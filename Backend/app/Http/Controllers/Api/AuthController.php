<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\OtpService;
use App\Services\WhatsAppService;
use App\Mail\OtpMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function __construct(
        private OtpService $otpService,
        private WhatsAppService $whatsAppService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $key = 'login_' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak percobaan login. Coba lagi dalam ' . RateLimiter::availableIn($key) . ' detik.',
            ], 429);
        }

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 60);
            return response()->json(['success' => false, 'message' => 'Email atau password salah.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['success' => false, 'message' => 'Akun tidak aktif.'], 403);
        }

        RateLimiter::clear($key);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => [
                'token' => $token,
                'user'  => new UserResource($user),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['success' => true, 'message' => 'Logout berhasil.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($request->user()),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name'  => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', "unique:users,email,{$user->id}"],
            'phone' => ['sometimes', 'string', 'max:20', "unique:users,phone,{$user->id}"],
        ]);

        $data = $request->only(['name', 'phone']);

        if ($request->filled('email')) {
            $data['email'] = strtolower($request->email);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data'    => new UserResource($user->fresh()),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $key = 'otp_send_' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 3)) {
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak permintaan OTP.',
            ], 429);
        }

        $identifier = $request->identifier;
        $channel    = $request->channel;

        $user = $this->otpService->findUser($identifier);

        // Selalu return success untuk mencegah user enumeration
        if ($user) {
            $otp = $this->otpService->generate($identifier, $channel);

            if ($channel === 'email') {
                Mail::to($user->email)->send(new OtpMail($user->name, $otp));
            } else {
                $this->whatsAppService->sendOtp($user->phone, $user->name, $otp);
            }
        }

        RateLimiter::hit($key, 60);

        return response()->json([
            'success' => true,
            'message' => 'Jika akun ditemukan, kode OTP telah dikirim.',
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $key = 'otp_verify_' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 10)) {
            return response()->json(['success' => false, 'message' => 'Terlalu banyak percobaan.'], 429);
        }

        $result = $this->otpService->verify($request->identifier, $request->otp);

        if (!$result['valid']) {
            RateLimiter::hit($key, 60);
            return response()->json(['success' => false, 'message' => $result['message']], 422);
        }

        RateLimiter::clear($key);

        return response()->json([
            'success' => true,
            'data'    => ['reset_token' => $result['reset_token']],
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $valid = $this->otpService->verifyResetToken($request->identifier, $request->reset_token);

        if (!$valid) {
            return response()->json(['success' => false, 'message' => 'Token reset tidak valid atau sudah kedaluwarsa.'], 422);
        }

        $user = $this->otpService->findUser($request->identifier);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Akun tidak ditemukan.'], 404);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete();

        return response()->json(['success' => true, 'message' => 'Password berhasil direset.']);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Password saat ini tidak sesuai.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete();

        return response()->json(['success' => true, 'message' => 'Password berhasil diubah. Silakan login kembali.']);
    }
}