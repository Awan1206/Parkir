<?php

namespace App\Http\Controllers\Api;

use App\Exports\TransactionExport;
use App\Http\Controllers\Controller;
use App\Models\ParkingTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Ringkasan: agregasi tanpa ORDER BY dan tanpa eager load
        $summary = $this->filteredQuery($request, $user)
            ->selectRaw('COUNT(*) as total_transactions, COALESCE(SUM(total_amount), 0) as total_revenue')
            ->toBase()
            ->first();

        // Daftar: urut + eager load + pagination
        $transactions = $this->filteredQuery($request, $user)
            ->with(['processedBy:id,name', 'member:id,member_code,name', 'invoice:id,invoice_number'])
            ->latest('exit_time')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $transactions->items(),
            'summary' => [
                'total_transactions' => (int) $summary->total_transactions,
                'total_revenue'      => $summary->total_revenue,
            ],
            'meta'    => [
                'current_page' => $transactions->currentPage(),
                'last_page'    => $transactions->lastPage(),
                'total'        => $transactions->total(),
            ],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        return Excel::download(
            new TransactionExport($request, $request->user()),
            'laporan-transaksi-' . now()->format('YmdHis') . '.xlsx'
        );
    }

    /**
     * Hanya filter dan pembatasan akses. Tanpa orderBy supaya aman dipakai untuk agregasi.
     */
    private function filteredQuery(Request $request, User $user): Builder
    {
        return ParkingTransaction::query()
            ->when($user->isPetugas(), fn ($q) => $q->where('processed_by', $user->id))
            ->when($user->isSuperAdmin() && $request->filled('staff_id'), fn ($q) =>
                $q->where('processed_by', $request->staff_id)
            )
            ->when($request->filled('visitor_type'), fn ($q) =>
                $q->where('visitor_type', $request->visitor_type)
            )
            ->when($request->filled('vehicle_type'), fn ($q) =>
                $q->where('vehicle_type', $request->vehicle_type)
            )
            ->when($request->filled('date_from'), fn ($q) =>
                $q->whereDate('exit_time', '>=', $request->date_from)
            )
            ->when($request->filled('date_to'), fn ($q) =>
                $q->whereDate('exit_time', '<=', $request->date_to)
            )
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->search;

                // Grup wajib: mencegah OR melepas filter processed_by
                $q->where(fn ($s) => $s
                    ->where('plate_number', 'like', "%{$term}%")
                    ->orWhereHas('invoice', fn ($iq) =>
                        $iq->where('invoice_number', 'like', "%{$term}%")
                    )
                );
            });
    }
}