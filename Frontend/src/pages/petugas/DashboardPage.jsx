import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  QrCode,
  Users,
  FileText,
  TrendingUp,
  Car,
  CreditCard,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import useAuth from "@/hooks/useAuth";

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

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-xl font-semibold text-gray-900 leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}

function MemberStatRow({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StaffDashboardPage() {
  const user = useAuth.getUser();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: () =>
      dashboardService.getStaffDashboard().then((res) => res.data.data),
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

  const { today, this_month, members, recent_transactions = [] } = data;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Halo, {user?.name} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Berikut ringkasan aktivitas parkir hari ini.
        </p>
      </div>

      {/* Stat cards hari ini */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Transaksi Hari Ini"
          value={today.total_transactions}
          icon={TrendingUp}
          accent="bg-gray-900"
        />
        <StatCard
          label="Kendaraan di Dalam"
          value={today.vehicles_inside}
          icon={Car}
          accent="bg-blue-500"
        />
        <StatCard
          label="Pendapatan Hari Ini"
          value={formatRupiah(today.total_revenue)}
          icon={CreditCard}
          accent="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Kiri — aksi cepat + bulan ini */}
        <div className="col-span-2 space-y-6">
          {/* Aksi cepat */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
              Aksi Cepat
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  to: "/staff/transactions",
                  icon: QrCode,
                  label: "Scan QR",
                  desc: "Proses kendaraan keluar",
                },
                {
                  to: "/staff/members",
                  icon: Users,
                  label: "Member",
                  desc: "Kelola data member",
                },
                {
                  to: "/staff/reports",
                  icon: FileText,
                  label: "Laporan",
                  desc: "Riwayat transaksi",
                },
              ].map(({ to, icon: Icon, label, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <Icon size={15} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Transaksi terbaru */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Transaksi Terbaru
              </p>
            </div>
            {recent_transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">
                  Belum ada transaksi hari ini.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Nama", "Kendaraan", "Durasi", "Total"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-medium text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent_transactions.map((trx) => (
                    <tr
                      key={trx.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{trx.name}</p>
                        <p className="text-xs text-gray-400">
                          {trx.visitor_type === "member"
                            ? "Member"
                            : "Non-Member"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-700 capitalize">
                          {trx.vehicle_type}
                        </p>
                        <p className="text-xs text-gray-400">
                          {trx.plate_number}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDuration(trx.duration_minutes)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {formatRupiah(trx.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Kanan — member + bulan ini */}
        <div className="space-y-6">
          {/* Member summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Member
              </p>
              <Link
                to="/staff/members"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                Lihat semua →
              </Link>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {members.total}
            </p>
            <p className="text-xs text-gray-400 mb-5">Total member terdaftar</p>
            <div className="space-y-3.5">
              <MemberStatRow
                label="Aktif"
                value={members.active}
                total={members.total}
              />
              <MemberStatRow
                label="Belum Bayar"
                value={members.unpaid}
                total={members.total}
              />
            </div>
          </div>

          {/* Bulan ini */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
              Bulan Ini
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total Transaksi</p>
                <p className="text-xl font-semibold text-gray-900">
                  {this_month.total_transactions}
                </p>
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total Pendapatan</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatRupiah(this_month.total_revenue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
