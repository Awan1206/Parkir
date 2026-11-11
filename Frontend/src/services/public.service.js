import api from "./api";

export const publicService = {
  issueTicket: () => api.post("/public/parking/tickets"),
  memberEntry: (qr_token) =>
    api.post("/public/parking/member/entry", { qr_token }),
};
