<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\MemberEntry;
use App\Models\ParkingTicket;
use App\Models\ParkingTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Dashboard petugas: transaksi hanya milik petugas yang login.
     */
    public function staff(Request $request): JsonResponse
    {
        $staffId = $request->user()->id;

        return response()->json([
            'success' => true,
            'data'    => [
                'today'               => $this->todaySummary($staffId),
                'this_month'          => $this->monthSummary($staffId),
                'members'             => $this->memberSummary(),
                'recent_transactions' => $this->recentTransactions($staffId),
            ],
        ]);
    }

    /**
     * Dashboard super admin: seluruh transaksi + performa per petugas.
     */
    public function admin(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'today'               => $this->todaySummary(),
                'this_month'          => $this->monthSummary(),
                'members'             => $this->memberSummary(),
                'staff'               => $this->staffSummary(),
                'recent_transactions' => $this->recentTransactions(),
            ],
        ]);
    }

    private function transactions(?int $staffId): Builder
    {
        return ParkingTransaction::query()
            ->when($staffId, fn ($q) => $q->where('processed_by', $staffId));
    }

    private function todaySummary(?int $staffId = null): array
    {
        $row = $this->transactions($staffId)
            ->whereBetween('exit_time', [today(), today()->endOfDay()])
            ->selectRaw('COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue')
            ->toBase()
            ->first();

        return [
            'total_transactions' => (int) $row->total,
            'total_revenue'      => (float) $row->revenue,
            // Kondisi area parkir bersifat global, relevan untuk kedua role
            'vehicles_inside'    => MemberEntry::where('status', 'inside')->count()
                                  + ParkingTicket::where('status', 'inside')->count(),
        ];
    }

    private function monthSummary(?int $staffId = null): array
    {
        $rows = $this->transactions($staffId)
            ->whereBetween('exit_time', [now()->startOfMonth(), now()->endOfMonth()])
            ->selectRaw('visitor_type, vehicle_type, COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue')
            ->groupBy('visitor_type', 'vehicle_type')
            ->toBase()
            ->get();

        $byVisitor = [];
        $byVehicle = [];

        foreach ($rows as $row) {
            $byVisitor[$row->visitor_type] = ($byVisitor[$row->visitor_type] ?? 0) + $row->total;

            $byVehicle[$row->vehicle_type] ??= ['total' => 0, 'revenue' => 0.0];
            $byVehicle[$row->vehicle_type]['total']   += $row->total;
            $byVehicle[$row->vehicle_type]['revenue'] += (float) $row->revenue;
        }

        return [
            // Total dihitung dari hasil group by, tanpa query tambahan
            'total_transactions' => (int) $rows->sum('total'),
            'total_revenue'      => (float) $rows->sum('revenue'),
            'by_visitor_type'    => $byVisitor,
            'by_vehicle_type'    => $byVehicle,
        ];
    }

    private function memberSummary(): array
    {
        $today = today()->toDateString();

        $row = Member::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw(
                "SUM(is_active = 1 AND billing_status = 'paid' AND membership_end >= ?) as active",
                [$today]
            )
            ->selectRaw('SUM(is_active = 1 AND membership_end < ?) as expired', [$today])
            ->selectRaw("SUM(billing_status = 'unpaid') as unpaid")
            ->toBase()
            ->first();

        return [
            'total'   => (int) $row->total,
            'active'  => (int) $row->active,
            'expired' => (int) $row->expired,
            'unpaid'  => (int) $row->unpaid,
        ];
    }

    /**
     * Khusus admin: ringkasan petugas dan 5 petugas dengan pendapatan tertinggi bulan ini.
     */
    private function staffSummary(): array
    {
        $top = ParkingTransaction::query()
            ->whereBetween('exit_time', [now()->startOfMonth(), now()->endOfMonth()])
            ->selectRaw('processed_by, COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue')
            ->groupBy('processed_by')
            ->orderByDesc('revenue')
            ->limit(5)
            ->toBase()
            ->get();

        $names = User::whereIn('id', $top->pluck('processed_by'))->pluck('name', 'id');

        return [
            'total_staff' => User::where('role', 'petugas')->count(),
            'top_staff'   => $top->map(fn ($r) => [
                'id'                 => $r->processed_by,
                'name'               => $names[$r->processed_by] ?? null,
                'total_transactions' => (int) $r->total,
                'total_revenue'      => (float) $r->revenue,
            ])->all(),
        ];
    }

    private function recentTransactions(?int $staffId = null): array
    {
        return $this->transactions($staffId)
            ->select([
                'id', 'member_id', 'visitor_type', 'vehicle_type', 'plate_number',
                'entry_time', 'exit_time', 'duration_minutes', 'total_amount', 'processed_by',
            ])
            ->with(['processedBy:id,name', 'member:id,name,member_code'])
            ->latest('exit_time')
            ->limit(5)
            ->get()
            ->map(fn ($t) => [
                'id'               => $t->id,
                'visitor_type'     => $t->visitor_type,
                'name'             => $t->member?->name ?? 'Non-Member',
                'vehicle_type'     => $t->vehicle_type,
                'plate_number'     => $t->plate_number,
                'entry_time'       => $t->entry_time->toDateTimeString(),
                'exit_time'        => $t->exit_time?->toDateTimeString(),
                'duration_minutes' => $t->duration_minutes,
                'total_amount'     => (float) $t->total_amount,
                'processed_by'     => $t->processedBy?->name,
            ])
            ->all();
    }
}