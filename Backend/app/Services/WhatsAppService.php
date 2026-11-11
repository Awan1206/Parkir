<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private string $apiKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.fonnte.api_key');
        $this->apiUrl = config('services.fonnte.api_url');
    }

    public function sendOtp(string $phone, string $name, string $otp): bool
    {
        $message = $this->buildOtpMessage($name, $otp);

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->apiKey,
            ])->post($this->apiUrl, [
                'target'  => $this->normalizePhone($phone),
                'message' => $message,
            ]);

            if (!$response->successful()) {
                Log::error('Fonnte API error', [
                    'status'   => $response->status(),
                    'response' => $response->body(),
                    'phone'    => $phone,
                ]);
                return false;
            }

            $body = $response->json();

            if (!($body['status'] ?? false)) {
                Log::error('Fonnte send failed', [
                    'response' => $body,
                    'phone'    => $phone,
                ]);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Fonnte exception', [
                'message' => $e->getMessage(),
                'phone'   => $phone,
            ]);
            return false;
        }
    }

    private function buildOtpMessage(string $name, string $otp): string
    {
        return implode("\n", [
            "Halo {$name},",
            "",
            "Kode OTP reset password Anda:",
            "",
            "*{$otp}*",
            "",
            "Kode berlaku selama *5 menit* dan hanya dapat digunakan satu kali.",
            "",
            "Jangan berikan kode ini kepada siapapun.",
            "Jika Anda tidak merasa melakukan permintaan ini, abaikan pesan ini.",
        ]);
    }

    private function normalizePhone(string $phone): string
    {
        // Hapus karakter non-digit
        $phone = preg_replace('/\D/', '', $phone);

        // Ganti awalan 0 dengan 62
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        // Tambahkan 62 jika belum ada
        if (!str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }

        return $phone;
    }

    public function sendPaymentReminder(string $phone, string $name, string $memberCode, string $membershipEnd): bool
    {
        $message = implode("\n", [
            "Halo {$name},",
            "",
            "Ini adalah pengingat bahwa tagihan parkir Anda akan segera jatuh tempo.",
            "",
            "*Detail Member:*",
            "Kode Member : _*{$memberCode}*_",
            "Berlaku Hingga : *{$membershipEnd}*",
            "",
            "Silakan hubungi petugas untuk melakukan pembayaran perpanjangan.",
            "Terima kasih telah menggunakan layanan parkir kami.",
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->apiKey,
            ])->post($this->apiUrl, [
                'target'  => $this->normalizePhone($phone),
                'message' => $message,
            ]);

            if (!$response->successful()) {
                Log::error('Fonnte reminder error', [
                    'status'   => $response->status(),
                    'response' => $response->body(),
                    'phone'    => $phone,
                ]);
                return false;
            }

            $body = $response->json();

            if (!($body['status'] ?? false)) {
                Log::error('Fonnte reminder failed', [
                    'response' => $body,
                    'phone'    => $phone,
                ]);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Fonnte reminder exception', [
                'message' => $e->getMessage(),
                'phone'   => $phone,
            ]);
            return false;
        }
    }
}