import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

// ── Thresholds ──────────────────────────────────────────────────────────────
const LATE_MS = 10 * 60 * 1000;        // clocking in more than 10min after start = late
const MISSED_GRACE_MS = 30 * 60 * 1000; // 30min grace before flagging a miss
const OVERTIME_MS = 15 * 60 * 1000;     // 15min past scheduled duration = overtime
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Date helpers ────────────────────────────────────────────────────────────
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const mondayOf = (d: Date) => {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  return addDays(x, diff);
};
const monthLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
const dayLabel = (d: Date) => d.toISOString().split("T")[0];
const weekLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ── Shift predicates ────────────────────────────────────────────────────────
type ShiftRow = {
  id: string; userId: string | null; postId: string | null;
  startTime: Date; endTime: Date | null; actualStartTime: Date | null; actualEndTime: Date | null;
  status: string;
};

const isCountable = (s: ShiftRow) => s.status !== "DRAFT" && !!s.userId;
const isLateArrival = (s: ShiftRow) => !!s.actualStartTime && s.actualStartTime.getTime() - s.startTime.getTime() > LATE_MS;
const isOnTimeArrival = (s: ShiftRow) => !!s.actualStartTime && !isLateArrival(s);
const isMissedCheckIn = (s: ShiftRow, at: Date) =>
  isCountable(s) && !s.actualStartTime && at.getTime() - s.startTime.getTime() > MISSED_GRACE_MS;
const isMissedCheckOut = (s: ShiftRow, at: Date) =>
  !!s.actualStartTime && !s.actualEndTime && !!s.endTime && at.getTime() - s.endTime.getTime() > MISSED_GRACE_MS;
const overtimeMinutes = (s: ShiftRow) => {
  if (!s.actualStartTime || !s.actualEndTime || !s.endTime) return 0;
  const scheduled = s.endTime.getTime() - s.startTime.getTime();
  const actual = s.actualEndTime.getTime() - s.actualStartTime.getTime();
  const over = actual - scheduled;
  return over > OVERTIME_MS ? Math.round(over / 60000) : 0;
};

const rate = (num: number, den: number): number | null => (den > 0 ? Math.round((num / den) * 100) : null);

