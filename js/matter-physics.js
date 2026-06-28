/**
 * ARDigital — Matter.js Zero-Gravity Physics v2
 * 
 * Proper zero-gravity simulation with:
 * - Soft-body collision response
 * - Mouse/touch repulsion via constraints
 * - Slight drift (simulating micro-gravity)
 * - Velocity damping to prevent chaos
 * - Canvas rendering with glow, connections, gradients
 */

const PhysicsEngine = (() => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1024;

    // ===== Configuration =====
    const ELEMENTS = isMobile ? [
        { label: 'AI-Саппорт', emoji: '🤖', color: '#00f0ff', colorRgb: '0,240,255' },
        { label: 'TG-Бот', emoji: '💬', color: '#b829ff', colorRgb: '184,41,255' },
        { label: 'Саммари', emoji: '📄', color: '#39ff14', colorRgb: '57,255,20' },
        { label: 'Voice AI', emoji: '🎙️', color: '#ff6b35', colorRgb: '255,107,53' },
    ] : [
        { label: 'AI-Саппорт', emoji: '🤖', color: '#00f0ff', colorRgb: '0,240,255' },
        { label: 'TG-Бот', emoji: '💬', color: '#b829ff', colorRgb: '184,41,255' },
        { label: 'Саммари', emoji: '📄', color: '#39ff14', colorRgb: '57,255,20' },
        { label: 'Voice AI', emoji: '🎙️', color: '#ff6b35', colorRgb: '255,107,53' },
        { label: 'Smart CRM', emoji: '📊', color: '#ffd700', colorRgb: '255,215,0' },
        { label: 'AI-Аналитика', emoji: '📈', color: '#ff1493', colorRgb: '255,20,147' },
        { label: 'Омниканал', emoji: '🌐', color: '#00d4ff', colorRgb: '0,212,255' },
    ];

    const RADIUS = isMobile ? 48 : 58;
    const MOUSE_RADIUS = isMobile ? 120 : 180;
    const MOUSE_STRENGTH = isMobile ? 0.04 : 0.08;
    const MAX_SPEED = isMobile ? 2.5 : 3.5;
    const DAMPING = 0.98;

    let engine, runner, canvas, ctx;
    let bodies = [];
    let mousePos = { x: -9999, y: -9999 };
    let animFrameId = null;
    let time = 0;
    let width, height;

    // ===== Init =====
    function init() {
        canvas = document.getElementById('matterCanvas');
        if (!canvas || typeof Matter === 'undefined') return;

        ctx = canvas.getContext('2d');
        sizeCanvas();

        // Create engine with zero gravity
        engine = Matter.Engine.create();
        engine.gravity.x = 0;
        engine.gravity.y = 0;
        engine.constraintIterations = isMobile ? 1 : 3;
        engine.positionIterations = isMobile ? 2 : 6;
        engine.velocityIterations = isMobile ? 1 : 4;

        // Spawn elements in a spread pattern
        spawnElements();

        // Create boundary walls (invisible, static)
        createBounds();

        // Apply micro-gravity drift in beforeUpdate
        Matter.Events.on(engine, 'beforeUpdate', beforeUpdate);

        // Start the simulation loop
        runner = Matter.Runner.create({
            delta: 1000 / 60,
            isFixed: true,
        });
        Matter.Runner.run(runner, engine);

        // Custom render loop for drawing
        render();

        // Track mouse / touch
        trackPointer();

        // Handle resize
        window.addEventListener('resize', debounce(onResize, 300));
    }

    // ===== Canvas sizing =====
    function sizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ===== Spawn elements =====
    function spawnElements() {
        const pad = RADIUS + 40;
        const count = ELEMENTS.length;
        const cols = isMobile ? 2 : Math.ceil(count / 2);
        const rows = Math.ceil(count / cols);
        const cellW = (width - pad * 2) / cols;
        const cellH = (height - pad * 2 - 80) / rows; // -80 for top nav

        ELEMENTS.forEach((el, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = pad + cellW * col + cellW / 2 + (Math.random() - 0.5) * cellW * 0.4;
            const y = pad + 80 + cellH * row + cellH / 2 + (Math.random() - 0.5) * cellH * 0.4;

            const body = Matter.Bodies.circle(
                Math.max(RADIUS, Math.min(x, width - RADIUS)),
                Math.max(RADIUS, Math.min(y, height - RADIUS)),
                RADIUS,
                {
                    restitution: 0.65,
                    friction: 0.05,
                    frictionAir: 0.015,
                    frictionStatic: 0.1,
                    density: 0.001,
                    render: { visible: false },
                    label: i.toString(),
                }
            );

            // Random initial velocity (gentle)
            Matter.Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 1.5,
                y: (Math.random() - 0.5) * 1.5,
            });

            Matter.Composite.add(engine.world, body);
            bodies.push(body);
        });
    }

    // ===== Boundary walls =====
    function createBounds() {
        const t = 200; // thickness
        const opts = {
            isStatic: true,
            render: { visible: false },
            restitution: 0.8,
            friction: 0,
        };

        Matter.Composite.add(engine.world, [
            // top
            Matter.Bodies.rectangle(width / 2, -t / 2, width + t * 2, t, opts),
            // bottom
            Matter.Bodies.rectangle(width / 2, height + t / 2, width + t * 2, t, opts),
            // left
            Matter.Bodies.rectangle(-t / 2, height / 2, t, height + t * 2, opts),
            // right
            Matter.Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, opts),
        ]);
    }

    // ===== Physics step (beforeUpdate) =====
    function beforeUpdate() {
        time += 0.005;

        bodies.forEach((body) => {
            const el = ELEMENTS[parseInt(body.label)];

            // --- Micro-gravity drift (gentle sine wave movement) ---
            const driftX = Math.sin(time * 2 + parseFloat(body.label) * 1.5) * 0.00004;
            const driftY = Math.cos(time * 1.7 + parseFloat(body.label) * 2.1) * 0.00003;
            Matter.Body.applyForce(body, body.position, { x: driftX, y: driftY });

            // --- Mouse repulsion ---
            const dx = body.position.x - mousePos.x;
            const dy = body.position.y - mousePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MOUSE_RADIUS && dist > 1) {
                const factor = MOUSE_STRENGTH * Math.pow(1 - dist / MOUSE_RADIUS, 2);
                Matter.Body.applyForce(body, body.position, {
                    x: (dx / dist) * factor,
                    y: (dy / dist) * factor,
                });
            }

            // --- Speed clamping ---
            const vx = body.velocity.x;
            const vy = body.velocity.y;
            const speed = Math.sqrt(vx * vx + vy * vy);

            if (speed > MAX_SPEED) {
                Matter.Body.setVelocity(body, {
                    x: (vx / speed) * MAX_SPEED,
                    y: (vy / speed) * MAX_SPEED,
                });
            }

            // --- Damping (applied as air friction tweak) ---
            Matter.Body.setVelocity(body, {
                x: vx * DAMPING,
                y: vy * DAMPING,
            });
        });

        // --- Inter-body soft repulsion to prevent stacking ---
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                const dx = b.position.x - a.position.x;
                const dy = b.position.y - a.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = RADIUS * 2.5;

                if (dist < minDist && dist > 1) {
                    const force = 0.0005 * (1 - dist / minDist);
                    const nx = dx / dist;
                    const ny = dy / dist;
                    Matter.Body.applyForce(a, a.position, { x: -nx * force, y: -ny * force });
                    Matter.Body.applyForce(b, b.position, { x: nx * force, y: ny * force });
                }
            }
        }
    }

    // ===== Pointer tracking =====
    function trackPointer() {
        window.addEventListener('mousemove', (e) => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        });
        window.addEventListener('mouseleave', () => {
            mousePos.x = -9999;
            mousePos.y = -9999;
        });
        window.addEventListener('touchmove', (e) => {
            if (e.touches[0]) {
                mousePos.x = e.touches[0].clientX;
                mousePos.y = e.touches[0].clientY;
            }
        }, { passive: true });
        window.addEventListener('touchend', () => {
            mousePos.x = -9999;
            mousePos.y = -9999;
        });
    }

    // ===== Custom Render =====
    function render() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw subtle connection lines
        drawConnections();

        // 2. Draw each floating element
        bodies.forEach((body) => {
            const idx = parseInt(body.label);
            const el = ELEMENTS[idx];
            const { x, y } = body.position;
            const r = RADIUS;

            // Outer glow
            ctx.save();
            const glowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.8);
            glowGrad.addColorStop(0, `rgba(${el.colorRgb}, 0.12)`);
            glowGrad.addColorStop(1, `rgba(${el.colorRgb}, 0)`);
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Glass circle fill
            ctx.save();
            const fillGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
            fillGrad.addColorStop(0, `rgba(${el.colorRgb}, 0.10)`);
            fillGrad.addColorStop(1, `rgba(${el.colorRgb}, 0.03)`);
            ctx.fillStyle = fillGrad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Border ring
            ctx.strokeStyle = `rgba(${el.colorRgb}, 0.25)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner highlight arc
            ctx.beginPath();
            ctx.arc(x, y, r - 4, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.strokeStyle = `rgba(${el.colorRgb}, 0.1)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // Emoji (centered)
            ctx.save();
            ctx.font = isMobile ? '20px serif' : '24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.emoji, x, y - 8);
            ctx.restore();

            // Label
            ctx.save();
            ctx.font = `600 ${isMobile ? '10px' : '12px'} Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `rgba(${el.colorRgb}, 0.85)`;
            ctx.fillText(el.label, x, y + 16);
            ctx.restore();
        });

        // 3. Draw small ambient particles
        drawParticles();

        animFrameId = requestAnimationFrame(render);
    }

    // ===== Connection lines =====
    function drawConnections() {
        const maxDist = isMobile ? 180 : 280;
        ctx.save();
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                const dx = a.position.x - b.position.x;
                const dy = a.position.y - b.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    const alpha = Math.pow(1 - dist / maxDist, 2) * 0.15;
                    const grad = ctx.createLinearGradient(
                        a.position.x, a.position.y,
                        b.position.x, b.position.y
                    );
                    const ai = ELEMENTS[parseInt(a.label)].colorRgb;
                    const bi = ELEMENTS[parseInt(b.label)].colorRgb;
                    grad.addColorStop(0, `rgba(${ai}, ${alpha})`);
                    grad.addColorStop(1, `rgba(${bi}, ${alpha})`);
                    ctx.beginPath();
                    ctx.moveTo(a.position.x, a.position.y);
                    ctx.lineTo(b.position.x, b.position.y);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }

    // ===== Ambient particles =====
    const particles = [];
    function initParticles() {
        for (let i = 0; i < (isMobile ? 30 : 60); i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.5 + 0.3,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.4 + 0.1,
            });
        }
    }
    initParticles();

    function drawParticles() {
        ctx.save();
        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.fill();
        });
        ctx.restore();
    }

    // ===== Resize handler =====
    function onResize() {
        const oldW = width;
        const oldH = height;
        sizeCanvas();

        // Remove old bounds
        const all = Matter.Composite.allBodies(engine.world);
        const statics = all.filter(b => b.isStatic);
        Matter.Composite.remove(engine.world, statics);
        createBounds();

        // Re-clamp body positions
        bodies.forEach(b => {
            const nx = Math.max(RADIUS, Math.min(b.position.x, width - RADIUS));
            const ny = Math.max(RADIUS, Math.min(b.position.y, height - RADIUS));
            Matter.Body.setPosition(b, { x: nx, y: ny });
        });

        // Re-init particles
        particles.length = 0;
        initParticles();
    }

    // ===== Destroy =====
    function destroy() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (runner) Matter.Runner.stop(runner);
        if (engine) Matter.Engine.clear(engine);
        bodies = [];
    }

    // ===== Utility =====
    function debounce(fn, ms) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    }

    return { init, destroy };
})();
