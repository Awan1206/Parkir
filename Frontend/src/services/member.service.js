import api from "./api";

export const memberService = {
  getAll: (params) => api.get("/staff/members", { params }),
  getById: (id) => api.get(`/staff/members/${id}`),
  create: (data) => api.post("/staff/members", data),
  update: (id, data) => api.put(`/staff/members/${id}`, data),
  remove: (id) => api.delete(`/staff/members/${id}`),
  getQr: (id) => api.get(`/staff/members/${id}/qr`),
  sendReminder: (id) => api.post(`/staff/members/${id}/reminder`),
  getPayments: (id) => api.get(`/staff/members/${id}/payments`),
  createPayment: (id, data) => api.post(`/staff/members/${id}/payments`, data),
  downloadCard: async (id, memberCode) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/staff/members/${id}/card/pdf`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kartu-member-${memberCode}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};