<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MemberPaymentController;
use App\Http\Controllers\Api\ParkingController;
use App\Http\Controllers\Api\PublicParkingController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;

// Public
Route::prefix('public/parking')->group(function () {
    Route::post('tickets', [PublicParkingController::class, 'issueTicket']);
    Route::post('member/entry', [PublicParkingController::class, 'memberEntry']);
});

// Auth
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
    });
});

// Petugas
Route::prefix('staff')
    ->middleware(['auth:sanctum', 'role:petugas'])
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'staff']);

        // Member
        Route::apiResource('members', MemberController::class);
        Route::get('members/{id}/qr', [MemberController::class, 'qr']);
        Route::get('members/{id}/card/pdf', [MemberController::class, 'downloadCard']);
        Route::get('members/{id}/payments', [MemberPaymentController::class, 'index']);
        Route::post('members/{id}/payments', [MemberPaymentController::class, 'store']);
        Route::post('members/{id}/reminder', [MemberController::class, 'sendReminder']);

        // Parking
        Route::post('parking/scan', [ParkingController::class, 'scan']);
        Route::post('parking/exit', [ParkingController::class, 'exit']);
        Route::get('parking/transactions', [ParkingController::class, 'transactions']);
        Route::post('parking/preview', [ParkingController::class, 'preview']);

        // Invoice
        Route::get('invoices/{id}', [InvoiceController::class, 'show']);
        Route::get('invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);

        // Reports
        Route::get('reports', [ReportController::class, 'index']);
        Route::get('reports/export', [ReportController::class, 'export']);
    });

// Super Admin
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:super_admin'])
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'admin']);

        // Staff Management
        Route::get('staff', [StaffController::class, 'index']);
        Route::post('staff', [StaffController::class, 'store']);
        Route::get('staff/{id}', [StaffController::class, 'show']);
        Route::put('staff/{id}', [StaffController::class, 'update']);
        Route::delete('staff/{id}', [StaffController::class, 'destroy']);
        Route::get('members/{id}/card/pdf', [MemberController::class, 'downloadCard']);

        // Reports
        Route::get('reports', [ReportController::class, 'index']);
        Route::get('reports/export', [ReportController::class, 'export']);

        // Invoice
        Route::get('invoices/{id}', [InvoiceController::class, 'show']);
        Route::get('invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
    });