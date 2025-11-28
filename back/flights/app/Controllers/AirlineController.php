<?php
namespace App\Controllers;

use App\Models\Nave;
use App\Models\Flight;
use App\Models\Reservation;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AirlineController
{
    public function createNave(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador'])) {
            return $this->forbidden($response);
        }

        $payload = (array) $request->getParsedBody();
        $nave = Nave::create($payload);

        return $this->json($response, $nave);
    }

    public function listNaves(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador'])) {
            return $this->forbidden($response);
        }

        $naves = Nave::all();
        return $this->json($response, $naves);
    }

    public function updateNave(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador'])) {
            return $this->forbidden($response);
        }

        $nave = Nave::find($args['id'] ?? null);
        if (!$nave) {
            return $this->notFound($response);
        }

        $data = (array) $request->getParsedBody();
        $nave->update($data);

        return $this->json($response, ['message' => 'Nave actualizada']);
    }

    public function deleteNave(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador'])) {
            return $this->forbidden($response);
        }

        $nave = Nave::find($args['id'] ?? null);
        if (!$nave) {
            return $this->notFound($response);
        }

        $nave->delete();
        return $this->json($response, ['message' => 'Nave eliminada']);
    }

    public function createFlight(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador'])) {
            return $this->forbidden($response);
        }

        $payload = (array) $request->getParsedBody();
        $flight = Flight::create($payload);

        return $this->json($response, $flight);
    }

    public function listFlights(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador', 'gestor'])) {
            return $this->forbidden($response);
        }

        $filters = $request->getQueryParams();
        $builder = Flight::query();

        if (!empty($filters['origin'])) {
            $builder->where('origin', $filters['origin']);
        }

        if (!empty($filters['destination'])) {
            $builder->where('destination', $filters['destination']);
        }

        if (!empty($filters['date'])) {
            $builder->whereDate('departure', $filters['date']);
        }

        $flights = $builder->get();
        return $this->json($response, $flights);
    }

    public function updateFlight(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador'])) {
            return $this->forbidden($response);
        }

        $flight = Flight::find($args['id'] ?? null);
        if (!$flight) {
            return $this->notFound($response);
        }

        $data = (array) $request->getParsedBody();
        $flight->update($data);

        return $this->json($response, ['message' => 'Vuelo actualizado']);
    }

    public function deleteFlight(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['administrador'])) {
            return $this->forbidden($response);
        }

        $flight = Flight::find($args['id'] ?? null);
        if (!$flight) {
            return $this->notFound($response);
        }

        $flight->delete();
        return $this->json($response, ['message' => 'Vuelo eliminado']);
    }

    public function createReservation(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['gestor'])) {
            return $this->forbidden($response);
        }

        $data = (array) $request->getParsedBody();
        $data['user_id'] = $user->id;

        $flight = Flight::find($data['flight_id'] ?? null);
        if (!$flight) {
            return $this->json($response, ['error' => 'Vuelo inexistente'], 400);
        }

        $reservation = Reservation::create($data);
        return $this->json($response, $reservation, 201);
    }

    public function listReservations(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['gestor'])) {
            return $this->forbidden($response);
        }

        $filters = $request->getQueryParams();
        $builder = Reservation::query();

        if (!empty($filters['user_id'])) {
            $builder->where('user_id', $filters['user_id']);
        }

        $reservations = $builder->orderBy('id', 'desc')->get();
        return $this->json($response, $reservations);
    }

    public function cancelReservation(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        if ($this->deniedByRole($user, ['gestor'])) {
            return $this->forbidden($response);
        }

        $reservation = Reservation::find($args['id'] ?? null);
        if (!$reservation) {
            return $this->notFound($response);
        }

        $reservation->update(['status' => 'cancelada']);
        return $this->json($response, ['message' => 'Reserva cancelada']);
    }

    private function deniedByRole($user, array $roles): bool
    {
        if (!$user) {
            return true;
        }
        return !in_array($user->role, $roles, true);
    }

    private function json(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json');
    }

    private function forbidden(Response $response): Response
    {
        return $this->json($response, ['error' => 'Acceso denegado'], 403);
    }

    private function notFound(Response $response): Response
    {
        return $this->json($response, ['error' => 'Recurso no encontrado'], 404);
    }
}
