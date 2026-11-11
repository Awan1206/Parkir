<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\MemberPayment;
use App\Models\ParkingTransaction;

class InvoiceService
{
    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . now()->format('Ym') . '-';
        $last   = Invoice::where('invoice_number', 'like', $prefix . '%')->count();
        return $prefix . str_pad($last + 1, 5, '0', STR_PAD_LEFT);
    }

    public function createForMemberPayment(MemberPayment $payment): Invoice
    {
        $payment->load('member', 'processedBy');

        return Invoice::create([
            'invoice_number'  => $this->generateInvoiceNumber(),
            'type'            => $payment->payment_type === 'registration'
                                    ? 'member_registration'
                                    : 'member_renewal',
            'member_payment_id' => $payment->id,
            'issued_by'       => $payment->processed_by,
            'recipient_name'  => $payment->member->name,
            'amount'          => $payment->amount,
            'issued_at'       => now(),
        ]);
    }

    public function createForParkingTransaction(ParkingTransaction $transaction): Invoice
    {
        $transaction->load('member', 'processedBy');

        return Invoice::create([
            'invoice_number'         => $this->generateInvoiceNumber(),
            'type'                   => $transaction->visitor_type === 'member'
                                            ? 'parking_member'
                                            : 'parking_non_member',
            'parking_transaction_id' => $transaction->id,
            'issued_by'              => $transaction->processed_by,
            'recipient_name'         => $transaction->member?->name ?? 'Non-Member',
            'vehicle_type'           => $transaction->vehicle_type,
            'plate_number'           => $transaction->plate_number,
            'entry_time'             => $transaction->entry_time,
            'exit_time'              => $transaction->exit_time,
            'duration_minutes'       => $transaction->duration_minutes,
            'amount'                 => $transaction->total_amount,
            'issued_at'              => now(),
        ]);
    }
}