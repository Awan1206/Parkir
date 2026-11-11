<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members');
            $table->foreignId('processed_by')->constrained('users');
            $table->decimal('amount', 12, 2);
            $table->enum('payment_type', ['registration', 'renewal']);
            $table->date('period_start');
            $table->date('period_end');
            $table->string('idempotency_key', 64)->unique();
            $table->timestamp('paid_at');
            $table->timestamps();

            $table->index('member_id');
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_payments');
    }
};