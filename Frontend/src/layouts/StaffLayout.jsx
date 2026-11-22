import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  FileText,
  LogOut,
  User,
  ParkingSquare,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
  { to: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/staff/members", icon: Users, label: "Kelola Member" },
  { to: "/staff/parking", icon: ParkingSquare, label: "Kelola Parkir" },
  { to: "/staff/transactions", icon: ScanLine, label: "Transaksi Parkir" },
  { to: "/staff/reports", icon: FileText, label: "Laporan" },
];

function ProfileModal({ open, onClose }) {
  const user = useAuth.getUser();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: ({ data }) => {
      useAuth.setSession(localStorage.getItem("token"), data.data);
      onClose();
    },
    onError: (error) => {
      const errs = error.response?.data?.errors;
      if (errs) {
        Object.entries(errs).forEach(([field, messages]) =>
          setError(field, { message: messages[0] }),
        );
      } else {
        setError("root", {
          message: error.response?.data?.message ?? "Terjadi kesalahan.",
        });
      }
    },
  });

  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors ${
      hasError
        ? "border-red-400 focus:border-red-400"
        : "border-gray-300 focus:border-gray-900"
    }`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          noValidate
          className="space-y-4 mt-2"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama
            </label>
            <input
              type="text"
              className={inputClass(errors.name)}
              {...register("name", { required: "Nama wajib diisi" })}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              className={inputClass(errors.email)}
              {...register("email", {
                required: "Email wajib diisi",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Format email tidak valid",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              No. Telepon
            </label>
            <input
              type="text"
              className={inputClass(errors.phone)}
              {...register("phone", { required: "No. telepon wajib diisi" })}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">
              {errors.root.message}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-gray-900 text-sm text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

export default function StaffLayout() {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
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
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">
            ParkOps Enterprise
          </span>
          <p className="text-xs text-gray-500 mt-0.5">Petugas</p>
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
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors mb-1 text-left"
          >
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              <User size={13} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </button>
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
      <LogoutConfirmModal
        open={showLogout}
        onConfirm={() => logout()}
        onClose={() => setShowLogout(false)}
        isPending={isLoggingOut}
      />
    </div>
  );
}
