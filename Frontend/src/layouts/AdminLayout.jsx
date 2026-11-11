import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import useAuth from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const navItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/staff", icon: Users, label: "Kelola Petugas" },
  { to: "/admin/reports", icon: FileText, label: "Laporan" },
];

function LogoutConfirmModal({ open, onConfirm, onClose, isPending }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keluar dari Akun</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 mt-1">
          Apakah Anda yakin ingin keluar? Anda perlu login kembali untuk
          mengakses sistem.
        </p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-sm text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Keluar..." : "Ya, Keluar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const user = useAuth.getUser();

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      useAuth.clearSession();
      navigate("/login");
    },
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">
            ParkOps Enterprise
          </span>
          <p className="text-xs text-gray-500 mt-0.5">Super Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <LogoutConfirmModal
        open={showLogout}
        onConfirm={() => logout()}
        onClose={() => setShowLogout(false)}
        isPending={isLoggingOut}
      />
    </div>
  );
}
