import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";

// ─── Helpers ─────────────────────────────────────────────

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDuration(minutes) {
  if (minutes == null) return "-";
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

const pct = (value, total) => (total > 0 ? (value / total) * 100 : 0);

// ─── Components ──────────────────────────────────────────

function Card({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-7 ${className}`}
    >
      {title && (
        <header className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

function StatCard({ label, value, dark }) {
  return (
    <div
      className={`rounded-3xl p-6 lg:p-7 ${
        dark ? "bg-gray-900" : "bg-white border border-gray-100 shadow-sm"
      }`}
    >
      <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
        {label}
      </p>
      <p
        className={`text-3xl font-semibold tracking-tight mt-2 tabular-nums ${
          dark ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MemberStatus({ members }) {
  const items = [
    { label: "Aktif", value: members.active, color: "bg-emerald-500" },
    { label: "Belum Bayar", value: members.unpaid, color: "bg-amber-500" },
  ];

  return (
    <Card
      title="Member"
      subtitle="Status keanggotaan saat ini"
      className="lg:col-span-2"
    >
      <p className="text-4xl font-semibold text-gray-900 tracking-tight tabular-nums">
        {members.total}
        <span className="text-sm font-normal text-gray-500 ml-2">
          member terdaftar
        </span>
      </p>

      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mt-6">
        {items.map((i) => (
          <div
            key={i.label}
            className={i.color}
            style={{ width: `${pct(i.value, members.total)}%` }}
          />
        ))}
      </div>

      <dl className="mt-5 space-y-3">
        {items.map((i) => (
          <div
            key={i.label}
            className="flex items-center justify-between text-sm"
          >
            <dt className="flex items-center gap-2.5 text-gray-600">
              <span className={`w-2 h-2 rounded-full ${i.color}`} />
              {i.label}
            </dt>
            <dd className="font-semibold text-gray-900 tabular-nums">
              {i.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function MonthlySummary({ month }) {
  const entries = Object.entries(month.by_vehicle_type ?? {});
  const totalRevenue = entries.reduce(
    (sum, [, v]) => sum + Number(v.revenue),
    0,
  );

  return (
    <Card
      title="Bulan Ini"
      subtitle="Performa transaksi bulan berjalan"
      className="lg:col-span-3"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gray-50 px-5 py-4">
          <p className="text-xs text-gray-500">Total Transaksi</p>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight mt-1 tabular-nums">
            {month.total_transactions}
          </p>
        </div>
        <div className="rounded-2xl bg-gray-50 px-5 py-4">
          <p className="text-xs text-gray-500">Total Pendapatan</p>
          <p className="text-2xl font-semibold text-gray-900 tracking-tight mt-1 tabular-nums">
            {formatRupiah(month.total_revenue)}
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mt-7">
          <p className="text-xs font-medium text-gray-500 mb-4">
            Pendapatan per jenis kendaraan
          </p>
          <ul className="space-y-4">
            {entries.map(([type, val]) => (
              <li key={type}>
                <div className="flex items-baseline justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-900 capitalize">
                    {type}
                    <span className="text-gray-500 font-normal">
                      {" "}
                      · {val.total} transaksi
                    </span>
                  </span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatRupiah(val.revenue)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-900"
                    style={{
                      width: `${pct(Number(val.revenue), totalRevenue)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
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

function RecentTransactionRow({ trx }) {
  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900">{trx.name}</p>
        <div className="mt-1">
          <VisitorBadge type={trx.visitor_type} />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-block px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 font-mono text-xs font-semibold text-gray-800 tracking-wide">
          {trx.plate_number}
        </span>
        <p className="text-xs text-gray-500 capitalize mt-1">
          {trx.vehicle_type}
        </p>
      </td>
      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
        {formatDuration(trx.duration_minutes)}
      </td>
      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
        {trx.processed_by ?? "-"}
      </td>
      <td className="px-6 py-4 text-right font-semibold text-gray-900 whitespace-nowrap tabular-nums">
        {formatRupiah(trx.total_amount)}
      </td>
    </tr>
  );
}

// ─── Page ────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () =>
      dashboardService.getAdminDashboard().then((res) => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32 gap-2 text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Memuat dashboard...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <p className="text-sm text-red-500">Gagal memuat data dashboard.</p>
      </div>
    );
  }

  const { today, members, this_month, recent_transactions } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan sistem parkir hari ini.
        </p>
      </div>

      {/* Hari ini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard
          dark
          label="Pendapatan Hari Ini"
          value={formatRupiah(today.total_revenue)}
        />
        <StatCard label="Transaksi Hari Ini" value={today.total_transactions} />
        <StatCard label="Kendaraan di Dalam" value={today.vehicles_inside} />
      </div>

      {/* Member + Bulan ini */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
        <MemberStatus members={members} />
        <MonthlySummary month={this_month} />
      </div>

      {/* Transaksi terbaru */}
      {recent_transactions.length > 0 && (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <header className="px-6 lg:px-7 pt-6 pb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Transaksi Terbaru
            </h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-100">
                  {["Pengunjung", "Kendaraan", "Durasi", "Petugas"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="text-right px-6 py-3.5 text-xs font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent_transactions.map((trx) => (
                  <RecentTransactionRow key={trx.id} trx={trx} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
