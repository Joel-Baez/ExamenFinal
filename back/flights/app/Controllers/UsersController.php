<?php
namespace App\Controllers;

use App\Models\User;
use Exception;

class UsersController
{
    public function login($username, $password)
    {
        $user = $this->findUserByCredentials($username, $password);

        if ($user === null) {
            throw new Exception('User null');
        }

        return $user->toJson();
    }

    public function getUsers()
    {
        $users = User::query()->get();

        if ($users->count() === 0) {
            return null;
        }

        return $users->toJson();
    }

    private function findUserByCredentials($username, $password)
    {
        return User::where('userName', $username)
            ->where('password', $password)
            ->first();
    }
}
