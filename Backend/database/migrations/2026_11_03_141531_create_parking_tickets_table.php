<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parking_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_code', 20)->unique();
            $table->string('qr_token', 64)->unique();
            $table->timestamp('entry_time');
            $table->enum('status', ['inside', 'exited', 'cancelled'])->default('inside');
            $table->timestamps();

            $table->index('qr_token');
            $table->index('status');
            $table->index('entry_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parking_tickets');
    }
};