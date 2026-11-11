import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();

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
      console.log("Login error:", error.response?.data);
      const message =
        error.response?.data?.message ?? "Login gagal. Coba lagi.";
      setError("root", { message });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-4">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            ParkOps Enterprise
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Manajemen Parkir</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit((data) => login(data))(e);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors
                  ${errors.email ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-gray-900"}`}
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
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors
                  ${errors.password ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-gray-900"}`}
                {...register("password", { required: "Password wajib diisi" })}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                Lupa password?
              </Link>
            </div>

            {errors.root && (
              <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium
                hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isPending ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
