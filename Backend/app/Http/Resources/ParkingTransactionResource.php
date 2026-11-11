<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParkingTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'visitor_type'     => $this->visitor_type,
            'vehicle_type'     => $this->vehicle_type,
            'plate_number'     => $this->plate_number,
            'stnk_verified'    => $this->stnk_verified,
            'notes'            => $this->notes,
            'entry_time'       => $this->entry_time->toDateTimeString(),
            'exit_time'        => $this->exit_time?->toDateTimeString(),
            'duration_minutes' => $this->duration_minutes,
            'rate_per_hour'    => $this->rate_per_hour,
            'total_amount'     => $this->total_amount,
            'processed_by'     => $this->whenLoaded('processedBy', fn() => [
                'id'   => $this->processedBy->id,
                'name' => $this->processedBy->name,
            ]),
            'member'           => $this->whenLoaded('member', fn() => [
                'id'          => $this->member->id,
                'member_code' => $this->member->member_code,
                'name'        => $this->member->name,
            ]),
            'created_at'       => $this->created_at->toDateTimeString(),
            'invoice' => $this->whenLoaded('invoice', fn () => [
                'id'             => $this->invoice->id,
                'invoice_number' => $this->invoice->invoice_number,
            ]),
        ];
    }
}