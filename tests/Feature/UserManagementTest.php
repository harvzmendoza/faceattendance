<?php

use App\Enums\UserRole;
use App\Models\User;

test('admins can create an operator account', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('users.store'), [
            'name' => 'Desk Operator',
            'email' => 'desk@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => UserRole::AttendanceOperator->value,
        ])
        ->assertRedirect(route('users.index'));

    $user = User::query()->where('email', 'desk@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::AttendanceOperator);
});

test('admins cannot delete themselves', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->delete(route('users.destroy', $admin))
        ->assertForbidden();

    $this->assertModelExists($admin);
});
