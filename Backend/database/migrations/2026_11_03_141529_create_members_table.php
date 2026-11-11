<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('member_code', 20)->unique();
            $table->string('name', 100);
            $table->string('phone', 20)->unique();
            $table->text('notes')->nullable();
            $table->string('qr_token', 64)->unique();
            $table->enum('billing_status', ['paid', 'unpaid'])->default('unpaid');
            $table->date('membership_start')->nullable();
            $table->date('membership_end')->nullable();
            $table->foreignId('registered_by')->constrained('users');
            $table->boolean('is_active')->default(false);
            $table->softDeletes();
            $table->timestamps();

            $table->index('qr_token');
            $table->index('billing_status');
            $table->index('membership_end');
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};