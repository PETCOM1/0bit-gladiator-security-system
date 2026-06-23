import { jsPDF } from "jspdf";

export function exportToPDF(title: string, headers: string[], rows: any[][], filename: string) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900 (primary text)
  doc.text(title, 14, 22);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500 (muted text)
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 29);
  
  // Confidential stamp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(239, 68, 68); // Red
  doc.text("CONFIDENTIAL", 196 - doc.getTextWidth("CONFIDENTIAL"), 29);
  
  // Draw header separator line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);
  
  let y = 46;
  
  // Draw Table Headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  
  const totalWidth = 182;
  const colWidth = totalWidth / headers.length;
  
  headers.forEach((header, i) => {
    doc.text(header.toUpperCase(), 14 + i * colWidth, y);
  });
  
  y += 5;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(14, y, 196, y);
  y += 9;
  
  // Draw Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  
  rows.forEach((row) => {
    // If y is close to page bottom, add page and redraw headers
    if (y > 275) {
      doc.addPage();
      y = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      headers.forEach((header, i) => {
        doc.text(header.toUpperCase(), 14 + i * colWidth, y);
      });
      y += 5;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, 196, y);
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
    }
    
    row.forEach((cell, i) => {
      let cellText = String(cell ?? "");
      // Truncate text if it overflows its column slot to prevent overlap
      const maxChars = Math.floor(colWidth * 0.22);
      if (cellText.length > maxChars) {
        cellText = cellText.substring(0, maxChars - 3) + "...";
      }
      doc.text(cellText, 14 + i * colWidth, y);
    });
    
    y += 8;
  });
  
  doc.save(filename);
}

interface MultiPageReportData {
  tenantName: string;
  managerName: string;
  reportPeriod: string;
  generatedDate: string;
  summary: {
    guardsCount: number;
    sitesCount: number;
    incidentsCount: number;
    patrolRate: number;
  };
  kpis: {
    totalSites: number;
    activeGuards: number;
    openIncidents: number;
    closedIncidents: number;
    patrolCompletionRate: number;
    avgResponseTime: string;
  };
  actionItems: Array<{ severity: "HIGH" | "MEDIUM" | "LOW"; message: string }>;
  incidentTypes: Array<{ type: string; count: number }>;
  incidentRegister: Array<{ id: string; title: string; siteName: string; status: string }>;
  sitePerformance: Array<{ siteName: string; guards: number; incidents: number; patrolRate: number; risk: "LOW" | "MEDIUM" | "HIGH" }>;
  guardPerformance: Array<{ guardName: string; siteName: string; attendance: number; patrolRate: number; rating: "Excellent" | "Good" | "Average" | "At Risk" }>;
  interventions: Array<{ target: string; indicator: string; recommendation: string }>;
  honors: {
    guards: Array<{ rank: string; guardName: string; score: number }>;
    sites: Array<{ rank: string; siteName: string; score: number }>;
  };
  auditPatrols: Array<{ shift: string; siteName: string; completion: number; missed: number }>;
  auditCategories: Array<{ category: string; avgResponse: string; resolutionRate: number }>;
}

