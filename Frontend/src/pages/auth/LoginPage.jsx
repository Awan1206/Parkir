import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { authService } from "@/services/auth.service";
import useAuth from "@/hooks/useAuth";

const inputClass = (hasError) =>
  `w-full px-3.5 py-3 rounded-xl border text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
      : "border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-100"
  }`;

function Brand({ light }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          light ? "bg-white" : "bg-gray-900"
        }`}
      >
        <span
          className={`font-bold text-lg ${light ? "text-gray-900" : "text-white"}`}
        >
          P
        </span>
      </div>
      <span
        className={`font-semibold ${light ? "text-white" : "text-gray-900"}`}
      >
        ParkOps Enterprise
      </span>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();

  const { mutate: login, isPending } = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ data }) => {
      useAuth.setSession(data.data.token, data.data.user);
      navigate(
        data.data.user.role === "super_admin"
          ? "/admin/dashboard"
          : "/staff/dashboard",
      );
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ?? "Login gagal. Coba lagi.";
      setError("root", { message });
    },
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Panel brand (desktop) */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-black via-slate-900 to-blue-950 p-12">
        <Brand light />
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight leading-tight max-w-sm">
            Sistem Manajemen Parkir
          </h2>
          <p className="text-gray-400 mt-3 max-w-sm">
            Kelola tiket, member, dan transaksi parkir dalam satu tempat.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Brand (mobile) */}
          <div className="lg:hidden mb-10">
            <Brand />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Masuk
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 mb-8">
            Masukkan email dan password untuk melanjutkan.
          </p>

          <form
            onSubmit={handleSubmit((data) => login(data))}
            noValidate
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
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
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${inputClass(errors.password)} pr-11`}
                  {...register("password", {
                    required: "Password wajib diisi",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{errors.root.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
