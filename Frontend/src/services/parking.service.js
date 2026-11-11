import api from "./api";

export const parkingService = {
  scan: (qr_token) => api.post("/staff/parking/scan", { qr_token }),
  exit: (data) => api.post("/staff/parking/exit", data),
  preview: (payload) => api.post("/staff/parking/preview", payload),
  getTransactions: (params) => api.get("/staff/parking/transactions", { params }),
};