import apiClient from "@/api/client";

export const managerService = {
  // Dashboard & KPIs
  getDashboardStats: () => apiClient.get("/manager/stats"),

  // Sites
  getSites: () => apiClient.get("/sites"),
  getSiteById: (id: string) => apiClient.get(`/sites/${id}`),
  createSite: (data: { name: string; address: string }) => apiClient.post("/sites", data),
  updateSite: (id: string, data: { name?: string; address?: string }) => apiClient.put(`/sites/${id}`, data),
  deleteSite: (id: string) => apiClient.delete(`/sites/${id}`),

  // Users & Personnel
  getTenantUsers: () => apiClient.get("/users/tenant"),
  inviteUser: (data: { email: string; firstName: string; lastName: string; role: "SITE_MANAGER" | "USER"; siteId?: string }) => apiClient.post("/users/invite", data),
  updateUserRole: (id: string, role: string) => apiClient.patch(`/users/${id}/role`, { role }),
  assignUserToSite: (id: string, siteId: string) => apiClient.patch(`/users/${id}/site`, { siteId }),
  disableUser: (id: string) => apiClient.patch(`/users/${id}/status`),

  // Incidents
  getIncidents: () => apiClient.get("/incidents"),
  updateIncidentStatus: (id: string, data: { status?: string; severity?: string }) => apiClient.patch(`/incidents/${id}`, data),

  // Visitors
  getVisitors: () => apiClient.get("/visitors"),

  // Shifts & Attendance
  getTenantShifts: () => apiClient.get("/shifts/tenant"),

  // Profile & Settings
  updateTenantProfile: (data: { name: string }) => apiClient.patch("/manager/profile", data),
  getTenantAuditLogs: () => apiClient.get("/manager/audit"),
};
