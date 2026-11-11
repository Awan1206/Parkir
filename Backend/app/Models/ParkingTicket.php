<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ParkingTicket extends Model
{
    protected $fillable = [
        'ticket_code',
        'qr_token',
        'entry_time',
        'status',
    ];

    protected $casts = [
        'entry_time' => 'datetime',
    ];

    public function transaction(): HasOne
    {
        return $this->hasOne(ParkingTransaction::class);
    }

    public function isInside(): bool
    {
        return $this->status === 'inside';
    }
}