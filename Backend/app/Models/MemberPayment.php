<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MemberPayment extends Model
{
    protected $fillable = [
        'member_id',
        'processed_by',
        'amount',
        'payment_type',
        'period_start',
        'period_end',
        'idempotency_key',
        'paid_at',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'period_start' => 'date',
        'period_end'   => 'date',
        'paid_at'      => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}