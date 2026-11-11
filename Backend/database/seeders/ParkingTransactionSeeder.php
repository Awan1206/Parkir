<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Member;
use App\Models\MemberEntry;
use App\Models\MemberPayment;
use App\Models\ParkingRate;
use App\Models\ParkingTicket;
use App\Models\ParkingTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ParkingTransactionSeeder extends Seeder
{
    private array $rates = [];
    private array $petugas = [];
    private int $invoiceCounter = 1;

    public function run(): void
    {
        $this->rates   = ParkingRate::where('is_active', true)->get()->keyBy('vehicle_type')->toArray();
        $this->petugas = User::where('role', 'petugas')->pluck('id')->toArray();

        if (empty($this->petugas)) {
            $this->command->warn('Tidak ada petugas. Jalankan UserSeeder terlebih dahulu.');
            return;
        }

        if (empty($this->rates)) {
            $this->command->warn('Tidak ada tarif parkir. Jalankan ParkingRateSeeder terlebih dahulu.');
            return;
        }

        $this->command->info('Membuat member...');
        $this->seedMembers();

        $this->command->info('Membuat transaksi parkir non-member...');
        $this->seedNonMemberTransactions();

        $this->command->info('Membuat transaksi parkir member...');
        $this->seedMemberTransactions();

        $this->command->info('Seeder selesai.');
    }

    private function seedMembers(): void
    {
        $membersData = [
            ['name' => 'Andi Wijaya',     'phone' => '081311111001'],
            ['name' => 'Siti Rahayu',     'phone' => '081311111002'],
            ['name' => 'Budi Prakoso',    'phone' => '081311111003'],
            ['name' => 'Dewi Lestari',    'phone' => '081311111004'],
            ['name' => 'Rudi Hartono',    'phone' => '081311111005'],
            ['name' => 'Maya Sari',       'phone' => '081311111006'],
            ['name' => 'Hendra Gunawan',  'phone' => '081311111007'],
            ['name' => 'Rina Kusuma',     'phone' => '081311111008'],
            ['name' => 'Doni Setiawan',   'phone' => '081311111009'],
            ['name' => 'Lina Marlina',    'phone' => '081311111010'],
        ];

        foreach ($membersData as $index => $data) {
            $memberCode = 'MBR-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);

            $member = Member::create([
                'member_code'    => $memberCode,
                'name'           => $data['name'],
                'phone'          => $data['phone'],
                'notes'          => null,
                'qr_token'       => Str::random(32),
                'billing_status' => 'paid',
                'membership_start' => now()->subDays(rand(1, 25))->toDateString(),
                'membership_end'   => now()->addDays(rand(5, 25))->toDateString(),
                'registered_by'  => $this->petugas[0],
                'is_active'      => true,
            ]);

            // Buat payment registrasi
            $paidAt = now()->subDays(rand(10, 30));
            $payment = MemberPayment::create([
                'member_id'       => $member->id,
                'processed_by'    => $this->petugas[0],
                'amount'          => 150000,
                'payment_type'    => 'registration',
                'period_start'    => $paidAt->toDateString(),
                'period_end'      => $paidAt->copy()->addDays(30)->toDateString(),
                'idempotency_key' => 'seed_member_reg_' . $member->id,
                'paid_at'         => $paidAt,
            ]);

            // Buat invoice pembayaran member
            $this->createInvoice([
                'type'              => 'member_registration',
                'member_payment_id' => $payment->id,
                'issued_by'         => $this->petugas[0],
                'recipient_name'    => $member->name,
                'amount'            => 150000,
                'issued_at'         => $paidAt,
            ]);
        }
    }

    private function seedNonMemberTransactions(): void
    {
        $vehicleTypes = ['motor', 'mobil', 'truk'];
        $plates = [
            'motor' => ['B 1234 ABC', 'D 5678 DEF', 'F 9012 GHI', 'B 3456 JKL', 'Z 7890 MNO'],
            'mobil' => ['B 2345 PQR', 'D 6789 STU', 'F 0123 VWX', 'B 4567 YZA', 'T 8901 BCD'],
            'truk'  => ['B 3456 EFG', 'D 7890 HIJ', 'B 1111 TRK'],
        ];

        // Generate 60 transaksi non-member untuk 30 hari terakhir
        for ($i = 0; $i < 60; $i++) {
            $vehicleType = $vehicleTypes[array_rand($vehicleTypes)];
            $plate       = $plates[$vehicleType][array_rand($plates[$vehicleType])];
            $processedBy = $this->petugas[array_rand($this->petugas)];
            $rate        = $this->rates[$vehicleType];

            $entryTime = now()
                ->subDays(rand(0, 29))
                ->setHour(rand(7, 20))
                ->setMinute(rand(0, 59))
                ->setSecond(0);

            $durationMinutes = rand(30, 480); // 30 menit - 8 jam
            $exitTime        = $entryTime->copy()->addMinutes($durationMinutes);

            // Skip jika exit_time melebihi sekarang
            if ($exitTime->isAfter(now())) {
                $exitTime = now()->subMinutes(rand(5, 30));
                $durationMinutes = (int) $entryTime->diffInMinutes($exitTime);
            }

            $totalAmount = $this->calculateFee($durationMinutes, $rate);

            DB::transaction(function () use (
                $vehicleType, $plate, $processedBy, $rate,
                $entryTime, $exitTime, $durationMinutes, $totalAmount, $i
            ) {
                $ticket = ParkingTicket::create([
                    'ticket_code' => 'TKT-' . strtoupper(Str::random(8)),
                    'qr_token'    => Str::random(32),
                    'entry_time'  => $entryTime,
                    'status'      => 'exited',
                ]);

                $transaction = ParkingTransaction::create([
                    'parking_ticket_id' => $ticket->id,
                    'processed_by'      => $processedBy,
                    'visitor_type'      => 'non_member',
                    'vehicle_type'      => $vehicleType,
                    'plate_number'      => $plate,
                    'stnk_verified'     => (bool) rand(0, 1),
                    'notes'             => null,
                    'entry_time'        => $entryTime,
                    'exit_time'         => $exitTime,
                    'duration_minutes'  => $durationMinutes,
                    'rate_per_hour'     => $rate['rate_per_hour'],
                    'total_amount'      => $totalAmount,
                    'idempotency_key'   => 'seed_nonmember_exit_' . $ticket->id,
                    'created_at'        => $exitTime,
                    'updated_at'        => $exitTime,
                ]);

                $this->createInvoice([
                    'type'                   => 'parking_non_member',
                    'parking_transaction_id' => $transaction->id,
                    'issued_by'              => $processedBy,
                    'recipient_name'         => 'Non-Member',
                    'vehicle_type'           => $vehicleType,
                    'plate_number'           => $plate,
                    'entry_time'             => $entryTime,
                    'exit_time'              => $exitTime,
                    'duration_minutes'       => $durationMinutes,
                    'amount'                 => $totalAmount,
                    'issued_at'              => $exitTime,
                ]);
            });
        }
    }

    private function seedMemberTransactions(): void
    {
        $members     = Member::where('is_active', true)->get();
        $vehicleTypes = ['motor', 'mobil'];
        $plates = [
            'motor' => ['B 5555 MBR', 'D 6666 MBR', 'F 7777 MBR'],
            'mobil' => ['B 8888 MBR', 'D 9999 MBR'],
        ];

        // Generate 40 transaksi member untuk 30 hari terakhir
        foreach ($members as $member) {
            $totalTrips = rand(2, 6);

            for ($i = 0; $i < $totalTrips; $i++) {
                $vehicleType = $vehicleTypes[array_rand($vehicleTypes)];
                $plate       = $plates[$vehicleType][array_rand($plates[$vehicleType])];
                $processedBy = $this->petugas[array_rand($this->petugas)];

                $entryTime = now()
                    ->subDays(rand(0, 25))
                    ->setHour(rand(7, 20))
                    ->setMinute(rand(0, 59))
                    ->setSecond(0);

                $durationMinutes = rand(60, 360);
                $exitTime        = $entryTime->copy()->addMinutes($durationMinutes);

                if ($exitTime->isAfter(now())) {
                    $exitTime = now()->subMinutes(rand(5, 30));
                    $durationMinutes = (int) $entryTime->diffInMinutes($exitTime);
                }

                DB::transaction(function () use (
                    $member, $vehicleType, $plate, $processedBy,
                    $entryTime, $exitTime, $durationMinutes, $i
                ) {
                    $entry = MemberEntry::create([
                        'member_id'  => $member->id,
                        'entry_time' => $entryTime,
                        'status'     => 'exited',
                        'created_at' => $entryTime,
                        'updated_at' => $exitTime,
                    ]);

                    $transaction = ParkingTransaction::create([
                        'member_id'        => $member->id,
                        'processed_by'     => $processedBy,
                        'visitor_type'     => 'member',
                        'vehicle_type'     => $vehicleType,
                        'plate_number'     => $plate,
                        'stnk_verified'    => true,
                        'notes'            => null,
                        'entry_time'       => $entryTime,
                        'exit_time'        => $exitTime,
                        'duration_minutes' => $durationMinutes,
                        'rate_per_hour'    => 0,
                        'total_amount'     => 0,
                        'idempotency_key'  => 'seed_member_exit_' . $member->id . '_' . $entry->id,
                        'created_at'       => $exitTime,
                        'updated_at'       => $exitTime,
                    ]);

                    $this->createInvoice([
                        'type'                   => 'parking_member',
                        'parking_transaction_id' => $transaction->id,
                        'issued_by'              => $processedBy,
                        'recipient_name'         => $member->name,
                        'vehicle_type'           => $vehicleType,
                        'plate_number'           => $plate,
                        'entry_time'             => $entryTime,
                        'exit_time'              => $exitTime,
                        'duration_minutes'       => $durationMinutes,
                        'amount'                 => 0,
                        'issued_at'              => $exitTime,
                    ]);
                });
            }
        }
    }

    private function calculateFee(int $durationMinutes, array $rate): float
    {
        $hours = $durationMinutes / 60;

        $billableHours = match ($rate['rounding']) {
            'ceil'  => (int) ceil($hours),
            'floor' => (int) floor($hours),
            'round' => (int) round($hours),
            default => (int) ceil($hours),
        };

        $billableHours = max($billableHours, $rate['minimum_hours']);

        return $billableHours * $rate['rate_per_hour'];
    }

    private function createInvoice(array $data): void
    {
        $prefix = 'INV-' . now()->format('Ym') . '-';

        Invoice::create([
            'invoice_number'         => $prefix . str_pad($this->invoiceCounter++, 5, '0', STR_PAD_LEFT),
            'type'                   => $data['type'],
            'member_payment_id'      => $data['member_payment_id'] ?? null,
            'parking_transaction_id' => $data['parking_transaction_id'] ?? null,
            'issued_by'              => $data['issued_by'],
            'recipient_name'         => $data['recipient_name'],
            'vehicle_type'           => $data['vehicle_type'] ?? null,
            'plate_number'           => $data['plate_number'] ?? null,
            'entry_time'             => $data['entry_time'] ?? null,
            'exit_time'              => $data['exit_time'] ?? null,
            'duration_minutes'       => $data['duration_minutes'] ?? null,
            'amount'                 => $data['amount'],
            'issued_at'              => $data['issued_at'],
        ]);
    }
}