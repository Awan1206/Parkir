import api from "./api";

export const dashboardService = {
  getAdminDashboard: () => api.get("/admin/dashboard"),
  getStaffDashboard: () => api.get("/staff/dashboard"),
};