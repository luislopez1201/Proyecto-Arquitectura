<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($studioName) ?> — Portafolio Arquitectónico & Visor 3D</title>
    <meta name="description" content="Estudio de arquitectura contemporánea, diseño paramétrico y visualización 3D interactiva en tiempo real. Desarrollado con Laravel/PHP y compatible con GitHub Pages.">

    <!-- Tipografías Editoriales y Técnicas -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">

    <!-- Hoja de Estilos Arquitectónica (Rutas relativas compatibles con Laravel y GitHub Pages) -->
    <link rel="stylesheet" href="assets/css/architecture.css">
</head>
<body>
    <!-- Rejilla Técnica de Fondo -->
    <div class="arch-grid-overlay" aria-hidden="true"></div>

    <!-- Barra de Navegación -->
    <header class="navbar">
        <a href="#" class="brand">
            <div class="brand-mark">K//A</div>
            <div class="brand-text">
                <span class="brand-title">KRONOS ATELIER</span>
                <span class="brand-sub">ARQUITECTURA · BIM 3D · INGENIERÍA</span>
            </div>
        </a>

        <ul class="nav-links">
            <li><a href="#visor-3d">Escena 3D</a></li>
            <li><a href="#obras">Proyectos</a></li>
            <li><a href="#metodologia">Metodología BIM</a></li>
            <li><a href="#contacto">Estudio</a></li>
        </ul>

        <a href="#obras" class="nav-badge">LARAVEL + THREE.JS // GH-PAGES READY</a>
    </header>

    <!-- =======================================================================
         PORTADA HERO CON ESCENA 3D INTERACTIVA EN TIEMPO REAL (THREE.JS)
         ======================================================================= -->
    <section class="hero-3d-section" id="visor-3d">
        <!-- Lienzo 3D WebGL -->
        <div id="arch-canvas-container" aria-label="Modelo arquitectónico 3D interactivo"></div>

        <!-- Columna Izquierda: Narrativa Arquitectónica -->
        <div class="hero-content">
            <div class="tech-pill">
                <span class="pulse-dot"></span>
                <span>VISOR WEBGL 3D INTERACTIVO · TIEMPO REAL</span>
            </div>

            <h1 class="hero-title">
                Espacios que desafían la gravedad
                <span>y dialogan con la luz.</span>
            </h1>

            <p class="hero-description">
                <?= htmlspecialchars($tagline) ?>. Explora el modelo volumétrico 3D arrastrando con el cursor, alterna a vista de planos (Wireframe), despieza los niveles estructurales o simula el asoleamiento real.
            </p>

            <div class="hero-actions">
                <a href="#obras" class="btn-primary">Explorar Obras Selectas ↓</a>
                <a href="#metodologia" class="btn-outline">Arquitectura Laravel + 3D</a>
            </div>
        </div>

        <!-- Columna Derecha: Consola HUD de Control Arquitectónico 3D -->
        <aside class="hud-3d-panel" aria-label="Controles del modelo 3D">
            <div class="hud-header">
                <span class="hud-title">// CONSOLA BIM 3D · LOD 400</span>
                <span class="hud-coords" id="hud-coords">X:0.0m  Y:0.0m</span>
            </div>

            <div class="hud-controls-grid">
                <button type="button" class="hud-btn" id="btn-3d-wireframe">
                    <span>[01] MODO PLANO CAD</span>
                    <span>⊞</span>
                </button>
                <button type="button" class="hud-btn" id="btn-3d-explode">
                    <span>[02] CORTE EXPLOTADO</span>
                    <span>⇅</span>
                </button>
                <button type="button" class="hud-btn active" id="btn-3d-rotate">
                    <span>[03] ÓRBITA ACTIVA</span>
                    <span>↻</span>
                </button>
                <button type="button" class="hud-btn" id="btn-3d-reset">
                    <span>[04] REINICIAR VISTA</span>
                    <span>⌖</span>
                </button>
            </div>

            <div class="hud-slider-group">
                <div class="hud-slider-label">
                    <span>ESTUDIO DE ASOLEAMIENTO (HORA SOLAR)</span>
                    <strong id="sun-time-label">17:45 · Hora Dorada</strong>
                </div>
                <input
                    type="range"
                    id="sun-angle-slider"
                    class="hud-slider"
                    min="6"
                    max="22"
                    step="0.25"
                    value="17.75"
                >
            </div>

            <div class="hud-preset-bar">
                <button type="button" class="preset-chip active" data-preset-3d="cantilever_villa">
                    Pabellón Aura (Voladizo)
                </button>
                <button type="button" class="preset-chip" data-preset-3d="diagrid_tower">
                    Torre Prisma
                </button>
                <button type="button" class="preset-chip" data-preset-3d="cultural_pavilion">
                    Museo Horizonte
                </button>
            </div>
        </aside>
    </section>

    <!-- =======================================================================
         INDICADORES DEL ESTUDIO
         ======================================================================= -->
    <section class="stats-strip">
        <?php foreach ($stats as $stat): ?>
            <div class="stat-item">
                <div class="stat-value"><?= htmlspecialchars($stat['value']) ?></div>
                <div class="stat-label"><?= htmlspecialchars($stat['label']) ?></div>
                <div class="stat-detail"><?= htmlspecialchars($stat['detail']) ?></div>
            </div>
        <?php endforeach; ?>
    </section>

    <!-- =======================================================================
         CATÁLOGO INTERACTIVO DE PROYECTOS ARQUITECTÓNICOS
         ======================================================================= -->
    <section class="section-container" id="obras">
        <div class="section-header">
            <div>
                <div class="section-eyebrow">// PORTAFOLIO CURADO 2024 — 2026</div>
                <h2 class="section-title">Obras & Proyectos Arquitectónicos</h2>
            </div>

            <div class="filter-tabs" role="tablist">
                <button type="button" class="filter-btn active" data-filter="todos">Todos (<?= count($projects) ?>)</button>
                <button type="button" class="filter-btn" data-filter="residencial">Residencial</button>
                <button type="button" class="filter-btn" data-filter="corporativo">Corporativo</button>
                <button type="button" class="filter-btn" data-filter="cultural">Cultural</button>
                <button type="button" class="filter-btn" data-filter="urbanismo">Urbanismo</button>
            </div>
        </div>

        <div class="projects-grid">
            <?php foreach ($projects as $project): ?>
                <article class="project-card" data-category="<?= htmlspecialchars($project['category']) ?>">
                    <div>
                        <div class="project-image-wrap">
                            <img
                                src="<?= htmlspecialchars($project['image']) ?>"
                                alt="<?= htmlspecialchars($project['title']) ?>"
                                loading="lazy"
                            >
                            <span class="project-code-badge"><?= htmlspecialchars($project['code']) ?></span>
                            <span class="project-status-badge"><?= htmlspecialchars($project['status']) ?></span>
                        </div>

                        <div class="project-body">
                            <div class="project-meta-top">
                                <span><?= htmlspecialchars($project['category_label']) ?></span>
                                <span><?= htmlspecialchars($project['location']) ?> · <?= htmlspecialchars($project['year']) ?></span>
                            </div>

                            <h3 class="project-title"><?= htmlspecialchars($project['title']) ?></h3>
                            <p class="project-summary"><?= htmlspecialchars($project['summary']) ?></p>

                            <div class="project-metrics-row">
                                <?php foreach ($project['metrics'] as $mLabel => $mVal): ?>
                                    <div class="metric-cell">
                                        <span class="metric-val"><?= htmlspecialchars($mVal) ?></span>
                                        <span class="metric-lbl"><?= htmlspecialchars($mLabel) ?></span>
                                    </div>
                                <?php endforeach; ?>
                            </div>

                            <div class="project-card-actions">
                                <button
                                    type="button"
                                    class="btn-card-3d"
                                    data-preset-3d="<?= htmlspecialchars($project['preset_3d']) ?>"
                                >
                                     Cargar Volumetría 3D ↑
                                </button>
                                <button
                                    type="button"
                                    class="btn-card-details"
                                    data-project='<?= htmlspecialchars(json_encode($project, JSON_UNESCAPED_UNICODE), ENT_QUOTES, "UTF-8") ?>'
                                >
                                    Ficha Técnica
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- =======================================================================
         METODOLOGÍA BIM & ARQUITECTURA HÍBRIDA LARAVEL -> GITHUB PAGES
         ======================================================================= -->
    <section class="section-container" id="metodologia">
        <div class="section-header">
            <div>
                <div class="section-eyebrow">// FLUJO DE TRABAJO DIGITAL</div>
                <h2 class="section-title">Ingeniería Paramétrica & Despliegue Continuo</h2>
            </div>
        </div>

        <div class="bim-grid">
            <div class="bim-card">
                <div class="bim-step">FASE 01 // CONCEPCIÓN PARAMÉTRICA</div>
                <h3>Simulación Solar y Volumetría 3D</h3>
                <p>
                    Cada proyecto nace de un análisis riguroso del sitio, vientos dominantes y radiación solar. Nuestro visor WebGL en portada permite evaluar voladizos y sombras antes de cimentar.
                </p>
            </div>

            <div class="bim-card">
                <div class="bim-step">FASE 02 // COORDINACIÓN BIM LOD 400</div>
                <h3>Materialidad Honesta y Precisión</h3>
                <p>
                    Combinamos hormigón aparente, madera laminada CLT, acero corten y cristal de baja emisividad con tolerancias milimétricas controladas mediante gemelos digitales.
                </p>
            </div>

            <div class="bim-card">
                <div class="bim-step">FASE 03 // ARQUITECTURA WEB LARAVEL + GH PAGES</div>
                <h3>Código PHP/Blade con Exportación Estática</h3>
                <p>
                    Gestiona tus proyectos en <code>app/Models/Project.php</code> y vistas en <code>resources/views/portfolio.blade.php</code>. Con <code>php artisan export:static</code> o GitHub Actions se publica gratis en GitHub Pages.
                </p>
            </div>
        </div>
    </section>

    <!-- =======================================================================
         MODAL DE FICHA TÉCNICA ARQUITECTÓNICA
         ======================================================================= -->
    <div class="modal-backdrop" id="project-modal" role="dialog" aria-modal="true">
        <div class="modal-sheet">
            <div class="modal-img-col">
                <img id="modal-img" src="" alt="Vista previa del proyecto">
            </div>
            <div class="modal-info-col">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <span class="section-eyebrow" id="modal-code" style="margin:0;"></span>
                        <button type="button" class="modal-close-btn" id="modal-close-btn">CERRAR [ESC]</button>
                    </div>
                    <h3 class="section-title" id="modal-title" style="font-size:1.75rem; margin-bottom:0.4rem;"></h3>
                    <p id="modal-location" style="font-family:var(--font-mono); font-size:0.82rem; color:var(--accent-gold); margin-bottom:1.1rem;"></p>
                    <p id="modal-summary" style="color:var(--text-secondary); font-size:0.95rem; margin-bottom:1.2rem;"></p>

                    <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">
                        Sistema Constructivo & Materiales:
                    </div>
                    <div class="tag-list" id="modal-materials"></div>

                    <div style="padding:0.9rem; background:rgba(201,166,107,0.08); border-left:2px solid var(--accent-gold); font-size:0.84rem;">
                        <strong style="color:var(--accent-gold); display:block; font-family:var(--font-mono); font-size:0.74rem;">DESEMPEÑO BIOCLIMÁTICO:</strong>
                        <span id="modal-sustain"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- =======================================================================
         PIE DE PÁGINA / CONTACTO
         ======================================================================= -->
    <footer class="footer" id="contacto">
        <div>
            <strong style="color:var(--text-primary);"><?= htmlspecialchars($studioName) ?></strong><br>
            <span>Ciudad de México · Madrid · Valparaíso — contacto@kronos-atelier.arch</span>
        </div>
        <div>
            <span>Desarrollado con PHP / Laravel Blade + Three.js WebGL · Listo para GitHub Pages</span>
        </div>
    </footer>

    <!-- Three.js CDN + Escena Arquitectónica 3D -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="assets/js/arch-scene-3d.js"></script>
</body>
</html>

