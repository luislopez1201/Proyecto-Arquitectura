# KRONOS // ATELIER — Portafolio de Arquitectura 3D (Laravel/PHP + GitHub Pages)

Plataforma web moderna para visualizar proyectos de arquitectura con una **escena 3D interactiva en tiempo real (Three.js / WebGL)** en la portada, estructurada con **PHP / Laravel (MVC + Vistas Blade)** y equipada con un **exportador estático automático** para publicar directamente en **GitHub Pages**.

---

## ✨ Características Principales

1. **Visor Arquitectónico 3D Interactivo en Portada (`Three.js`)**:
   - Rotación libre arrastrando con el mouse y zoom suave.
   - **Modo Plano CAD (`Wireframe`)** para inspeccionar la geometría estructural.
   - **Corte Explotado (`Exploded View`)** que separa las losas y niveles del edificio en tiempo real.
   - **Simulador de Asoleamiento (Hora Solar)** desde el amanecer hasta la noche con encendido automático de luces interiores cálidas.
   - **Selector de 3 tipologías arquitectónicas 3D**: *Pabellón Aura (Voladizo)*, *Torre Bioclimática Prisma* y *Centro Cultural Horizonte*.
2. **Arquitectura Laravel / PHP Limpia**:
   - **Modelo de Datos**: `app/Models/Project.php` (agrega o edita proyectos fácilmente en un solo arreglo PHP).
   - **Controlador**: `app/Http/Controllers/PortfolioController.php`.
   - **Vista Blade**: `resources/views/portfolio.blade.php`.
   - **Rutas**: `routes/web.php`.
3. **100% Compatible con GitHub Pages**:
   - Incluye el comando `php artisan export:static` que compila las vistas de Laravel/PHP en `./index.html` y `./docs/index.html` junto con un workflow automático de GitHub Actions (`.github/workflows/deploy-pages.yml`).

---

## 🚀 Uso en Desarrollo Local (PHP / Laravel)

Para levantar el servidor de desarrollo local:

```bash
php artisan serve
```

Luego abre en tu navegador: **`http://localhost:8000`**

---

## 📦 Compilar y Publicar en GitHub Pages

Cada vez que modifiques tus proyectos en `app/Models/Project.php` o el diseño en `resources/views/portfolio.blade.php`, ejecuta:

```bash
php artisan export:static
```

Esto actualiza automáticamente:
- `index.html` (en la raíz)
- `docs/index.html` y `docs/assets/...`

### Publicación automática con GitHub Actions
1. Sube este repositorio a GitHub (`git init`, `git add .`, `git commit -m "Initial commit"`, `git push`).
2. En tu repositorio de GitHub ve a **Settings → Pages**.
3. En **Build and deployment → Source**, elige **GitHub Actions** (o bien **Deploy from a branch** seleccionando la rama `main` y la carpeta `/docs` o `/root`).

