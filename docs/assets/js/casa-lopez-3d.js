/**
 * ============================================================================
 * CASA LUIS LÓPEZ · MODELO 3D INTERACTIVO (Lote 4,00 × 13,50 m · 34,20 m²)
 * ============================================================================
 * Incluye THREE.OrbitControls (r128) y el modelo arquitectónico ortográfico
 * detallado con recorte de muros, apertura de puertas, techo, cotas, etiquetas
 * y mobiliario interior completo.
 */

(function () {
    if (typeof THREE === 'undefined') return;

    const _changeEvent = { type: 'change' };
    const _startEvent = { type: 'start' };
    const _endEvent = { type: 'end' };

    class OrbitControls extends THREE.EventDispatcher {
        constructor(object, domElement) {
            super();
            this.object = object;
            this.domElement = domElement;
            this.enabled = true;
            this.target = new THREE.Vector3();
            this.minDistance = 0;
            this.maxDistance = Infinity;
            this.minZoom = 0;
            this.maxZoom = Infinity;
            this.minPolarAngle = 0;
            this.maxPolarAngle = Math.PI;
            this.minAzimuthAngle = -Infinity;
            this.maxAzimuthAngle = Infinity;
            this.enableDamping = false;
            this.dampingFactor = 0.05;
            this.enableZoom = true;
            this.zoomSpeed = 1.0;
            this.enableRotate = true;
            this.rotateSpeed = 1.0;
            this.enablePan = true;
            this.panSpeed = 1.0;
            this.screenSpacePanning = true;
            this.keyPanSpeed = 7.0;
            this.autoRotate = false;
            this.autoRotateSpeed = 2.0;
            this.keys = {
                LEFT: 'ArrowLeft',
                UP: 'ArrowUp',
                RIGHT: 'ArrowRight',
                BOTTOM: 'ArrowDown'
            };
            this.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
            this.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
            this.target0 = this.target.clone();
            this.position0 = this.object.position.clone();
            this.zoom0 = this.object.zoom;
            this._domElementKeyEvents = null;

            this.getPolarAngle = function () {
                return spherical.phi;
            };

            this.getAzimuthalAngle = function () {
                return spherical.theta;
            };

            this.listenToKeyEvents = function (domElement) {
                domElement.addEventListener('keydown', onKeyDown);
                this._domElementKeyEvents = domElement;
            };

            this.saveState = function () {
                scope.target0.copy(scope.target);
                scope.position0.copy(scope.object.position);
                scope.zoom0 = scope.object.zoom;
            };

            this.reset = function () {
                scope.target.copy(scope.target0);
                scope.object.position.copy(scope.position0);
                scope.object.zoom = scope.zoom0;
                scope.object.updateProjectionMatrix();
                scope.dispatchEvent(_changeEvent);
                scope.update();
                state = STATE.NONE;
            };

            this.update = (function () {
                const offset = new THREE.Vector3();
                const quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
                const quatInverse = quat.clone().invert();
                const lastPosition = new THREE.Vector3();
                const lastQuaternion = new THREE.Quaternion();
                const twoPI = 2 * Math.PI;

                return function update() {
                    const position = scope.object.position;
                    offset.copy(position).sub(scope.target);
                    offset.applyQuaternion(quat);
                    spherical.setFromVector3(offset);

                    if (scope.autoRotate && state === STATE.NONE) {
                        rotateLeft(getAutoRotationAngle());
                    }

                    if (scope.enableDamping) {
                        spherical.theta += sphericalDelta.theta * scope.dampingFactor;
                        spherical.phi += sphericalDelta.phi * scope.dampingFactor;
                    } else {
                        spherical.theta += sphericalDelta.theta;
                        spherical.phi += sphericalDelta.phi;
                    }

                    let min = scope.minAzimuthAngle;
                    let max = scope.maxAzimuthAngle;

                    if (isFinite(min) && isFinite(max)) {
                        if (min < -Math.PI) min += twoPI;
                        else if (min > Math.PI) min -= twoPI;
                        if (max < -Math.PI) max += twoPI;
                        else if (max > Math.PI) max -= twoPI;

                        if (min <= max) {
                            spherical.theta = Math.max(min, Math.min(max, spherical.theta));
                        } else {
                            spherical.theta =
                                spherical.theta > (min + max) / 2
                                    ? Math.max(min, spherical.theta)
                                    : Math.min(max, spherical.theta);
                        }
                    }

                    spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
                    spherical.makeSafe();
                    spherical.radius *= scale;
                    spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

                    if (scope.enableDamping === true) {
                        scope.target.addScaledVector(panOffset, scope.dampingFactor);
                    } else {
                        scope.target.add(panOffset);
                    }

                    offset.setFromSpherical(spherical);
                    offset.applyQuaternion(quatInverse);
                    position.copy(scope.target).add(offset);
                    scope.object.lookAt(scope.target);

                    if (scope.enableDamping === true) {
                        sphericalDelta.theta *= 1 - scope.dampingFactor;
                        sphericalDelta.phi *= 1 - scope.dampingFactor;
                        panOffset.multiplyScalar(1 - scope.dampingFactor);
                    } else {
                        sphericalDelta.set(0, 0, 0);
                        panOffset.set(0, 0, 0);
                    }

                    scale = 1;

                    if (
                        zoomChanged ||
                        lastPosition.distanceToSquared(scope.object.position) > EPS ||
                        8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS
                    ) {
                        scope.dispatchEvent(_changeEvent);
                        lastPosition.copy(scope.object.position);
                        lastQuaternion.copy(scope.object.quaternion);
                        zoomChanged = false;
                        return true;
                    }

                    return false;
                };
            })();

            this.dispose = function () {
                scope.domElement.removeEventListener('contextmenu', onContextMenu);
                scope.domElement.removeEventListener('pointerdown', onPointerDown);
                scope.domElement.removeEventListener('wheel', onMouseWheel);
                scope.domElement.removeEventListener('touchstart', onTouchStart);
                scope.domElement.removeEventListener('touchend', onTouchEnd);
                scope.domElement.removeEventListener('touchmove', onTouchMove);
                scope.domElement.ownerDocument.removeEventListener('pointermove', onPointerMove);
                scope.domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);

                if (scope._domElementKeyEvents !== null) {
                    scope._domElementKeyEvents.removeEventListener('keydown', onKeyDown);
                }
            };

            const scope = this;
            const STATE = {
                NONE: -1,
                ROTATE: 0,
                DOLLY: 1,
                PAN: 2,
                TOUCH_ROTATE: 3,
                TOUCH_PAN: 4,
                TOUCH_DOLLY_PAN: 5,
                TOUCH_DOLLY_ROTATE: 6
            };
            let state = STATE.NONE;
            const EPS = 0.000001;
            const spherical = new THREE.Spherical();
            const sphericalDelta = new THREE.Spherical();
            let scale = 1;
            const panOffset = new THREE.Vector3();
            let zoomChanged = false;
            const rotateStart = new THREE.Vector2();
            const rotateEnd = new THREE.Vector2();
            const rotateDelta = new THREE.Vector2();
            const panStart = new THREE.Vector2();
            const panEnd = new THREE.Vector2();
            const panDelta = new THREE.Vector2();
            const dollyStart = new THREE.Vector2();
            const dollyEnd = new THREE.Vector2();
            const dollyDelta = new THREE.Vector2();

            function getAutoRotationAngle() {
                return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed;
            }

            function getZoomScale() {
                return Math.pow(0.95, scope.zoomSpeed);
            }

            function rotateLeft(angle) {
                sphericalDelta.theta -= angle;
            }

            function rotateUp(angle) {
                sphericalDelta.phi -= angle;
            }

            const panLeft = (function () {
                const v = new THREE.Vector3();
                return function panLeft(distance, objectMatrix) {
                    v.setFromMatrixColumn(objectMatrix, 0);
                    v.multiplyScalar(-distance);
                    panOffset.add(v);
                };
            })();

            const panUp = (function () {
                const v = new THREE.Vector3();
                return function panUp(distance, objectMatrix) {
                    if (scope.screenSpacePanning === true) {
                        v.setFromMatrixColumn(objectMatrix, 1);
                    } else {
                        v.setFromMatrixColumn(objectMatrix, 0);
                        v.crossVectors(scope.object.up, v);
                    }
                    v.multiplyScalar(distance);
                    panOffset.add(v);
                };
            })();

            const pan = (function () {
                const offset = new THREE.Vector3();
                return function pan(deltaX, deltaY) {
                    const element = scope.domElement;
                    if (scope.object.isPerspectiveCamera) {
                        const position = scope.object.position;
                        offset.copy(position).sub(scope.target);
                        let targetDistance = offset.length();
                        targetDistance *= Math.tan(((scope.object.fov / 2) * Math.PI) / 180.0);
                        panLeft((2 * deltaX * targetDistance) / element.clientHeight, scope.object.matrix);
                        panUp((2 * deltaY * targetDistance) / element.clientHeight, scope.object.matrix);
                    } else if (scope.object.isOrthographicCamera) {
                        panLeft(
                            (deltaX * (scope.object.right - scope.object.left)) /
                                scope.object.zoom /
                                element.clientWidth,
                            scope.object.matrix
                        );
                        panUp(
                            (deltaY * (scope.object.top - scope.object.bottom)) /
                                scope.object.zoom /
                                element.clientHeight,
                            scope.object.matrix
                        );
                    } else {
                        scope.enablePan = false;
                    }
                };
            })();

            function dollyOut(dollyScale) {
                if (scope.object.isPerspectiveCamera) {
                    scale /= dollyScale;
                } else if (scope.object.isOrthographicCamera) {
                    scope.object.zoom = Math.max(
                        scope.minZoom,
                        Math.min(scope.maxZoom, scope.object.zoom * dollyScale)
                    );
                    scope.object.updateProjectionMatrix();
                    zoomChanged = true;
                } else {
                    scope.enableZoom = false;
                }
            }

            function dollyIn(dollyScale) {
                if (scope.object.isPerspectiveCamera) {
                    scale *= dollyScale;
                } else if (scope.object.isOrthographicCamera) {
                    scope.object.zoom = Math.max(
                        scope.minZoom,
                        Math.min(scope.maxZoom, scope.object.zoom / dollyScale)
                    );
                    scope.object.updateProjectionMatrix();
                    zoomChanged = true;
                } else {
                    scope.enableZoom = false;
                }
            }

            function handleMouseDownRotate(event) {
                rotateStart.set(event.clientX, event.clientY);
            }

            function handleMouseDownDolly(event) {
                dollyStart.set(event.clientX, event.clientY);
            }

            function handleMouseDownPan(event) {
                panStart.set(event.clientX, event.clientY);
            }

            function handleMouseMoveRotate(event) {
                rotateEnd.set(event.clientX, event.clientY);
                rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
                const element = scope.domElement;
                rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight);
                rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight);
                rotateStart.copy(rotateEnd);
                scope.update();
            }

            function handleMouseMoveDolly(event) {
                dollyEnd.set(event.clientX, event.clientY);
                dollyDelta.subVectors(dollyEnd, dollyStart);
                if (dollyDelta.y > 0) {
                    dollyOut(getZoomScale());
                } else if (dollyDelta.y < 0) {
                    dollyIn(getZoomScale());
                }
                dollyStart.copy(dollyEnd);
                scope.update();
            }

            function handleMouseMovePan(event) {
                panEnd.set(event.clientX, event.clientY);
                panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
                pan(panDelta.x, panDelta.y);
                panStart.copy(panEnd);
                scope.update();
            }

            function handleMouseWheel(event) {
                if (event.deltaY < 0) {
                    dollyIn(getZoomScale());
                } else if (event.deltaY > 0) {
                    dollyOut(getZoomScale());
                }
                scope.update();
            }

            function handleKeyDown(event) {
                let needsUpdate = false;
                switch (event.code) {
                    case scope.keys.UP:
                        pan(0, scope.keyPanSpeed);
                        needsUpdate = true;
                        break;
                    case scope.keys.BOTTOM:
                        pan(0, -scope.keyPanSpeed);
                        needsUpdate = true;
                        break;
                    case scope.keys.LEFT:
                        pan(scope.keyPanSpeed, 0);
                        needsUpdate = true;
                        break;
                    case scope.keys.RIGHT:
                        pan(-scope.keyPanSpeed, 0);
                        needsUpdate = true;
                        break;
                }
                if (needsUpdate) {
                    event.preventDefault();
                    scope.update();
                }
            }

            function handleTouchStartRotate(event) {
                if (event.touches.length == 1) {
                    rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
                } else {
                    const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                    const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                    rotateStart.set(x, y);
                }
            }

            function handleTouchStartPan(event) {
                if (event.touches.length == 1) {
                    panStart.set(event.touches[0].pageX, event.touches[0].pageY);
                } else {
                    const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                    const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                    panStart.set(x, y);
                }
            }

            function handleTouchStartDolly(event) {
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                dollyStart.set(0, distance);
            }

            function handleTouchStartDollyPan(event) {
                if (scope.enableZoom) handleTouchStartDolly(event);
                if (scope.enablePan) handleTouchStartPan(event);
            }

            function handleTouchStartDollyRotate(event) {
                if (scope.enableZoom) handleTouchStartDolly(event);
                if (scope.enableRotate) handleTouchStartRotate(event);
            }

            function handleTouchMoveRotate(event) {
                if (event.touches.length == 1) {
                    rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                } else {
                    const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                    const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                    rotateEnd.set(x, y);
                }
                rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
                const element = scope.domElement;
                rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight);
                rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight);
                rotateStart.copy(rotateEnd);
            }

            function handleTouchMovePan(event) {
                if (event.touches.length == 1) {
                    panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                } else {
                    const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                    const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                    panEnd.set(x, y);
                }
                panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
                pan(panDelta.x, panDelta.y);
                panStart.copy(panEnd);
            }

            function handleTouchMoveDolly(event) {
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                dollyEnd.set(0, distance);
                dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
                dollyOut(dollyDelta.y);
                dollyStart.copy(dollyEnd);
            }

            function handleTouchMoveDollyPan(event) {
                if (scope.enableZoom) handleTouchMoveDolly(event);
                if (scope.enablePan) handleTouchMovePan(event);
            }

            function handleTouchMoveDollyRotate(event) {
                if (scope.enableZoom) handleTouchMoveDolly(event);
                if (scope.enableRotate) handleTouchMoveRotate(event);
            }

            function onPointerDown(event) {
                if (scope.enabled === false) return;
                switch (event.pointerType) {
                    case 'mouse':
                    case 'pen':
                        onMouseDown(event);
                        break;
                }
            }

            function onPointerMove(event) {
                if (scope.enabled === false) return;
                switch (event.pointerType) {
                    case 'mouse':
                    case 'pen':
                        onMouseMove(event);
                        break;
                }
            }

            function onPointerUp(event) {
                switch (event.pointerType) {
                    case 'mouse':
                    case 'pen':
                        onMouseUp(event);
                        break;
                }
            }

            function onMouseDown(event) {
                event.preventDefault();
                scope.domElement.focus ? scope.domElement.focus() : window.focus();
                let mouseAction;
                switch (event.button) {
                    case 0:
                        mouseAction = scope.mouseButtons.LEFT;
                        break;
                    case 1:
                        mouseAction = scope.mouseButtons.MIDDLE;
                        break;
                    case 2:
                        mouseAction = scope.mouseButtons.RIGHT;
                        break;
                    default:
                        mouseAction = -1;
                }

                switch (mouseAction) {
                    case THREE.MOUSE.DOLLY:
                        if (scope.enableZoom === false) return;
                        handleMouseDownDolly(event);
                        state = STATE.DOLLY;
                        break;
                    case THREE.MOUSE.ROTATE:
                        if (event.ctrlKey || event.metaKey || event.shiftKey) {
                            if (scope.enablePan === false) return;
                            handleMouseDownPan(event);
                            state = STATE.PAN;
                        } else {
                            if (scope.enableRotate === false) return;
                            handleMouseDownRotate(event);
                            state = STATE.ROTATE;
                        }
                        break;
                    case THREE.MOUSE.PAN:
                        if (event.ctrlKey || event.metaKey || event.shiftKey) {
                            if (scope.enableRotate === false) return;
                            handleMouseDownRotate(event);
                            state = STATE.ROTATE;
                        } else {
                            if (scope.enablePan === false) return;
                            handleMouseDownPan(event);
                            state = STATE.PAN;
                        }
                        break;
                    default:
                        state = STATE.NONE;
                }

                if (state !== STATE.NONE) {
                    scope.domElement.ownerDocument.addEventListener('pointermove', onPointerMove);
                    scope.domElement.ownerDocument.addEventListener('pointerup', onPointerUp);
                    scope.dispatchEvent(_startEvent);
                }
            }

            function onMouseMove(event) {
                if (scope.enabled === false) return;
                event.preventDefault();
                switch (state) {
                    case STATE.ROTATE:
                        if (scope.enableRotate === false) return;
                        handleMouseMoveRotate(event);
                        break;
                    case STATE.DOLLY:
                        if (scope.enableZoom === false) return;
                        handleMouseMoveDolly(event);
                        break;
                    case STATE.PAN:
                        if (scope.enablePan === false) return;
                        handleMouseMovePan(event);
                        break;
                }
            }

            function onMouseUp() {
                scope.domElement.ownerDocument.removeEventListener('pointermove', onPointerMove);
                scope.domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
                if (scope.enabled === false) return;
                scope.dispatchEvent(_endEvent);
                state = STATE.NONE;
            }

            function onMouseWheel(event) {
                if (
                    scope.enabled === false ||
                    scope.enableZoom === false ||
                    (state !== STATE.NONE && state !== STATE.ROTATE)
                )
                    return;
                event.preventDefault();
                scope.dispatchEvent(_startEvent);
                handleMouseWheel(event);
                scope.dispatchEvent(_endEvent);
            }

            function onTouchStart(event) {
                if (scope.enabled === false) return;
                event.preventDefault();
                switch (event.touches.length) {
                    case 1:
                        switch (scope.touches.ONE) {
                            case THREE.TOUCH.ROTATE:
                                if (scope.enableRotate === false) return;
                                handleTouchStartRotate(event);
                                state = STATE.TOUCH_ROTATE;
                                break;
                            case THREE.TOUCH.PAN:
                                if (scope.enablePan === false) return;
                                handleTouchStartPan(event);
                                state = STATE.TOUCH_PAN;
                                break;
                            default:
                                state = STATE.NONE;
                        }
                        break;
                    case 2:
                        switch (scope.touches.TWO) {
                            case THREE.TOUCH.DOLLY_PAN:
                                if (scope.enableZoom === false && scope.enablePan === false) return;
                                handleTouchStartDollyPan(event);
                                state = STATE.TOUCH_DOLLY_PAN;
                                break;
                            case THREE.TOUCH.DOLLY_ROTATE:
                                if (scope.enableZoom === false && scope.enableRotate === false) return;
                                handleTouchStartDollyRotate(event);
                                state = STATE.TOUCH_DOLLY_ROTATE;
                                break;
                            default:
                                state = STATE.NONE;
                        }
                        break;
                    default:
                        state = STATE.NONE;
                }
                if (state !== STATE.NONE) {
                    scope.dispatchEvent(_startEvent);
                }
            }

            function onTouchMove(event) {
                if (scope.enabled === false) return;
                event.preventDefault();
                switch (state) {
                    case STATE.TOUCH_ROTATE:
                        if (scope.enableRotate === false) return;
                        handleTouchMoveRotate(event);
                        scope.update();
                        break;
                    case STATE.TOUCH_PAN:
                        if (scope.enablePan === false) return;
                        handleTouchMovePan(event);
                        scope.update();
                        break;
                    case STATE.TOUCH_DOLLY_PAN:
                        if (scope.enableZoom === false && scope.enablePan === false) return;
                        handleTouchMoveDollyPan(event);
                        scope.update();
                        break;
                    case STATE.TOUCH_DOLLY_ROTATE:
                        if (scope.enableZoom === false && scope.enableRotate === false) return;
                        handleTouchMoveDollyRotate(event);
                        scope.update();
                        break;
                    default:
                        state = STATE.NONE;
                }
            }

            function onTouchEnd() {
                if (scope.enabled === false) return;
                scope.dispatchEvent(_endEvent);
                state = STATE.NONE;
            }

            function onContextMenu(event) {
                if (scope.enabled === false) return;
                event.preventDefault();
            }

            scope.domElement.addEventListener('contextmenu', onContextMenu);
            scope.domElement.addEventListener('pointerdown', onPointerDown);
            scope.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
            scope.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
            scope.domElement.addEventListener('touchend', onTouchEnd);
            scope.domElement.addEventListener('touchmove', onTouchMove, { passive: false });

            this.update();
        }
    }

    THREE.OrbitControls = OrbitControls;
})();

