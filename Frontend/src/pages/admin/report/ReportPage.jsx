import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { reportsService } from "@/services/reports.service";

const INITIAL_FILTERS = {
  date_from: "",
  date_to: "",
  visitor_type: "",
  vehicle_type: "",
};

const VISITOR_TABS = [
  { value: "", label: "Semua" },
  { value: "member", label: "Member" },
  { value: "non_member", label: "Non-Member" },
];

// ─── Helpers ─────────────────────────────────────────────

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDuration(minutes) {
  // Durasi negatif = data tidak valid (waktu keluar lebih awal dari masuk)
  if (minutes == null || minutes < 0) return "-";
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function formatTime(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

const inputClass =
  "w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all";

// ─── Components ──────────────────────────────────────────

function FilterField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function VisitorBadge({ type }) {
  const isMember = type === "member";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isMember
          ? "bg-emerald-50 text-emerald-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isMember ? "bg-emerald-500" : "bg-gray-400"}`}
      />
      {isMember ? "Member" : "Non-Member"}
    </span>
  );
}

function TransactionRow({ trx }) {
  const isMember = trx.visitor_type === "member";
  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-gray-900 font-medium">{formatDate(trx.exit_time)}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatTime(trx.exit_time)} WIB
        </p>
      </td>
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900">
          {isMember ? trx.member?.name : "Pengunjung"}
        </p>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          {isMember
            ? trx.member?.member_code
            : `Tiket #${trx.parking_ticket_id}`}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-block px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 font-mono text-xs font-semibold text-gray-800 tracking-wide">
          {trx.plate_number}
        </span>
        <p className="text-xs text-gray-500 capitalize mt-1">
          {trx.vehicle_type}
        </p>
      </td>
      <td className="px-6 py-4">
        <VisitorBadge type={trx.visitor_type} />
      </td>
      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
        {formatDuration(trx.duration_minutes)}
      </td>
      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
        {trx.processed_by?.name ?? "-"}
      </td>
      <td className="px-6 py-4 text-right font-semibold text-gray-900 whitespace-nowrap tabular-nums">
        {formatRupiah(trx.total_amount)}
      </td>
    </tr>
  );
}

// ─── Page ────────────────────────────────────────────────

export default function ReportsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["admin-reports", filters, page],
    queryFn: () => {
      // buang filter yang kosong agar tidak ikut terkirim
      const params = Object.fromEntries(
        Object.entries({ ...filters, page }).filter(([, v]) => v !== ""),
      );
      return reportsService.getAdminReports(params).then((res) => res.data);
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

  const setVisitorType = (value) => {
    setFilters((prev) => ({ ...prev, visitor_type: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const hasFilter = Object.values(filters).some((v) => v !== "");

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Laporan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Riwayat transaksi parkir yang sudah selesai.
        </p>
      </div>

      {/* Ringkasan */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500">Total Transaksi</p>
            <p className="text-3xl font-semibold text-gray-900 tracking-tight mt-2 tabular-nums">
              {summary.total_transactions}
            </p>
          </div>
          <div className="rounded-3xl bg-gray-900 p-6">
            <p className="text-sm text-gray-400">Total Pendapatan</p>
            <p className="text-3xl font-semibold text-white tracking-tight mt-2 tabular-nums">
              {formatRupiah(summary.total_revenue)}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <FilterField label="Dari tanggal">
            <input
              type="date"
              value={filters.date_from}
              max={filters.to || undefined}
              onChange={setFilter("date_from")}
              className={inputClass}
            />
          </FilterField>
          <FilterField label="Sampai tanggal">
            <input
              type="date"
              value={filters.date_to}
              min={filters.from || undefined}
              onChange={setFilter("date_to")}
              className={inputClass}
            />
          </FilterField>
          <FilterField label="Kendaraan">
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
          </FilterField>

          <div className="sm:col-span-2 lg:col-span-2 flex items-center gap-3 lg:justify-end">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {VISITOR_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setVisitorType(t.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.visitor_type === t.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* {hasFilter && (
              <button
                onClick={resetFilters}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            )} */}
            {isFetching && !isPending && (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Tabel (mengisi sisa halaman) */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[360px]">
        {isPending ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 py-20">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat laporan...</span>
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-red-500">Gagal memuat laporan.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">
              Tidak ada transaksi pada filter ini.
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto flex-1 transition-opacity ${isFetching ? "opacity-60" : ""}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Waktu Keluar",
                    "Pengunjung",
                    "Kendaraan",
                    "Tipe",
                    "Durasi",
                    "Petugas",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="text-right px-6 py-4 text-xs font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((trx) => (
                  <TransactionRow key={trx.id} trx={trx} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginasi */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Halaman {meta.current_page} dari {meta.last_page}
              <span className="text-gray-400"> · {meta.total} transaksi</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={meta.current_page <= 1}
                className="flex items-center gap-1 pl-2.5 pr-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.current_page >= meta.last_page}
                className="flex items-center gap-1 pl-3.5 pr-2.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
