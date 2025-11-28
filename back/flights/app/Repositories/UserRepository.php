<?php
namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    public function getByToken(string $token)
    {
        return User::query()
            ->where('token', $token)
            ->first();
    }
}
