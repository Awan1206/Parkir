import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Plus,
  Loader2,
  Pencil,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { staffService } from "@/services/staff.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Helpers ─────────────────────────────────────────────

const inputClass = (hasError) =>
  `w-full px-3.5 py-3 rounded-xl border text-sm bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
      : "border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-100"
  }`;

const btnGhost =
  "flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors";
const btnPrimary =
  "flex-1 py-3 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`}
      />
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

// ─── Staff Form Modal (Tambah & Edit) ─────────────────────

function StaffFormModal({ open, staff, onClose }) {
  const isEdit = !!staff;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  // isi ulang form setiap modal dibuka (agar data petugas yang diedit muncul)
  useEffect(() => {
    if (open)
      reset({
        name: staff?.name ?? "",
        email: staff?.email ?? "",
        phone: staff?.phone ?? "",
        password: "",
      });
  }, [open, staff]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      isEdit ? staffService.update(staff.id, data) : staffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      reset();
      onClose();
    },
    onError: (error) => {
      const errs = error.response?.data?.errors;
      if (errs) {
        Object.entries(errs).forEach(([field, messages]) => {
          setError(field, { message: messages[0] });
        });
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
            {isEdit ? "Edit Petugas" : "Tambah Petugas"}
          </DialogTitle>
        </DialogHeader>

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

          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              placeholder="email@contoh.com"
              className={inputClass(errors.email)}
              {...register("email", {
                required: "Email wajib diisi",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Format email tidak valid",
                },
              })}
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

          {!isEdit && (
            <Field label="Password" error={errors.password?.message}>
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                className={inputClass(errors.password)}
                {...register("password", {
                  required: "Password wajib diisi",
                  minLength: {
                    value: 8,
                    message: "Password minimal 8 karakter",
                  },
                })}
              />
            </Field>
          )}

          {errors.root && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <XCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
                "Tambah"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function StaffListPage() {
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // tunda pencarian 400ms agar tidak request di setiap ketikan
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["admin-staff", search, statusFilter, page],
    queryFn: () =>
      staffService
        .getAll({
          search: search || undefined,
          is_active: statusFilter || undefined, // "1" atau "0"
          page,
        })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  const staffList = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Kelola Petugas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta
              ? `${meta.total} petugas terdaftar`
              : "Daftar seluruh petugas terdaftar."}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shrink-0"
        >
          <Plus size={16} />
          Tambah Petugas
        </button>
      </div>

      {/* Toolbar: search 2/3, filter 1/3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="relative md:col-span-2">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari nama, email, atau telepon..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`${inputClass(false)} pl-10`}
          />
          {isFetching && !isLoading && (
            <Loader2
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
            />
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass(false)}
        >
          <option value="">Semua Status</option>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>
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
            <p className="text-sm text-red-500">Gagal memuat data petugas.</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">
              {search || statusFilter
                ? "Tidak ada petugas yang cocok."
                : "Belum ada petugas terdaftar."}
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto flex-1 transition-opacity ${isFetching ? "opacity-60" : ""}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Petugas
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    No. Telepon
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">
                    Terdaftar
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-gray-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffList.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {staff.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {staff.phone ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge active={staff.is_active} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {staff.created_at}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditStaff(staff)}
                          title="Edit Petugas"
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Halaman {meta.current_page} dari {meta.last_page}
              <span className="text-gray-400"> · {meta.total} petugas</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={meta.current_page <= 1}
                className="flex items-center gap-1 pl-2.5 pr-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={meta.current_page >= meta.last_page}
                className="flex items-center gap-1 pl-3.5 pr-2.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Berikutnya
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <StaffFormModal open={showForm} onClose={() => setShowForm(false)} />
      <StaffFormModal
        open={!!editStaff}
        staff={editStaff}
        onClose={() => setEditStaff(null)}
      />
    </div>
  );
}
