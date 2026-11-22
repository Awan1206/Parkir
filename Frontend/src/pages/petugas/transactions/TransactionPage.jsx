import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  ScanLine,
  Loader2,
  XCircle,
  Download,
  RotateCcw,
  CheckCircle,
  Check,
  Camera,
  Keyboard,
  Receipt,
  Car,
  Clock,
  User,
  Ticket,
} from "lucide-react";
import jsQR from "jsqr";
import { parkingService } from "@/services/parking.service";
import { invoiceService } from "@/services/invoice.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function formatDuration(minutes) {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1.5">{message}</p>;
}

function Field({ label, optional, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {optional && (
          <span className="text-gray-400 font-normal"> (opsional)</span>
        )}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

const inputClass = (hasError) =>
  `w-full px-3.5 py-3 rounded-xl border text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
      : "border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-100"
  }`;

// ─── Invoice Modal ────────────────────────────────────────

function InvoiceModal({ open, transactionId, onClose, onReset }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", transactionId],
    queryFn: () =>
      invoiceService.getById(transactionId).then((res) => res.data.data),
    enabled: open && !!transactionId,
  });

  const handleDownload = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      await invoiceService.downloadPdf(invoice.id, invoice.invoice_number);
    } catch {
      alert("Gagal mengunduh invoice.");
    } finally {
      setIsDownloading(false);
    }
  };

  const typeLabel = {
    parking_non_member: "Parkir Non-Member",
    parking_member: "Parkir Member",
    member_registration: "Registrasi Member",
  };

  const rows = invoice
    ? [
        ["Nama", invoice.recipient_name],
        invoice.vehicle_type && ["Kendaraan", invoice.vehicle_type],
        invoice.plate_number && ["Plat", invoice.plate_number],
        invoice.entry_time && ["Masuk", formatDateTime(invoice.entry_time)],
        invoice.exit_time && ["Keluar", formatDateTime(invoice.exit_time)],
        invoice.duration_minutes && [
          "Durasi",
          formatDuration(invoice.duration_minutes),
        ],
        ["Diterbitkan", formatDateTime(invoice.issued_at)],
        ["Petugas", invoice.issued_by?.name],
      ].filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat invoice...</span>
          </div>
        ) : invoice ? (
          <>
            <div className="bg-gray-900 px-6 pt-8 pb-7 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-3">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400">Pembayaran Berhasil</p>
              <p className="text-3xl font-semibold text-white mt-1 tracking-tight">
                {formatRupiah(invoice.amount)}
              </p>
              <p className="text-xs text-gray-500 font-mono mt-3">
                {invoice.invoice_number}
              </p>
            </div>

            <div className="px-6 pt-5 pb-6">
              <p className="text-xs font-medium text-gray-400 mb-3">
                {typeLabel[invoice.type] ?? invoice.type}
              </p>
              <dl className="space-y-3 text-sm mb-6">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-900 text-right capitalize-first">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {isDownloading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  Unduh PDF
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onReset();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  <RotateCcw size={15} />
                  Scan Berikutnya
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-red-500 text-center py-16">
            Gagal memuat invoice.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Form ─────────────────────────────────────────

function PaymentForm({ totalAmount, onConfirm, isPending }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { cash_received: "" },
  });

  const total = parseFloat(totalAmount);
  const cashReceived = parseFloat(watch("cash_received")) || 0;
  const change = cashReceived - total;

  return (
    <form
      onSubmit={handleSubmit(({ cash_received }) => onConfirm(cash_received))}
      noValidate
      className="space-y-5"
    >
      <div className="rounded-2xl bg-gray-900 p-6 text-center">
        <p className="text-sm text-gray-400 mb-1">Total Tagihan</p>
        <p className="text-4xl font-semibold text-white tracking-tight">
          {formatRupiah(totalAmount)}
        </p>
      </div>

      {total > 0 && (
        <>
          <Field label="Uang Diterima" error={errors.cash_received?.message}>
            <input
              type="number"
              placeholder="0"
              className={inputClass(errors.cash_received)}
              {...register("cash_received", {
                required: "Nominal wajib diisi",
                min: {
                  value: total,
                  message: `Minimal ${formatRupiah(totalAmount)}`,
                },
              })}
            />
          </Field>

          {cashReceived >= total && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 flex justify-between items-center text-sm">
              <span className="text-emerald-700">Kembalian</span>
              <span className="font-semibold text-emerald-800 text-base">
                {formatRupiah(change)}
              </span>
            </div>
          )}
        </>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={15} className="animate-spin" /> Memproses...
          </span>
        ) : total === 0 ? (
          "Selesaikan Transaksi"
        ) : (
          "Konfirmasi Pembayaran"
        )}
      </button>
    </form>
  );
}

