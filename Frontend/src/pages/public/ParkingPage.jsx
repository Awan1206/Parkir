import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  QrCode,
  Ticket,
  ScanLine,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Bike,
  Car,
  Truck,
} from "lucide-react";
import QRCode from "qrcode";
import { publicService } from "@/services/public.service";
import jsQR from "jsqr";

// ─── Helpers ─────────────────────────────────────────────

function formatDateTime(str) {
  if (!str) return "-";
  return new Date(str).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Auto return ─────────────────────────────────────────

// lama tampil (detik) sebelum layar kembali otomatis
const RESET_SECONDS = {
  ticket: 5,
  memberSuccess: 5,
  memberError: 8,
};

function AutoReturn({ seconds, onDone }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <div className="mt-5">
      <div className="h-1 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full bg-black/40 transition-all duration-1000 ease-linear"
          style={{ width: `${(left / seconds) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Kembali otomatis dalam {left} detik
      </p>
    </div>
  );
}

// ─── Tarif ────────────────────────────────────────────────

const TARIF = [
  { label: "Motor", price: 3000, icon: Bike },
  { label: "Mobil", price: 5000, icon: Car },
  { label: "Truk", price: 8000, icon: Truck },
];

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function TarifCatalog() {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Tarif Parkir
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {TARIF.map(({ label, price, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl bg-gray-50 px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
              <Icon size={20} className="text-gray-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-base font-semibold text-gray-900 tabular-nums">
                {formatRupiah(price)}
                <span className="text-xs font-normal text-gray-500"> /jam</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Panel wrapper (kartu kiri / kanan) ──────────────────

function Panel({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
      <header className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
          <Icon size={20} className="text-gray-700" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 leading-tight">
            {title}
          </h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </header>
      <div className="flex-1 flex flex-col justify-center">{children}</div>
    </section>
  );
}

// ─── Ticket Result ────────────────────────────────────────

function TicketResult({ ticket, onReset }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    QRCode.toDataURL(ticket.qr_token, { width: 200, margin: 2 }).then(
      setQrDataUrl,
    );
  }, [ticket.qr_token]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `tiket-${ticket.ticket_code}.png`;
    link.click();
  };

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
        <CheckCircle size={24} className="text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Tiket Berhasil Diterbitkan
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Simpan atau unduh QR code ini untuk keluar parkir.
      </p>

      <div className="bg-gray-50 rounded-2xl p-6 mb-6">
        <div className="flex justify-center mb-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Tiket"
              className="w-44 h-44 rounded-xl"
            />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Kode Tiket</span>
            <span className="font-mono font-semibold text-gray-900">
              {ticket.ticket_code}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Waktu Masuk</span>
            <span className="text-gray-900">
              {formatDateTime(ticket.entry_time)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="text-green-600 font-medium">Di Dalam</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Unduh QR
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-sm text-white hover:bg-gray-800 transition-colors"
        >
          <RotateCcw size={16} />
          Tiket Baru
        </button>
      </div>

      <AutoReturn seconds={RESET_SECONDS.ticket} onDone={onReset} />
    </div>
  );
}

// ─── Non-Member (kiri) ────────────────────────────────────

function NonMemberPanel() {
  const [ticket, setTicket] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: publicService.issueTicket,
    onSuccess: ({ data }) => setTicket(data.data),
  });

  return (
    <Panel
      icon={Ticket}
      title="Non-Member"
      subtitle="Ambil tiket untuk masuk parkir"
    >
      {ticket ? (
        <TicketResult ticket={ticket} onReset={() => setTicket(null)} />
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-5">
            <Ticket size={28} className="text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ambil Tiket Parkir
          </h3>
          <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
            Klik tombol di bawah untuk mendapatkan tiket parkir. Simpan QR code
            untuk proses keluar.
          </p>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Menerbitkan...
              </span>
            ) : (
              "Ambil Tiket Sekarang"
            )}
          </button>
        </div>
      )}
    </Panel>
  );
}

// ─── Member Entry (kanan) ─────────────────────────────────

function MemberPanel() {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (qr_token) => publicService.memberEntry(qr_token),
    onSuccess: ({ data }) =>
      setResult({ success: true, data: data.data, message: data.message }),
    onError: (error) =>
      setResult({
        success: false,
        message: error.response?.data?.message ?? "Terjadi kesalahan.",
      }),
    onSettled: () => stopCamera(),
  });

  const stopCamera = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const startCamera = async () => {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setScanning(true);
      scanFrame();
    } catch {
      setResult({ success: false, message: "Tidak dapat mengakses kamera." });
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        mutate(code.data);
        return;
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => () => stopCamera(), []);

  const handleManualSubmit = ({ qr_token }) => mutate(qr_token);

  const handleReset = () => {
    setResult(null);
    setValue("qr_token", "");
  };

  return (
    <Panel
      icon={QrCode}
      title="Member"
      subtitle="Scan kartu member untuk masuk"
    >
      <div>
        {/* Kamera scanner */}
        <div
          className={`relative rounded-2xl overflow-hidden bg-gray-900 mb-5 ${scanning ? "block" : "hidden"}`}
          style={{ aspectRatio: "4/3" }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white/60 rounded-2xl" />
          </div>
          <button
            onClick={stopCamera}
            className="absolute top-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg"
          >
            Batal
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {/* Result */}
        {result && (
          <div
            className={`rounded-xl p-4 mb-5 ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle
                  size={18}
                  className="text-green-600 shrink-0 mt-0.5"
                />
              ) : (
                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${result.success ? "text-green-800" : "text-red-700"}`}
                >
                  {result.message}
                </p>
                {result.success && result.data && (
                  <div className="mt-2 space-y-1 text-xs text-green-700">
                    <p>
                      {result.data.name} — {result.data.member_code}
                    </p>
                    <p>Masuk: {formatDateTime(result.data.entry_time)}</p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Scan lagi
            </button>

            <AutoReturn
              seconds={
                result.success
                  ? RESET_SECONDS.memberSuccess
                  : RESET_SECONDS.memberError
              }
              onDone={handleReset}
            />
          </div>
        )}

        {!scanning && !result && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-5">
              <ScanLine size={28} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Scan Kartu Member
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Gunakan kamera atau scanner USB untuk memproses masuk parkir
              member.
            </p>
            <button
              onClick={startCamera}
              className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Buka Kamera
            </button>
          </div>
        )}

        {/* Input manual / USB scanner */}
        {!result && (
          <form onSubmit={handleSubmit(handleManualSubmit)}>
            <p className="text-xs text-gray-400 text-center mb-2">
              atau masukkan token QR secara manual / USB scanner
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Scan atau ketik token QR..."
                className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm bg-white outline-none transition-colors ${
                  errors.qr_token
                    ? "border-red-400"
                    : "border-gray-300 focus:border-gray-900"
                }`}
                {...register("qr_token", { required: true })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(handleManualSubmit)();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Proses"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Panel>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function ParkingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-6">
        <TarifCatalog />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <NonMemberPanel />
          <MemberPanel />
        </div>
      </div>
    </div>
  );
}
