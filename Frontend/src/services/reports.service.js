import api from "./api";

export const reportsService = {
  // admin: { page, from, to, visitor_type, vehicle_type }
  getAdminReports: (params) => api.get("/admin/reports", { params }),
  exportStaffReports(params) {
    return api.get("/staff/reports/export", {
      params,
      responseType: "blob",
    });
  },

  // petugas: { page, date_from, date_to, visitor_type, vehicle_type, search }
  getStaffReports: (params) => api.get("/staff/reports", { params }),
};