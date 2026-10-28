<?php

/**
 * Front Controller de Laravel/PHP para desarrollo local (`php -S localhost:8000 -t public`)
 */

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

$routes = require __DIR__ . '/../routes/web.php';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Servir archivos estáticos directamente cuando se usa el servidor embebido de PHP
if ($uri !== '/' && file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false;
}

if (isset($routes[$uri])) {
    $handler = $routes[$uri];
    if (is_array($handler)) {
        [$class, $method] = $handler;
        $controller = new $class();
        echo $controller->$method();
    } elseif (is_callable($handler)) {
        echo $handler();
    }
    exit;
}

// Fallback a la portada
$controller = new \App\Http\Controllers\PortfolioController();
echo $controller->index();

