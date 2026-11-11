<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Member\StoreMemberRequest;
use App\Http\Requests\Member\UpdateMemberRequest;
use App\Http\Resources\MemberResource;
use App\Models\Member;
use App\Services\MemberService;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MemberController extends Controller
{
    public function __construct(private MemberService $memberService) {}

    public function index(Request $request): JsonResponse
    {
        $members = Member::with('registeredBy')
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('member_code', 'like', "%{$request->search}%")
            )
            ->when($request->status, fn($q) =>
                $q->where('billing_status', $request->status)
            )
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => MemberResource::collection($members),
            'meta'    => [
                'current_page' => $members->currentPage(),
                'last_page'    => $members->lastPage(),
                'total'        => $members->total(),
            ],
        ]);
    }

    public function store(StoreMemberRequest $request): JsonResponse
    {
        $member = Member::create([
            'member_code'    => $this->memberService->generateMemberCode(),
            'name'           => $request->name,
            'phone'          => $request->phone,
            'notes'          => $request->notes,
            'qr_token'       => $this->memberService->generateQrToken(),
            'registered_by'  => $request->user()->id,
            'billing_status' => 'unpaid',
            'is_active'      => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Member berhasil didaftarkan. Proses pembayaran untuk mengaktifkan.',
            'data'    => new MemberResource($member),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $member = Member::with('registeredBy')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new MemberResource($member),
        ]);
    }

    public function update(UpdateMemberRequest $request, int $id): JsonResponse
    {
        $member = Member::findOrFail($id);

        $member->update($request->only(['name', 'phone', 'notes']));

        return response()->json([
            'success' => true,
            'message' => 'Data member berhasil diperbarui.',
            'data'    => new MemberResource($member->fresh('registeredBy')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $member = Member::findOrFail($id);
        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Member berhasil dihapus.',
        ]);
    }

    public function qr(int $id): JsonResponse
    {
        $member = Member::select(
            'id', 'member_code', 'name', 'phone',
            'qr_token', 'is_active', 'billing_status',
            'membership_start', 'membership_end'
        )->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'member_code'      => $member->member_code,
                'name'             => $member->name,
                'phone'            => $member->phone,
                'qr_token'         => $member->qr_token,
                'membership_start' => $member->membership_start?->toDateString(),
                'membership_end'   => $member->membership_end?->toDateString(),
                'is_active'        => $member->is_active,
                'billing_status'   => $member->billing_status,
            ],
        ]);
    }

    public function downloadCard($id): Response
    {
        $member = Member::findOrFail($id);

        $qrCode = new QrCode($member->qr_token);
        $writer = new PngWriter();
        $result = $writer->write($qrCode);

        $qrImage = 'data:image/png;base64,' . base64_encode($result->getString());

        $pdf = Pdf::loadView('members.card', [
            'member'  => $member,
            'qrImage' => $qrImage,
        ])->setPaper([0, 0, 242, 153]);

        return $pdf->download("kartu-member-{$member->member_code}.pdf");
    }

    public function sendReminder(int $id): JsonResponse
    {
        $member = Member::select('id', 'member_code', 'name', 'phone', 'membership_end', 'billing_status')
            ->findOrFail($id);

        if ($member->billing_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Tagihan member sudah lunas.',
            ], 422);
        }

        $membershipEnd = $member->membership_end?->format('d F Y') ?? '-';

        $sent = app(\App\Services\WhatsAppService::class)
            ->sendPaymentReminder(
                $member->phone,
                $member->name,
                $member->member_code,
                $membershipEnd
            );

        if (!$sent) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim pesan WhatsApp. Periksa konfigurasi Fonnte.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "Pengingat berhasil dikirim ke {$member->phone}.",
        ]);
    }
}