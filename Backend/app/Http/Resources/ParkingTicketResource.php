<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParkingTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'ticket_code' => $this->ticket_code,
            'qr_token'    => $this->qr_token,
            'entry_time'  => $this->entry_time->toDateTimeString(),
            'status'      => $this->status,
        ];
    }
}