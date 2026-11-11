<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'member_code',
        'name',
        'phone',
        'notes',
        'qr_token',
        'billing_status',
        'membership_start',
        'membership_end',
        'registered_by',
        'is_active',
    ];

    protected $casts = [
        'membership_start' => 'date',
        'membership_end'   => 'date',
        'is_active'        => 'boolean',
    ];

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(MemberPayment::class);
    }

    public function entries(): HasMany
    {
        return $this->hasMany(MemberEntry::class);
    }

    public function parkingTransactions(): HasMany
    {
        return $this->hasMany(ParkingTransaction::class);
    }

    public function activeEntry()
    {
        return $this->entries()->where('status', 'inside')->latest()->first();
    }

    public function isInsideParking(): bool
    {
        return $this->entries()->where('status', 'inside')->exists();
    }

    public function isExpired(): bool
    {
        return $this->membership_end && now()->isAfter($this->membership_end);
    }

    public function isEligibleForParking(): bool
    {
        return $this->is_active
            && $this->billing_status === 'paid'
            && !$this->isExpired();
    }
}