// ─── Exit Form ────────────────────────────────────────────

function ExitForm({ scanResult, qrToken, onSuccess, onReset }) {
  const [step, setStep] = useState("vehicle"); // vehicle | payment
  const [preview, setPreview] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      vehicle_type: "motor",
      plate_number: "",
      stnk_verified: false,
      notes: "",
    },
  });

  // Fase 1: hanya hitung tagihan, status tiket TIDAK berubah
  const {
    mutate: previewExit,
    isPending: isPreviewing,
    error: previewError,
  } = useMutation({
    mutationFn: (data) =>
      parkingService.preview({
        qr_token: qrToken,
        vehicle_type: data.vehicle_type,
      }),
    onSuccess: ({ data }) => {
      setPreview(data.data);
      setStep("payment");
    },
  });

  // Fase 2: dipanggil hanya saat "Konfirmasi Pembayaran" ditekan
  const {
    mutate: processExit,
    isPending: isPaying,
    error: exitError,
  } = useMutation({
    mutationFn: (cash) =>
      parkingService.exit({
        ...vehicleData,
        qr_token: qrToken,
        cash_received: cash,
      }),
    onSuccess: ({ data }) => onSuccess(data.data.invoice.id),
  });

  const handleVehicleSubmit = (data) => {
    setVehicleData(data);
    previewExit(data);
  };

  const isMember = scanResult.type === "member";
  const errorMessage = previewError?.response?.data?.message;

  if (step === "payment" && preview) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">
              {isMember ? "Member" : "Plat Nomor"}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {isMember
                ? scanResult.name
                : vehicleData.plate_number.toUpperCase()}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500 mb-0.5">Durasi Parkir</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDuration(preview.duration_minutes)}
            </p>
          </div>
        </div>

        {exitError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-4">
            <XCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600">
              {exitError.response?.data?.message ?? "Transaksi gagal."}
            </p>
          </div>
        )}

        <PaymentForm
          totalAmount={preview.total_amount}
          onConfirm={(cash) => processExit(Number(cash) || 0)}
          isPending={isPaying}
        />

        <button
          type="button"
          onClick={() => setStep("vehicle")}
          disabled={isPaying}
          className="w-full mt-3 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(handleVehicleSubmit)}
      noValidate
      className="space-y-5"
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Jenis Kendaraan">
          <select
            className={inputClass(errors.vehicle_type)}
            {...register("vehicle_type", { required: true })}
          >
            <option value="motor">Motor</option>
            <option value="mobil">Mobil</option>
            <option value="truk">Truk</option>
          </select>
        </Field>

        <Field label="Nomor Plat" error={errors.plate_number?.message}>
          <input
            type="text"
            placeholder="B 1234 ABC"
            className={`${inputClass(errors.plate_number)} uppercase`}
            {...register("plate_number", {
              required: "Nomor plat wajib diisi",
            })}
          />
        </Field>
      </div>

      <label
        htmlFor="stnk_verified"
        className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <input
          type="checkbox"
          id="stnk_verified"
          className="w-4 h-4 rounded border-gray-300 accent-gray-900"
          {...register("stnk_verified")}
        />
        <span className="text-sm text-gray-700">STNK sudah diverifikasi</span>
      </label>

      <Field label="Catatan" optional>
        <textarea
          rows={3}
          className={`${inputClass(false)} resize-none`}
          placeholder="Catatan tambahan..."
          {...register("notes")}
        />
      </Field>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <XCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPreviewing}
          className="flex-1 py-3 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPreviewing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              Memproses...
            </span>
          ) : (
            "Lanjut ke Pembayaran"
          )}
        </button>
      </div>
    </form>
  );
}

