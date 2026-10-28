<?php

namespace App\Support;

/**
 * Motor ligero compatible con sintaxis Laravel Blade para compilar vistas PHP
 * y permitir tanto ejecución dinámica (php artisan serve) como exportación estática (GitHub Pages).
 */
class View
{
    protected static string $viewsPath = __DIR__ . '/../../resources/views';

    public static function render(string $view, array $data = []): string
    {
        $file = self::$viewsPath . '/' . str_replace('.', '/', $view) . '.blade.php';
        if (!file_exists($file)) {
            throw new \RuntimeException("Vista no encontrada: {$file}");
        }

        extract($data, EXTR_SKIP);
        ob_start();
        include $file;
        return ob_get_clean();
    }
}

