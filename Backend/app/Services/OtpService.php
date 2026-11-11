<?php

namespace App\Services;

use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OtpService
{
    const MAX_ATTEMPTS = 5;
    const EXPIRY_MINUTES = 5;

    public function findUser(string $identifier): ?User
    {
        return User::where('email', strtolower($identifier))
            ->orWhere('phone', $identifier)
            ->first();
    }

    public function generate(string $identifier, string $channel): string
    {
        OtpVerification::where('identifier', $identifier)
            ->whereNull('used_at')
            ->delete();

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpVerification::create([
            'identifier'    => $identifier,
            'otp_hash'      => Hash::make($otp),
            'channel'       => $channel,
            'expires_at'    => now()->addMinutes(self::EXPIRY_MINUTES),
            'attempt_count' => 0,
        ]);

        return $otp;
    }

    public function verify(string $identifier, string $otp): array
    {
        $record = OtpVerification::where('identifier', $identifier)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$record) {
            return ['valid' => false, 'message' => 'OTP tidak ditemukan.'];
        }

        if ($record->isExpired()) {
            return ['valid' => false, 'message' => 'OTP sudah kedaluwarsa.'];
        }

        if ($record->attempt_count >= self::MAX_ATTEMPTS) {
            return ['valid' => false, 'message' => 'Terlalu banyak percobaan.'];
        }

        if (!Hash::check($otp, $record->otp_hash)) {
            $record->increment('attempt_count');
            return ['valid' => false, 'message' => 'OTP tidak valid.'];
        }

        $resetToken = Str::random(64);

        $record->update([
            'used_at'  => now(),
            'otp_hash' => Hash::make($resetToken),
        ]);

        return ['valid' => true, 'reset_token' => $resetToken];
    }

    public function verifyResetToken(string $identifier, string $token): bool
    {
        $record = OtpVerification::where('identifier', $identifier)
            ->whereNotNull('used_at')
            ->latest()
            ->first();

        if (!$record) return false;

        if ($record->used_at->diffInMinutes(now()) > 15) return false;

        return Hash::check($token, $record->otp_hash);
    }
}