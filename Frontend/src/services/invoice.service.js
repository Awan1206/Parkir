import api from "./api";

export const invoiceService = {
  getById: (id) => api.get(`/staff/invoices/${id}`),
  downloadPdf: async (id, invoiceNumber) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/staff/invoices/${id}/pdf`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Gagal mengunduh invoice.");
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoice-${invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};