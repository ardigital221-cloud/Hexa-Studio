/* ============================================================
   HEXA STUDIO — app.js v2
   Plugins: Lenis (smooth scroll) + VanillaTilt + Particles + Magnetic
   ============================================================ */
(function () {
    'use strict';

    // ====================================================
    // 0. UTILS
    // ====================================================
    function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }
    const isMobile = () => window.innerWidth <= 768;

    // ====================================================
    // 1. PRELOADER
    // ====================================================
    const preloader = qs('#preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            gsap.to(preloader, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut',
                onComplete: () => preloader.remove()
            });
        }, 900);
    });

    // ====================================================
    // 2. LENIS SMOOTH SCROLL
    // ====================================================
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.25,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
        });
        gsap.ticker.add(time => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    // Anchor smooth scroll (works with Lenis)
    qsa('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const target = qs(a.getAttribute('href'));
            if (target) {
                if (lenis) lenis.scrollTo(target, { offset: -70 });
                else target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ====================================================
    // 3. CUSTOM CURSOR
    // ====================================================
    const dot  = qs('#cursorDot');
    const ring = qs('#cursorRing');
    const cTxt = qs('#cursorText');

    if (window.matchMedia('(pointer: fine)').matches) {
        let mx = 0, my = 0, rx = 0, ry = 0;

        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            dot.style.left = mx + 'px';
            dot.style.top  = my + 'px';
            cTxt.style.left = mx + 'px';
            cTxt.style.top  = my + 'px';
        });

        (function follow() {
            rx += (mx - rx) * 0.1;
            ry += (my - ry) * 0.1;
            ring.style.left = rx + 'px';
            ring.style.top  = ry + 'px';
            requestAnimationFrame(follow);
        })();

        qsa('a, button, .filter-btn, .srv-card, .why-item').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });

        qsa('.wcard').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-work'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-work'));
        });
    }

    // ====================================================
    // 4. HEADER SCROLL
    // ====================================================
    const header = qs('#header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });

    // ====================================================
    // 5. MOBILE MENU
    // ====================================================
    const burger  = qs('#burger');
    const overlay = qs('#mobOverlay');

    const toggleMenu = open => {
        burger.classList.toggle('open', open);
        overlay.classList.toggle('open', open);
        document.body.classList.toggle('mob-open', open);
    };

    burger.addEventListener('click', () => toggleMenu(!burger.classList.contains('open')));
    qsa('.mob-link').forEach(l => l.addEventListener('click', () => toggleMenu(false)));

    // ====================================================
    // 6. PARTICLE CANVAS
    // ====================================================
    (function initParticles() {
        const canvas = qs('#particleCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W, H;
        const COUNT = isMobile() ? 40 : 90;
        const particles = [];

        const resize = () => {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        class P {
            constructor() { this.reset(true); }
            reset(init = false) {
                this.x  = Math.random() * W;
                this.y  = init ? Math.random() * H : H + 5;
                this.vx = (Math.random() - 0.5) * 0.25;
                this.vy = -(Math.random() * 0.5 + 0.15);
                this.r  = Math.random() * 1.4 + 0.4;
                this.a  = Math.random() * 0.4 + 0.05;
                this.life = 0; this.max = Math.random() * 350 + 200;
                this.hex  = Math.random() < 0.12;
                this.hr   = Math.random() * 5 + 3;
                this.rot  = Math.random() * Math.PI * 2;
                this.rs   = (Math.random() - 0.5) * 0.012;
                this.col  = Math.random() < 0.35 ? '#22D3EE' : '#A855F7';
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                this.rot += this.rs; this.life++;
                if (this.life > this.max || this.y < -15) this.reset();
            }
            draw() {
                const t = this.life / this.max;
                const f = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
                ctx.globalAlpha = this.a * f;
                if (this.hex) {
                    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const a = (Math.PI / 3) * i - Math.PI / 6;
                        i === 0 ? ctx.moveTo(Math.cos(a) * this.hr, Math.sin(a) * this.hr)
                                : ctx.lineTo(Math.cos(a) * this.hr, Math.sin(a) * this.hr);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = this.col + '88'; ctx.lineWidth = 0.8; ctx.stroke();
                    ctx.restore();
                } else {
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                    ctx.fillStyle = this.col; ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
        }

        for (let i = 0; i < COUNT; i++) particles.push(new P());

        const maxD = 110;
        function drawLines() {
            for (let i = 0; i < particles.length - 1; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d  = dx * dx + dy * dy;
                    if (d < maxD * maxD) {
                        ctx.globalAlpha = (1 - Math.sqrt(d) / maxD) * 0.1;
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

        (function frame() {
            ctx.clearRect(0, 0, W, H);
            if (!isMobile()) drawLines();
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(frame);
        })();
    })();

    // ====================================================
    // 7. FLOATING BADGES — Zero-Gravity
    // ====================================================
    (function initBadges() {
        const zone   = qs('#floatZone');
        if (!zone) return;
        const badges = qsa('.fbadge', zone);
        let zW = zone.offsetWidth, zH = zone.offsetHeight;
        let mX = -999, mY = -999;

        window.addEventListener('resize', () => { zW = zone.offsetWidth; zH = zone.offsetHeight; }, { passive: true });

        const hero = qs('#hero');
        if (hero) {
            hero.addEventListener('mousemove', e => {
                const r = hero.getBoundingClientRect();
                mX = e.clientX - r.left; mY = e.clientY - r.top;
            });
            hero.addEventListener('mouseleave', () => { mX = -999; mY = -999; });
        }

        const states = badges.map(el => {
            const w = el.offsetWidth || 120, h = el.offsetHeight || 34;
            return {
                el,
                x:  Math.random() * (zW - w - 40) + 20,
                y:  Math.random() * (zH - h - 40) + 20,
                vx: parseFloat(el.dataset.vx) * (0.8 + Math.random() * 0.5),
                vy: parseFloat(el.dataset.vy) * (0.8 + Math.random() * 0.5),
            };
        });

        (function tick() {
            states.forEach(s => {
                const w = s.el.offsetWidth || 120, h = s.el.offsetHeight || 34;

                // Mouse repulsion
                const dxM = s.x - mX, dyM = s.y - mY;
                const dM  = Math.sqrt(dxM * dxM + dyM * dyM);
                if (dM < 130 && dM > 0) {
                    const f = (130 - dM) / 130 * 0.55;
                    s.vx += (dxM / dM) * f;
                    s.vy += (dyM / dM) * f;
                }

                // Cap speed
                const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
                if (spd > 2.2) { s.vx = (s.vx / spd) * 2.2; s.vy = (s.vy / spd) * 2.2; }

                s.x += s.vx; s.y += s.vy;

                // Bounce
                if (s.x < w / 2)        { s.x = w / 2;        s.vx *= -0.8; }
                if (s.x > zW - w / 2)   { s.x = zW - w / 2;   s.vx *= -0.8; }
                if (s.y < h / 2)        { s.y = h / 2;        s.vy *= -0.8; }
                if (s.y > zH - h / 2)   { s.y = zH - h / 2;   s.vy *= -0.8; }

                // Damping + min speed
                s.vx *= 0.997; s.vy *= 0.997;
                if (Math.abs(s.vx) < 0.1) s.vx += (Math.random() - 0.5) * 0.04;
                if (Math.abs(s.vy) < 0.1) s.vy += (Math.random() - 0.5) * 0.04;

                s.el.style.transform = `translate(${s.x - w / 2}px, ${s.y - h / 2}px)`;
            });
            requestAnimationFrame(tick);
        })();
    })();

    // ====================================================
    // 8. VANILLA TILT on cards
    // ====================================================
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(qsa('.tilt-card'), {
            max:      10,
            speed:    400,
            glare:    true,
            'max-glare': 0.12,
            perspective: 900,
        });
    }

    // ====================================================
    // 9. MAGNETIC BUTTONS
    // ====================================================
    qsa('[data-magnetic]').forEach(btn => {
        const strength = 0.35;
        btn.addEventListener('mousemove', e => {
            const r   = btn.getBoundingClientRect();
            const dx  = e.clientX - (r.left + r.width  / 2);
            const dy  = e.clientY - (r.top  + r.height / 2);
            gsap.to(btn, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        });
    });

    // ====================================================
    // 10. TEXT SCRAMBLE EFFECT
    // ====================================================
    const chars = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    function scramble(el) {
        const original = el.dataset.text;
        let iteration  = 0;
        const total    = original.length * 3;
        const id = setInterval(() => {
            el.textContent = original.split('').map((ch, idx) => {
                if (ch === ' ') return ' ';
                if (idx < Math.floor(iteration / 3)) return ch;
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            if (++iteration > total) clearInterval(id);
        }, 30);
    }

    // Trigger scramble once preloader is gone
    setTimeout(() => {
        qsa('.scramble-text').forEach(el => scramble(el));
    }, 1000);

    // ====================================================
    // 11. GSAP SCROLL ANIMATIONS
    // ====================================================
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
        lenis.on('scroll', ScrollTrigger.update);
    }

    // Generic sections reveal
    gsap.utils.toArray('.section').forEach(sec => {
        if (sec.id === 'hero') return;
        gsap.fromTo(sec,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
              scrollTrigger: { trigger: sec, start: 'top 88%', toggleActions: 'play none none reverse' }
            }
        );
    });

    // Stagger: service cards
    gsap.fromTo('.srv-card',
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: '.srv-grid', start: 'top 80%' }
        }
    );

    // Stagger: work cards
    gsap.fromTo('.wcard',
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.works-grid', start: 'top 80%' }
        }
    );

    // Why items
    gsap.fromTo('.why-item',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out',
          scrollTrigger: { trigger: '.why-items', start: 'top 80%' }
        }
    );

    // Process steps
    gsap.fromTo('.proc-step',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: '.process-track', start: 'top 80%' }
        }
    );

    // Review cards
    gsap.fromTo('.review-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: '.reviews-grid', start: 'top 80%' }
        }
    );

    // ====================================================
    // 12. COUNTER ANIMATION (hero nums)
    // ====================================================
    const heroNums = [
        { el: qs('.hero-nums .hnum:nth-child(1) strong'), target: 120, suffix: '+' },
        { el: qs('.hero-nums .hnum:nth-child(3) strong'), target: 97,  suffix: '%' },
    ];

    function animNum(el, target, suffix) {
        if (!el) return;
        let cur = 0;
        const step = target / 50;
        const timer = setInterval(() => {
            cur += step;
            if (cur >= target) { cur = target; clearInterval(timer); }
            el.textContent = Math.floor(cur) + suffix;
        }, 30);
    }

    setTimeout(() => heroNums.forEach(n => animNum(n.el, n.target, n.suffix)), 1200);

    // ====================================================
    // 13. WORKS FILTER
    // ====================================================
    const filterBtns = qsa('.filter-btn');
    const wCards     = qsa('.wcard');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            wCards.forEach(c => {
                const show = f === 'all' || c.dataset.cat === f;
                gsap.to(c, {
                    opacity: show ? 1 : 0.25,
                    scale:   show ? 1 : 0.97,
                    duration: 0.35, ease: 'power2.out'
                });
                c.style.pointerEvents = show ? '' : 'none';
            });
        });
    });

    // ====================================================
    // 14. CONTACT FORM SUBMIT (stub)
    // ====================================================
    const form = qs('#contactForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const btn = form.querySelector('.form-submit');
            const orig = btn.textContent;
            btn.textContent = '✓ Отправлено!';
            btn.style.background = 'linear-gradient(135deg,#10B981,#22D3EE)';
            setTimeout(() => {
                btn.textContent = orig;
                btn.style.background = '';
                form.reset();
            }, 3000);
        });
    }

    // ====================================================
    // 15. ORB PARALLAX on hero
    // ====================================================
    const orbs = qsa('.hero-gradient-orb');
    window.addEventListener('mousemove', e => {
        if (isMobile()) return;
        const xPct = (e.clientX / window.innerWidth  - 0.5) * 30;
        const yPct = (e.clientY / window.innerHeight - 0.5) * 30;
        orbs.forEach((orb, i) => {
            const mul = (i + 1) * 0.4;
            gsap.to(orb, { x: xPct * mul, y: yPct * mul, duration: 1.2, ease: 'power2.out' });
        });
    });

})();
