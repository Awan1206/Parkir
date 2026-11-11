import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Plus,
  Loader2,
  Download,
  QrCode,
  CreditCard,
  Search,
  MessageCircle,
  Pencil,
  CheckCircle,
  XCircle,
} from "lucide-react";
import QRCode from "qrcode";
import { memberService } from "@/services/member.service";
import { invoiceService } from "@/services/invoice.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Helpers ─────────────────────────────────────────────

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const inputClass = (hasError) =>
  `w-full px-3.5 py-3 rounded-xl border text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
      : "border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-100"
  }`;

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
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

function BillingBadge({ status }) {
  const map = {
    paid: {
      cls: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      label: "Aktif",
    },
    unpaid: {
      cls: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      label: "Belum Bayar",
    },
    expired: {
      cls: "bg-red-50 text-red-600",
      dot: "bg-red-500",
      label: "Expired",
    },
  };
  const s = map[status] ?? {
    cls: "bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ModalActions({ children }) {
  return <div className="flex gap-3 pt-2">{children}</div>;
}

const btnGhost =
  "flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors";
const btnPrimary =
  "flex-1 py-3 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

// ─── Member Form Modal (Tambah & Edit) ────────────────────

function MemberFormModal({ open, member, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!member;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: member?.name ?? "",
      phone: member?.phone ?? "",
      notes: member?.notes ?? "",
    },
  });

  useEffect(() => {
    if (open)
      reset({
        name: member?.name ?? "",
        phone: member?.phone ?? "",
        notes: member?.notes ?? "",
      });
  }, [open, member]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      isEdit
        ? memberService.update(member.id, data)
        : memberService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      reset();
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

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md rounded-3xl p-7">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {isEdit ? "Edit Member" : "Tambah Member"}
          </DialogTitle>
        </DialogHeader>
        {!isEdit && (
          <p className="text-sm text-gray-500 -mt-1">
            Member perlu melakukan pembayaran untuk mengaktifkan keanggotaan.
          </p>
        )}
        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          noValidate
          className="space-y-4 mt-2"
        >
          <Field label="Nama" error={errors.name?.message}>
            <input
              type="text"
              placeholder="Nama lengkap"
              className={inputClass(errors.name)}
              {...register("name", { required: "Nama wajib diisi" })}
            />
          </Field>
          <Field label="No. Telepon" error={errors.phone?.message}>
            <input
              type="text"
              placeholder="08xxxxxxxxxx"
              className={inputClass(errors.phone)}
              {...register("phone", { required: "No. telepon wajib diisi" })}
            />
          </Field>
          <Field label="Catatan" optional>
            <textarea
              rows={2}
              placeholder="Catatan tambahan..."
              className={`${inputClass(false)} resize-none`}
              {...register("notes")}
            />
          </Field>

          {errors.root && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <XCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          <ModalActions>
            <button type="button" onClick={close} className={btnGhost}>
              Batal
            </button>
            <button type="submit" disabled={isPending} className={btnPrimary}>
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Menyimpan...
                </span>
              ) : isEdit ? (
                "Simpan"
              ) : (
                "Daftarkan"
              )}
            </button>
          </ModalActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── QR Modal ────────────────────────────────────────────

