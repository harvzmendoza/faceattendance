<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;

class UserService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        return User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] instanceof UserRole ? $data['role'] : UserRole::from($data['role']),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'] instanceof UserRole ? $data['role'] : UserRole::from($data['role']),
        ];

        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }

        $user->update($payload);

        return $user->refresh();
    }

    public function delete(User $user): void
    {
        $user->delete();
    }
}