(function () {
    'use strict';
    const root = document.getElementById('casa-lopez-modelo');
    if (!root) return;

    const stage = root.querySelector('#cl-scene');
    const detail = root.querySelector('#cl-detail');
    const loading = root.querySelector('#cl-loading');

    if (!window.THREE || !THREE.OrbitControls) {
        if (loading) loading.textContent = 'No se pudo cargar el visor 3D. Vuelve a abrir esta vista con conexión a internet.';
        return;
    }

    const T = THREE;
    let renderer;
    try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
        if (loading) loading.textContent = 'El navegador no pudo activar WebGL para mostrar el modelo 3D.';
        return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.localClippingEnabled = true;
    stage.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const ortho = new T.OrthographicCamera(-8, 8, 8, -8, 0.05, 160);
    const camera = ortho;
    let controls;

    const state = {
        cut: true,
        roof: false,
        doors: true,
        dims: false,
        rotating: false,
        view: 'planta'
    };

    const group = (parent = scene) => {
        const g = new T.Group();
        parent.add(g);
        return g;
    };

    const architecture = group();
    const fullWalls = group(architecture);
    const lowWalls = group(architecture);
    const fullTrim = group(architecture);
    const lowTrim = group(architecture);
    const furnishings = group();
    const roof = group();
    const dims = group();
    const doorGroup = group();

    roof.visible = false;
    fullWalls.visible = false;
    fullTrim.visible = false;
    dims.visible = false;

    const materials = {};
    const themed = [];
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const colorContext = colorCanvas.getContext('2d', { willReadFrequently: true });

    function token(name) {
        const p = document.createElement('span');
        p.style.color = 'var(' + name + ')';
        root.appendChild(p);
        const c = getComputedStyle(p).color;
        p.style.color = 'var(--background)';
        const bg = getComputedStyle(p).color;
        p.remove();
        colorContext.clearRect(0, 0, 1, 1);
        colorContext.fillStyle = bg;
        colorContext.fillRect(0, 0, 1, 1);
        colorContext.fillStyle = c;
        colorContext.fillRect(0, 0, 1, 1);
        const rgb = colorContext.getImageData(0, 0, 1, 1).data;
        return new T.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255).convertSRGBToLinear();
    }

    function colors() {
        const bg = token('--background');
        const fg = token('--foreground');
        const muted = token('--muted');
        const orange = token('--orange');
        const blue = token('--blue');
        const green = token('--green');
        const light = bg.r + bg.g + bg.b > fg.r + fg.g + fg.b ? bg : fg;
        const ink = light === bg ? fg : bg;
        const pale = light.clone().lerp(ink, 0.1);
        const dark = ink.clone().lerp(light, 0.08);
        return {
            plaster: pale,
            wallCap: ink.clone().lerp(light, 0.69),
            base: light.clone().lerp(ink, 0.36),
            tile: light.clone().lerp(ink, 0.2),
            grout: ink.clone().lerp(light, 0.8),
            wood: orange.clone().lerp(light, 0.4).lerp(ink, 0.28),
            woodDark: orange.clone().lerp(ink, 0.78),
            linen: light.clone().lerp(ink, 0.05),
            fabric: blue.clone().lerp(light, 0.4).lerp(ink, 0.12),
            accent: blue.clone().lerp(muted, 0.4),
            stone: light.clone().lerp(ink, 0.38),
            metal: dark,
            rubber: ink.clone().lerp(light, 0.07),
            chrome: ink.clone().lerp(light, 0.45),
            glass: blue.clone().lerp(light, 0.58),
            green: green.clone().lerp(muted, 0.4),
            soil: orange.clone().lerp(ink, 0.78),
            road: ink.clone().lerp(light, 0.4),
            car: blue.clone().lerp(muted, 0.6),
            lamp: light.clone().lerp(orange, 0.25),
            brake: token('--red'),
            dim: fg.clone(),
            ground: muted.clone().lerp(bg, 0.5)
        };
    }

    let palette = colors();

    function mat(name, opts = {}) {
        const m = new T.MeshStandardMaterial({ color: palette[name], roughness: 0.72, ...opts });
        themed.push([m, name]);
        return m;
    }

    [
        'plaster',
        'wallCap',
        'base',
        'tile',
        'grout',
        'wood',
        'woodDark',
        'linen',
        'fabric',
        'accent',
        'stone',
        'metal',
        'rubber',
        'chrome',
        'green',
        'soil',
        'road',
        'car',
        'lamp',
        'brake',
        'ground'
    ].forEach(
        (n) =>
            (materials[n] = mat(
                n,
                n === 'chrome'
                    ? { metalness: 0.85, roughness: 0.28 }
                    : n === 'car'
                    ? { metalness: 0.45, roughness: 0.23 }
                    : {}
            ))
    );

    materials.glass = mat('glass', {
        transparent: true,
        opacity: 0.38,
        roughness: 0.16,
        metalness: 0.15,
        depthWrite: false,
        side: T.DoubleSide
    });
    materials.carGlass = mat('glass', { roughness: 0.12, metalness: 0.65 });

    const wallcut = new T.Plane(new T.Vector3(0, -1, 0), 1.0);
    const clippingMats = [];

    function clipped(material) {
        if (material.userData.cutClone) return material.userData.cutClone;
        const c = material.clone();
        c.clippingPlanes = [wallcut];
        c.clipShadows = true;
        material.userData.cutClone = c;
        clippingMats.push(c);
        const item = themed.find((x) => x[0] === material);
        if (item) themed.push([c, item[1]]);
        return c;
    }

    function box(w, h, d, x, y, z, m = materials.plaster, p = scene) {
        const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        p.add(mesh);
        return mesh;
    }

    function cyl(rt, rb, h, x, y, z, m, p = furnishings, n = 24) {
        const mesh = new T.Mesh(new T.CylinderGeometry(rt, rb, h, n), m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        p.add(mesh);
        return mesh;
    }

    function ball(rx, ry, rz, x, y, z, m, p = furnishings) {
        const mesh = new T.Mesh(new T.SphereGeometry(1, 24, 16), m);
        mesh.scale.set(rx, ry, rz);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        p.add(mesh);
        return mesh;
    }

    function rounded(w, h, d, x, y, z, m, p = furnishings, r = 0.04) {
        r = Math.min(r, w / 4, h / 4, d / 4);
        const s = new T.Shape();
        const a = -w / 2;
        const b = -h / 2;
        s.moveTo(a + r, b);
        s.lineTo(a + w - r, b);
        s.quadraticCurveTo(a + w, b, a + w, b + r);
        s.lineTo(a + w, b + h - r);
        s.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
        s.lineTo(a + r, b + h);
        s.quadraticCurveTo(a, b + h, a, b + h - r);
        s.lineTo(a, b + r);
        s.quadraticCurveTo(a, b, a + r, b);
        const geo = new T.ExtrudeGeometry(s, {
            depth: d - 2 * r,
            bevelEnabled: true,
            bevelThickness: r,
            bevelSize: r * 0.5,
            bevelSegments: 2,
            steps: 1,
            curveSegments: 4
        });
        geo.translate(0, 0, -(d - 2 * r) / 2);
        const mesh = new T.Mesh(geo, m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        p.add(mesh);
        return mesh;
    }

    function rod(a, b, r, m, p = furnishings) {
        const start = new T.Vector3(...a);
        const end = new T.Vector3(...b);
        const v = end.clone().sub(start);
        const c = cyl(r, r, v.length(), 0, 0, 0, m, p, 12);
        c.position.copy(start.add(end).multiplyScalar(0.5));
        c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
        return c;
    }

    function torus(r, t, x, y, z, m, p = furnishings) {
        const ob = new T.Mesh(new T.TorusGeometry(r, t, 8, 32), m);
        ob.position.set(x, y, z);
        ob.castShadow = true;
        p.add(ob);
        return ob;
    }

    function line(points, m, p = scene) {
        const geom = new T.BufferGeometry().setFromPoints(points.map((v) => new T.Vector3(...v)));
        const l = new T.Line(geom, m);
        p.add(l);
        return l;
    }

    // El origen y todas las medidas siguen el mapeado: fondo z=0; calle z=13,50.
    const lot = box(4, 0.16, 13.5, 2, -0.17, 6.75, materials.ground);
    lot.name = 'lote-rectangular-4x13-50';
    box(4, 0.2, 8.55, 2, 0.1, 4.275, materials.base);
    box(4, 0.05, 4.95, 2, 0.025, 11.025, materials.base);
    // La vereda y la calle son elementos de contexto, fuera del lote z=0…13,50.
    box(4, 0.1, 1.0, 2, -0.055, 14.0, materials.stone);
    box(4, 0.05, 0.7, 2, -0.13, 14.85, materials.road);
    box(4, 0.12, 0.1, 2, -0.065, 14.5, materials.base);

    function tileFloor(x0, x1, z0, z1, y, step, material, parent = furnishings) {
        box(x1 - x0, 0.015, z1 - z0, (x0 + x1) / 2, y - 0.0075, (z0 + z1) / 2, material, parent);
        for (let x = x0 + step; x < x1 - 0.02; x += step)
            box(0.006, 0.003, z1 - z0, x, y + 0.002, (z0 + z1) / 2, materials.grout, parent);
        for (let z = z0 + step; z < z1 - 0.02; z += step)
            box(x1 - x0, 0.003, 0.006, (x0 + x1) / 2, y + 0.002, z, materials.grout, parent);
    }

    tileFloor(0.05, 3.95, 0.05, 8.5, 0.211, 0.6, materials.tile);
    tileFloor(0.06, 2.075, 0.055, 1.35, 0.225, 0.25, materials.stone);
    tileFloor(0.055, 3.945, 8.6, 13.45, 0.061, 0.5, materials.stone);
    box(2.9, 0.018, 2.84, 2.5, 0.222, 3.68, materials.wood, furnishings);
    for (let z = 2.29; z < 5.08; z += 0.17) {
        box(2.9, 0.002, 0.006, 2.5, 0.233, z, materials.woodDark, furnishings);
        for (let x = 1.5 + (Math.round(z * 10) % 2) * 0.4; x < 3.9; x += 0.95)
            box(0.005, 0.002, 0.165, x, 0.234, z + 0.08, materials.woodDark, furnishings);
    }

    const walls = [
        { id: 1, p1: [0, 0.05], p2: [4, 0.05], t: 0.1, y0: 0.2, ops: [] },
        { id: 2, p1: [0.05, 0], p2: [0.05, 8.55], t: 0.1, y0: 0.2, ops: [] },
        { id: 3, p1: [3.95, 0], p2: [3.95, 8.55], t: 0.1, y0: 0.2, ops: [] },
        {
            id: 4,
            p1: [0, 8.55],
            p2: [4, 8.55],
            t: 0.1,
            y0: 0.2,
            ops: [
                { s: 0.15, e: 1.15, sill: 0, top: 2.1, type: 'door' },
                { s: 2.05, e: 3.55, sill: 1.2, top: 2.1, type: 'window' }
            ]
        },
        { id: 5, p1: [0.05, 8.55], p2: [0.05, 13.5], t: 0.1, y0: 0.05, ops: [] },
        { id: 6, p1: [3.95, 8.55], p2: [3.95, 13.5], t: 0.1, y0: 0.05, ops: [] },
        {
            id: 7,
            p1: [0, 13.45],
            p2: [4, 13.45],
            t: 0.1,
            y0: 0.05,
            ops: [
                { s: 0.25, e: 1.25, sill: 0, top: 2.1, type: 'door' },
                { s: 1.35, e: 3.75, sill: 0, top: 2.1, type: 'gate_double' }
            ]
        },
        { id: 8, p1: [2.15, 0], p2: [2.15, 1.4], t: 0.15, y0: 0.2, ops: [] },
        {
            id: 9,
            p1: [0, 1.4],
            p2: [2.15, 1.4],
            t: 0.1,
            y0: 0.2,
            ops: [{ s: 0.1, e: 0.9, sill: 0, top: 2.1, type: 'door' }]
        },
        {
            id: 10,
            p1: [1, 2.2],
            p2: [4, 2.2],
            t: 0.1,
            y0: 0.2,
            ops: [{ s: 0.4, e: 2.6, sill: 1, top: 2, type: 'window' }]
        },
        { id: 11, p1: [1, 2.2], p2: [1, 5.15], t: 0.1, y0: 0.2, ops: [] },
        {
            id: 12,
            p1: [1, 5.15],
            p2: [4, 5.15],
            t: 0.1,
            y0: 0.2,
            ops: [{ s: 0.05, e: 0.85, sill: 0, top: 2.1, type: 'door' }]
        }
    ];

    const doors = [];

    function segment(w, s, e, lo, hi, parent, cap = false) {
        if (hi - lo < 0.005 || e - s < 0.005) return;
        const dx = w.p2[0] - w.p1[0];
        const dz = w.p2[1] - w.p1[1];
        const len = Math.hypot(dx, dz);
        const mid = (s + e) / 2;
        const ob = box(
            e - s,
            hi - lo,
            w.t,
            w.p1[0] + (dx / len) * mid,
            (lo + hi) / 2,
            w.p1[1] + (dz / len) * mid,
            cap ? materials.wallCap : materials.plaster,
            parent
        );
        ob.rotation.y = -Math.atan2(dz, dx);
        ob.userData.wallId = w.id;
    }

    function frame(w, o) {
        const dx = w.p2[0] - w.p1[0];
        const dz = w.p2[1] - w.p1[1];
        const len = Math.hypot(dx, dz);
        const angle = -Math.atan2(dz, dx);
        const g = group(fullTrim);
        g.position.set(
            w.p1[0] + (dx / len) * ((o.s + o.e) / 2),
            0,
            w.p1[1] + (dz / len) * ((o.s + o.e) / 2)
        );
        g.rotation.y = angle;
        const width = o.e - o.s;
        const height = o.top - o.sill;
        const cy = w.y0 + (o.sill + o.top) / 2;
        const fm = w.id === 7 ? materials.metal : materials.chrome;
        box(0.038, height, 0.09, -width / 2 + 0.02, cy, 0, fm, g);
        box(0.038, height, 0.09, width / 2 - 0.02, cy, 0, fm, g);
        box(width, 0.035, 0.09, 0, w.y0 + o.top - 0.02, 0, fm, g);

        if (o.type === 'window') {
            g.name = 'ventana-muro-' + w.id;
            g.userData = { wallId: w.id, width, height, sillY: w.y0 + o.sill, topY: w.y0 + o.top };
            box(width, 0.035, 0.09, 0, w.y0 + o.sill + 0.02, 0, fm, g);
            box(width - 0.07, height - 0.07, 0.015, 0, cy, 0.003, materials.glass, g);
            box(0.027, height - 0.05, 0.07, 0, cy, 0.016, fm, g);
            box(width + 0.08, 0.035, 0.18, 0, w.y0 + o.sill - 0.025, 0.01, materials.stone, g);
            box(0.018, 0.14, 0.03, 0.08, cy, 0.068, materials.metal, g);
        } else {
            const dg = group(doorGroup);
            dg.position.copy(g.position);
            dg.rotation.y = angle;
            const gate = w.id === 7;

            function leaf(x, width, sign, isGate) {
                const hinge = group(dg);
                hinge.position.set(x, w.y0, 0);
                const material = clipped(isGate ? materials.metal : materials.woodDark);
                const timber = clipped(materials.wood);
                const cx = (sign * width) / 2;
                if (isGate) {
                    box(width, 2.04, 0.065, cx, 1.045, 0, material, hinge);
                    for (let y = 0.15; y < 2.02; y += 0.15)
                        box(width - 0.06, 0.112, 0.077, cx, y, 0, timber, hinge);
                } else {
                    box(width, 2.045, 0.04, cx, 1.045, 0, timber, hinge);
                    for (let a = 0.13; a < width - 0.08; a += 0.14)
                        box(0.01, 1.85, 0.047, sign * a, 1.04, 0, material, hinge);
                }
                const handle = clipped(materials.chrome);
                box(0.1, 0.024, 0.075, sign * (width - 0.13), 1.0, 0.04, handle, hinge);
                box(0.1, 0.024, 0.075, sign * (width - 0.13), 1.0, -0.04, handle, hinge);
                const open = (o.type === 'gate_double' ? -sign : sign) * Math.PI * 0.5;
                hinge.name = (w.id === 7 ? 'puerta-calle-' : 'puerta-interior-') + w.id + '-' + sign;
                hinge.userData = { wallId: w.id, width, sign, openAngle: open, type: o.type };
                doors.push({ hinge, open });
            }

            if (o.type === 'gate_double') {
                leaf(-width / 2 + 0.025, width / 2 - 0.035, 1, true);
                leaf(width / 2 - 0.025, width / 2 - 0.035, -1, true);
            } else {
                leaf(-width / 2 + 0.025, width - 0.05, 1, gate);
            }
        }
    }

    walls.forEach((w) => {
        const len = Math.hypot(w.p2[0] - w.p1[0], w.p2[1] - w.p1[1]);
        let cursor = 0;
        function solid(a, b, y0, y1) {
            segment(w, a, b, y0, y1, fullWalls);
            const high = Math.min(1, y1);
            if (y0 < high) {
                segment(w, a, b, y0, high, lowWalls);
                if (y1 >= 1) segment(w, a, b, 0.987, 1.004, lowWalls, true);
            }
        }
        w.ops.forEach((o) => {
            solid(cursor, o.s, w.y0, 2.8);
            if (o.sill > 0) solid(o.s, o.e, w.y0, w.y0 + o.sill);
            solid(o.s, o.e, w.y0 + o.top, 2.8);
            frame(w, o);
            cursor = o.e;
        });
        solid(cursor, len, w.y0, 2.8);

        const intervals = [];
        cursor = 0;
        w.ops
            .filter((o) => o.sill === 0)
            .forEach((o) => {
                intervals.push([cursor, o.s]);
                cursor = o.e;
            });
        intervals.push([cursor, len]);
        intervals.forEach(([a, b]) => {
            if (b > a) {
                const ww = { ...w, t: w.id <= 7 ? w.t : w.t + 0.018 };
                segment(ww, a, b, w.y0, w.y0 + 0.085, lowTrim, true);
                segment(ww, a, b, w.y0, w.y0 + 0.085, fullTrim, true);
            }
        });
    });

    box(4, 0.15, 8.6, 2, 2.875, 4.3, materials.plaster, roof);
    box(4, 0.04, 8.6, 2, 2.97, 4.3, materials.stone, roof);
    box(4, 0.4, 0.1, 2, 3.15, 0.05, materials.plaster, roof);
    box(4, 0.4, 0.1, 2, 3.15, 8.55, materials.plaster, roof);
    box(0.1, 0.4, 8.6, 0.05, 3.15, 4.3, materials.plaster, roof);
    box(0.1, 0.4, 8.6, 3.95, 3.15, 4.3, materials.plaster, roof);

    // Cama, textiles, costuras, veladores y closet.
    box(2.1, 0.22, 1.5, 2.2, 0.38, 3.5, materials.woodDark, furnishings);
    [
        [1.3, 2.9],
        [3.1, 2.9],
        [1.3, 4.1],
        [3.1, 4.1]
    ].forEach(([x, z]) => cyl(0.035, 0.028, 0.14, x, 0.29, z, materials.metal));
    rounded(2.07, 0.23, 1.48, 2.2, 0.595, 3.5, materials.linen);
    rounded(0.1, 1.02, 1.64, 1.16, 0.76, 3.5, materials.fabric);
    rounded(0.53, 0.15, 0.6, 1.54, 0.775, 3.13, materials.linen);
    rounded(0.53, 0.15, 0.6, 1.54, 0.775, 3.86, materials.linen);
    rounded(1.38, 0.04, 1.5, 2.55, 0.739, 3.5, materials.fabric);
    box(0.43, 0.025, 1.51, 2.96, 0.773, 3.5, materials.accent, furnishings);
    for (let z = 2.79; z < 4.25; z += 0.055)
        box(0.4, 0.003, 0.006, 2.96, 0.787, z, materials.fabric, furnishings);
    [2.65, 4.35].forEach((z) => {
        box(0.35, 0.38, 0.4, 1.25, 0.41, z, materials.wood, furnishings);
        box(0.37, 0.035, 0.42, 1.25, 0.62, z, materials.stone, furnishings);
        box(0.018, 0.015, 0.1, 1.437, 0.48, z, materials.chrome, furnishings);
        cyl(0.065, 0.065, 0.024, 1.25, 0.654, z, materials.metal);
        cyl(0.014, 0.014, 0.2, 1.25, 0.76, z, materials.chrome);
        cyl(0.065, 0.115, 0.16, 1.25, 0.91, z, materials.linen);
    });

    const closet = group(furnishings);
    closet.name = 'closet';
    box(1.85, 2, 0.5, 2.95, 1.2, 4.85, materials.wood, closet).name = 'closet-cuerpo';
    const closetDoorWidth = (1.85 - 2 * 0.035 - 2 * 0.015) / 3;
    for (let i = 0; i < 3; i++) {
        const left = 2.025 + 0.035 + i * (closetDoorWidth + 0.015);
        box(
            closetDoorWidth,
            1.89,
            0.02,
            left + closetDoorWidth / 2,
            1.225,
            4.588,
            materials.linen,
            closet
        ).name = 'closet-puerta-' + (i + 1);
        box(0.025, 0.25, 0.025, left + closetDoorWidth - 0.07, 1.25, 4.555, materials.metal, closet);
    }

    // Televisor pequeño en el lateral derecho: pantalla orientada a −x, frente a los pies de la cama.
    const television = group(furnishings);
    television.name = 'televisor-frente-cama';
    box(0.025, 0.15, 0.16, 3.895, 1.48, 3.5, materials.metal, television).name = 'tv-soporte';
    rounded(0.045, 0.355, 0.62, 3.865, 1.48, 3.5, materials.metal, television, 0.01).name = 'tv-marco';
    box(0.007, 0.312, 0.566, 3.835, 1.48, 3.5, materials.carGlass, television).name = 'tv-pantalla';
    box(0.008, 0.006, 0.018, 3.832, 1.315, 3.27, materials.green, television).name = 'tv-indicador';
    television.userData = {
        screenNormal: [-1, 0, 0],
        bedHeadX: 1.16,
        bedFootX: 3.25,
        screenCenter: [3.835, 1.48, 3.5]
    };

    // Sofá lateral con dos cojines, tapizado y patas.
    [5.16, 6.64].forEach((z) =>
        [0.17, 0.62].forEach((x) => cyl(0.025, 0.02, 0.12, x, 0.27, z, materials.woodDark))
    );
    rounded(0.6, 0.28, 1.8, 0.4, 0.45, 5.9, materials.fabric);
    rounded(0.12, 0.56, 1.8, 0.16, 0.7, 5.9, materials.fabric);
    rounded(0.6, 0.34, 0.12, 0.4, 0.62, 5.04, materials.fabric);
    rounded(0.6, 0.34, 0.12, 0.4, 0.62, 6.76, materials.fabric);
    [5.48, 6.3].forEach((z) => {
        rounded(0.46, 0.12, 0.74, 0.45, 0.65, z, materials.linen);
        const p = rounded(0.18, 0.34, 0.4, 0.28, 0.89, z, materials.accent);
        p.rotation.z = -0.12;
    });

    // Comedor: cuatro sillas con respaldo, travesaños y patas.
    box(1, 0.065, 0.8, 1.9, 0.93, 7, materials.wood, furnishings);
    [1.53, 2.27].forEach((x) =>
        [6.73, 7.27].forEach((z) => box(0.045, 0.66, 0.045, x, 0.555, z, materials.woodDark, furnishings))
    );
    function chair(x, z, angle) {
        const g = group(furnishings);
        g.position.set(x, 0.2, z);
        g.rotation.y = angle;
        rounded(0.4, 0.075, 0.4, 0, 0.45, 0, materials.fabric, g);
        [-0.145, 0.145].forEach((a) =>
            [-0.145, 0.145].forEach((b) => box(0.028, 0.43, 0.028, a, 0.215, b, materials.woodDark, g))
        );
        box(0.025, 0.48, 0.025, -0.16, 0.66, -0.17, materials.wood, g);
        box(0.025, 0.48, 0.025, 0.16, 0.66, -0.17, materials.wood, g);
        rounded(0.38, 0.27, 0.045, 0, 0.77, -0.18, materials.wood, g);
    }
    chair(1.9, 6.3, 0);
    chair(1.9, 7.7, Math.PI);
    chair(1.2, 7, Math.PI / 2);
    chair(2.6, 7, -Math.PI / 2);
    cyl(0.13, 0.13, 0.018, 1.9, 0.981, 7, materials.linen);
    cyl(0.1, 0.035, 0.12, 1.9, 1.047, 7, materials.stone);
    for (let i = 0; i < 3; i++) ball(0.036, 0.035, 0.036, 1.85 + i * 0.047, 1.115, 7, materials.lamp);

    // Cocina; refrigeradora x=1,65 (−0,30 m).
    box(1.5, 0.8, 0.6, 2.75, 0.62, 8.2, materials.wood, furnishings);
    box(1.54, 0.055, 0.64, 2.75, 1.105, 8.2, materials.stone, furnishings);
    [2.025, 2.525, 3.025].forEach((x) => {
        box(0.47, 0.66, 0.025, x + 0.225, 0.68, 7.887, materials.linen, furnishings);
        box(0.16, 0.022, 0.027, x + 0.225, 0.96, 7.865, materials.chrome, furnishings);
    });
    box(0.58, 0.026, 0.46, 2.49, 1.147, 8.2, materials.metal, furnishings);
    [2.34, 2.65].forEach((x) =>
        [8.07, 8.32].forEach((z) => {
            const ring = torus(0.072, 0.008, x, 1.166, z, materials.chrome);
            ring.rotation.x = Math.PI / 2;
            cyl(0.044, 0.044, 0.009, x, 1.163, z, materials.metal);
            box(0.17, 0.014, 0.015, x, 1.18, z, materials.chrome, furnishings);
            box(0.015, 0.014, 0.17, x, 1.18, z, materials.chrome, furnishings);
        })
    );
    box(0.42, 0.32, 0.028, 2.45, 0.67, 7.856, materials.metal, furnishings);
    box(0.34, 0.23, 0.01, 2.45, 0.67, 7.836, materials.carGlass, furnishings);
    box(0.3, 0.026, 0.04, 2.45, 0.88, 7.82, materials.chrome, furnishings);
    box(0.4, 0.81, 1, 3.7, 0.645, 7.1, materials.wood, furnishings);
    box(0.46, 0.045, 1.04, 3.7, 1.078, 7.1, materials.stone, furnishings);
    box(0.32, 0.028, 0.46, 3.7, 1.113, 7.18, materials.chrome, furnishings);
    box(0.245, 0.02, 0.33, 3.7, 1.13, 7.18, materials.metal, furnishings);
    box(0.19, 0.007, 0.27, 3.7, 1.141, 7.18, materials.glass, furnishings);
    for (let z = 6.68; z < 6.95; z += 0.045)
        box(0.29, 0.009, 0.01, 3.7, 1.11, z, materials.chrome, furnishings);

    function tap(x, y, z, p = furnishings) {
        rod([x, y, z], [x, y + 0.24, z], 0.015, materials.chrome, p);
        rod([x, y + 0.24, z], [x - 0.11, y + 0.24, z], 0.015, materials.chrome, p);
        rod([x - 0.11, y + 0.24, z], [x - 0.11, y + 0.2, z], 0.015, materials.chrome, p);
    }
    tap(3.85, 1.11, 7.2);
    rounded(0.6, 1.7, 0.6, 1.65, 1.05, 8.2, materials.chrome);
    box(0.57, 0.45, 0.027, 1.65, 1.65, 7.88, materials.linen, furnishings);
    box(0.57, 1.14, 0.027, 1.65, 0.8, 7.88, materials.linen, furnishings);
    box(0.025, 0.25, 0.035, 1.9, 1.68, 7.848, materials.metal, furnishings);
    box(0.025, 0.36, 0.035, 1.9, 1.17, 7.848, materials.metal, furnishings);
    box(0.3, 0.025, 0.25, 3.13, 1.148, 8.17, materials.wood, furnishings);
    cyl(0.045, 0.038, 0.17, 3.36, 1.225, 8.29, materials.chrome);
    ball(0.07, 0.055, 0.07, 3.15, 1.2, 8.16, materials.green);

    // Baño: lavamanos, inodoro, ducha y accesorios.
    box(0.45, 0.39, 0.5, 0.45, 0.48, 0.36, materials.wood, furnishings);
    rounded(0.47, 0.07, 0.55, 0.45, 0.725, 0.35, materials.linen);
    ball(0.16, 0.027, 0.18, 0.45, 0.766, 0.35, materials.chrome);
    ball(0.13, 0.025, 0.15, 0.45, 0.777, 0.35, materials.glass);
    tap(0.62, 0.77, 0.19);
    box(0.43, 0.58, 0.032, 0.45, 1.35, 0.071, materials.chrome, furnishings);
    box(0.39, 0.54, 0.018, 0.45, 1.35, 0.094, materials.glass, furnishings);
    rounded(0.38, 0.37, 0.17, 1.2, 0.61, 0.16, materials.linen);
    ball(0.205, 0.12, 0.25, 1.2, 0.53, 0.39, materials.linen);
    ball(0.135, 0.016, 0.176, 1.2, 0.64, 0.43, materials.metal);
    const seat = torus(0.14, 0.026, 1.2, 0.657, 0.42, materials.linen);
    seat.rotation.x = Math.PI / 2;
    seat.scale.y = 1.28;
    cyl(0.11, 0.14, 0.25, 1.2, 0.355, 0.34, materials.linen);
    box(0.09, 0.015, 0.025, 1.2, 0.801, 0.16, materials.chrome, furnishings);
    box(0.8, 0.05, 0.8, 1.7, 0.25, 1, materials.linen, furnishings);
    box(0.045, 0.015, 0.045, 1.85, 0.283, 1.1, materials.chrome, furnishings);
    const showerGlass = clipped(materials.glass);
    const showerChrome = clipped(materials.chrome);
    box(0.015, 1.9, 0.73, 1.285, 1.19, 0.995, showerGlass, furnishings);
    rod([1.285, 0.27, 0.63], [1.285, 2.15, 0.63], 0.012, showerChrome);
    rod([2.055, 0.5, 0.83], [2.055, 2.17, 0.83], 0.013, showerChrome);
    rod([2.055, 2.17, 0.83], [1.89, 2.17, 0.83], 0.012, showerChrome);
    cyl(0.09, 0.09, 0.02, 1.88, 2.16, 0.83, showerChrome);
    box(0.035, 0.08, 0.14, 2.058, 1.05, 0.83, showerChrome, furnishings);
    box(0.17, 0.16, 0.06, 2.05, 0.88, 1.12, showerChrome, furnishings);

    // Lavandería abierta: mesón, poza y lavadora bajo encimera.
    box(1.6, 0.075, 0.6, 3.2, 1.063, 0.45, materials.stone, furnishings);
    box(0.065, 0.82, 0.57, 2.43, 0.64, 0.45, materials.plaster, furnishings);
    box(0.065, 0.82, 0.57, 3.97, 0.64, 0.45, materials.plaster, furnishings);
    box(0.6, 0.8, 0.57, 2.8, 0.62, 0.45, materials.linen, furnishings);
    torus(0.19, 0.025, 2.8, 0.59, 0.744, materials.chrome);
    ball(0.155, 0.155, 0.028, 2.8, 0.59, 0.747, materials.carGlass);
    box(0.38, 0.07, 0.02, 2.8, 0.94, 0.744, materials.chrome, furnishings);
    cyl(0.027, 0.027, 0.02, 2.97, 0.94, 0.764, materials.metal).rotation.x = Math.PI / 2;
    box(0.55, 0.025, 0.42, 3.51, 1.111, 0.44, materials.chrome, furnishings);
    box(0.43, 0.02, 0.32, 3.51, 1.128, 0.44, materials.metal, furnishings);
    tap(3.72, 1.12, 0.25);
    for (let i = 0; i < 3; i++)
        box(
            0.32,
            0.04,
            0.22,
            2.88,
            1.14 + i * 0.045,
            0.4,
            i % 2 ? materials.fabric : materials.linen,
            furnishings
        );
    cyl(0.07, 0.05, 0.22, 2.52, 1.215, 0.3, materials.accent);
    cyl(0.025, 0.025, 0.045, 2.52, 1.347, 0.3, materials.linen);

    // Vehículo a escala (1,70 × 4,20 m), con ruedas, cristales y luces.
    const car = group(furnishings);
    car.name = 'auto-alineado-porton';
    car.position.set((1.35 + 3.75) / 2, 0.05, 11);
    car.userData = { gateMinX: 1.35, gateMaxX: 3.75 };
    rounded(1.65, 0.38, 4.16, 0, 0.48, 0, materials.car, car, 0.13);
    rounded(1.7, 0.17, 4.2, 0, 0.31, 0, materials.metal, car, 0.08);
    rounded(1.59, 0.18, 1.03, 0, 0.72, 1.46, materials.car, car, 0.05);
    rounded(1.56, 0.17, 0.83, 0, 0.73, -1.55, materials.car, car, 0.05);

    const vs = new Float32Array([
        -0.74, 0.68, -1.18, 0.74, 0.68, -1.18, 0.74, 0.68, 1.1, -0.74, 0.68, 1.1, -0.61, 1.23,
        -0.72, 0.61, 1.23, -0.72, 0.61, 1.23, 0.54, -0.61, 1.23, 0.54
    ]);
    const cabGeo = new T.BufferGeometry();
    cabGeo.setAttribute('position', new T.BufferAttribute(vs, 3));
    cabGeo.setIndex([
        0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0, 4, 7, 6, 4, 6, 5
    ]);
    cabGeo.computeVertexNormals();
    const cab = new T.Mesh(cabGeo, materials.carGlass);
    car.add(cab);
    cab.castShadow = true;

    rounded(1.26, 0.045, 1.29, 0, 1.245, -0.09, materials.car, car, 0.04);
    [
        [-0.74, 0.68, -1.18],
        [0.74, 0.68, -1.18],
        [0.74, 0.68, 1.1],
        [-0.74, 0.68, 1.1]
    ].forEach((a, i) => {
        const b = [
            [-0.61, 1.23, -0.72],
            [0.61, 1.23, -0.72],
            [0.61, 1.23, 0.54],
            [-0.61, 1.23, 0.54]
        ][i];
        rod(a, b, 0.027, materials.car, car);
    });
    [-1, 1].forEach((s) => {
        rod([s * 0.74, 0.69, -0.2], [s * 0.62, 1.24, -0.2], 0.04, materials.metal, car);
        box(0.04, 0.02, 1.9, s * 0.788, 0.73, -0.02, materials.chrome, car);
        [-0.65, 0.62].forEach((z) => box(0.025, 0.025, 0.15, s * 0.829, 0.62, z, materials.chrome, car));
        rounded(0.15, 0.1, 0.22, s * 0.82, 0.82, 0.74, materials.car, car, 0.04);
        [-1.36, 1.36].forEach((z) => {
            const tire = cyl(0.31, 0.31, 0.18, s * 0.78, 0.32, z, materials.rubber, car, 32);
            tire.rotation.z = Math.PI / 2;
            const rim = cyl(0.205, 0.205, 0.188, s * 0.79, 0.32, z, materials.chrome, car, 24);
            rim.rotation.z = Math.PI / 2;
            const hub = cyl(0.055, 0.055, 0.194, s * 0.8, 0.32, z, materials.metal, car);
            hub.rotation.z = Math.PI / 2;
            for (let i = 0; i < 5; i++) {
                const a = (i * Math.PI * 2) / 5;
                rod(
                    [s * 0.899, 0.32, z],
                    [s * 0.899, 0.32 + Math.cos(a) * 0.18, z + Math.sin(a) * 0.18],
                    0.018,
                    materials.metal,
                    car
                );
            }
        });
        rounded(0.45, 0.1, 0.035, s * 0.52, 0.58, 2.085, materials.lamp, car, 0.025);
        rounded(0.47, 0.09, 0.035, s * 0.51, 0.58, -2.085, materials.brake, car, 0.02);
    });
    box(0.63, 0.14, 0.026, 0, 0.4, 2.11, materials.metal, car);
    box(0.28, 0.1, 0.03, 0, 0.35, -2.11, materials.linen, car);
    box(0.28, 0.1, 0.03, 0, 0.34, 2.13, materials.linen, car);
    for (let x = -0.28; x < 0.3; x += 0.07)
        box(0.016, 0.1, 0.031, x, 0.4, 2.132, materials.chrome, car);

    // Umbral frontal y luminarias.
    box(1.02, 0.1, 0.28, 0.65, 0.1, 8.71, materials.stone, furnishings);
    [1.5, 3.85].forEach((x) => {
        box(0.12, 0.22, 0.08, x, 2.1, 8.63, clipped(materials.metal), furnishings);
        box(0.08, 0.12, 0.015, x, 2.1, 8.68, clipped(materials.lamp), furnishings);
    });

    // Etiquetas proyectadas y cotas exactas del lote.
    const labels = [];
    function label(text, pos, type = 'room') {
        const el = document.createElement('span');
        el.className = 'text-small';
        el.textContent = text;
        root.querySelector('#cl-labels').appendChild(el);
        labels.push({ el, pos: new T.Vector3(...pos), type });
    }
    label('Baño', [1.1, 0.32, 0.88]);
    label('Lavandería', [3.1, 0.3, 1.28]);
    label('Dormitorio', [2.65, 0.25, 2.5]);
    label('Sala · comedor · cocina', [2, 0.25, 5.72]);
    label('Garaje descubierto', [2, 0.1, 12.96]);

    const dimMaterial = new T.LineBasicMaterial({ color: palette.dim });
    function dimLine(a, b, text, pos) {
        line([a, b], dimMaterial, dims);
        [a, b].forEach((p) => {
            const dx = b[0] - a[0];
            const dz = b[2] - a[2];
            line(
                [
                    [p[0] - (dz ? 0.1 : 0), p[1], p[2] - (dx ? 0.1 : 0)],
                    [p[0] + (dz ? 0.1 : 0), p[1], p[2] + (dx ? 0.1 : 0)]
                ],
                dimMaterial,
                dims
            );
        });
        label(text, pos, 'dim');
    }
    dimLine([-0.46, 0.24, 0], [-0.46, 0.24, 13.5], '13,50 m', [-0.74, 0.3, 6.75]);
    dimLine([0, 0.24, -0.52], [4, 0.24, -0.52], '4,00 m', [2, 0.3, -0.65]);
    dimLine([0, 0.1, 14.98], [4, 0.1, 14.98], '4,00 m', [2, 0.14, 15.2]);
    dimLine([4.4, 0.25, 0], [4.4, 0.25, 8.55], '8,55 m', [4.7, 0.3, 4.28]);
    dimLine([4.4, 0.12, 8.55], [4.4, 0.12, 13.5], '4,95 m', [4.7, 0.2, 11.03]);

    // Luz suave para leer espacios y volúmenes en todos los ángulos.
    const hemi = new T.HemisphereLight(palette.linen, palette.stone, 1.05);
    scene.add(hemi);
    const sun = new T.DirectionalLight(palette.linen, 1.5);
    sun.position.set(-5, 15, 11);
    sun.target.position.set(2, 0, 6);
    scene.add(sun, sun.target);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -11;
    sun.shadow.camera.right = 11;
    sun.shadow.camera.top = 11;
    sun.shadow.camera.bottom = -11;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.035;
    const fill = new T.DirectionalLight(palette.linen, 0.45);
    fill.position.set(10, 8, -5);
    scene.add(fill);

    function createControls() {
        if (controls) controls.dispose();
        controls = new T.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 2;
        controls.maxDistance = 38;
        controls.minZoom = 0.55;
        controls.maxZoom = 6;
        controls.maxPolarAngle = Math.PI * 0.49;
        controls.enablePan = true;
        controls.autoRotateSpeed = 0.8;
        controls.target.set(2, 0.1, 6.3);
        controls.addEventListener('start', () => {
            transition = null;
        });
        controls.update();
    }

    let transition = null;
    createControls();

    const views = {
        maqueta: {
            pos: [-7, 19, 21],
            target: [2, 0.8, 6.75],
            text: '3D sin perspectiva · lados paralelos y ancho constante de 4,00 m.'
        },
        planta: {
            pos: [2, 24, 6.75],
            target: [2, 0, 6.75],
            text: 'Planta rectangular · 4,00 m tanto al frente como al fondo · profundidad 13,50 m.'
        },
        fachada: {
            pos: [-2, 5.8, 24],
            target: [2, 1.25, 11],
            text: 'Carro centrado con el portón doble · ventana de la cocina hacia el garaje.'
        },
        dormitorio: {
            pos: [-1, 7.4, -1],
            target: [2.4, 0.5, 3.65],
            text: 'Dormitorio · televisor pequeño frente a los pies de la cama y clóset de tres puertas.'
        },
        social: {
            pos: [-2.4, 6.8, 11.4],
            target: [2, 0.4, 6.95],
            text: 'Área social · cocina con ventana hacia el garaje; refrigeradora separada de la cocineta.'
        },
        cocina: {
            pos: [2.8, 2.15, 6.35],
            target: [2.8, 1.7, 8.55],
            text: 'Ventana cocina → garaje · 1,50 × 0,90 m · sobre el mesón.'
        },
        servicios: {
            pos: [-1.5, 6.1, 5],
            target: [2, 0.4, 0.7],
            text: 'Baño y lavandería · puerta de baño de 0,80 m; lavandería abierta.'
        }
    };

    function syncArchitecture() {
        fullWalls.visible = !state.cut;
        lowWalls.visible = state.cut;
        fullTrim.visible = !state.cut;
        lowTrim.visible = state.cut;
        roof.visible = state.roof;
        wallcut.constant = state.cut ? 1 : 20;
        root.querySelector('#cl-cut').checked = state.cut;
        root.querySelector('#cl-roof').checked = state.roof;
    }

    function fitView() {
        const w = Math.max(1, stage.clientWidth);
        const h = Math.max(1, stage.clientHeight);
        camera.lookAt(controls.target);
        camera.updateMatrixWorld();
        const bounds = {
            maqueta: [
                [-0.65, 4.7],
                [0, 2.6],
                [-0.85, 15.3]
            ],
            planta: [
                [-0.85, 4.85],
                [0, 0],
                [-0.85, 15.45]
            ],
            fachada: [
                [-0.3, 4.3],
                [0, 3.35],
                [-0.2, 15.15]
            ],
            dormitorio: [
                [0.82, 4.12],
                [0.2, 2.8],
                [2.0, 5.3]
            ],
            social: [
                [-0.2, 4.2],
                [0.0, 2.8],
                [4.95, 8.8]
            ],
            cocina: [
                [1.8, 3.85],
                [0.9, 2.5],
                [7.85, 8.7]
            ],
            servicios: [
                [-0.2, 4.2],
                [0, 2.8],
                [-0.2, 2.2]
            ]
        }[state.view];
        const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const up = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        for (const x of bounds[0])
            for (const y of bounds[1])
                for (const z of bounds[2]) {
                    const delta = new T.Vector3(x, y, z).sub(controls.target);
                    const px = delta.dot(right);
                    const py = delta.dot(up);
                    minX = Math.min(minX, px);
                    maxX = Math.max(maxX, px);
                    minY = Math.min(minY, py);
                    maxY = Math.max(maxY, py);
                }
        const shift = right
            .multiplyScalar((minX + maxX) / 2)
            .add(up.multiplyScalar((minY + maxY) / 2));
        camera.position.add(shift);
        controls.target.add(shift);
        const aspect = w / h;
        const half = Math.max((maxY - minY) / 2, (maxX - minX) / 2 / aspect) * 1.06;
        ortho.left = -half * aspect;
        ortho.right = half * aspect;
        ortho.top = half;
        ortho.bottom = -half;
        ortho.updateProjectionMatrix();
        controls.update();
    }

    function resize() {
        const w = Math.max(1, stage.clientWidth);
        const h = Math.max(1, stage.clientHeight);
        renderer.setSize(w, h, false);
        fitView();
    }

    function syncQuickViewButtons(name) {
        root.querySelectorAll('[data-cl-view]').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-cl-view') === name);
        });
    }

    function setView(name) {
        state.view = name;
        const v = views[name];
        root.querySelector('#cl-vista').value = name;
        syncQuickViewButtons(name);
        state.rotating = false;
        root.querySelector('#cl-rotate').setAttribute('aria-pressed', 'false');
        root.querySelector('#cl-rotate').textContent = 'Girar';
        if (name === 'fachada') {
            state.roof = true;
            state.cut = false;
        } else if (name === 'cocina') {
            state.roof = false;
            state.cut = false;
        } else {
            state.roof = false;
            state.cut = true;
        }
        syncArchitecture();
        camera.up.set(0, name === 'planta' ? 0 : 1, name === 'planta' ? -1 : 0);
        createControls();
        controls.enableRotate = name !== 'planta';
        controls.maxPolarAngle = name === 'planta' ? Math.PI : Math.PI * 0.49;
        controls.autoRotate = false;
        ortho.zoom = 1;
        camera.position.set(...v.pos);
        controls.target.set(...v.target);
        controls.update();
        transition = null;
        resize();
        detail.textContent = v.text;
    }

    root.querySelector('#cl-vista').addEventListener('change', (e) => setView(e.target.value));
    root.querySelectorAll('[data-cl-view]').forEach((btn) => {
        btn.addEventListener('click', () => setView(btn.getAttribute('data-cl-view')));
    });

    root.querySelector('#cl-cut').addEventListener('change', (e) => {
        state.cut = e.target.checked;
        if (state.cut) state.roof = false;
        syncArchitecture();
        detail.textContent = state.cut
            ? 'Sección horizontal a 1,00 m · la altura completa de los muros llega a N+2,80 m.'
            : 'Muros completos · tope N+2,80 m y piso interior N+0,20 m (altura supuesta).';
    });

    root.querySelector('#cl-roof').addEventListener('change', (e) => {
        state.roof = e.target.checked;
        if (state.roof) state.cut = false;
        syncArchitecture();
        detail.textContent = state.roof
            ? 'Cubierta supuesta · losa de 0,15 m y parapeto de 0,40 m; garaje descubierto.'
            : 'Cubierta oculta para inspeccionar los ambientes.';
    });

    root.querySelector('#cl-doors').addEventListener('change', (e) => {
        state.doors = e.target.checked;
        detail.textContent = state.doors
            ? 'Portón doble abierto hacia afuera · todas las puertas de una hoja hacia adentro.'
            : 'Puertas y portón cerrados.';
    });

    root.querySelector('#cl-dims').addEventListener('change', (e) => {
        state.dims = e.target.checked;
        dims.visible = state.dims;
    });

    root.querySelector('#cl-rotate').addEventListener('click', () => {
        if (state.view === 'planta') setView('maqueta', true);
        state.rotating = !state.rotating;
        controls.autoRotate = state.rotating;
        root.querySelector('#cl-rotate').setAttribute('aria-pressed', String(state.rotating));
        root.querySelector('#cl-rotate').textContent = state.rotating ? 'Pausar giro' : 'Girar';
    });

    function zoom(factor) {
        transition = null;
        if (camera === ortho) {
            ortho.zoom = T.MathUtils.clamp(ortho.zoom / factor, 0.55, 6);
            ortho.updateProjectionMatrix();
        } else {
            const d = camera.position.clone().sub(controls.target);
            d.setLength(T.MathUtils.clamp(d.length() * factor, 2, 38));
            camera.position.copy(controls.target).add(d);
        }
        controls.update();
    }

    root.querySelector('#cl-in').addEventListener('click', () => zoom(0.8));
    root.querySelector('#cl-out').addEventListener('click', () => zoom(1.25));

    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const groundPlane = new T.Plane(new T.Vector3(0, 1, 0), -0.23);
    let down = null;

    renderer.domElement.addEventListener('pointerdown', (e) => {
        down = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('pointerup', (e) => {
        if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointer, camera);
        const p = new T.Vector3();
        if (!raycaster.ray.intersectPlane(groundPlane, p) || p.x < 0 || p.x > 4 || p.z < 0 || p.z > 13.5)
            return;
        if (p.z > 8.55)
            detail.textContent =
                'Garaje · carro alineado con el portón de 2,40 m · paso peatonal libre a la izquierda.';
        else if (p.z > 5.15) detail.textContent = views.social.text;
        else if (p.x < 1 && p.z > 1.4)
            detail.textContent = 'Pasillo lateral · ancho nominal 1,00 m · acceso al dormitorio y al baño.';
        else if (p.z > 2.2) detail.textContent = views.dormitorio.text;
        else if (p.x < 2.15 && p.z < 1.4)
            detail.textContent = 'Baño · 2,15 × 1,40 m nominales · ducha, inodoro y lavamanos.';
        else
            detail.textContent =
                'Lavandería y circulación posterior · mesón de 1,60 m, fregadero y lavadora propuesta.';
    });

    new ResizeObserver(resize).observe(stage);

    function updateTheme() {
        palette = colors();
        themed.forEach(([m, k]) => m.color.copy(palette[k]));
        dimMaterial.color.copy(palette.dim);
        hemi.color.copy(palette.linen);
        hemi.groundColor.copy(palette.stone);
        sun.color.copy(palette.linen);
        fill.color.copy(palette.linen);
    }

    new MutationObserver(updateTheme).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme']
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

    setView('planta', true);
    resize();
    if (loading) loading.remove();

    const project = new T.Vector3();
    let last = performance.now();

    function animate(now) {
        if (!root.isConnected) {
            renderer.dispose();
            controls.dispose();
            return;
        }
        requestAnimationFrame(animate);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        if (transition) {
            let a = Math.min(1, (now - transition.start) / 750);
            a = a * a * (3 - 2 * a);
            camera.position.lerpVectors(transition.from, transition.to, a);
            controls.target.lerpVectors(transition.targetFrom, transition.targetTo, a);
            if (a >= 1) transition = null;
        }

        const speed = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 1
            : Math.min(1, dt * 7);
        doors.forEach((d) => {
            d.hinge.rotation.y += ((state.doors ? d.open : 0) - d.hinge.rotation.y) * speed;
        });
        controls.update();

        labels.forEach((l) => {
            const show =
                l.type === 'dim'
                    ? state.dims
                    : state.dims &&
                      state.cut &&
                      !state.roof &&
                      (state.view === 'maqueta' || state.view === 'planta');
            if (!show) {
                l.el.hidden = true;
                return;
            }
            project.copy(l.pos).project(camera);
            const x = (project.x * 0.5 + 0.5) * stage.clientWidth;
            const y = (-project.y * 0.5 + 0.5) * stage.clientHeight;
            l.el.hidden =
                project.z > 1 ||
                project.z < -1 ||
                x < 35 ||
                x > stage.clientWidth - 35 ||
                y < 10 ||
                y > stage.clientHeight - 10;
            if (!l.el.hidden) {
                l.el.style.left = x + 'px';
                l.el.style.top = y + 'px';
            }
        });

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
    root.dataset.ready = 'true';
    window.setCasaLopezView = setView;
})();
