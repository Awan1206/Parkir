<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parking_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->nullable()->constrained('members');
            $table->foreignId('parking_ticket_id')->nullable()->constrained('parking_tickets');
            $table->foreignId('processed_by')->constrained('users');
            $table->enum('visitor_type', ['member', 'non_member']);
            $table->enum('vehicle_type', ['motor', 'mobil', 'truk']);
            $table->string('plate_number', 15);
            $table->boolean('stnk_verified')->default(false);
            $table->text('notes')->nullable();
            $table->timestamp('entry_time');
            $table->timestamp('exit_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->decimal('rate_per_hour', 10, 2)->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('idempotency_key', 64)->unique();
            $table->timestamps();

            $table->index('member_id');
            $table->index('parking_ticket_id');
            $table->index('processed_by');
            $table->index('exit_time');
            $table->index('visitor_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parking_transactions');
    }
};