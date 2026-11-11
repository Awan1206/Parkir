<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parking\ParkingExitRequest;
use App\Http\Resources\ParkingTransactionResource;
use App\Models\ParkingTransaction;
use App\Services\ParkingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParkingController extends Controller
{
    public function __construct(private ParkingService $parkingService) {}

    public function scan(Request $request): JsonResponse
    {
        $request->validate(['qr_token' => ['required', 'string']]);

        $member = \App\Models\Member::where('qr_token', $request->qr_token)->first();
        $ticket = \App\Models\ParkingTicket::where('qr_token', $request->qr_token)->first();

        if (!$member && !$ticket) {
            return response()->json(['success' => false, 'message' => 'QR tidak valid.'], 404);
        }

        if ($ticket) {
            if ($ticket->status !== 'inside') {
                return response()->json(['success' => false, 'message' => 'Tiket sudah tidak aktif.'], 422);
            }

            // Hanya baca data, tidak ubah status
            return response()->json([
                'success' => true,
                'data'    => [
                    'type'        => 'non_member',
                    'ticket_code' => $ticket->ticket_code,
                    'entry_time'  => $ticket->entry_time->toDateTimeString(),
                ],
            ]);
        }

        $entry = $member->entries()->where('status', 'inside')->latest()->first();

        if (!$entry) {
            return response()->json(['success' => false, 'message' => 'Member tidak tercatat masuk.'], 422);
        }

        // Hanya baca data, tidak ubah status
        return response()->json([
            'success' => true,
            'data'    => [
                'type'        => 'member',
                'member_code' => $member->member_code,
                'name'        => $member->name,
                'entry_time'  => $entry->entry_time->toDateTimeString(),
            ],
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'qr_token'     => ['required', 'string'],
            'vehicle_type' => ['required', 'in:motor,mobil,truck'],
        ]);

        $result = $this->parkingService->previewExit($request->qr_token, $request->vehicle_type);

        if (!$result['success']) {
            return response()->json(['success' => false, 'message' => $result['message']], $result['code']);
        }

        return response()->json(['success' => true, 'data' => $result['data']]);
    }

    public function exit(ParkingExitRequest $request): JsonResponse
    {
        $result = $this->parkingService->processExit(
            $request->qr_token,
            $request->only(['vehicle_type', 'plate_number', 'stnk_verified', 'notes', 'cash_received']),
            $request->user()->id
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], $result['code']);
        }

        $transaction = $result['transaction']->load('processedBy', 'member', 'invoice');

        return response()->json([
            'success' => true,
            'message' => 'Transaksi keluar berhasil.',
            'data'    => new ParkingTransactionResource($transaction),
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = ParkingTransaction::with(['processedBy', 'member'])
            ->when($user->isPetugas(), fn($q) => $q->where('processed_by', $user->id))
            ->when($request->visitor_type, fn($q) => $q->where('visitor_type', $request->visitor_type))
            ->when($request->date_from, fn($q) => $q->whereDate('exit_time', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('exit_time', '<=', $request->date_to))
            ->latest('exit_time')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => ParkingTransactionResource::collection($query),
            'meta'    => [
                'current_page' => $query->currentPage(),
                'last_page'    => $query->lastPage(),
                'total'        => $query->total(),
            ],
        ]);
    }
}