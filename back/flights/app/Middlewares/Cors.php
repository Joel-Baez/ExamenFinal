<?php
namespace App\Middlewares;

use Slim\Psr7\Response;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;

class Cors
{
    public function __invoke(Request $request, Handler $handler): ResponseInterface
    {
        $origin = $request->getHeaderLine('Origin') ?: '*';

        if ($request->getMethod() === 'OPTIONS') {
            return $this->preflight($origin);
        }

        $response = $handler->handle($request);
        return $this->applyHeaders($response, $origin);
    }

    private function preflight($origin): ResponseInterface
    {
        $response = new Response();
        return $this->applyHeaders($response->withStatus(200), $origin);
    }

    private function applyHeaders(ResponseInterface $response, $origin): ResponseInterface
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    }
}