function MemberQrModal({ open, memberId, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["member-qr", memberId],
    queryFn: () => memberService.getQr(memberId).then((res) => res.data.data),
    enabled: open && !!memberId,
    retry: false,
  });

  const errorMessage = error?.response?.data?.message;

  useEffect(() => {
    if (!data?.qr_token) return;
    QRCode.toDataURL(data.qr_token, { width: 240, margin: 2 }).then(
      setQrDataUrl,
    );
  }, [data]);

  useEffect(() => {
    if (!open) setQrDataUrl(null);
  }, [open]);

  const handleDownload = async () => {
    if (!data) return;
    setIsDownloading(true);
    try {
      await memberService.downloadCard(memberId, data.member_code);
    } catch {
      alert("Gagal mengunduh kartu.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl p-7">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Kartu Member
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat QR...</span>
          </div>
        ) : isError ? (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-5 text-center">
            <p className="text-sm text-amber-800">
              {errorMessage ?? "QR tidak dapat dimuat."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <div className="rounded-2xl border border-gray-100 p-3">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Member" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <p className="mt-4 font-semibold text-gray-900">{data?.name}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {data?.member_code}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <dt className="text-xs text-gray-500">Mulai</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {data?.membership_start ?? "-"}
                </dd>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <dt className="text-xs text-gray-500">Berakhir</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {data?.membership_end ?? "-"}
                </dd>
              </div>
            </dl>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`${btnPrimary} flex items-center justify-center gap-2 w-full flex-none`}
            >
              {isDownloading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              Unduh Kartu
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Reminder Payment Button ─────────────────────────────────

function ReminderButton({ member }) {
  const [status, setStatus] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => memberService.sendReminder(member.id),
    onSuccess: ({ data }) =>
      setStatus({ type: "success", message: data.message }),
    onError: (error) =>
      setStatus({
        type: "error",
        message: error.response?.data?.message ?? "Gagal mengirim pengingat.",
      }),
  });

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => {
          setStatus(null);
          mutate();
        }}
        disabled={isPending}
        className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <MessageCircle size={14} />
        )}
        {isPending ? "Mengirim..." : "Kirim pengingat via WhatsApp"}
      </button>
      {status && (
        <p
          className={`text-xs ${status.type === "success" ? "text-emerald-600" : "text-red-500"}`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

// ─── History Payment ────────────────────────────────────────

function RiwayatPembayaran({ memberId }) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: () =>
      memberService.getPayments(memberId).then((res) => res.data.data),
    enabled: !!memberId,
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Memuat riwayat...</span>
      </div>
    );

  if (!payments?.length)
    return (
      <p className="text-sm text-gray-400 text-center py-10">
        Belum ada riwayat pembayaran.
      </p>
    );

  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1">
        Riwayat Pembayaran
      </p>
      <div className="divide-y divide-gray-100">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {p.payment_type === "registration"
                  ? "Pendaftaran"
                  : "Perpanjangan"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {p.period_start} — {p.period_end} · {p.processed_by?.name}
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatRupiah(p.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────

function PaymentModal({ open, member, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("payment");
  const [invoiceData, setInvoiceData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: freshMemberData } = useQuery({
    queryKey: ["member-detail", member?.id],
    queryFn: () =>
      memberService.getById(member.id).then((res) => res.data.data),
    enabled: open && !!member?.id,
  });

  const currentMember = freshMemberData ?? member;
  const needsPayment =
    currentMember?.billing_status === "unpaid" ||
    currentMember?.billing_status === "expired";
  const AMOUNT = 150000;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { cash_received: "" },
  });

  const cashReceived = parseFloat(watch("cash_received")) || 0;
  const change = cashReceived - AMOUNT;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      memberService.createPayment(currentMember.id, {
        payment_type:
          currentMember?.billing_status === "unpaid"
            ? "registration"
            : "renewal",
      }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      queryClient.invalidateQueries({
        queryKey: ["member-payments", currentMember.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["member-detail", currentMember.id],
      });
      setInvoiceData(data.data);
      setStep("invoice");
    },
    onError: (error) =>
      alert(error.response?.data?.message ?? "Pembayaran gagal."),
  });

  const handleClose = () => {
    reset();
    setStep("payment");
    setInvoiceData(null);
    onClose();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceData) return;
    setIsDownloading(true);
    try {
      await invoiceService.downloadPdf(
        invoiceData.invoice_id,
        invoiceData.invoice_number,
      );
    } catch {
      alert("Gagal mengunduh invoice.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-3xl p-7">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {step === "invoice" ? "Invoice Pembayaran" : "Pembayaran Member"}
          </DialogTitle>
        </DialogHeader>

        {step === "payment" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {currentMember?.name}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {currentMember?.member_code}
                </p>
              </div>
              <BillingBadge status={currentMember?.billing_status} />
            </div>

            {needsPayment ? (
              <form
                onSubmit={handleSubmit(() => mutate())}
                noValidate
                className="space-y-4"
              >
                <div className="rounded-2xl bg-gray-900 p-6 text-center">
                  <p className="text-sm text-gray-400 mb-1">
                    {currentMember?.billing_status === "unpaid"
                      ? "Pembayaran Pendaftaran"
                      : "Perpanjangan Membership"}
                  </p>
                  <p className="text-3xl font-semibold text-white tracking-tight">
                    {formatRupiah(AMOUNT)}
                  </p>
                </div>

                <Field
                  label="Uang Diterima"
                  error={errors.cash_received?.message}
                >
                  <input
                    type="number"
                    placeholder="0"
                    className={inputClass(errors.cash_received)}
                    {...register("cash_received", {
                      required: "Nominal wajib diisi",
                      min: {
                        value: AMOUNT,
                        message: `Minimal ${formatRupiah(AMOUNT)}`,
                      },
                    })}
                  />
                </Field>

                {cashReceived >= AMOUNT && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 flex justify-between items-center text-sm">
                    <span className="text-emerald-700">Kembalian</span>
                    <span className="font-semibold text-emerald-800 text-base">
                      {formatRupiah(change)}
                    </span>
                  </div>
                )}

                <ReminderButton member={currentMember} />

                <ModalActions>
                  <button
                    type="button"
                    onClick={handleClose}
                    className={btnGhost}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || cashReceived < AMOUNT}
                    className={btnPrimary}
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={15} className="animate-spin" />
                        Memproses...
                      </span>
                    ) : (
                      "Konfirmasi"
                    )}
                  </button>
                </ModalActions>
              </form>
            ) : (
              <RiwayatPembayaran memberId={currentMember?.id} />
            )}
          </>
        )}

        {step === "invoice" && invoiceData && (
          <>
            <div className="rounded-2xl bg-gray-900 px-6 py-7 text-center">
              <CheckCircle
                size={26}
                className="text-emerald-400 mx-auto mb-2"
              />
              <p className="text-sm text-gray-400">
                {invoiceData.payment_type === "registration"
                  ? "Pendaftaran berhasil dibayar"
                  : "Perpanjangan berhasil dibayar"}
              </p>
              <p className="text-3xl font-semibold text-white tracking-tight mt-1">
                {formatRupiah(invoiceData.amount)}
              </p>
              <p className="text-xs text-gray-500 font-mono mt-3">
                {invoiceData.invoice_number}
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Member</dt>
                <dd className="text-gray-900 font-medium">
                  {currentMember?.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Periode</dt>
                <dd className="text-gray-900">
                  {invoiceData.period_start} — {invoiceData.period_end}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Diproses oleh</dt>
                <dd className="text-gray-900">
                  {invoiceData.processed_by?.name}
                </dd>
              </div>
            </dl>

            <ModalActions>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className={`${btnGhost} flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {isDownloading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                Unduh PDF
              </button>
              <button onClick={handleClose} className={btnPrimary}>
                Selesai
              </button>
            </ModalActions>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Modal ─────────────────────────────────────────

function MemberDetailModal({
  open,
  member,
  onEdit,
  onShowQr,
  onShowPayment,
  onClose,
}) {
  if (!member) return null;

  const rows = [
    ["No. Telepon", member.phone],
    [
      "Masa Aktif",
      member.membership_start
        ? `${member.membership_start} — ${member.membership_end}`
        : "-",
    ],
    ["Catatan", member.notes ?? "-"],
    ["Didaftarkan oleh", member.registered_by?.name],
    ["Tanggal Daftar", member.created_at],
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-7">
        <DialogHeader className="sr-only">
          <DialogTitle>Detail Member</DialogTitle>
        </DialogHeader>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900 tracking-tight truncate">
              {member.name}
            </p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {member.member_code}
            </p>
          </div>
          <BillingBadge status={member.billing_status} />
        </div>

        <dl className="divide-y divide-gray-100">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-3 text-sm"
            >
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-gray-900 text-right max-w-[60%] break-words">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onShowQr}
            className={`${btnGhost} flex items-center justify-center gap-2`}
          >
            <QrCode size={15} /> Kartu
          </button>
          <button
            onClick={onShowPayment}
            className={`${btnGhost} flex items-center justify-center gap-2`}
          >
            <CreditCard size={15} /> Pembayaran
          </button>
          <button
            onClick={onEdit}
            className={`${btnPrimary} col-span-2 flex items-center justify-center gap-2`}
          >
            <Pencil size={14} /> Edit Member
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "paid", label: "Aktif" },
  { value: "unpaid", label: "Belum Bayar" },
];

export default function MemberListPage() {
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [qrMemberId, setQrMemberId] = useState(null);
  const [paymentMember, setPaymentMember] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff-members", debouncedSearch, statusFilter],
    queryFn: () =>
      memberService
        .getAll({
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
        })
        .then((res) => res.data),
  });

  const memberList = data?.data ?? [];

  const iconBtn =
    "p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Kelola Member
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.meta
              ? `${data.meta.total} member terdaftar`
              : "Daftar seluruh member terdaftar."}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shrink-0"
        >
          <Plus size={16} />
          Tambah Member
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari nama, telepon, atau kode..."
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === t.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel (mengisi sisa halaman) */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 py-20">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-red-500">Gagal memuat data member.</p>
          </div>
        ) : memberList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">
              {search || statusFilter
                ? "Tidak ada member yang cocok."
                : "Belum ada member terdaftar."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Member
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    No. Telepon
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Berlaku Hingga
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {memberList.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {member.member_code}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{member.phone}</td>
                    <td className="px-6 py-4">
                      <BillingBadge status={member.billing_status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {member.membership_end ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setQrMemberId(member.id)}
                          title="Kartu Member"
                          className={iconBtn}
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          onClick={() => setPaymentMember(member)}
                          title="Pembayaran"
                          className={iconBtn}
                        >
                          <CreditCard size={16} />
                        </button>
                        <button
                          onClick={() => setEditMember(member)}
                          title="Edit Member"
                          className={iconBtn}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <MemberFormModal open={showForm} onClose={() => setShowForm(false)} />
      <MemberFormModal
        open={!!editMember}
        member={editMember}
        onClose={() => setEditMember(null)}
      />
      <MemberQrModal
        open={!!qrMemberId}
        memberId={qrMemberId}
        onClose={() => setQrMemberId(null)}
      />
      <PaymentModal
        open={!!paymentMember}
        member={paymentMember}
        onClose={() => setPaymentMember(null)}
      />
    </div>
  );
}
