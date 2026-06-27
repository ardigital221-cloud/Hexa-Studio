/**
 * ARDigital — Matter.js Zero-Gravity Physics
 * Floating elements with mouse repulsion, wall bouncing, and inter-element collision
 */

const PhysicsEngine = (() => {
    // Config
    const isMobile = window.innerWidth < 768;
    
    const CONFIG = {
        elements: isMobile ? [
            { label: 'AI-Саппорт', emoji: '🤖', color: '#00f0ff' },
            { label: 'TG-Бот', emoji: '💬', color: '#b829ff' },
            { label: 'Саммари', emoji: '📄', color: '#39ff14' },
            { label: 'Voice AI', emoji: '🎙️', color: '#ff6b35' },
        ] : [
            { label: 'AI-Саппорт', emoji: '🤖', color: '#00f0ff' },
            { label: 'TG-Бот', emoji: '💬', color: '#b829ff' },
            { label: 'Саммари', emoji: '📄', color: '#39ff14' },
            { label: 'Voice AI', emoji: '🎙️', color: '#ff6b35' },
            { label: 'Smart CRM', emoji: '📊', color: '#ffd700' },
            { label: 'AI-Аналитика', emoji: '📈', color: '#ff1493' },
            { label: 'Омниканал', emoji: '🌐', color: '#00f0ff' },
        ],
        circleRadius: isMobile ? 45 : 55,
        mouseRepulsionRadius: isMobile ? 100 : 150,
        mouseRepulsionStrength: isMobile ? 0.0003 : 0.0006,
        wallBounce: 0.7,
        frictionAir: 0.02,
        friction: 0.1,
        restitution: 0.6,
        density: 0.002,
        labelFont: isMobile ? '10px Inter' : '12px Inter',
        emojiFont: isMobile ? '18px serif' : '22px serif',
        glowIntensity: isMobile ? 0.15 : 0.25,
        // Performance tuning for mobile
        velocityIterations: isMobile ? 1 : 4,
        positionIterations: isMobile ? 1 : 6,
    };

    let engine, runner, canvas, ctx, bodies = [], mousePos = { x: -1000, y: -1000 };
    let animFrameId = null;

    function init() {
        canvas = document.getElementById('matterCanvas');
        if (!canvas || typeof Matter === 'undefined') return;

        ctx = canvas.getContext('2d');
        resizeCanvas();

        // Create engine
        engine = Matter.Engine.create({
            gravity: { x: 0, y: 0, scale: 0 }, // Zero gravity
        });

        // Adjust solver for mobile performance
        engine.positionIterations = CONFIG.positionIterations;
        engine.velocityIterations = CONFIG.velocityIterations;

        // Create floating elements
        createFloatingElements();

        // Create invisible walls
        createWalls();

        // Start runner
        runner = Matter.Runner.create({ delta: 1000 / 60 });
        Matter.Runner.run(runner, engine);

        // Mouse tracking
        setupMouseTracking();

        // Start custom render loop
        render();

        // Resize handler
        window.addEventListener('resize', debounce(handleResize, 250));
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createFloatingElements() {
        const { width, height } = canvas;
        const padding = CONFIG.circleRadius + 20;

        CONFIG.elements.forEach((el, i) => {
            // Position in a spread pattern
            const cols = isMobile ? 2 : 4;
            const rows = isMobile ? 2 : 2;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cellW = (width - padding * 2) / cols;
            const cellH = (height - padding * 2) / rows;

            const x = padding + cellW * col + cellW / 2 + (Math.random() - 0.5) * cellW * 0.3;
            const y = padding + cellH * row + cellH / 2 + (Math.random() - 0.5) * cellH * 0.3;

            const body = Matter.Bodies.circle(x, y, CONFIG.circleRadius, {
                restitution: CONFIG.restitution,
                friction: CONFIG.friction,
                frictionAir: CONFIG.frictionAir,
                density: CONFIG.density,
                render: { visible: false },
                label: JSON.stringify(el),
            });

            // Give random initial velocity
            Matter.Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
            });

            Matter.Composite.add(engine.world, body);
            bodies.push(body);
        });
    }

    function createWalls() {
        const { width, height } = canvas;
        const thickness = 100;
        const options = { isStatic: true, render: { visible: false }, restitution: CONFIG.wallBounce };

        const walls = [
            Matter.Bodies.rectangle(width / 2, -thickness / 2, width + 200, thickness, options),           // top
            Matter.Bodies.rectangle(width / 2, height + thickness / 2, width + 200, thickness, options),   // bottom
            Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height + 200, options),          // left
            Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + 200, options),  // right
        ];

        Matter.Composite.add(engine.world, walls);
    }

    function setupMouseTracking() {
        window.addEventListener('mousemove', (e) => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mousePos.x = e.touches[0].clientX;
                mousePos.y = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            mousePos.x = -1000;
            mousePos.y = -1000;
        });

        window.addEventListener('mouseleave', () => {
            mousePos.x = -1000;
            mousePos.y = -1000;
        });
    }

    function applyMouseRepulsion() {
        const radius = CONFIG.mouseRepulsionRadius;
        const strength = CONFIG.mouseRepulsionStrength;

        bodies.forEach((body) => {
            const dx = body.position.x - mousePos.x;
            const dy = body.position.y - mousePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius && dist > 0) {
                const force = strength * (radius - dist);
                const nx = dx / dist;
                const ny = dy / dist;

                Matter.Body.applyForce(body, body.position, {
                    x: nx * force,
                    y: ny * force,
                });
            }
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply mouse repulsion forces
        applyMouseRepulsion();

        // Draw connecting lines between nearby elements
        drawConnections();

        // Draw each floating element
        bodies.forEach((body) => {
            const data = JSON.parse(body.label);
            const { x, y } = body.position;
            const r = CONFIG.circleRadius;

            // Glow effect
            ctx.save();
            ctx.shadowColor = data.color;
            ctx.shadowBlur = 30 * CONFIG.glowIntensity;

            // Circle background
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = hexToRGBA(data.color, 0.06);
            ctx.fill();
            ctx.strokeStyle = hexToRGBA(data.color, 0.2);
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();

            // Emoji
            ctx.font = CONFIG.emojiFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.emoji, x, y - 6);

            // Label
            ctx.font = `600 ${CONFIG.labelFont}`;
            ctx.fillStyle = hexToRGBA(data.color, 0.9);
            ctx.fillText(data.label, x, y + 16);
        });

        animFrameId = requestAnimationFrame(render);
    }

    function drawConnections() {
        const maxDist = 250;

        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const dx = bodies[i].position.x - bodies[j].position.x;
                const dy = bodies[i].position.y - bodies[j].position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * 0.1;
                    ctx.beginPath();
                    ctx.moveTo(bodies[i].position.x, bodies[i].position.y);
                    ctx.lineTo(bodies[j].position.x, bodies[j].position.y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    function handleResize() {
        resizeCanvas();

        // Recreate walls for new dimensions
        // Remove old walls and add new ones
        const allBodies = Matter.Composite.allBodies(engine.world);
        const walls = allBodies.filter(b => b.isStatic);
        Matter.Composite.remove(engine.world, walls);
        createWalls();

        // Keep bodies within new bounds
        bodies.forEach(body => {
            const r = CONFIG.circleRadius;
            if (body.position.x < r) Matter.Body.setPosition(body, { x: r, y: body.position.y });
            if (body.position.x > canvas.width - r) Matter.Body.setPosition(body, { x: canvas.width - r, y: body.position.y });
            if (body.position.y < r) Matter.Body.setPosition(body, { x: body.position.x, y: r });
            if (body.position.y > canvas.height - r) Matter.Body.setPosition(body, { x: body.position.x, y: canvas.height - r });
        });
    }

    function destroy() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (runner) Matter.Runner.stop(runner);
        if (engine) Matter.Engine.clear(engine);
        bodies = [];
    }

    // Utility: hex to rgba
    function hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Utility: debounce
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    return { init, destroy };
})();
