<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'invoice_number' => $this->invoice_number,
            'type'           => $this->type,
            'recipient_name' => $this->recipient_name,
            'vehicle_type'   => $this->vehicle_type,
            'plate_number'   => $this->plate_number,
            'entry_time'     => $this->entry_time?->toDateTimeString(),
            'exit_time'      => $this->exit_time?->toDateTimeString(),
            'duration_minutes' => $this->duration_minutes,
            'amount'         => $this->amount,
            'issued_at'      => $this->issued_at?->toDateTimeString(),
            'issued_by'      => $this->whenLoaded('issuedBy', fn() => [
                'id'   => $this->issuedBy->id,
                'name' => $this->issuedBy->name,
            ]),
        ];
    }
}