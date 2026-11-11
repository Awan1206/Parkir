<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Member;
use App\Models\MemberPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MemberService
{
    const MEMBERSHIP_FEE = 150000;
    const MEMBERSHIP_DAYS = 30;

    public function generateMemberCode(): string
    {
        $last = Member::withTrashed()->lockForUpdate()->max('id') ?? 0;
        return 'MBR-' . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }

    public function generateQrToken(): string
    {
        do {
            $token = Str::random(32);
        } while (Member::where('qr_token', $token)->exists());

        return $token;
    }

    public function processPayment(Member $member, string $paymentType, int $processedBy): MemberPayment
    {
        return DB::transaction(function () use ($member, $paymentType, $processedBy) {
            $member->refresh()->lockForUpdate();

            $idempotencyKey = 'member_' . $member->id . '_' . now()->format('Ym');

            if (MemberPayment::where('idempotency_key', $idempotencyKey)->exists()) {
                throw new \Exception('Pembayaran bulan ini sudah diproses.');
            }

            $periodStart = now()->toDateString();
            $periodEnd   = now()->addDays(self::MEMBERSHIP_DAYS)->toDateString();

            $payment = MemberPayment::create([
                'member_id'       => $member->id,
                'processed_by'    => $processedBy,
                'amount'          => self::MEMBERSHIP_FEE,
                'payment_type'    => $paymentType,
                'period_start'    => $periodStart,
                'period_end'      => $periodEnd,
                'idempotency_key' => $idempotencyKey,
                'paid_at'         => now(),
            ]);

            $member->update([
                'billing_status'   => 'paid',
                'membership_start' => $periodStart,
                'membership_end'   => $periodEnd,
                'is_active'        => true,
            ]);

            app(InvoiceService::class)->createForMemberPayment($payment);

            return $payment;
        });
    }
}