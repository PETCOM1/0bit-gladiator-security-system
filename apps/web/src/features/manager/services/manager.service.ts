import apiClient from "@/api/client";

export const managerService = {
  // Dashboard & KPIs
  getDashboardStats: () => apiClient.get("/manager/stats"),

  // Sites
  getSites: () => apiClient.get("/sites"),
  getSiteById: (id: string) => apiClient.get(`/sites/${id}`),
  createSite: (data: { name: string; address: string }) => apiClient.post("/sites", data),
  updateSite: (id: string, data: { name?: string; address?: string; isFrozen?: boolean }) => apiClient.put(`/sites/${id}`, data),
  deleteSite: (id: string) => apiClient.delete(`/sites/${id}`),

  // Users & Personnel
  getTenantUsers: () => apiClient.get("/users/tenant"),
  inviteUser: (data: { email: string; firstName: string; lastName: string; role: "SITE_MANAGER" | "GUARD"; siteId?: string }) => apiClient.post("/users/invite", data),
  updateUserRole: (id: string, role: string) => apiClient.patch(`/users/${id}/role`, { role }),
  assignUserToSite: (id: string, siteId: string) => apiClient.patch(`/users/${id}/site`, { siteId }),
  assignUserToPost: (id: string, postId: string | null) => apiClient.patch(`/users/${id}/post`, { postId }),
  disableUser: (id: string) => apiClient.patch(`/users/${id}/status`),
  toggleUserLeave: (id: string) => apiClient.patch(`/users/${id}/leave`),

  // Incidents
  getIncidents: () => apiClient.get("/incidents"),
  createIncident: (data: { title: string; description: string; severity?: string; siteId?: string }) => apiClient.post("/incidents", data),
  updateIncidentStatus: (id: string, data: { status?: string; severity?: string }) => apiClient.patch(`/incidents/${id}`, data),

  // Visitors
  getVisitors: () => apiClient.get("/visitors"),
  checkInVisitor: (data: { name: string; idNumber?: string; company?: string; personVisiting?: string; vehicleReg?: string; purpose?: string; siteId?: string }) => apiClient.post("/visitors", data),
  checkOutVisitor: (id: string) => apiClient.patch(`/visitors/${id}/checkout`),

  // Shifts & Attendance
  getTenantShifts: () => apiClient.get("/shifts/tenant"),
  createShift: (data: { userId: string; startTime: string; endTime: string; postId?: string; siteId?: string }) => apiClient.post("/shifts", data),
  startShift: (data: { shiftId?: string }) => apiClient.post("/shifts/start", data),
  endShift: (id: string) => apiClient.post(`/shifts/${id}/end`),

  // Posts
  getTenantPosts: (siteId?: string) => apiClient.get("/posts/tenant", { params: { siteId } }),
  createPost: (data: { name: string; siteId?: string }) => apiClient.post("/posts", data),
  updatePost: (id: string, data: { name?: string; isActive?: boolean }) => apiClient.patch(`/posts/${id}`, data),

  // Occurrences
  getOccurrences: (siteId?: string) => apiClient.get("/occurrences", { params: { siteId } }),
  createOccurrence: (data: { entryText: string; category?: string; siteId?: string; location?: string; severity?: string; image?: string }) => apiClient.post("/occurrences", data),

  // Profile & Settings
  updateTenantProfile: (data: { 
    name: string; 
    contactEmail?: string | null;
    contactPhone?: string | null;
    registrationNumber?: string | null;
    orgType?: string | null;
    physicalAddress?: string | null;
    countryRegion?: string | null;
  }) => apiClient.patch("/manager/profile", data),
  getTenantAuditLogs: () => apiClient.get("/manager/audit"),
};
