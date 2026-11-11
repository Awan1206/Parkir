import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

const STEPS = { EMAIL: "email", OTP: "otp", RESET: "reset", DONE: "done" };

function StepEmail({ onSuccess }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: { identifier: "", channel: "email" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (_, variables) =>
      onSuccess(variables.identifier, variables.channel),
    onError: (error) =>
      setError("root", {
        message: error.response?.data?.message ?? "Terjadi kesalahan.",
      }),
  });

  return (
    <>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Lupa Password</h2>
        <p className="text-sm text-gray-500 mt-1">
          Masukkan email atau nomor telepon akun Anda.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        noValidate
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email / No. Telepon
          </label>
          <input
            type="text"
            placeholder="email@contoh.com atau 08xxxxxxxxxx"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors ${
              errors.identifier
                ? "border-red-400"
                : "border-gray-300 focus:border-gray-900"
            }`}
            {...register("identifier", { required: "Field ini wajib diisi" })}
          />
          {errors.identifier && (
            <p className="text-xs text-red-500 mt-1">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Kirim OTP via
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "email", label: "Email" },
              { value: "whatsapp", label: "WhatsApp" },
            ].map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50 border-gray-200"
              >
                <input
                  type="radio"
                  value={value}
                  className="accent-gray-900"
                  {...register("channel", { required: true })}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {errors.root && (
          <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Mengirim...
            </span>
          ) : (
            "Kirim Kode OTP"
          )}
        </button>
      </form>
    </>
  );
}

function StepOtp({ email, onSuccess, onBack }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: authService.verifyOtp,
    onSuccess: ({ data }) => onSuccess(data.data.reset_token),
    onError: (error) =>
      setError("root", {
        message: error.response?.data?.message ?? "OTP tidak valid.",
      }),
  });

  return (
    <>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Verifikasi OTP
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Kode OTP telah dikirim ke{" "}
          <span className="font-medium text-gray-900">{email}</span>.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) =>
          mutate({ identifier: email, otp: data.otp }),
        )}
        noValidate
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Kode OTP
          </label>
          <input
            type="text"
            placeholder="123456"
            maxLength={6}
            className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white outline-none text-center tracking-widest font-mono transition-colors ${
              errors.otp
                ? "border-red-400"
                : "border-gray-300 focus:border-gray-900"
            }`}
            {...register("otp", {
              required: "Kode OTP wajib diisi",
              minLength: { value: 4, message: "Kode OTP tidak valid" },
            })}
          />
          {errors.otp && (
            <p className="text-xs text-red-500 mt-1">{errors.otp.message}</p>
          )}
        </div>

        {errors.root && (
          <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Memverifikasi...
            </span>
          ) : (
            "Verifikasi OTP"
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Kirim ulang OTP
        </button>
      </form>
    </>
  );
}

function StepReset({ email, resetToken, onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess,
    onError: (error) =>
      setError("root", {
        message: error.response?.data?.message ?? "Terjadi kesalahan.",
      }),
  });

  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors ${
      hasError ? "border-red-400" : "border-gray-300 focus:border-gray-900"
    }`;

  return (
    <>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Reset Password
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Buat password baru untuk akun Anda.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) =>
          mutate({
            identifier: email,
            reset_token: resetToken,
            password: data.password,
            password_confirmation: data.password_confirmation,
          }),
        )}
        noValidate
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password Baru
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={inputClass(errors.password)}
            {...register("password", {
              required: "Password wajib diisi",
              minLength: { value: 8, message: "Password minimal 8 karakter" },
            })}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Konfirmasi Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={inputClass(errors.password_confirmation)}
            {...register("password_confirmation", {
              required: "Konfirmasi password wajib diisi",
              validate: (val) =>
                val === watch("password") || "Password tidak cocok",
            })}
          />
          {errors.password_confirmation && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Menyimpan...
            </span>
          ) : (
            "Simpan Password Baru"
          )}
        </button>
      </form>
    </>
  );
}

function StepDone({ onLogin }) {
  return (
    <div className="text-center py-2">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
        <CheckCircle size={22} className="text-green-600" />
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        Password Berhasil Diubah
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Silakan login dengan password baru Anda.
      </p>
      <button
        onClick={onLogin}
        className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Kembali ke Login
      </button>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

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
          {/* Step indicator */}
          {step !== STEPS.DONE && (
            <div className="flex items-center gap-1 mb-5">
              {[STEPS.EMAIL, STEPS.OTP, STEPS.RESET].map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      [STEPS.EMAIL, STEPS.OTP, STEPS.RESET].indexOf(step) >= i
                        ? "bg-gray-900"
                        : "bg-gray-200"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}

          {step === STEPS.EMAIL && (
            <StepEmail
              onSuccess={(id) => {
                setEmail(id);
                setStep(STEPS.OTP);
              }}
            />
          )}
          {step === STEPS.OTP && (
            <StepOtp
              email={email}
              onSuccess={(token) => {
                setResetToken(token);
                setStep(STEPS.RESET);
              }}
              onBack={() => setStep(STEPS.EMAIL)}
            />
          )}
          {step === STEPS.RESET && (
            <StepReset
              email={email}
              resetToken={resetToken}
              onSuccess={() => setStep(STEPS.DONE)}
            />
          )}
          {step === STEPS.DONE && (
            <StepDone onLogin={() => navigate("/login")} />
          )}
        </div>

        {step !== STEPS.DONE && (
          <div className="text-center mt-5">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={14} />
              Kembali ke Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
