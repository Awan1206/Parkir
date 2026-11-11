import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { reportsService } from "@/services/reports.service";

const INITIAL_FILTERS = {
  date_from: "",
  date_to: "",
  visitor_type: "",
  vehicle_type: "",
};

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDuration(minutes) {
  if (minutes == null || minutes < 0) return "-";
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

function formatDateTime(iso) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function VisitorBadge({ type }) {
  const isMember = type === "member";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isMember ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {isMember ? "Member" : "Non-Member"}
    </span>
  );
}

function TransactionRow({ trx }) {
  const isMember = trx.visitor_type === "member";
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
        {formatDateTime(trx.exit_time)}
      </td>
      <td className="px-5 py-3.5">
        <p className="font-medium text-gray-900">
          {isMember ? trx.member?.name : "Pengunjung"}
        </p>
        <p className="text-xs text-gray-400">
          {isMember
            ? trx.member?.member_code
            : `Tiket #${trx.parking_ticket_id}`}
        </p>
      </td>
      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
        {trx.plate_number}
      </td>
      <td className="px-5 py-3.5 text-gray-600 capitalize">
        {trx.vehicle_type}
      </td>
      <td className="px-5 py-3.5">
        <VisitorBadge type={trx.visitor_type} />
      </td>
      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
        {formatDuration(trx.duration_minutes)}
      </td>
      <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
        {formatRupiah(trx.total_amount)}
      </td>
    </tr>
  );
}

const inputClass =
  "px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-gray-900 transition-colors";

export default function StaffReportsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // tunda pencarian 400ms agar tidak request di setiap ketikan
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["staff-reports", filters, search, page],
    queryFn: () => {
      const params = Object.fromEntries(
        Object.entries({ ...filters, search, page }).filter(
          ([, v]) => v !== "",
        ),
      );
      return reportsService.getStaffReports(params).then((res) => res.data);
    },
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const summary = data?.summary;
  const meta = data?.meta;

  const setFilter = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const hasFilter =
    searchInput !== "" || Object.values(filters).some((v) => v !== "");

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // pakai filter yang sama, tapi tanpa page
      const params = Object.fromEntries(
        Object.entries({ ...filters, search }).filter(([, v]) => v !== ""),
      );
      const res = await reportsService.exportStaffReports(params);

      // ambil nama file dari header backend, kalau ada
      const disposition = res.headers?.["content-disposition"] ?? "";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = match
        ? decodeURIComponent(match[1])
        : `laporan-parkir-${new Date().toISOString().slice(0, 10)}.xlsx`;

      downloadBlob(res.data, filename);
    } catch {
      toast.error("Gagal mengekspor laporan.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Laporan Saya</h1>
        <p className="text-sm text-gray-500 mt-1">
          Transaksi parkir yang kamu proses.
        </p>

        <button
          onClick={handleExport}
          disabled={isExporting || rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Export Excel
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Cari
          </label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Plat atau nama member"
              className={`${inputClass} pl-9 w-56`}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Dari tanggal
          </label>
          <input
            type="date"
            value={filters.date_from}
            max={filters.date_to || undefined}
            onChange={setFilter("date_from")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Sampai tanggal
          </label>
          <input
            type="date"
            value={filters.date_to}
            min={filters.date_from || undefined}
            onChange={setFilter("date_to")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Tipe pengunjung
          </label>
          <select
            value={filters.visitor_type}
            onChange={setFilter("visitor_type")}
            className={inputClass}
          >
            <option value="">Semua</option>
            <option value="member">Member</option>
            <option value="non_member">Non-Member</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Kendaraan
          </label>
          <select
            value={filters.vehicle_type}
            onChange={setFilter("vehicle_type")}
            className={inputClass}
          >
            <option value="">Semua</option>
            <option value="motor">Motor</option>
            <option value="mobil">Mobil</option>
            <option value="truk">Truk</option>
          </select>
        </div>
        {hasFilter && (
          <button
            onClick={resetFilters}
            title="Reset filter"
            aria-label="Reset filter"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
        {isFetching && !isPending && (
          <Loader2 size={16} className="animate-spin text-gray-400 mb-2.5" />
        )}
      </div>

      {/* Ringkasan */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Total Transaksi"
            value={summary.total_transactions}
          />
          <StatCard
            label="Total Pendapatan"
            value={formatRupiah(summary.total_revenue)}
          />
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat laporan...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">Gagal memuat laporan.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">
              Tidak ada transaksi pada filter ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {[
                    "Waktu Keluar",
                    "Nama",
                    "Plat",
                    "Kendaraan",
                    "Tipe",
                    "Durasi",
                    "Total",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-medium text-gray-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((trx) => (
                  <TransactionRow key={trx.id} trx={trx} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Halaman {meta.current_page} dari {meta.last_page} ({meta.total}{" "}
              transaksi)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={meta.current_page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.current_page >= meta.last_page}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Berikutnya
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