export const getSiteAnalytics = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const siteId = req.user!.siteId;
  if (!tenantId || !siteId) return res.status(HttpStatus.FORBIDDEN).json({ message: "No tenant/site context" });

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  const ninetyDaysAgo = addDays(todayStart, -90);
  const thirtyDaysAgo = addDays(todayStart, -30);
  const sevenDaysAgo = addDays(todayStart, -7);

  const [
    site,
    guards,
    posts,
    shifts,
    incidents,
    visitors,
    obEntries,
    openIncidentsCount,
    visitorsOnSiteCount,
  ] = await Promise.all([
    prisma.site.findUnique({ where: { id: siteId }, select: { name: true } }),
    prisma.user.findMany({
      where: { tenantId, siteId, role: "GUARD", accountStatus: { not: "DELETED" } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, onLeave: true, accountStatus: true, postId: true }
    }),
    prisma.post.findMany({ where: { tenantId, siteId }, select: { id: true, name: true, isActive: true } }),
    prisma.shift.findMany({
      where: { tenantId, siteId, startTime: { gte: sixMonthsAgo } },
      select: { id: true, userId: true, postId: true, startTime: true, endTime: true, actualStartTime: true, actualEndTime: true, status: true }
    }),
    prisma.incident.findMany({
      where: { tenantId, siteId, createdAt: { gte: sixMonthsAgo } },
      select: { id: true, status: true, severity: true, category: true, createdAt: true, resolvedAt: true }
    }),
    prisma.visitor.findMany({
      where: { tenantId, siteId, checkInTime: { gte: ninetyDaysAgo } },
      select: { id: true, name: true, idNumber: true, company: true, checkInTime: true, checkOutTime: true, status: true }
    }),
    prisma.occurrenceBookEntry.findMany({
      where: { tenantId, siteId, createdAt: { gte: ninetyDaysAgo } },
      select: { id: true, category: true, createdAt: true }
    }),
    prisma.incident.count({ where: { tenantId, siteId, status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.visitor.count({ where: { tenantId, siteId, status: "CHECKED_IN" } }),
  ]);

  const guardById = new Map(guards.map(g => [g.id, g]));
  const guardName = (id: string | null) => {
    if (!id) return "Unassigned";
    const g = guardById.get(id);
    return g ? `${g.firstName || ""} ${g.lastName || ""}`.trim() || "Unnamed" : "Former guard";
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const todayShifts = shifts.filter(s => s.status !== "DRAFT" && s.startTime >= todayStart && s.startTime < todayEnd);
  const todayShiftsStarted = todayShifts.filter(s => s.startTime <= now);
  const personnelOnDuty = new Set(shifts.filter(s => s.status === "IN_PROGRESS").map(s => s.userId)).size;

  const kpis = {
    totalPersonnel: guards.length,
    personnelOnDuty,
    activePosts: posts.filter(p => p.isActive).length,
    activeShiftsToday: todayShifts.length,
    attendanceRate: rate(todayShiftsStarted.filter(s => s.actualStartTime).length, todayShiftsStarted.filter(s => s.userId).length),
    shiftCoverage: rate(todayShifts.filter(s => s.userId).length, todayShifts.length),
    openIncidents: openIncidentsCount,
    visitorsOnSite: visitorsOnSiteCount,
  };

  // ── Attendance analytics ─────────────────────────────────────────────────
  const bucketAttendance = (starts: Date[], bucketEnd: (s: Date) => Date, label: (s: Date) => string) =>
    starts.map(start => {
      const end = bucketEnd(start);
      const bucketShifts = shifts.filter(s => isCountable(s) && s.startTime >= start && s.startTime < end && s.startTime <= now);
      const present = bucketShifts.filter(s => s.actualStartTime).length;
      return { label: label(start), total: bucketShifts.length, present, rate: rate(present, bucketShifts.length) };
    });

  const dayStarts = Array.from({ length: 14 }, (_, i) => addDays(todayStart, -(13 - i)));
  const weekStarts = Array.from({ length: 8 }, (_, i) => addDays(mondayOf(now), -(7 - i) * 7));
  const monthStarts = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1));

  const last30Shifts = shifts.filter(s => isCountable(s) && s.startTime >= thirtyDaysAgo && s.startTime <= now);

  const attendance = {
    dailyTrend: bucketAttendance(dayStarts, s => addDays(s, 1), dayLabel),
    weeklyTrend: bucketAttendance(weekStarts, s => addDays(s, 7), weekLabel),
    monthlyTrend: bucketAttendance(monthStarts, s => new Date(s.getFullYear(), s.getMonth() + 1, 1), monthLabel),
    onTimeCheckIns: last30Shifts.filter(isOnTimeArrival).length,
    lateArrivals: last30Shifts.filter(isLateArrival).length,
    missedCheckIns: last30Shifts.filter(s => isMissedCheckIn(s, now)).length,
    missedCheckOuts: last30Shifts.filter(s => isMissedCheckOut(s, now)).length,
    attendancePercentage: rate(last30Shifts.filter(s => s.actualStartTime).length, last30Shifts.length),
  };

  // ── Shift coverage analytics (this week) ─────────────────────────────────
  const weekStart = mondayOf(now);
  const weekEnd = addDays(weekStart, 7);
  const weekShifts = shifts.filter(s => s.status !== "DRAFT" && s.startTime >= weekStart && s.startTime < weekEnd);
  const weekShiftsFilled = weekShifts.filter(s => s.userId);
  const weekShiftsDue = weekShifts.filter(s => s.startTime <= now);
  const postsWithCoverageToday = new Set(todayShifts.filter(s => s.userId && s.postId).map(s => s.postId));

  const shiftCoverage = {
    totalScheduled: weekShifts.length,
    filled: weekShiftsFilled.length,
    vacant: weekShifts.length - weekShiftsFilled.length,
    coveragePercentage: rate(weekShiftsFilled.length, weekShifts.length),
    unstaffedPosts: posts.filter(p => p.isActive && !postsWithCoverageToday.has(p.id)).length,
    overtimeAssignments: weekShifts.filter(s => overtimeMinutes(s) > 0).length,
    shiftCompletionRate: rate(weekShiftsDue.filter(s => s.status === "COMPLETED").length, weekShiftsDue.length),
  };

  // ── Post performance ──────────────────────────────────────────────────────
  // Note: Incident and OccurrenceBookEntry are only tracked site-wide in the
  // current schema (no postId column on either), so per-post incident/OB
  // counts aren't available — deliberately omitted rather than guessed.
  const postPerformance = posts.map(post => {
    const postShiftsWeek = shifts.filter(s => s.postId === post.id && s.status !== "DRAFT" && s.startTime >= sevenDaysAgo && s.startTime <= now);
    const filled = postShiftsWeek.filter(s => s.userId).length;
    const present = postShiftsWeek.filter(s => s.actualStartTime).length;
    const assignedPersonnel = new Set<string>();
    postShiftsWeek.forEach(s => { if (s.userId) assignedPersonnel.add(s.userId); });
    guards.filter(g => g.postId === post.id).forEach(g => assignedPersonnel.add(g.id));

    const coveragePercentage = rate(filled, postShiftsWeek.length);
    const needsAttention = assignedPersonnel.size === 0 || (coveragePercentage !== null && coveragePercentage < 70);

    return {
      id: post.id,
      name: post.name,
      isActive: post.isActive,
      assignedPersonnel: assignedPersonnel.size,
      coveragePercentage,
      attendanceHistoryPercentage: rate(present, postShiftsWeek.length),
      needsAttention,
    };
  });

  // ── Personnel performance (trailing 30 days) ─────────────────────────────
  const guardStats = guards.map(g => {
    const gShifts = last30Shifts.filter(s => s.userId === g.id);
    const present = gShifts.filter(s => s.actualStartTime).length;
    const late = gShifts.filter(isLateArrival).length;
    const onTime = gShifts.filter(isOnTimeArrival).length;
    const otMinutes = gShifts.reduce((sum, s) => sum + overtimeMinutes(s), 0);
    return {
      id: g.id,
      name: `${g.firstName || ""} ${g.lastName || ""}`.trim() || "Unnamed",
      avatarUrl: g.avatarUrl,
      totalShifts: gShifts.length,
      present,
      lateArrivals: late,
      overtimeMinutes: otMinutes,
      attendancePercentage: rate(present, gShifts.length),
      onTimePercentage: rate(onTime, present),
      onLeave: g.onLeave,
    };
  });

  const absentTodayIds = new Set(
    todayShiftsStarted.filter(s => isMissedCheckIn(s, now)).map(s => s.userId).filter(Boolean) as string[]
  );

  const personnelPerformance = {
    mostPunctual: guardStats.filter(g => g.present >= 3).sort((a, b) => (b.onTimePercentage || 0) - (a.onTimePercentage || 0)).slice(0, 5),
    repeatedLateArrivals: guardStats.filter(g => g.lateArrivals >= 3).sort((a, b) => b.lateArrivals - a.lateArrivals).slice(0, 5),
    highestAttendance: guardStats.filter(g => g.totalShifts >= 3).sort((a, b) => (b.attendancePercentage || 0) - (a.attendancePercentage || 0)).slice(0, 5),
    mostOvertimeWorked: guardStats.filter(g => g.overtimeMinutes > 0).sort((a, b) => b.overtimeMinutes - a.overtimeMinutes).slice(0, 5),
    onLeave: guards.filter(g => g.onLeave).map(g => ({ id: g.id, name: `${g.firstName || ""} ${g.lastName || ""}`.trim() })),
    absentToday: guards.filter(g => absentTodayIds.has(g.id)).map(g => ({ id: g.id, name: `${g.firstName || ""} ${g.lastName || ""}`.trim() })),
  };

  // ── Incident analytics ────────────────────────────────────────────────────
  const categoryCounts = new Map<string, number>();
  incidents.forEach(i => {
    const key = i.category || "Uncategorized";
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  });
  const resolvedWithTime = incidents.filter(i => i.resolvedAt);
  const avgResolutionMs = resolvedWithTime.length
    ? resolvedWithTime.reduce((sum, i) => sum + (i.resolvedAt!.getTime() - i.createdAt.getTime()), 0) / resolvedWithTime.length
    : null;

  const incidentTrend = weekStarts.map(start => {
    const end = addDays(start, 7);
    return { label: weekLabel(start), count: incidents.filter(i => i.createdAt >= start && i.createdAt < end).length };
  });

  const incidentAnalytics = {
    total: incidents.length,
    open: incidents.filter(i => ["OPEN", "INVESTIGATING"].includes(i.status)).length,
    resolved: incidents.filter(i => ["RESOLVED", "CLOSED"].includes(i.status)).length,
    byCategory: [...categoryCounts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    trend: incidentTrend,
    avgResolutionTimeHours: avgResolutionMs !== null ? Math.round((avgResolutionMs / 3600000) * 10) / 10 : null,
  };

  // ── Visitor analytics ─────────────────────────────────────────────────────
  const visitorsToday = visitors.filter(v => v.checkInTime >= todayStart && v.checkInTime < todayEnd).length;
  const visitorsThisWeek = visitors.filter(v => v.checkInTime >= weekStart && v.checkInTime < weekEnd).length;
  const checkedOut = visitors.filter(v => v.checkOutTime);
  const avgVisitMinutes = checkedOut.length
    ? Math.round(checkedOut.reduce((sum, v) => sum + (v.checkOutTime!.getTime() - v.checkInTime.getTime()), 0) / checkedOut.length / 60000)
    : null;

  const visitorFreq = new Map<string, { name: string; count: number }>();
  visitors.forEach(v => {
    const key = (v.idNumber || v.name).toLowerCase();
    const existing = visitorFreq.get(key);
    if (existing) existing.count += 1;
    else visitorFreq.set(key, { name: v.name, count: 1 });
  });

  const visitorAnalytics = {
    today: visitorsToday,
    thisWeek: visitorsThisWeek,
    onSite: visitorsOnSiteCount,
    avgVisitDurationMinutes: avgVisitMinutes,
    frequentVisitors: [...visitorFreq.values()].filter(v => v.count >= 2).sort((a, b) => b.count - a.count).slice(0, 5),
  };

  // ── Occurrence Book analytics ─────────────────────────────────────────────
  const obToday = obEntries.filter(e => e.createdAt >= todayStart && e.createdAt < todayEnd).length;
  const obThisWeek = obEntries.filter(e => e.createdAt >= weekStart && e.createdAt < weekEnd).length;
  const obCategoryCounts = new Map<string, number>();
  const obHourCounts = new Map<number, number>();
  obEntries.forEach(e => {
    obCategoryCounts.set(e.category, (obCategoryCounts.get(e.category) || 0) + 1);
    const hour = e.createdAt.getHours();
    obHourCounts.set(hour, (obHourCounts.get(hour) || 0) + 1);
  });
  const obByCategory = [...obCategoryCounts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  const peakHours = [...obHourCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([hour, count]) => ({ hourRange: `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`, count }));

  const occurrenceBook = {
    entriesToday: obToday,
    entriesThisWeek: obThisWeek,
    byCategory: obByCategory,
    mostCommon: obByCategory.slice(0, 3),
    peakReportingPeriods: peakHours,
  };

  // ── Weekly coverage overview (Mon–Sun, current week) ─────────────────────
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyCoverage = DAY_NAMES.map((name, i) => {
    const dayStart = addDays(weekStart, i);
    const dayEnd = addDays(dayStart, 1);
    const isFuture = dayStart > now;
    const isToday = dayStart.getTime() === todayStart.getTime();
    const dayShifts = shifts.filter(s => s.status !== "DRAFT" && s.startTime >= dayStart && s.startTime < dayEnd);
    const filled = dayShifts.filter(s => s.userId).length;
    const vacant = dayShifts.length - filled;
    const coveragePct = rate(filled, dayShifts.length);
    const absent = isFuture ? null : dayShifts.filter(s => isMissedCheckIn(s, dayEnd < now ? dayEnd : now)).length;

    let statusLevel: "full" | "minor" | "understaffed" | "critical" = "full";
    if (coveragePct === null) statusLevel = "full";
    else if (coveragePct < 50) statusLevel = "critical";
    else if (coveragePct < 80) statusLevel = "understaffed";
    else if (coveragePct < 95) statusLevel = "minor";

    return {
      day: name,
      date: dayLabel(dayStart),
      isToday,
      isFuture,
      coveragePercentage: coveragePct,
      filledShifts: filled,
      vacantShifts: vacant,
      guardsOnLeave: isToday ? guards.filter(g => g.onLeave).length : null,
      guardsAbsent: absent,
      status: statusLevel,
    };
  });

  // ── Operational alerts ────────────────────────────────────────────────────
  const unassignedShifts = shifts.filter(s => s.status === "SCHEDULED" && !s.userId && s.startTime >= todayStart && s.startTime < addDays(todayStart, 7));
  const vacantPostsToday = posts.filter(p => p.isActive && !postsWithCoverageToday.has(p.id));
  const missedCheckInsToday = todayShiftsStarted.filter(s => isMissedCheckIn(s, now));
  const openHighPriority = incidents.filter(i => ["OPEN", "INVESTIGATING"].includes(i.status) && ["HIGH", "CRITICAL"].includes(i.severity));
  const overstayingThresholdMs = 4 * 60 * 60 * 1000;
  const overstayingVisitors = visitors.filter(v => v.status === "CHECKED_IN" && now.getTime() - v.checkInTime.getTime() > overstayingThresholdMs);

  const alerts = {
    vacantPosts: vacantPostsToday.map(p => ({ id: p.id, name: p.name })),
    unassignedShifts: unassignedShifts.length,
    personnelAbsent: personnelPerformance.absentToday,
    missedCheckIns: missedCheckInsToday.map(s => ({ shiftId: s.id, guardId: s.userId, guardName: guardName(s.userId), startTime: s.startTime })),
    openHighPriorityIncidents: openHighPriority.length,
    expiringDocuments: { tracked: false, items: [] as any[] },
    visitorsOverstaying: overstayingVisitors.map(v => ({ id: v.id, name: v.name, checkInTime: v.checkInTime, hoursOnSite: Math.round((now.getTime() - v.checkInTime.getTime()) / 3600000 * 10) / 10 })),
  };

  // ── Trends & insights (rollups reusing data already fetched above) ───────
  const visitorTrend = dayStarts.map(start => ({
    label: dayLabel(start),
    count: visitors.filter(v => v.checkInTime >= start && v.checkInTime < addDays(start, 1)).length
  }));
  const obTrend = dayStarts.map(start => ({
    label: dayLabel(start),
    count: obEntries.filter(e => e.createdAt >= start && e.createdAt < addDays(start, 1)).length
  }));
  const coverageTrend = weekStarts.map(start => {
    const end = addDays(start, 7);
    const wShifts = shifts.filter(s => s.status !== "DRAFT" && s.startTime >= start && s.startTime < end);
    return { label: weekLabel(start), coveragePercentage: rate(wShifts.filter(s => s.userId).length, wShifts.length) };
  });

  const trends = {
    attendance: attendance.weeklyTrend,
    shiftCoverage: coverageTrend,
    incidents: incidentTrend,
    visitors: visitorTrend,
    occurrenceBook: obTrend,
  };

  res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      site: { id: siteId, name: site?.name || "" },
      generatedAt: now.toISOString(),
      kpis,
      attendance,
      shiftCoverage,
      postPerformance,
      personnelPerformance,
      incidentAnalytics,
      visitorAnalytics,
      occurrenceBook,
      weeklyCoverage,
      alerts,
      trends,
    }
  });
});
