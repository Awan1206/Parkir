<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('identifier', 150);
            $table->string('otp_hash');
            $table->enum('channel', ['email', 'whatsapp']);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->tinyInteger('attempt_count')->default(0);
            $table->timestamps();

            $table->index('identifier');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_verifications');
    }
};