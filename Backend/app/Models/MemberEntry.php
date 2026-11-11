<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberEntry extends Model
{
    protected $fillable = [
        'member_id',
        'entry_time',
        'status',
    ];

    protected $casts = [
        'entry_time' => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}