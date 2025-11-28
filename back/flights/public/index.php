<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
use Slim\Factory\AppFactory;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/Config/database.php';

$app = AppFactory::create();

$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

$app->add(function (Request $request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
});

$app->add(function (Request $request, $handler) {
    $authorization = $request->getHeader('Authorization');
    $token = $authorization[0] ?? null;

    if ($token === null) {
        $r = new \Slim\Psr7\Response();
        $r->getBody()->write(json_encode(['error' => 'Token no provisto']));
        return $r->withStatus(401)->withHeader('Content-Type', 'application/json');
    }

    $repository = new \App\Repositories\UserRepository();
    $user = $repository->getByToken($token);

    if ($user === null) {
        $r = new \Slim\Psr7\Response();
        $r->getBody()->write(json_encode(['error' => 'Token inválido']));
        return $r->withStatus(401)->withHeader('Content-Type', 'application/json');
    }

    $request = $request->withAttribute('user', $user);
    return $handler->handle($request);
});
$router = require __DIR__ . '/../app/Config/routers.php';
$router($app);
$app->run();
