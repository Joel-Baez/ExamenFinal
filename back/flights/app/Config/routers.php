<?php
namespace App\Config;

use Slim\App;
use App\Controllers\AirlineController;

return static function (App $app): void {
    $controller = new AirlineController();

    $app->group('', function (App $app) use ($controller) {
        $app->post('/naves', [$controller, 'createNave']);
        $app->get('/naves', [$controller, 'listNaves']);
        $app->put('/naves/{id}', [$controller, 'updateNave']);
        $app->delete('/naves/{id}', [$controller, 'deleteNave']);

        $app->post('/flights', [$controller, 'createFlight']);
        $app->get('/flights', [$controller, 'listFlights']);
        $app->put('/flights/{id}', [$controller, 'updateFlight']);
        $app->delete('/flights/{id}', [$controller, 'deleteFlight']);

        $app->post('/reservations', [$controller, 'createReservation']);
        $app->get('/reservations', [$controller, 'listReservations']);
        $app->put('/reservations/{id}/cancel', [$controller, 'cancelReservation']);
    });
};
