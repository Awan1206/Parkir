<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(Member::class, 'registered_by');
    }

    public function memberPayments(): HasMany
    {
        return $this->hasMany(MemberPayment::class, 'processed_by');
    }

    public function parkingTransactions(): HasMany
    {
        return $this->hasMany(ParkingTransaction::class, 'processed_by');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'issued_by');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isPetugas(): bool
    {
        return $this->role === 'petugas';
    }
}