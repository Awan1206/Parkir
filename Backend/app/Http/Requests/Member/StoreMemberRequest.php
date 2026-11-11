<?php

namespace App\Http\Requests\Member;

use Illuminate\Foundation\Http\FormRequest;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:20', 'unique:members,phone'],
            'notes' => ['nullable', 'string'],
        ];
    }
}