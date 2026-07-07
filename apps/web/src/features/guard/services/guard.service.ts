import apiClient from "@/api/client";

export const guardService = {
  // Shifts
  startShift: (shiftId?: string) => apiClient.post("/shifts/start", shiftId ? { shiftId } : {}),
  endShift: (id: string) => apiClient.post(`/shifts/${id}/end`),
  getMyShifts: () => apiClient.get("/shifts/tenant"),

  // Visitors
  logVisitor: (data: { name: string; idNumber?: string; vehicleReg?: string; purpose?: string }) => 
    apiClient.post("/visitors", data),
  getVisitors: () => apiClient.get("/visitors"),

  // Incidents
  reportIncident: (data: { title: string; description: string; severity: string }) => 
    apiClient.post("/incidents", data),
  getIncidents: () => apiClient.get("/incidents"),
};

