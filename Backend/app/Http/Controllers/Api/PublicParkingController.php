<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ParkingTicketResource;
use App\Services\ParkingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicParkingController extends Controller
{
    public function __construct(private ParkingService $parkingService) {}

    public function issueTicket(): JsonResponse
    {
        $ticket = $this->parkingService->createTicket();

        return response()->json([
            'success' => true,
            'message' => 'Tiket parkir berhasil diterbitkan.',
            'data'    => new ParkingTicketResource($ticket),
        ], 201);
    }

    public function memberEntry(Request $request): JsonResponse
    {
        $request->validate([
            'qr_token' => ['required', 'string'],
        ]);

        $result = $this->parkingService->memberEntry($request->qr_token);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], $result['code']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Scan masuk berhasil.',
            'data'    => [
                'member_code' => $result['member']->member_code,
                'name'        => $result['member']->name,
                'entry_time'  => now()->toDateTimeString(),
            ],
        ]);
    }
}