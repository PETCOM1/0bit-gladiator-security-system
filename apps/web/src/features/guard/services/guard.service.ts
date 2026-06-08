import apiClient from "@/api/client";

export const guardService = {
  // Shifts
  startShift: () => apiClient.post("/shifts/start"),
  endShift: (id: string) => apiClient.post(`/shifts/${id}/end`),

  // Visitors
  logVisitor: (data: { name: string; idNumber?: string; vehicleReg?: string; purpose?: string }) => 
    apiClient.post("/visitors", data),
  getVisitors: () => apiClient.get("/visitors"),

  // Incidents
  reportIncident: (data: { title: string; description: string; severity: string }) => 
    apiClient.post("/incidents", data),
  getIncidents: () => apiClient.get("/incidents"),
};
