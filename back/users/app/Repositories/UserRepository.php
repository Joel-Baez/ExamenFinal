<?php
namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    public function create(array $data)
    {
        return User::query()->create($data);
    }

    public function getByEmailAndPassword(string $email, string $password)
    {
        return User::query()
            ->where('email', $email)
            ->where('password', $password)
            ->first();
    }

    public function updateToken(int $userId, ?string $token)
    {
        $user = User::query()->find($userId);

        if ($user) {
            $user->token = $token;
            $user->save();
        }
    }

    public function getByToken(string $token)
    {
        return User::query()
            ->where('token', $token)
            ->first();
    }

    public function getAll()
    {
        return User::query()->get();
    }

    public function update(int $id, array $data)
    {
        $user = User::query()->find($id);

        if ($user) {
            $user->update($data);
        }
    }
}
