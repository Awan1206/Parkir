<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParkingRate extends Model
{
    protected $fillable = [
        'vehicle_type',
        'rate_per_hour',
        'minimum_hours',
        'rounding',
        'is_active',
    ];

    protected $casts = [
        'rate_per_hour' => 'decimal:2',
        'is_active'     => 'boolean',
    ];
}