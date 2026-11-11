<?php

namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'     => ['sometimes', 'string', 'max:100'],
            'email'    => ['sometimes', 'email', "unique:users,email,{$id}"],
            'phone'    => ['sometimes', 'string', 'max:20', "unique:users,phone,{$id}"],
            'password' => ['sometimes', 'string', 'min:8'],
            'is_active'=> ['sometimes', 'boolean'],
        ];
    }
}