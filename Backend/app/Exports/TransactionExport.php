<?php

namespace App\Exports;

use App\Models\ParkingTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransactionExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(
        private Request $request,
        private User $user
    ) {}

    public function query()
    {
        return ParkingTransaction::query()
            ->with(['processedBy', 'member', 'invoice'])
            ->when($this->user->isPetugas(), fn($q) => $q->where('processed_by', $this->user->id))
            ->when($this->request->staff_id && $this->user->isSuperAdmin(), fn($q) =>
                $q->where('processed_by', $this->request->staff_id)
            )
            ->when($this->request->visitor_type, fn($q) =>
                $q->where('visitor_type', $this->request->visitor_type)
            )
            ->when($this->request->vehicle_type, fn($q) =>
                $q->where('vehicle_type', $this->request->vehicle_type)
            )
            ->when($this->request->date_from, fn($q) =>
                $q->whereDate('exit_time', '>=', $this->request->date_from)
            )
            ->when($this->request->date_to, fn($q) =>
                $q->whereDate('exit_time', '<=', $this->request->date_to)
            )
            ->latest('exit_time');
    }

    public function headings(): array
    {
        return [
            'No. Invoice',
            'Jenis Pengunjung',
            'Nama / Kode',
            'Jenis Kendaraan',
            'Plat Nomor',
            'Waktu Masuk',
            'Waktu Keluar',
            'Durasi (menit)',
            'Total Bayar',
            'Petugas',
        ];
    }

    public function map($transaction): array
    {
        return [
            $transaction->invoice?->invoice_number ?? '-',
            $transaction->visitor_type,
            $transaction->member?->name ?? 'Non-Member',
            $transaction->vehicle_type,
            $transaction->plate_number,
            $transaction->entry_time->toDateTimeString(),
            $transaction->exit_time?->toDateTimeString(),
            $transaction->duration_minutes,
            number_format($transaction->total_amount, 0, ',', '.'),
            $transaction->processedBy?->name,
        ];
    }
}