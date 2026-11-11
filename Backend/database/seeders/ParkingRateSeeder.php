<?php

namespace Database\Seeders;

use App\Models\ParkingRate;
use Illuminate\Database\Seeder;

class ParkingRateSeeder extends Seeder
{
    public function run(): void
    {
        $rates = [
            ['vehicle_type' => 'motor',  'rate_per_hour' => 3000.00],
            ['vehicle_type' => 'mobil',  'rate_per_hour' => 5000.00],
            ['vehicle_type' => 'truk',   'rate_per_hour' => 8000.00],
        ];

        foreach ($rates as $rate) {
            ParkingRate::create([
                'vehicle_type'  => $rate['vehicle_type'],
                'rate_per_hour' => $rate['rate_per_hour'],
                'minimum_hours' => 1,
                'rounding'      => 'ceil',
                'is_active'     => true,
            ]);
        }
    }
}