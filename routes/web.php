<?php

/**
 * Definición de rutas web estilo Laravel para el estudio de arquitectura.
 */

use App\Http\Controllers\PortfolioController;

return [
    '/' => [PortfolioController::class, 'index'],
    '/api/projects' => function () {
        header('Content-Type: application/json; charset=utf-8');
        return json_encode(\App\Models\Project::all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    },
];

