<?php

namespace App\Http\Requests\Member;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'  => ['sometimes', 'string', 'max:100'],
            'phone' => ['sometimes', 'string', 'max:20', "unique:members,phone,{$id}"],
            'notes' => ['nullable', 'string'],
        ];
    }
}