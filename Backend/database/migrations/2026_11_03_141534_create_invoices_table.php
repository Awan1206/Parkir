<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 30)->unique();
            $table->enum('type', [
                'member_registration',
                'member_renewal',
                'parking_member',
                'parking_non_member',
            ]);
            $table->foreignId('member_payment_id')->nullable()->constrained('member_payments');
            $table->foreignId('parking_transaction_id')->nullable()->constrained('parking_transactions');
            $table->foreignId('issued_by')->constrained('users');
            $table->string('recipient_name', 100);
            $table->string('vehicle_type', 20)->nullable();
            $table->string('plate_number', 15)->nullable();
            $table->timestamp('entry_time')->nullable();
            $table->timestamp('exit_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->decimal('amount', 12, 2);
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();

            $table->index('invoice_number');
            $table->index('type');
            $table->index('issued_by');
            $table->index('issued_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};