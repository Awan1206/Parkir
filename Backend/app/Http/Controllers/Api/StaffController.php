<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StoreStaffRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'    => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $staff = User::query()
            ->where('role', 'petugas')
            ->select('id', 'name', 'email', 'phone', 'is_active', 'created_at')
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "{$search}%")
                    ->orWhere('email', 'like', "{$search}%")
                    ->orWhere('phone', 'like', "{$search}%");
                });
            })
            ->when(isset($validated['is_active']), fn ($query) =>
                $query->where('is_active', $request->boolean('is_active'))
            )
            ->latest()
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($staff),
            'meta'    => [
                'current_page' => $staff->currentPage(),
                'last_page'    => $staff->lastPage(),
                'total'        => $staff->total(),
            ],
        ]);
    }

    public function store(StoreStaffRequest $request): JsonResponse
    {
        $staff = User::create([
            'name'      => $request->name,
            'email'     => strtolower($request->email),
            'phone'     => $request->phone,
            'password'  => Hash::make($request->password),
            'role'      => 'petugas',
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Petugas berhasil ditambahkan.',
            'data'    => new UserResource($staff),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $staff = User::where('id', $id)->where('role', 'petugas')->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => new UserResource($staff),
        ]);
    }

    public function update(UpdateStaffRequest $request, int $id): JsonResponse
    {
        $staff = User::where('id', $id)->where('role', 'petugas')->firstOrFail();

        $data = $request->only(['name', 'phone', 'is_active']);

        if ($request->filled('email')) {
            $data['email'] = strtolower($request->email);
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $staff->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Data petugas berhasil diperbarui.',
            'data'    => new UserResource($staff->fresh()),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $staff = User::where('id', $id)->where('role', 'petugas')->firstOrFail();

        $staff->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Akun petugas berhasil dinonaktifkan.',
        ]);
    }
}