/* ============================================================
   HEXA STUDIO — JS Engine
   ============================================================ */
(function () {
    'use strict';

    // ====================================================
    // 1. PRELOADER
    // ====================================================
    const preloader = document.getElementById('preloader');

    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('done');
        }, 800);
    });

    // ====================================================
    // 2. CUSTOM CURSOR
    // ====================================================
    const cursor         = document.getElementById('cursor');
    const cursorFollower = document.getElementById('cursorFollower');

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top  = mouseY + 'px';
    });

    // Smooth follower
    (function animateFollower() {
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;
        cursorFollower.style.left = followerX + 'px';
        cursorFollower.style.top  = followerY + 'px';
        requestAnimationFrame(animateFollower);
    })();

    // Hover effect on interactive elements
    document.querySelectorAll('a, button, .service-item, .work-card').forEach(el => {
        el.addEventListener('mouseenter', () => cursorFollower.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursorFollower.classList.remove('hovered'));
    });

    // ====================================================
    // 3. HEADER SCROLL EFFECT
    // ====================================================
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 60);
    });

    // ====================================================
    // 4. MOBILE MENU
    // ====================================================
    const burger     = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('.mob-link').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // ====================================================
    // 5. HERO CANVAS — Particle Field
    // ====================================================
    const canvas = document.getElementById('heroCanvas');
    const ctx    = canvas.getContext('2d');
    let W, H;
    const particles = [];
    const PARTICLE_COUNT = window.innerWidth < 768 ? 40 : 100;

    function resizeCanvas() {
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() { this.reset(true); }
        reset(initial = false) {
            this.x  = Math.random() * W;
            this.y  = initial ? Math.random() * H : H + 10;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = -(Math.random() * 0.5 + 0.2);
            this.size  = Math.random() * 1.5 + 0.5;
            this.alpha = Math.random() * 0.5 + 0.1;
            this.life  = 0;
            this.maxLife = Math.random() * 300 + 200;

            // Occasionally use hex shape
            this.isHex = Math.random() < 0.15;
            this.hexR  = Math.random() * 6 + 4;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.01;
        }

        update() {
            this.x  += this.vx;
            this.y  += this.vy;
            this.life++;
            this.rotation += this.rotSpeed;
            if (this.life > this.maxLife || this.y < -20) this.reset();
        }

        draw() {
            const progress = this.life / this.maxLife;
            const fade = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
            ctx.globalAlpha = this.alpha * fade;

            if (this.isHex) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 6;
                    const xp = Math.cos(angle) * this.hexR;
                    const yp = Math.sin(angle) * this.hexR;
                    i === 0 ? ctx.moveTo(xp, yp) : ctx.lineTo(xp, yp);
                }
                ctx.closePath();
                ctx.strokeStyle = 'rgba(168,85,247,0.5)';
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = Math.random() < 0.3 ? '#22D3EE' : '#A855F7';
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    // Connection lines
    function drawConnections() {
        const maxDist = 120;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx   = particles[i].x - particles[j].x;
                const dy   = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    ctx.globalAlpha = (1 - dist / maxDist) * 0.12;
                    ctx.strokeStyle = '#A855F7';
                    ctx.lineWidth   = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    function animateCanvas() {
        ctx.clearRect(0, 0, W, H);
        drawConnections();
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateCanvas);
    }
    animateCanvas();

    // ====================================================
    // 6. FLOATING HEX BADGES — Zero-Gravity
    // ====================================================
    const floatLayer = document.getElementById('float-layer');
    const badges     = document.querySelectorAll('.hex-badge');
    let heroW = floatLayer.offsetWidth;
    let heroH = floatLayer.offsetHeight;

    const badgeStates = [];

    badges.forEach((badge, i) => {
        // Set label
        badge.textContent = badge.dataset.label;

        // Initial random position
        const size = badge.offsetWidth || 120;
        const x = Math.random() * (heroW - size) + size / 2;
        const y = Math.random() * (heroH - 60) + 30;
        const vx = parseFloat(badge.dataset.vx) * (1 + Math.random() * 0.4);
        const vy = parseFloat(badge.dataset.vy) * (1 + Math.random() * 0.4);

        badgeStates.push({ el: badge, x, y, vx, vy });
        badge.style.left = '0px';
        badge.style.top  = '0px';
    });

    let mx = -9999, my = -9999;
    floatLayer.parentElement.addEventListener('mousemove', (e) => {
        const rect = floatLayer.getBoundingClientRect();
        mx = e.clientX - rect.left;
        my = e.clientY - rect.top;
    });
    floatLayer.parentElement.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    window.addEventListener('resize', () => {
        heroW = floatLayer.offsetWidth;
        heroH = floatLayer.offsetHeight;
    });

    function animateBadges() {
        badgeStates.forEach((s) => {
            const w = s.el.offsetWidth  || 110;
            const h = s.el.offsetHeight || 36;

            // Mouse repulsion
            const dxM = s.x - mx;
            const dyM = s.y - my;
            const distM = Math.sqrt(dxM * dxM + dyM * dyM);
            if (distM < 140) {
                const force = (140 - distM) / 140 * 0.6;
                s.vx += (dxM / distM) * force;
                s.vy += (dyM / distM) * force;
            }

            // Speed cap
            const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
            if (speed > 2.5) { s.vx = (s.vx / speed) * 2.5; s.vy = (s.vy / speed) * 2.5; }

            s.x += s.vx;
            s.y += s.vy;

            // Bounce
            if (s.x < w / 2)        { s.x = w / 2;        s.vx *= -0.85; }
            if (s.x > heroW - w / 2) { s.x = heroW - w / 2; s.vx *= -0.85; }
            if (s.y < h / 2)        { s.y = h / 2;        s.vy *= -0.85; }
            if (s.y > heroH - h / 2) { s.y = heroH - h / 2; s.vy *= -0.85; }

            // Friction (loose drift)
            s.vx *= 0.995;
            s.vy *= 0.995;

            // Min speed (keep things moving)
            if (Math.abs(s.vx) < 0.15) s.vx += (Math.random() - 0.5) * 0.05;
            if (Math.abs(s.vy) < 0.15) s.vy += (Math.random() - 0.5) * 0.05;

            s.el.style.transform = `translate(${s.x - w / 2}px, ${s.y - h / 2}px)`;
        });
        requestAnimationFrame(animateBadges);
    }
    animateBadges();

    // ====================================================
    // 7. GSAP SCROLL ANIMATIONS
    // ====================================================
    gsap.registerPlugin(ScrollTrigger);

    // Sections fade in
    document.querySelectorAll('.reveal-section').forEach(section => {
        gsap.fromTo(section,
            { opacity: 0, y: 50 },
            {
                opacity: 1, y: 0,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    });

    // Service items stagger
    gsap.fromTo('.service-item',
        { opacity: 0, x: -30 },
        {
            opacity: 1, x: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.services-list',
                start: 'top 80%'
            }
        }
    );

    // Work cards stagger
    gsap.fromTo('.work-card',
        { opacity: 0, y: 40, scale: 0.97 },
        {
            opacity: 1, y: 0, scale: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.works-grid',
                start: 'top 80%'
            }
        }
    );

    // Steps stagger
    gsap.fromTo('.step',
        { opacity: 0, y: 30 },
        {
            opacity: 1, y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.steps',
                start: 'top 80%'
            }
        }
    );

    // ====================================================
    // 8. COUNTER ANIMATION
    // ====================================================
    function animateCounters() {
        document.querySelectorAll('.metric-num').forEach(el => {
            const target = parseInt(el.dataset.target, 10);
            let current = 0;
            const step  = target / 60;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) { current = target; clearInterval(timer); }
                el.textContent = Math.floor(current);
            }, 20);
        });
    }

    // Trigger counter when about section is visible
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    animateCounters();
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(aboutSection);
    }

    // ====================================================
    // 9. SMOOTH ANCHOR SCROLL
    // ====================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

})();
