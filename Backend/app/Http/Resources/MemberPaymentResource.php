<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'member_id'    => $this->member_id,
            'payment_type' => $this->payment_type,
            'amount'       => $this->amount,
            'period_start' => $this->period_start->toDateString(),
            'period_end'   => $this->period_end->toDateString(),
            'paid_at'      => $this->paid_at->toDateTimeString(),
            'invoice_id'   => $this->whenLoaded('invoice', fn() => $this->invoice?->id),
            'invoice_number' => $this->whenLoaded('invoice', fn() => $this->invoice?->invoice_number),
            'processed_by' => $this->whenLoaded('processedBy', fn() => [
                'id'   => $this->processedBy->id,
                'name' => $this->processedBy->name,
            ]),
        ];
    }
}