import api from "./api";

export const staffService = {
  getAll: (params) => api.get("/admin/staff", { params }),
  getById: (id) => api.get(`/admin/staff/${id}`),
  create: (data) => api.post("/admin/staff", data),
  update: (id, data) => api.put(`/admin/staff/${id}`, data),
  remove: (id) => api.delete(`/admin/staff/${id}`),
};