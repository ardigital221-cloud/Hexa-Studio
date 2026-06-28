document.addEventListener("DOMContentLoaded", () => {
    // ===== 1. Smooth Scrolling =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // ===== 2. GSAP Animations =====
    gsap.registerPlugin(ScrollTrigger);

    const revealElements = document.querySelectorAll(".gs-reveal");
    revealElements.forEach((el) => {
        gsap.fromTo(el, 
            { autoAlpha: 0, y: 50 }, 
            { 
                duration: 1, 
                autoAlpha: 1, 
                y: 0, 
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // ===== 3. Matter.js Zero-Gravity Effect =====
    initMatterJS();
});

function initMatterJS() {
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events;

    // Configuration
    const heroSection = document.getElementById("hero");
    const canvasContainer = document.getElementById("canvas-container");
    const domElements = document.querySelectorAll(".floating-item");
    
    // Check mobile
    const isMobile = window.innerWidth <= 768;

    // Create engine
    const engine = Engine.create();
    // Zero gravity for space effect
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    // We use a Render to handle mouse interactions easily, but make it transparent
    const render = Render.create({
        element: canvasContainer,
        engine: engine,
        options: {
            width: heroSection.clientWidth,
            height: heroSection.clientHeight,
            wireframes: false,
            background: 'transparent'
        }
    });

    // Create boundaries
    const thickness = 60;
    let width = heroSection.clientWidth;
    let height = heroSection.clientHeight;

    const walls = [
        Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true }), // Top
        Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true }), // Bottom
        Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true }), // Left
        Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true }) // Right
    ];
    Composite.add(engine.world, walls);

    // Map DOM elements to Matter bodies
    const bodies = [];
    const domToBodyMap = [];

    // Base dimensions for the items
    const circleRadius = isMobile ? 50 : 80;
    const rectWidth = isMobile ? 120 : 180;
    const rectHeight = isMobile ? 40 : 60;

    domElements.forEach((el, index) => {
        const type = el.getAttribute("data-type");
        let body;
        
        // Random initial position inside the container
        const startX = Math.random() * (width - 200) + 100;
        const startY = Math.random() * (height - 200) + 100;

        // Visual setup for DOM element
        if (type === "circle") {
            el.style.width = `${circleRadius * 2}px`;
            el.style.height = `${circleRadius * 2}px`;
            body = Bodies.circle(startX, startY, circleRadius, {
                restitution: 0.9,
                friction: 0.001,
                frictionAir: 0.01,
                render: { visible: false }
            });
        } else {
            el.style.width = `${rectWidth}px`;
            el.style.height = `${rectHeight}px`;
            body = Bodies.rectangle(startX, startY, rectWidth, rectHeight, {
                restitution: 0.9,
                friction: 0.001,
                frictionAir: 0.01,
                render: { visible: false }
            });
        }

        // Apply a small initial force
        Matter.Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05
        });

        bodies.push(body);
        domToBodyMap.push({ dom: el, body: body, type: type });
    });

    Composite.add(engine.world, bodies);

    // Add mouse interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });
    Composite.add(engine.world, mouseConstraint);
    
    // Keep the mouse in sync with rendering
    render.mouse = mouse;

    // Custom repulsion effect from mouse
    Events.on(engine, 'beforeUpdate', function() {
        if (mouse.position.x !== 0 && mouse.position.y !== 0) {
            bodies.forEach(body => {
                const dx = body.position.x - mouse.position.x;
                const dy = body.position.y - mouse.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Repel radius
                if (dist < 150) {
                    const forceMagnitude = (150 - dist) * 0.00005;
                    Matter.Body.applyForce(body, body.position, {
                        x: (dx / dist) * forceMagnitude,
                        y: (dy / dist) * forceMagnitude
                    });
                }
            });
        }
    });

    // Run engine & renderer
    Render.run(render);
    
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Sync DOM with Matter bodies
    Events.on(engine, 'afterUpdate', function() {
        domToBodyMap.forEach(item => {
            const { dom, body } = item;
            // Apply position and rotation
            dom.style.transform = `translate(${body.position.x - dom.offsetWidth / 2}px, ${body.position.y - dom.offsetHeight / 2}px) rotate(${body.angle}rad)`;
        });
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        width = heroSection.clientWidth;
        height = heroSection.clientHeight;
        
        render.canvas.width = width;
        render.canvas.height = height;
        
        // Update walls
        Matter.Body.setPosition(walls[0], { x: width / 2, y: -thickness / 2 });
        Matter.Body.setVertices(walls[0], Matter.Bodies.rectangle(width / 2, -thickness / 2, width, thickness).vertices);
        
        Matter.Body.setPosition(walls[1], { x: width / 2, y: height + thickness / 2 });
        Matter.Body.setVertices(walls[1], Matter.Bodies.rectangle(width / 2, height + thickness / 2, width, thickness).vertices);
        
        Matter.Body.setPosition(walls[2], { x: -thickness / 2, y: height / 2 });
        Matter.Body.setVertices(walls[2], Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height).vertices);
        
        Matter.Body.setPosition(walls[3], { x: width + thickness / 2, y: height / 2 });
        Matter.Body.setVertices(walls[3], Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height).vertices);
    });
}