export function exportMultiPageReport(data: MultiPageReportData, filename: string = "Gladiator_Pro_Operations_Analytics.pdf") {
  const doc = new jsPDF();
  const primaryColor = [15, 23, 42]; // slate-900
  const secondaryColor = [71, 85, 105]; // slate-600
  const accentColor = [249, 115, 22]; // orange-500
  const borderLight = [226, 232, 240]; // slate-200

  const drawHeader = (pageTitle: string, pageNum: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("GLADIATOR PRO", 14, 15);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(239, 68, 68); // Red-500
    doc.text("CONFIDENTIAL", 95, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Page ${pageNum} - ${pageTitle}`, 196 - doc.getTextWidth(`Page ${pageNum} - ${pageTitle}`), 15);
    
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 18, 196, 18);
  };

  // -------------------------------------------------------------
  // PAGE 1: COVER PAGE
  // -------------------------------------------------------------
  // Draw accent side banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 45, 297, "F");

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(40, 0, 5, 297, "F");

  // Cover Page Title Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(239, 68, 68); // Red
  doc.text("STRICTLY CONFIDENTIAL - INTERNAL USE ONLY", 60, 40);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("GLADIATOR PRO", 60, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Security Operations Analytics", 60, 60);

  // Metadata labels & values
  const drawMetaLabelVal = (label: string, value: string, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(label.toUpperCase(), 60, yPos);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(value, 60, yPos + 6);
  };

  drawMetaLabelVal("Company:", data.tenantName, 90);
  drawMetaLabelVal("Report Period:", data.reportPeriod, 115);
  drawMetaLabelVal("Generated:", data.generatedDate, 140);
  drawMetaLabelVal("Tenant Manager:", data.managerName, 165);

  // Stats Highlights
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("OPERATIONS HIGHLIGHTS", 60, 205);
  doc.line(60, 208, 190, 208);

  const drawHighlight = (count: string, label: string, xPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(count, xPos, 225);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(label, xPos, 231);
  };

  drawHighlight(`${data.summary.guardsCount}`, "Guards", 60);
  drawHighlight(`${data.summary.sitesCount}`, "Sites", 95);
  drawHighlight(`${data.summary.incidentsCount}`, "Incidents", 130);
  drawHighlight(`${data.summary.patrolRate}%`, "Patrol Compliance", 160);

  // -------------------------------------------------------------
  // PAGE 2: EXECUTIVE SUMMARY
  // -------------------------------------------------------------
  doc.addPage();
  drawHeader("Executive Summary", 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("EXECUTIVE SUMMARY", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Dashboard KPIs & Trends", 14, 35);

  // Draw 6 KPI Cards in a grid (2 columns, 3 rows)
  const drawKPICard = (title: string, value: string, x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(x, y, w, h, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(title.toUpperCase(), x + 6, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(value, x + 6, y + 20);
  };

  const cardW = 85;
  const cardH = 26;
  drawKPICard("Total Sites", `${data.kpis.totalSites}`, 14, 45, cardW, cardH);
  drawKPICard("Active Guards", `${data.kpis.activeGuards}`, 109, 45, cardW, cardH);
  drawKPICard("Open Incidents", `${data.kpis.openIncidents}`, 14, 78, cardW, cardH);
  drawKPICard("Closed Incidents", `${data.kpis.closedIncidents}`, 109, 78, cardW, cardH);
  drawKPICard("Patrol Completion Rate", `${data.kpis.patrolCompletionRate}%`, 14, 111, cardW, cardH);
  drawKPICard("Average Response Time", data.kpis.avgResponseTime, 109, 111, cardW, cardH);

  // Action Items Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("PRIORITY ACTION ITEMS", 14, 155);
  doc.line(14, 158, 196, 158);

  let actionY = 168;
  data.actionItems.forEach(item => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    if (item.severity === "HIGH") {
      doc.setTextColor(239, 68, 68); // Red
    } else if (item.severity === "MEDIUM") {
      doc.setTextColor(245, 158, 11); // Amber
    } else {
      doc.setTextColor(59, 130, 246); // Blue
    }
    
    const severityText = `[${item.severity}]`;
    doc.text(severityText, 14, actionY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(item.message, 14 + doc.getTextWidth(severityText) + 3, actionY);

    actionY += 10;
  });

  if (data.actionItems.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("No high priority action items listed. Operations are fully compliant.", 14, 168);
  }

  // -------------------------------------------------------------
  // PAGE 3: INCIDENT ANALYTICS
  // -------------------------------------------------------------
  doc.addPage();
  drawHeader("Incident Analytics", 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("INCIDENT ANALYTICS", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Incident Distribution & Trends", 14, 35);

  // Table 1: Incident Breakdown (Types & Counts)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Incident Type Breakdown", 14, 48);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 53, 182, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("INCIDENT TYPE", 18, 58);
  doc.text("LOGGED COUNT", 120, 58);

  let typeY = 66;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
  data.incidentTypes.forEach(t => {
    doc.text(t.type, 18, typeY);
    doc.text(t.count.toString(), 120, typeY);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, typeY + 3, 196, typeY + 3);
    typeY += 8;
  });

  if (data.incidentTypes.length === 0) {
    doc.text("No incidents logged in the selected period.", 18, typeY);
    typeY += 8;
  }

  // Table 2: Open Incident Register
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Open Incident Register", 14, typeY + 10);

  const regHeaderY = typeY + 15;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, regHeaderY, 182, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("INCIDENT ID / TITLE", 18, regHeaderY + 5);
  doc.text("SITE LOCATION", 95, regHeaderY + 5);
  doc.text("CURRENT STATUS", 150, regHeaderY + 5);

  let regY = regHeaderY + 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
  data.incidentRegister.forEach(r => {
    doc.setFont("helvetica", "bold");
    doc.text(r.id, 18, regY);
    doc.setFont("helvetica", "normal");
    
    // Truncate title if long
    let titleText = r.title;
    if (titleText.length > 25) titleText = titleText.substring(0, 22) + "...";
    doc.text(titleText, 35, regY);
    doc.text(r.siteName, 95, regY);
    
    doc.setFont("helvetica", "bold");
    if (r.status === "OPEN" || r.status === "CRITICAL") {
      doc.setTextColor(239, 68, 68);
    } else {
      doc.setTextColor(245, 158, 11);
    }
    doc.text(r.status, 150, regY);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, regY + 3, 196, regY + 3);
    regY += 8;
  });

  if (data.incidentRegister.length === 0) {
    doc.text("No open/active incidents listed.", 18, regY);
  }

  // -------------------------------------------------------------
  // PAGE 4: SITE ANALYTICS
  // -------------------------------------------------------------
  doc.addPage();
  drawHeader("Site Analytics", 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SITE ANALYTICS", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Site Performance Summary", 14, 35);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 45, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("SITE LOCATION", 18, 51);
  doc.text("GUARDS", 80, 51);
  doc.text("INCIDENTS", 105, 51);
  doc.text("PATROL RATE", 135, 51);
  doc.text("RISK LEVEL", 168, 51);

  let siteY = 60;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  data.sitePerformance.forEach(s => {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(s.siteName, 18, siteY);
    doc.setFont("helvetica", "normal");
    
    doc.text(s.guards.toString(), 80, siteY);
    doc.text(s.incidents.toString(), 105, siteY);
    doc.text(`${s.patrolRate}%`, 135, siteY);

    doc.setFont("helvetica", "bold");
    if (s.risk === "HIGH") {
      doc.setTextColor(239, 68, 68);
    } else if (s.risk === "MEDIUM") {
      doc.setTextColor(245, 158, 11);
    } else {
      doc.setTextColor(34, 197, 94);
    }
    doc.text(s.risk, 168, siteY);
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, siteY + 4, 196, siteY + 4);
    siteY += 10;
  });

  if (data.sitePerformance.length === 0) {
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("No site allocations registered under this account.", 18, siteY);
  }

  // -------------------------------------------------------------
  // PAGE 5: GUARD ROSTER
  // -------------------------------------------------------------
  doc.addPage();
  drawHeader("Guard Roster", 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("GUARD PERFORMANCE ROSTER", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Active Officer Compliance Ratings", 14, 35);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 45, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("SECURITY OFFICER", 18, 51);
  doc.text("SITE LOCATION", 75, 51);
  doc.text("ATTENDANCE", 120, 51);
  doc.text("PATROL compliance", 145, 51);
  doc.text("RATING", 172, 51);

  let guardY = 60;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  data.guardPerformance.forEach(g => {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(g.guardName, 18, guardY);
    doc.setFont("helvetica", "normal");
    
    doc.text(g.siteName, 75, guardY);
    doc.text(`${g.attendance}%`, 120, guardY);
    doc.text(`${g.patrolRate}%`, 145, guardY);

    doc.setFont("helvetica", "bold");
    if (g.rating === "Excellent") {
      doc.setTextColor(34, 197, 94);
    } else if (g.rating === "Good") {
      doc.setTextColor(59, 130, 246);
    } else if (g.rating === "Average") {
      doc.setTextColor(245, 158, 11);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(g.rating, 172, guardY);
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, guardY + 4, 196, guardY + 4);
    guardY += 10;
  });

  if (data.guardPerformance.length === 0) {
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("No active security officers found in logs.", 18, guardY);
  }

  // -------------------------------------------------------------
  // PAGE 6: RISK MANAGEMENT
  // -------------------------------------------------------------
  doc.addPage();
  drawHeader("Risk Management", 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RISK MANAGEMENT", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Site & Personnel Interventions", 14, 35);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 45, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("SITE / GUARD TARGET", 18, 51);
  doc.text("RISK INDICATOR", 70, 51);
  doc.text("RECOMMENDED INTERVENTION / CORRECTIVE ACTION", 115, 51);

  let riskY = 60;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  data.interventions.forEach(v => {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(v.target, 18, riskY);
    doc.setFont("helvetica", "normal");
    doc.text(v.indicator, 70, riskY);

    // Text wrapping recommendation if long
    const wrappedRec = doc.splitTextToSize(v.recommendation, 75);
    doc.text(wrappedRec, 115, riskY);

    const lineCount = wrappedRec.length;
    const padding = Math.max(10, lineCount * 5);

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, riskY + padding - 2, 196, riskY + padding - 2);
    riskY += padding;
  });

  if (data.interventions.length === 0) {
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("All sites and personnel operating within safe limits. No interventions needed.", 18, riskY);
  }

  // -------------------------------------------------------------
  // PAGE 7: SECURITY HONORS
  // -------------------------------------------------------------
  doc.addPage();
  drawHeader("Security Honors", 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SECURITY HONORS", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Top Performing Guards & Sites", 14, 35);

  // Column 1: Top Guards
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Top Officers", 14, 50);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 55, 80, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("RANK", 18, 61);
  doc.text("GUARD OFFICER", 32, 61);
  doc.text("SCORE", 80, 61);

  let honGuardsY = 70;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
  data.honors.guards.forEach(g => {
    doc.setFont("helvetica", "bold");
    doc.text(g.rank, 18, honGuardsY);
    doc.setFont("helvetica", "normal");
    doc.text(g.guardName, 32, honGuardsY);
    doc.setFont("helvetica", "bold");
    doc.text(g.score.toString(), 80, honGuardsY);
    
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, honGuardsY + 3, 94, honGuardsY + 3);
    honGuardsY += 10;
  });

  if (data.honors.guards.length === 0) {
    doc.text("No scores logged yet.", 18, honGuardsY);
  }

  // Column 2: Top Sites
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Top Sites", 110, 50);

  doc.setFillColor(241, 245, 249);
  doc.rect(110, 55, 86, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("RANK", 114, 61);
  doc.text("SITE LOCATION", 128, 61);
  doc.text("SCORE", 180, 61);

  let honSitesY = 70;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  data.honors.sites.forEach(s => {
    doc.setFont("helvetica", "bold");
    doc.text(s.rank, 114, honSitesY);
    doc.setFont("helvetica", "normal");
    doc.text(s.siteName, 128, honSitesY);
    doc.setFont("helvetica", "bold");
    doc.text(s.score.toString(), 180, honSitesY);

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(110, honSitesY + 3, 196, honSitesY + 3);
    honSitesY += 10;
  });

  if (data.honors.sites.length === 0) {
    doc.text("No scores logged yet.", 114, honSitesY);
  }

  // -------------------------------------------------------------
  // PAGE 8: SECURITY AUDIT
  // -------------------------------------------------------------
  doc.addPage();
  drawHeader("Security Audit", 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SECURITY AUDIT", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Patrol & Incident Statistics", 14, 35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Patrol Schedule Compliance", 14, 48);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 53, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("PATROL SHIFT", 18, 59);
  doc.text("SITE LOCATION", 75, 59);
  doc.text("COMPLETION %", 130, 59);
  doc.text("MISSED PATROLS", 165, 59);

  let auditPatrolY = 68;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  data.auditPatrols.forEach(p => {
    doc.text(p.shift, 18, auditPatrolY);
    doc.text(p.siteName, 75, auditPatrolY);
    doc.text(`${p.completion}%`, 130, auditPatrolY);
    doc.text(p.missed.toString(), 165, auditPatrolY);

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, auditPatrolY + 3, 196, auditPatrolY + 3);
    auditPatrolY += 10;
  });

  if (data.auditPatrols.length === 0) {
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("No shift compliance stats on record.", 18, auditPatrolY);
    auditPatrolY += 10;
  }

  // Section 2: Incident Categories
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Incident Categorization Response Summary", 14, auditPatrolY + 10);

  const catHeaderY = auditPatrolY + 15;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, catHeaderY, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("INCIDENT CATEGORY", 18, catHeaderY + 5);
  doc.text("AVG RESPONSE TIME", 95, catHeaderY + 5);
  doc.text("RESOLUTION RATE", 150, catHeaderY + 5);

  let auditCatY = catHeaderY + 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  data.auditCategories.forEach(c => {
    doc.text(c.category, 18, auditCatY);
    doc.text(c.avgResponse, 95, auditCatY);
    doc.text(`${c.resolutionRate}%`, 150, auditCatY);

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(14, auditCatY + 3, 196, auditCatY + 3);
    auditCatY += 10;
  });

  if (data.auditCategories.length === 0) {
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("No incidents recorded for metrics analysis.", 18, auditCatY);
  }

  // Save the complete report
  doc.save(filename);
}
