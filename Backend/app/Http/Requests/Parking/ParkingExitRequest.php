<?php

namespace App\Http\Requests\Parking;

use Illuminate\Foundation\Http\FormRequest;

class ParkingExitRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'qr_token'      => ['required', 'string'],
            'vehicle_type'  => ['required', 'in:motor,mobil,truk'],
            'plate_number'  => ['required', 'string', 'max:15'],
            'stnk_verified' => ['required', 'boolean'],
            'notes'         => ['nullable', 'string'],
            'cash_received' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}