// ─── QR Scanner ───────────────────────────────────────────

function QrScanner({ onScan, isPending }) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const { register, handleSubmit, setValue } = useForm();

  const stopCamera = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        stopCamera();
        onScan(code.data);
        return;
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setCameraError(null);
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
      setCameraError("Tidak dapat mengakses kamera.");
    }
  };

  useEffect(() => () => stopCamera(), []);

  const corner = "absolute w-8 h-8 border-white/90";

  return (
    <div className="space-y-6">
      {/* Viewport */}
      <div className="relative w-full aspect-[16/10] max-h-[440px] rounded-3xl overflow-hidden bg-gray-950">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {scanning ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                <span
                  className={`${corner} top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl`}
                />
                <span
                  className={`${corner} top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl`}
                />
                <span
                  className={`${corner} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl`}
                />
                <span
                  className={`${corner} bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl`}
                />
                <div className="absolute inset-x-3 top-1/2 h-0.5 bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-4 inset-x-0 flex justify-center">
              <span className="text-xs text-white/80 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full">
                Arahkan QR ke dalam bingkai
              </span>
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-4 right-4 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              Tutup Kamera
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <ScanLine size={28} className="text-white/70" />
            </div>
            <p className="text-white font-medium">Kamera belum aktif</p>
            <p className="text-sm text-gray-400 mt-1 mb-6 max-w-xs">
              Aktifkan kamera untuk memindai QR tiket atau kartu member.
            </p>
            <button
              onClick={startCamera}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
              Buka Kamera
            </button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <XCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{cameraError}</p>
        </div>
      )}

      {/* Input manual */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Keyboard size={13} /> atau scan dengan USB / input manual
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <form
          onSubmit={handleSubmit(({ qr_token }) => {
            setValue("qr_token", "");
            onScan(qr_token);
          })}
          className="flex gap-3"
        >
          <input
            type="text"
            placeholder="Scan atau ketik token QR..."
            autoComplete="off"
            className={`${inputClass(false)} flex-1 min-w-0`}
            {...register("qr_token", { required: true })}
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-7 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Proses"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Summary Panel (kanan) ────────────────────────────────

function SummaryRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`text-sm font-medium text-gray-900 break-words ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryPanel({ scanResult }) {
  const tips = [
    "Pastikan QR tidak terlipat atau buram.",
    "Gunakan scanner USB jika kamera kurang jelas.",
    "Periksa STNK sebelum memproses kendaraan keluar.",
  ];

  if (!scanResult) {
    return (
      <aside className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-7">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
          <Receipt size={18} className="text-gray-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">
          Ringkasan Transaksi
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Detail kendaraan akan tampil di sini setelah QR berhasil dipindai.
        </p>
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs font-medium text-gray-400 mb-3">Panduan</p>
          <ul className="space-y-3">
            {tips.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm text-gray-600">
                <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }

  const isMember = scanResult.type === "member";

  return (
    <aside className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-gray-900">
          Ringkasan Transaksi
        </h2>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isMember ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {isMember ? "Member" : "Non-Member"}
        </span>
      </div>

      <div className="space-y-5">
        {isMember ? (
          <>
            <SummaryRow
              icon={User}
              label="Nama Member"
              value={scanResult.name}
            />
            <SummaryRow
              icon={Ticket}
              label="Kode Member"
              value={scanResult.member_code}
              mono
            />
          </>
        ) : (
          <SummaryRow
            icon={Ticket}
            label="Kode Tiket"
            value={scanResult.ticket_code}
            mono
          />
        )}
        <SummaryRow
          icon={Clock}
          label="Waktu Masuk"
          value={formatDateTime(scanResult.entry_time)}
        />
        <SummaryRow icon={Car} label="Status" value="Di Dalam Area Parkir" />
      </div>
    </aside>
  );
}

// ─── Stepper ──────────────────────────────────────────────

function Stepper({ steps, labels, current }) {
  const currentIndex = steps.indexOf(current);
  return (
    <ol className="flex items-center w-full">
      {steps.map((s, i) => {
        const done = currentIndex > i;
        const active = currentIndex === i;
        return (
          <li
            key={s}
            className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  active
                    ? "bg-gray-900 text-white"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  active ? "text-gray-900 font-medium" : "text-gray-400"
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 mx-4 ${done ? "bg-emerald-300" : "bg-gray-200"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function TransactionPage() {
  const [step, setStep] = useState("scan");
  const [scanResult, setScanResult] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [scanError, setScanError] = useState(null);

  const { mutate: scan, isPending: isScanning } = useMutation({
    mutationFn: parkingService.scan,
    onSuccess: ({ data }, token) => {
      setQrToken(token);
      setScanResult(data.data);
      setScanError(null);
      setStep("form");
    },
    onError: (error) =>
      setScanError(error.response?.data?.message ?? "Scan gagal."),
  });

  const handleReset = () => {
    setStep("scan");
    setScanResult(null);
    setQrToken(null);
    setTransactionId(null);
    setScanError(null);
  };

  const steps = ["scan", "form", "invoice"];
  const stepLabels = ["Scan QR", "Data & Bayar", "Invoice"];

  const heading = {
    scan: {
      title: "Pindai QR Kendaraan",
      desc: "Scan QR tiket atau kartu member untuk memulai proses keluar.",
    },
    form: {
      title: "Data Kendaraan & Pembayaran",
      desc: "Lengkapi data kendaraan, lalu lanjutkan ke pembayaran.",
    },
    invoice: {
      title: "Transaksi Selesai",
      desc: "Invoice sedang disiapkan.",
    },
  }[step];

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 flex flex-col">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Transaksi Parkir
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Proses kendaraan keluar dengan cepat dan akurat.
        </p>
      </div>

      {/* Full-page layout */}
      <div className="flex-1 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        {/* Workspace */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col min-h-[640px]">
          <div className="px-6 lg:px-10 py-6 border-b border-gray-100">
            <Stepper steps={steps} labels={stepLabels} current={step} />
          </div>

          <div className="flex-1 px-6 lg:px-10 py-8">
            <div className="max-w-2xl mx-auto w-full">
              <div className="mb-7">
                <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
                  {heading.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{heading.desc}</p>
              </div>

              {step === "scan" && (
                <div>
                  {scanError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                      <XCircle size={16} className="text-red-500 shrink-0" />
                      <p className="text-sm text-red-600">{scanError}</p>
                    </div>
                  )}
                  <QrScanner
                    onScan={(token) => scan(token)}
                    isPending={isScanning}
                  />
                </div>
              )}

              {step === "form" && scanResult && (
                <ExitForm
                  scanResult={scanResult}
                  qrToken={qrToken}
                  onSuccess={(id) => {
                    setTransactionId(id);
                    setStep("invoice");
                  }}
                  onReset={handleReset}
                />
              )}
            </div>
          </div>
        </section>

        {/* Ringkasan */}
        <div className="lg:sticky lg:top-10">
          <SummaryPanel scanResult={scanResult} />
        </div>
      </div>

      <InvoiceModal
        open={step === "invoice"}
        transactionId={transactionId}
        onClose={() => {}}
        onReset={handleReset}
      />
    </div>
  );
}
