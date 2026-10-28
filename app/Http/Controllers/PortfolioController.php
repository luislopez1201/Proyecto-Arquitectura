<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Support\View;

class PortfolioController
{
    public function index(): string
    {
        $projects = Project::all();
        $stats = Project::studioStats();

        return View::render('portfolio', [
            'studioName' => 'KRONOS // ATELIER ARQUITECTURA',
            'tagline' => 'Arquitectura Paramétrica, Brutalismo Cálido & Ingeniería Bioclimática',
            'projects' => $projects,
            'stats' => $stats,
        ]);
    }
}

