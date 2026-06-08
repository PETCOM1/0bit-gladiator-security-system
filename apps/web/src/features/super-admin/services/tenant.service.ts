import apiClient from "@/api/client";

export const superAdminService = {
  getStats: () => apiClient.get("/super-admin/stats"),
  getTenants: () => apiClient.get("/tenants"),
  getTenantById: (id: string) => apiClient.get(`/tenants/${id}`),
  createTenant: (data: any) => apiClient.post("/tenants", data),
  updateTenantStatus: (id: string, status: string) => apiClient.patch(`/tenants/${id}/status`, { status }),
  getAuditLogs: (page: number = 1) => apiClient.get(`/super-admin/audit?page=${page}`),
  getSettings: () => apiClient.get("/super-admin/settings"),
  updateSetting: (key: string, value: string) => apiClient.put("/super-admin/settings", { key, value }),
  broadcastNotification: (data: { title: string, message: string }) => apiClient.post("/notifications/broadcast", data),
  getPlans: () => apiClient.get("/plans"),
  createPlan: (data: any) => apiClient.post("/plans", data),
  updatePlan: (id: string, data: any) => apiClient.patch(`/plans/${id}`, data),
  getTickets: () => apiClient.get("/tickets"),
  updateTicketStatus: (id: string, status: string) => apiClient.patch(`/tickets/${id}/status`, { status }),
  replyToTicket: (id: string, content: string) => apiClient.post(`/tickets/${id}/reply`, { content }),
};
