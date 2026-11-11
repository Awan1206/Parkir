<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@parkir.com'],
            [
                'name'      => 'Super Admin',
                'phone'     => '081200000001',
                'password'  => Hash::make('password'),
                'role'      => 'super_admin',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'petugas1@parkir.com'],
            [
                'name'      => 'Petugas Satu',
                'phone'     => '081200000002',
                'password'  => Hash::make('password'),
                'role'      => 'petugas',
                'is_active' => true,
            ]
        );
    }
}