<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Member\StoreMemberPaymentRequest;
use App\Http\Resources\MemberPaymentResource;
use App\Models\Member;
use App\Services\MemberService;
use Illuminate\Http\JsonResponse;

class MemberPaymentController extends Controller
{
    public function __construct(private MemberService $memberService) {}

    public function index(int $memberId): JsonResponse
    {
        $member   = Member::findOrFail($memberId);
        $payments = $member->payments()
            ->with('processedBy')
            ->latest('paid_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => MemberPaymentResource::collection($payments),
            'meta'    => [
                'current_page' => $payments->currentPage(),
                'last_page'    => $payments->lastPage(),
                'total'        => $payments->total(),
            ],
        ]);
    }

    public function store(StoreMemberPaymentRequest $request, int $memberId): JsonResponse
    {
        $member = Member::findOrFail($memberId);

        try {
            $payment = $this->memberService->processPayment(
                $member,
                $request->payment_type,
                $request->user()->id
            );

            $payment->load('processedBy', 'invoice');

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil diproses.',
                'data'    => new MemberPaymentResource($payment),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}