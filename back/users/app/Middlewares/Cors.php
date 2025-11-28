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
        if ($request->getMethod() === 'OPTIONS') {
            return $this->preflight();
        }

        $response = $handler->handle($request);
        return $this->addCorsHeaders($response);
    }

    private function preflight(): ResponseInterface
    {
        $response = new Response();
        return $this->addCorsHeaders($response)->withStatus(200);
    }

    private function addCorsHeaders(ResponseInterface $response): ResponseInterface
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
}
