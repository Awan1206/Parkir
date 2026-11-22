import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { parkingService } from "@/services/parking.service";

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "inside", label: "Di Dalam" },
  { value: "exited", label: "Sudah Keluar" },
];

// ─── Helpers ─────────────────────────────────────────────

// waktu dari backend: "YYYY-MM-DD HH:mm:ss"
const toDate = (str) => new Date(str.replace(" ", "T"));

function formatDuration(minutes) {
  if (minutes == null || minutes < 0) return "-";
  if (minutes < 1) return "Baru masuk";
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

function formatTime(str) {
  if (!str) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(str));
}

function formatDate(str) {
  if (!str) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(toDate(str));
}

// ─── Components ──────────────────────────────────────────

function StatusBadge({ status }) {
  const inside = status === "inside";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
        inside ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${inside ? "bg-blue-500" : "bg-gray-400"}`}
      />
      {inside ? "Di Dalam" : "Sudah Keluar"}
    </span>
  );
}

const selectClass =
  "px-3.5 py-3 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all";

// ─── Page ────────────────────────────────────────────────

export default function ParkingStatusPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visitorType, setVisitorType] = useState("");
  const [now, setNow] = useState(Date.now());

  // perbarui durasi kendaraan yang masih di dalam tiap menit
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["parking-status"],
    queryFn: () => parkingService.getStatus().then((res) => res.data.data),
    refetchInterval: 30_000,
  });

  const summary = data?.summary;
  const vehicles = data?.vehicles ?? [];

  const counts = {
    "": vehicles.length,
    inside: vehicles.filter((v) => v.status === "inside").length,
    exited: vehicles.filter((v) => v.status === "exited").length,
  };

  const keyword = search.trim().toLowerCase();
  const filtered = vehicles.filter((v) => {
    const matchStatus = !statusFilter || v.status === statusFilter;
    const matchType = !visitorType || v.visitor_type === visitorType;
    const matchSearch =
      !keyword ||
      v.name?.toLowerCase().includes(keyword) ||
      v.code?.toLowerCase().includes(keyword) ||
      v.plate_number?.toLowerCase().includes(keyword);
    return matchStatus && matchType && matchSearch;
  });

  const hasFilter = search || statusFilter || visitorType;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Kelola Parkir
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau kendaraan yang sedang parkir dan yang sudah keluar hari ini.
          </p>
        </div>
        {isFetching && !isLoading && (
          <Loader2 size={16} className="animate-spin text-gray-400 mt-2" />
        )}
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-gray-900 p-6 lg:p-7">
          <p className="text-sm text-gray-400">Kendaraan di Dalam</p>
          <p className="text-4xl font-semibold text-white tracking-tight mt-2 tabular-nums">
            {summary ? summary.inside_total : "–"}
          </p>
          {summary && (
            <p className="text-sm text-gray-400 mt-3">
              {summary.inside_members} member · {summary.inside_non_members}{" "}
              non-member
            </p>
          )}
        </div>
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 lg:p-7">
          <p className="text-sm text-gray-500">Sudah Keluar Hari Ini</p>
          <p className="text-4xl font-semibold text-gray-900 tracking-tight mt-2 tabular-nums">
            {summary ? summary.exited_today : "–"}
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Dihitung sejak pukul 00.00
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari nama, kode, atau plat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 text-sm bg-white placeholder:text-gray-400 outline-none hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all"
          />
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === t.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              <span className="text-xs text-gray-400 tabular-nums">
                {counts[t.value]}
              </span>
            </button>
          ))}
        </div>

        <select
          value={visitorType}
          onChange={(e) => setVisitorType(e.target.value)}
          className={`${selectClass} self-start`}
        >
          <option value="">Semua Tipe</option>
          <option value="member">Member</option>
          <option value="non_member">Non-Member</option>
        </select>
      </div>

      {/* Tabel (mengisi sisa halaman) */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[320px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 py-20">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-red-500">Gagal memuat data parkir.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">
              {hasFilter
                ? "Tidak ada data yang cocok."
                : "Belum ada aktivitas parkir hari ini."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Pengunjung
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Kendaraan
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Waktu
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Durasi
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((v) => {
                  const inside = v.status === "inside";
                  const minutes = inside
                    ? Math.max(
                        0,
                        Math.floor(
                          (now - toDate(v.entry_time).getTime()) / 60000,
                        ),
                      )
                    : v.duration_minutes;

                  return (
                    <tr
                      key={`${v.status}-${v.visitor_type}-${v.code}-${v.exit_time ?? v.entry_time}`}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-mono">{v.code}</span>
                          {" · "}
                          {v.visitor_type === "member"
                            ? "Member"
                            : "Non-Member"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {v.plate_number ? (
                          <>
                            <span className="inline-block px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 font-mono text-xs font-semibold text-gray-800 tracking-wide">
                              {v.plate_number}
                            </span>
                            <p className="text-xs text-gray-500 capitalize mt-1">
                              {v.vehicle_type}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-gray-900">
                          <span className="text-xs text-gray-500">Masuk </span>
                          {formatTime(v.entry_time)}
                        </p>
                        {v.exit_time && (
                          <p className="text-gray-900 mt-0.5">
                            <span className="text-xs text-gray-500">
                              Keluar{" "}
                            </span>
                            {formatTime(v.exit_time)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(v.exit_time ?? v.entry_time)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap tabular-nums">
                        {formatDuration(minutes)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusBadge status={v.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3.5 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Menampilkan kendaraan di dalam dan yang keluar hari ini. Diperbarui
            otomatis setiap 30 detik.
          </p>
        </div>
      </div>
    </div>
  );
}
