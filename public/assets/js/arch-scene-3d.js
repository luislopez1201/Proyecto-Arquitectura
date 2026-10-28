/**
 * ============================================================================
 * KRONOS // ATELIER ARQUITECTURA — Motor 3D WebGL (Three.js)
 * ============================================================================
 * Escena arquitectónica interactiva en tiempo real al inicio de la página:
 * - Modelos arquitectónicos procedurales multicapa (Pabellón en Voladizo,
 *   Torre Diagrid, Centro Cultural y Monolito del Desierto).
 * - Rotación suave con seguimiento del cursor y controles manuales.
 * - Ciclo solar dinámico (Día / Hora Dorada / Noche con luces interiores cálidas).
 * - Modo Plano Técnico (Wireframe / CAD Blueprint) y Corte de Sección (Exploded View).
 */

(function () {
    const container = document.getElementById('arch-canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    // --- 1. Escena, Cámara y Renderizador ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0c0e, 0.018);

    const camera = new THREE.PerspectiveCamera(
        42,
        container.clientWidth / container.clientHeight,
        0.1,
        250
    );
    camera.position.set(22, 13, 25);
    camera.lookAt(0, 3.5, 0);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- 2. Materiales Arquitectónicos ---
    const materials = {
        concrete: new THREE.MeshStandardMaterial({
            color: 0xe6e3dc,
            roughness: 0.72,
            metalness: 0.08
        }),
        darkConcrete: new THREE.MeshStandardMaterial({
            color: 0x23262d,
            roughness: 0.65,
            metalness: 0.18
        }),
        wood: new THREE.MeshStandardMaterial({
            color: 0x9c6b3f,
            roughness: 0.55,
            metalness: 0.1
        }),
        bronze: new THREE.MeshStandardMaterial({
            color: 0xc9a66b,
            roughness: 0.3,
            metalness: 0.82
        }),
        glass: new THREE.MeshPhysicalMaterial({
            color: 0x88c9d8,
            transparent: true,
            opacity: 0.42,
            roughness: 0.08,
            metalness: 0.25,
            reflectivity: 0.9
        }),
        warmGlow: new THREE.MeshStandardMaterial({
            color: 0xffcf87,
            emissive: 0xffa834,
            emissiveIntensity: 0.95,
            roughness: 0.4
        }),
        water: new THREE.MeshStandardMaterial({
            color: 0x10212b,
            roughness: 0.12,
            metalness: 0.85
        })
    };

    const allMaterials = Object.values(materials);

    // --- 3. Iluminación Arquitectónica y Ciclo Solar ---
    const ambientLight = new THREE.AmbientLight(0xdbe4f0, 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffe6c2, 1.9);
    sunLight.position.set(24, 30, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 90;
    const d = 22;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const interiorLight1 = new THREE.PointLight(0xffaa44, 1.8, 22);
    interiorLight1.position.set(0, 3.2, 0);
    scene.add(interiorLight1);

    const interiorLight2 = new THREE.PointLight(0xffb85c, 1.5, 18);
    interiorLight2.position.set(2.5, 6.8, -1.2);
    scene.add(interiorLight2);

    // --- 4. Plano Topográfico y Retícula CAD ---
    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const gridHelper = new THREE.GridHelper(64, 64, 0xc9a66b, 0x262932);
    gridHelper.position.y = -0.02;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    envGroup.add(gridHelper);

    // Espejo de agua perimetral
    const poolGeo = new THREE.BoxGeometry(24, 0.16, 18);
    const poolMesh = new THREE.Mesh(poolGeo, materials.water);
    poolMesh.position.set(1, -0.08, 1);
    poolMesh.receiveShadow = true;
    envGroup.add(poolMesh);

    // --- 5. Generador de Complejos Arquitectónicos 3D ---
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);

    let explodeElements = [];
    let currentPreset = 'cantilever_villa';

    function clearBuilding() {
        while (buildingGroup.children.length > 0) {
            const child = buildingGroup.children[0];
            buildingGroup.remove(child);
        }
        explodeElements = [];
    }

    function addPart(geometry, material, x, y, z, explodeVec = { x: 0, y: 0, z: 0 }, cast = true) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = cast;
        mesh.receiveShadow = true;

        // Añadir bordes técnicos sutiles para lectura arquitectónica
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0xc9a66b, transparent: true, opacity: 0.24 })
        );
        mesh.add(line);

        mesh.userData.basePos = new THREE.Vector3(x, y, z);
        mesh.userData.explodeVec = new THREE.Vector3(explodeVec.x, explodeVec.y, explodeVec.z);

        buildingGroup.add(mesh);
        explodeElements.push(mesh);
        return mesh;
    }

    function buildArchitecturalModel(preset) {
        clearBuilding();
        currentPreset = preset;

        if (preset === 'diagrid_tower') {
            // Torre Bioclimática Prisma Nord
            addPart(new THREE.BoxGeometry(11, 0.6, 11), materials.darkConcrete, 0, 0.3, 0, { x: 0, y: -0.5, z: 0 });
            const floors = 8;
            for (let i = 0; i < floors; i++) {
                const y = 1.1 + i * 1.45;
                const twist = i * 0.055;
                const slab = addPart(
                    new THREE.BoxGeometry(7.2 - i * 0.15, 0.24, 7.2 - i * 0.15),
                    materials.concrete,
                    0,
                    y,
                    0,
                    { x: 0, y: i * 0.65, z: 0 }
                );
                slab.rotation.y = twist;

                const core = addPart(
                    new THREE.BoxGeometry(2.6, 1.2, 2.6),
                    materials.warmGlow,
                    0,
                    y + 0.6,
                    0,
                    { x: 0, y: i * 0.65, z: 0 }
                );
                core.rotation.y = twist;

                const glassBox = addPart(
                    new THREE.BoxGeometry(6.6 - i * 0.15, 1.2, 6.6 - i * 0.15),
                    materials.glass,
                    0,
                    y + 0.6,
                    0,
                    { x: 0, y: i * 0.65, z: 0 },
                    false
                );
                glassBox.rotation.y = twist;
            }
            // Corona estructural de bronce
            addPart(new THREE.BoxGeometry(5.8, 0.45, 5.8), materials.bronze, 0, 13.0, 0, { x: 0, y: 6.2, z: 0 });
        } else if (preset === 'cultural_pavilion') {
            // Centro Cultural Horizonte del Pacífico
            addPart(new THREE.BoxGeometry(16, 0.5, 12), materials.darkConcrete, 0, 0.25, 0, { x: 0, y: -0.4, z: 0 });
            // Galerías acristaladas
            addPart(new THREE.BoxGeometry(11.5, 3.2, 7.5), materials.glass, 0, 2.1, 0, { x: 0, y: 0.8, z: 0 }, false);
            addPart(new THREE.BoxGeometry(6.5, 2.8, 4.5), materials.warmGlow, 0, 1.9, 0, { x: 0, y: 0.5, z: 0 });

            // Costillas estructurales paramétricas y gran cubierta plegada
            for (let i = -5; i <= 5; i++) {
                const h = 3.8 + Math.cos(i * 0.45) * 1.4;
                addPart(
                    new THREE.BoxGeometry(0.32, 0.45, 10.6),
                    materials.bronze,
                    i * 1.35,
                    h,
                    0,
                    { x: i * 0.35, y: 3.2, z: 0 }
                );
            }
            addPart(new THREE.BoxGeometry(15.2, 0.35, 9.8), materials.concrete, 0, 5.3, 0, { x: 0, y: 4.5, z: 0 });
        } else if (preset === 'desert_monolith' || preset === 'stepped_campus' || preset === 'vortex_pavilion') {
            // Monolito / Campus Escalonado
            addPart(new THREE.BoxGeometry(15, 0.5, 11), materials.wood, 0, 0.25, 0, { x: 0, y: -0.4, z: 0 });
            addPart(new THREE.BoxGeometry(11, 2.4, 7.5), materials.concrete, -1.2, 1.7, 0, { x: -1.5, y: 1.0, z: 0 });
            addPart(new THREE.BoxGeometry(8.5, 2.2, 6.2), materials.glass, 1.8, 3.8, 0.8, { x: 1.8, y: 2.4, z: 0.8 }, false);
            addPart(new THREE.BoxGeometry(4.8, 2.0, 4.2), materials.warmGlow, 1.4, 3.7, 0.8, { x: 1.4, y: 2.2, z: 0.8 });
            addPart(new THREE.BoxGeometry(9.8, 0.45, 7.2), materials.bronze, 1.5, 5.1, 0.8, { x: 1.5, y: 4.0, z: 0.8 });
        } else {
            // Default: Pabellón Aura & Residencia Kengo (Villa en Voladizo)
            // Plataforma base de hormigón oscuro y escalinata flotante
            addPart(new THREE.BoxGeometry(15, 0.55, 11), materials.darkConcrete, 0, 0.28, 0, { x: 0, y: -0.6, z: 0 });
            addPart(new THREE.BoxGeometry(3.4, 0.22, 2.2), materials.concrete, -5.2, 0.2, 5.8, { x: -1.2, y: -0.4, z: 1.5 });

            // Nivel 1: Núcleo pétreo + Salón de cristal e iluminación cálida
            addPart(new THREE.BoxGeometry(5.5, 3.0, 7.2), materials.concrete, -3.2, 2.05, -0.6, { x: -2.2, y: 0.4, z: -0.8 });
            addPart(new THREE.BoxGeometry(7.8, 2.8, 6.2), materials.glass, 2.4, 1.95, 0.4, { x: 2.0, y: 0.4, z: 1.2 }, false);
            addPart(new THREE.BoxGeometry(5.2, 2.3, 4.2), materials.warmGlow, 1.8, 1.85, 0.4, { x: 1.2, y: 0.4, z: 0.5 });

            // Losa intermedia con marco de bronce arquitectónico
            addPart(new THREE.BoxGeometry(13.8, 0.42, 8.8), materials.concrete, 0.4, 3.65, 0, { x: 0, y: 1.8, z: 0 });
            addPart(new THREE.BoxGeometry(14.1, 0.18, 9.1), materials.bronze, 0.4, 3.92, 0, { x: 0, y: 2.1, z: 0 });

            // Nivel 2: Gran Volumen en Voladizo (Cantilever)
            addPart(new THREE.BoxGeometry(10.8, 2.7, 5.8), materials.glass, 2.8, 5.4, 0.8, { x: 2.6, y: 3.2, z: 1.4 }, false);
            addPart(new THREE.BoxGeometry(6.4, 2.3, 4.2), materials.warmGlow, 2.1, 5.3, 0.8, { x: 1.8, y: 3.0, z: 0.8 });
            addPart(new THREE.BoxGeometry(4.4, 2.7, 6.4), materials.wood, -3.4, 5.4, -0.5, { x: -2.4, y: 3.2, z: -1.0 });

            // Celosías verticales (Brise-soleil) en fachada sur
            for (let i = 0; i < 9; i++) {
                addPart(
                    new THREE.BoxGeometry(0.14, 2.65, 0.45),
                    materials.bronze,
                    -0.4 + i * 0.95,
                    5.4,
                    3.75,
                    { x: 0, y: 3.6, z: 2.8 }
                );
            }

            // Cubierta superior con espejo de luz cenital
            addPart(new THREE.BoxGeometry(12.6, 0.48, 7.4), materials.concrete, 1.6, 7.0, 0.4, { x: 0.8, y: 5.0, z: 0 });

            // Columnas esbeltas de acero
            addPart(new THREE.CylinderGeometry(0.14, 0.14, 3.0, 16), materials.bronze, 5.6, 2.0, 2.9, { x: 2.5, y: 0.5, z: 2.0 });
            addPart(new THREE.CylinderGeometry(0.14, 0.14, 3.0, 16), materials.bronze, 5.6, 2.0, -2.1, { x: 2.5, y: 0.5, z: -2.0 });
        }
    }

    buildArchitecturalModel('cantilever_villa');

    // --- 6. Interacción con el Mouse, Auto-Rotación y Controles HUD ---
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let targetRotY = -0.35;
    let targetRotX = 0.08;
    let autoRotate = true;
    let isWireframe = false;
    let isExploded = false;
    let explodeFactor = 0;
    let targetExplode = 0;

    container.addEventListener('pointerdown', (e) => {
        isDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
    });

    window.addEventListener('pointermove', (e) => {
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Actualizar coordenadas HUD en tiempo real
        const coordsEl = document.getElementById('hud-coords');
        if (coordsEl) {
            coordsEl.textContent = `X:${(normX * 15).toFixed(1)}m  Y:${(normY * 12).toFixed(1)}m`;
        }

        if (isDragging) {
            const dx = e.clientX - prevMouse.x;
            const dy = e.clientY - prevMouse.y;
            targetRotY += dx * 0.008;
            targetRotX = Math.max(-0.25, Math.min(0.48, targetRotX + dy * 0.005));
            prevMouse = { x: e.clientX, y: e.clientY };
        } else {
            // Sutil efecto parallax con el cursor
            targetRotY += normX * 0.0008;
        }
    });

    // Zoom suave con rueda del ratón sobre el canvas
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z = Math.max(15, Math.min(38, camera.position.z + e.deltaY * 0.015));
    }, { passive: false });

    // Botones del HUD 3D
    const btnWireframe = document.getElementById('btn-3d-wireframe');
    const btnExplode = document.getElementById('btn-3d-explode');
    const btnRotate = document.getElementById('btn-3d-rotate');
    const btnReset = document.getElementById('btn-3d-reset');
    const sunSlider = document.getElementById('sun-angle-slider');
    const sunTimeLabel = document.getElementById('sun-time-label');

    if (btnWireframe) {
        btnWireframe.addEventListener('click', () => {
            isWireframe = !isWireframe;
            btnWireframe.classList.toggle('active', isWireframe);
            allMaterials.forEach((mat) => {
                mat.wireframe = isWireframe;
            });
        });
    }

    if (btnExplode) {
        btnExplode.addEventListener('click', () => {
            isExploded = !isExploded;
            targetExplode = isExploded ? 1 : 0;
            btnExplode.classList.toggle('active', isExploded);
        });
    }

    if (btnRotate) {
        btnRotate.addEventListener('click', () => {
            autoRotate = !autoRotate;
            btnRotate.classList.toggle('active', autoRotate);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            targetRotY = -0.35;
            targetRotX = 0.08;
            camera.position.set(22, 13, 25);
            isExploded = false;
            targetExplode = 0;
            if (btnExplode) btnExplode.classList.remove('active');
        });
    }

    // Control de Asoleamiento / Hora Solar
    function updateSunPosition(hourDecimal) {
        // hourDecimal entre 6 (amanecer) y 22 (noche)
        const normalized = (hourDecimal - 6) / 16; // 0..1
        const angle = normalized * Math.PI; // 0..PI

        const radius = 34;
        sunLight.position.x = Math.cos(angle) * radius;
        sunLight.position.y = Math.max(2.5, Math.sin(angle) * 28);
        sunLight.position.z = 14 + Math.sin(angle * 2) * 8;

        const isNight = hourDecimal > 19.2 || hourDecimal < 6.8;
        const isGolden = (hourDecimal >= 17.2 && hourDecimal <= 19.2) || (hourDecimal >= 6.8 && hourDecimal <= 8.2);

        if (isNight) {
            sunLight.intensity = 0.22;
            sunLight.color.setHex(0x6889ff);
            ambientLight.intensity = 0.28;
            materials.warmGlow.emissiveIntensity = 1.65;
            interiorLight1.intensity = 2.6;
            interiorLight2.intensity = 2.2;
        } else if (isGolden) {
            sunLight.intensity = 1.65;
            sunLight.color.setHex(0xff9e54);
            ambientLight.intensity = 0.48;
            materials.warmGlow.emissiveIntensity = 1.1;
            interiorLight1.intensity = 1.7;
            interiorLight2.intensity = 1.4;
        } else {
            sunLight.intensity = 2.1;
            sunLight.color.setHex(0xfff1dc);
            ambientLight.intensity = 0.72;
            materials.warmGlow.emissiveIntensity = 0.45;
            interiorLight1.intensity = 0.8;
            interiorLight2.intensity = 0.6;
        }

        if (sunTimeLabel) {
            const hrs = Math.floor(hourDecimal);
            const mins = Math.round((hourDecimal - hrs) * 60);
            const tag = isNight ? 'Noche' : (isGolden ? 'Hora Dorada' : 'Luz Diurna');
            sunTimeLabel.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} · ${tag}`;
        }
    }

    if (sunSlider) {
        sunSlider.addEventListener('input', (e) => {
            updateSunPosition(parseFloat(e.target.value));
        });
        updateSunPosition(parseFloat(sunSlider.value));
    }

    // Selector de Presets 3D desde el HUD y desde las tarjetas de proyectos
    function setPresetActiveUI(presetName) {
        document.querySelectorAll('[data-preset-3d]').forEach((el) => {
            if (el.classList.contains('preset-chip')) {
                el.classList.toggle('active', el.getAttribute('data-preset-3d') === presetName);
            }
        });
    }

    document.querySelectorAll('[data-preset-3d]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset-3d');
            buildArchitecturalModel(preset);
            setPresetActiveUI(preset);

            // Si el clic viene de una tarjeta de proyecto abajo, subir suavemente al visor 3D
            if (btn.classList.contains('btn-card-3d')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // --- 7. Loop de Animación ---
    function animate() {
        requestAnimationFrame(animate);

        if (autoRotate && !isDragging) {
            targetRotY += 0.0024;
        }

        buildingGroup.rotation.y += (targetRotY - buildingGroup.rotation.y) * 0.08;
        buildingGroup.rotation.x += (targetRotX - buildingGroup.rotation.x) * 0.08;
        envGroup.rotation.y = buildingGroup.rotation.y;
        envGroup.rotation.x = buildingGroup.rotation.x;

        // Interpolación suave de vista explotada (axonométrica constructiva)
        explodeFactor += (targetExplode - explodeFactor) * 0.08;
        explodeElements.forEach((mesh) => {
            mesh.position.x = mesh.userData.basePos.x + mesh.userData.explodeVec.x * explodeFactor;
            mesh.position.y = mesh.userData.basePos.y + mesh.userData.explodeVec.y * explodeFactor;
            mesh.position.z = mesh.userData.basePos.z + mesh.userData.explodeVec.z * explodeFactor;
        });

        renderer.render(scene, camera);
    }

    animate();

    // --- 8. Responsividad del Canvas 3D ---
    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
})();

/**
 * ============================================================================
 * Filtros de Portafolio y Modal de Ficha Técnica
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // Filtrado por categoría
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-filter');
            filterBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            cards.forEach((card) => {
                const cardCat = card.getAttribute('data-category');
                if (cat === 'todos' || cardCat === cat) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Modal de Ficha Técnica
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    document.querySelectorAll('.btn-card-details').forEach((btn) => {
        btn.addEventListener('click', () => {
            const data = JSON.parse(btn.getAttribute('data-project'));
            document.getElementById('modal-img').src = data.image;
            document.getElementById('modal-code').textContent = `${data.code} · ${data.category_label}`;
            document.getElementById('modal-title').textContent = data.title;
            document.getElementById('modal-location').textContent = `${data.location} (${data.year}) — ${data.area}`;
            document.getElementById('modal-summary').textContent = data.summary;
            document.getElementById('modal-sustain').textContent = data.sustainability;

            const tagsContainer = document.getElementById('modal-materials');
            tagsContainer.innerHTML = '';
            (data.materials || []).forEach((mat) => {
                const span = document.createElement('span');
                span.className = 'tag-chip';
                span.textContent = mat;
                tagsContainer.appendChild(span);
            });

            modal.classList.add('open');
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    }
});

