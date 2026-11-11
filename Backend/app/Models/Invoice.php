<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'type',
        'member_payment_id',
        'parking_transaction_id',
        'issued_by',
        'recipient_name',
        'vehicle_type',
        'plate_number',
        'entry_time',
        'exit_time',
        'duration_minutes',
        'amount',
        'issued_at',
    ];

    protected $casts = [
        'entry_time' => 'datetime',
        'exit_time'  => 'datetime',
        'issued_at'  => 'datetime',
        'amount'     => 'decimal:2',
    ];

    public function memberPayment(): BelongsTo
    {
        return $this->belongsTo(MemberPayment::class);
    }

    public function parkingTransaction(): BelongsTo
    {
        return $this->belongsTo(ParkingTransaction::class);
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}