<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MemberEntry;
use App\Models\ParkingRate;
use App\Models\ParkingTicket;
use App\Models\ParkingTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ParkingService
{
    public function generateTicketCode(): string
    {
        return 'TKT-' . strtoupper(Str::random(8));
    }

    public function generateQrToken(): string
    {
        do {
            $token = Str::random(32);
        } while (ParkingTicket::where('qr_token', $token)->exists());

        return $token;
    }

    public function createTicket(): ParkingTicket
    {
        return ParkingTicket::create([
            'ticket_code' => $this->generateTicketCode(),
            'qr_token'    => $this->generateQrToken(),
            'entry_time'  => now(),
            'status'      => 'inside',
        ]);
    }

    public function memberEntry(string $qrToken): array
    {
        return DB::transaction(function () use ($qrToken) {
            $member = Member::where('qr_token', $qrToken)
                ->lockForUpdate()
                ->first();

            if (!$member) {
                return ['success' => false, 'message' => 'QR tidak valid.', 'code' => 404];
            }

            if (!$member->isEligibleForParking()) {
                return [
                    'success' => false,
                    'message' => $member->isExpired()
                        ? 'Masa aktif member sudah berakhir.'
                        : 'Member belum aktif atau tagihan belum lunas.',
                    'code' => 422,
                ];
            }

            if ($member->isInsideParking()) {
                return ['success' => false, 'message' => 'Kendaraan member sudah berada di dalam area parkir.', 'code' => 422];
            }

            MemberEntry::create([
                'member_id'  => $member->id,
                'entry_time' => now(),
                'status'     => 'inside',
            ]);

            return ['success' => true, 'member' => $member];
        });
    }

    public function processExit(string $qrToken, array $data, int $processedBy): array
    {
        return DB::transaction(function () use ($qrToken, $data, $processedBy) {
            $member = Member::where('qr_token', $qrToken)->lockForUpdate()->first();
            $ticket = ParkingTicket::where('qr_token', $qrToken)->lockForUpdate()->first();

            if (!$member && !$ticket) {
                return ['success' => false, 'message' => 'QR tidak valid.', 'code' => 404];
            }

            if ($member) {
                return $this->processMemberExit($member, $data, $processedBy);
            }

            return $this->processNonMemberExit($ticket, $data, $processedBy);
        });
    }

    private function processMemberExit(Member $member, array $data, int $processedBy): array
    {
        $entry = MemberEntry::where('member_id', $member->id)
            ->where('status', 'inside')
            ->lockForUpdate()
            ->latest()
            ->first();

        if (!$entry) {
            return ['success' => false, 'message' => 'Member tidak tercatat masuk.', 'code' => 422];
        }

        $idempotencyKey = 'exit_member_entry_' . $entry->id;

        if (ParkingTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return ['success' => false, 'message' => 'Transaksi keluar sudah diproses.', 'code' => 422];
        }

        $exitTime        = now();
        $durationMinutes = (int) $entry->entry_time->diffInMinutes($exitTime);

        $transaction = ParkingTransaction::create([
            'member_id'       => $member->id,
            'processed_by'    => $processedBy,
            'visitor_type'    => 'member',
            'vehicle_type'    => $data['vehicle_type'],
            'plate_number'    => strtoupper($data['plate_number']),
            'stnk_verified'   => $data['stnk_verified'],
            'notes'           => $data['notes'] ?? null,
            'entry_time'      => $entry->entry_time,
            'exit_time'       => $exitTime,
            'duration_minutes'=> $durationMinutes,
            'rate_per_hour'   => 0,
            'total_amount'    => 0,
            'idempotency_key' => $idempotencyKey,
        ]);

        $entry->update(['status' => 'exited']);

        app(InvoiceService::class)->createForParkingTransaction($transaction);

        return ['success' => true, 'transaction' => $transaction];
    }

    private function processNonMemberExit(ParkingTicket $ticket, array $data, int $processedBy): array
    {
        if ($ticket->status !== 'inside') {
            return ['success' => false, 'message' => 'Tiket sudah digunakan atau tidak valid.', 'code' => 422];
        }

        $idempotencyKey = 'exit_ticket_' . $ticket->id;

        if (ParkingTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return ['success' => false, 'message' => 'Transaksi keluar sudah diproses.', 'code' => 422];
        }

        $rate = ParkingRate::where('vehicle_type', $data['vehicle_type'])
            ->where('is_active', true)
            ->first();

        if (!$rate) {
            return ['success' => false, 'message' => 'Tarif tidak ditemukan.', 'code' => 422];
        }

        $exitTime        = now();
        $durationMinutes = (int) $ticket->entry_time->diffInMinutes($exitTime);
        $totalAmount     = $this->calculateFee($durationMinutes, $rate);

        if (!isset($data['cash_received']) || (float) $data['cash_received'] < $totalAmount) {
            return [
                'success' => false,
                'message' => 'Nominal pembayaran kurang dari tagihan (' . number_format($totalAmount, 0, ',', '.') . ').',
                'code'    => 422,
            ];
        }

        $transaction = ParkingTransaction::create([
            'parking_ticket_id' => $ticket->id,
            'processed_by'      => $processedBy,
            'visitor_type'      => 'non_member',
            'vehicle_type'      => $data['vehicle_type'],
            'plate_number'      => strtoupper($data['plate_number']),
            'stnk_verified'     => $data['stnk_verified'],
            'notes'             => $data['notes'] ?? null,
            'entry_time'        => $ticket->entry_time,
            'exit_time'         => $exitTime,
            'duration_minutes'  => $durationMinutes,
            'rate_per_hour'     => $rate->rate_per_hour,
            'total_amount'      => $totalAmount,
            'idempotency_key'   => $idempotencyKey,
        ]);

        $ticket->update(['status' => 'exited']);

        app(InvoiceService::class)->createForParkingTransaction($transaction);

        return ['success' => true, 'transaction' => $transaction];
    }

    private function calculateFee(int $durationMinutes, ParkingRate $rate): float
    {
        $hours = $durationMinutes / 60;

        $billableHours = match ($rate->rounding) {
            'ceil'  => (int) ceil($hours),
            'floor' => (int) floor($hours),
            'round' => (int) round($hours),
        };

        $billableHours = max($billableHours, $rate->minimum_hours);

        return $billableHours * $rate->rate_per_hour;
    }

    public function previewExit(string $qrToken, string $vehicleType): array
    {
        $member = Member::where('qr_token', $qrToken)->first();

        if ($member) {
            $entry = MemberEntry::where('member_id', $member->id)
                ->where('status', 'inside')->latest()->first();

            if (!$entry) {
                return ['success' => false, 'message' => 'Member tidak tercatat masuk.', 'code' => 422];
            }

            return ['success' => true, 'data' => $this->buildPreview($entry->entry_time, 0, 0)];
        }

        $ticket = ParkingTicket::where('qr_token', $qrToken)->first();

        if (!$ticket) {
            return ['success' => false, 'message' => 'QR tidak valid.', 'code' => 404];
        }

        if ($ticket->status !== 'inside') {
            return ['success' => false, 'message' => 'Tiket sudah digunakan atau tidak valid.', 'code' => 422];
        }

        $rate = ParkingRate::where('vehicle_type', $vehicleType)->where('is_active', true)->first();

        if (!$rate) {
            return ['success' => false, 'message' => 'Tarif tidak ditemukan.', 'code' => 422];
        }

        $minutes = (int) $ticket->entry_time->diffInMinutes(now());

        return [
            'success' => true,
            'data'    => $this->buildPreview(
                $ticket->entry_time,
                $rate->rate_per_hour,
                $this->calculateFee($minutes, $rate)
            ),
        ];
    }

    private function buildPreview($entryTime, $ratePerHour, $total): array
    {
        return [
            'entry_time'       => $entryTime->toDateTimeString(),
            'duration_minutes' => (int) $entryTime->diffInMinutes(now()),
            'rate_per_hour'    => $ratePerHour,
            'total_amount'     => $total,
        ];
    }
}