<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ParkingTransaction extends Model
{
    protected $fillable = [
        'member_id',
        'parking_ticket_id',
        'processed_by',
        'visitor_type',
        'vehicle_type',
        'plate_number',
        'stnk_verified',
        'notes',
        'entry_time',
        'exit_time',
        'duration_minutes',
        'rate_per_hour',
        'total_amount',
        'idempotency_key',
    ];

    protected $casts = [
        'entry_time'    => 'datetime',
        'exit_time'     => 'datetime',
        'rate_per_hour' => 'decimal:2',
        'total_amount'  => 'decimal:2',
        'stnk_verified' => 'boolean',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function parkingTicket(): BelongsTo
    {
        return $this->belongsTo(ParkingTicket::class);
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