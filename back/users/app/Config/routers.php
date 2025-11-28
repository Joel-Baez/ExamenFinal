<?php
namespace App\Config;

use Slim\App;
use App\Controllers\UsersController;

return static function (App $app): void {
    $controller = UsersController::class;

    $app->post('/register', [$controller, 'register']);
    $app->post('/login', [$controller, 'login']);
    $app->post('/logout', [$controller, 'logout']);
    $app->get('/users', [$controller, 'listUsers']);
    $app->put('/users/{id}', [$controller, 'updateUser']);
};
