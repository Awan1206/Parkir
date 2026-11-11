<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members');
            $table->timestamp('entry_time');
            $table->enum('status', ['inside', 'exited'])->default('inside');
            $table->timestamps();

            $table->index('member_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_entries');
    }
};