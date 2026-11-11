<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'member_code'      => $this->member_code,
            'name'             => $this->name,
            'phone'            => $this->phone,
            'notes'            => $this->notes,
            'qr_token'         => $this->qr_token,
            'billing_status'   => $this->billing_status,
            'membership_start' => $this->membership_start?->toDateString(),
            'membership_end'   => $this->membership_end?->toDateString(),
            'is_active'        => $this->is_active,
            'registered_by'    => $this->whenLoaded('registeredBy', fn() => [
                'id'   => $this->registeredBy->id,
                'name' => $this->registeredBy->name,
            ]),
            'created_at'       => $this->created_at->toDateTimeString(),
        ];
    }
}