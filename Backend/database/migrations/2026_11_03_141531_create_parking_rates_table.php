<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parking_rates', function (Blueprint $table) {
            $table->id();
            $table->enum('vehicle_type', ['motor', 'mobil', 'truk']);
            $table->decimal('rate_per_hour', 10, 2);
            $table->tinyInteger('minimum_hours')->default(1);
            $table->enum('rounding', ['ceil', 'floor', 'round'])->default('ceil');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parking_rates');
    }
};