/* ============================================================
   HEXA STUDIO v3 — app.js
   GSAP + ScrollTrigger + Lenis + VanillaTilt + Magnetic
   ============================================================ */
(function () {
  'use strict';

  const qs  = (s, c) => (c || document).querySelector(s);
  const qsa = (s, c) => [...(c || document).querySelectorAll(s)];
  const mob = () => window.innerWidth <= 768;

  /* ── PRELOADER ── */
  window.addEventListener('load', () => {
    setTimeout(() => {
      gsap.to('#preloader', {
        autoAlpha: 0, duration: .5, ease: 'power2.inOut',
        onComplete: () => {
          qs('#preloader')?.remove();
          initScrollAnimations();
        }
      });
    }, 950);
  });

  /* ── LENIS ── */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = qs(a.getAttribute('href'));
      if (!t) return;
      if (lenis) lenis.scrollTo(t, { offset: -68 });
      else t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── CURSOR ── */
  const curDot  = qs('#curDot');
  const curRing = qs('#curRing');

  if (curDot && window.matchMedia('(pointer:fine)').matches) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      curDot.style.left = mx + 'px';
      curDot.style.top  = my + 'px';
    });
    (function followRing() {
      rx += (mx - rx) * .12;
      ry += (my - ry) * .12;
      curRing.style.left = rx + 'px';
      curRing.style.top  = ry + 'px';
      requestAnimationFrame(followRing);
    })();
    qsa('a,button,.wf-tab,.srv-card,.wi,.pc').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('c-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('c-hover'));
    });
  }

  /* ── HEADER SCROLL ── */
  const header = qs('#header');
  window.addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 50), { passive: true });

  /* ── MOBILE MENU ── */
  const burger  = qs('#burger');
  const mobMenu = qs('#mobMenu');
  const toggle  = open => {
    burger?.classList.toggle('open', open);
    mobMenu?.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open);
  };
  burger?.addEventListener('click', () => toggle(!burger.classList.contains('open')));
  qsa('.mm-link').forEach(l => l.addEventListener('click', () => toggle(false)));

  /* ── PARTICLE CANVAS ── */
  (function particles() {
    const canvas = qs('#bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COUNT = mob() ? 35 : 80;
    const pts = [];

    class Dot {
      reset(init = false) {
        this.x  = Math.random() * W;
        this.y  = init ? Math.random() * H : H + 5;
        this.vx = (Math.random() - .5) * .2;
        this.vy = -(Math.random() * .4 + .1);
        this.r  = Math.random() * 1.2 + .3;
        this.a  = Math.random() * .35 + .05;
        this.life = 0; this.max = Math.random() * 400 + 200;
        this.col = Math.random() < .5 ? '#0EA5E9' : '#22D3EE';
        this.hex = Math.random() < .1;
        this.hr  = Math.random() * 4 + 2.5;
        this.rot = Math.random() * Math.PI * 2;
        this.rs  = (Math.random() - .5) * .01;
      }
      constructor() { this.reset(true); }
      update() {
        this.x += this.vx; this.y += this.vy;
        this.rot += this.rs; this.life++;
        if (this.life > this.max || this.y < -10) this.reset();
      }
      draw() {
        const t = this.life / this.max;
        const f = t < .2 ? t / .2 : t > .8 ? (1 - t) / .2 : 1;
        ctx.globalAlpha = this.a * f;
        if (this.hex) {
          ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            i ? ctx.lineTo(Math.cos(a) * this.hr, Math.sin(a) * this.hr)
              : ctx.moveTo(Math.cos(a) * this.hr, Math.sin(a) * this.hr);
          }
          ctx.closePath();
          ctx.strokeStyle = this.col + '66'; ctx.lineWidth = .7; ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = this.col; ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < COUNT; i++) pts.push(new Dot());

    // connection lines
    const maxD = 100;
    function drawLines() {
      for (let i = 0; i < pts.length - 1; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) {
            ctx.globalAlpha = (1 - d / maxD) * .08;
            ctx.strokeStyle = '#0EA5E9'; ctx.lineWidth = .5;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    (function frame() {
      ctx.clearRect(0, 0, W, H);
      if (!mob()) drawLines();
      pts.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(frame);
    })();
  })();

  /* ── HERO SLIDESHOW ── */
  const slides   = qsa('.hs-slide');
  const dots     = qsa('.hs-dot');
  let   slideIdx = 0, slideTimer;

  function goSlide(n) {
    slides[slideIdx].classList.remove('active');
    dots[slideIdx].classList.remove('active');
    slideIdx = (n + slides.length) % slides.length;
    slides[slideIdx].classList.add('active');
    dots[slideIdx].classList.add('active');
  }

  function startSlide() {
    slideTimer = setInterval(() => goSlide(slideIdx + 1), 3500);
  }

  dots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(slideTimer); goSlide(i); startSlide(); }));
  startSlide();

  /* ── COUNTERS ── */
  function counter(el, target, suffix) {
    if (!el) return;
    gsap.fromTo({ v: 0 }, { v: target }, {
      duration: 1.6, ease: 'power2.out',
      onUpdate() { el.textContent = Math.round(this.targets()[0].v) + suffix; }
    });
  }
  setTimeout(() => {
    counter(qs('#cntProjects'), 120, '+');
    counter(qs('#cntScore'),    98,  '');
  }, 1100);

  /* ── ORB PARALLAX ── */
  qsa('.hero-orb').forEach((orb, i) => {
    window.addEventListener('mousemove', e => {
      if (mob()) return;
      const x = (e.clientX / innerWidth  - .5) * 25 * (i + 1) * .5;
      const y = (e.clientY / innerHeight - .5) * 25 * (i + 1) * .5;
      gsap.to(orb, { x, y, duration: 1.4, ease: 'power2.out' });
    });
  });

  /* ── MAGNETIC BUTTONS ── */
  qsa('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * .35;
      const y = (e.clientY - r.top  - r.height / 2) * .35;
      gsap.to(btn, { x, y, duration: .4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' });
    });
  });

  /* ── VANILLA TILT ── */
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(qsa('[data-tilt]'), {
      max: 8, speed: 400, glare: true, 'max-glare': .08, perspective: 900,
    });
  }

  /* ── WORKS FILTER ── */
  const tabs  = qsa('.wf-tab');
  const cards = qsa('.wc');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const f = tab.dataset.f;
      cards.forEach(c => {
        const show = f === 'all' || c.dataset.cat === f;
        gsap.to(c, { opacity: show ? 1 : .2, scale: show ? 1 : .97, duration: .35, ease: 'power2.out' });
        c.style.pointerEvents = show ? '' : 'none';
      });
    });
  });

  /* ── CONTACT FORM ── */
  const form = qs('#ctForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.cf-submit');
    const orig = btn.textContent;
    btn.textContent = 'Отправлено!';
    gsap.fromTo(btn, { scale: .95 }, { scale: 1, duration: .4, ease: 'elastic.out(1,.5)' });
    setTimeout(() => { btn.textContent = orig; form.reset(); }, 3000);
  });

  /* ── GSAP SCROLL ANIMATIONS ── */
  function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) lenis.on('scroll', ScrollTrigger.update);

    // Sections fade-in
    qsa('.sec').forEach(sec => {
      if (sec.id === 'hero') return;
      gsap.fromTo(sec,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: .9, ease: 'power3.out',
          scrollTrigger: { trigger: sec, start: 'top 88%', toggleActions: 'play none none reverse' }
        }
      );
    });

    // Service cards stagger
    gsap.fromTo('.srv-card',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: .6, stagger: .07, ease: 'power2.out',
        scrollTrigger: { trigger: '.srv-grid', start: 'top 80%' }
      }
    );

    // Work cards
    ScrollTrigger.batch('.wc', {
      onEnter: batch => gsap.from(batch, {
        opacity: 0, y: 35, duration: .65, stagger: .09, ease: 'power3.out'
      }),
      start: 'top 85%',
    });

    // Why items
    gsap.fromTo('.wi',
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: .5, stagger: .06, ease: 'power2.out',
        scrollTrigger: { trigger: '.why-items', start: 'top 80%' }
      }
    );

    // Process
    gsap.fromTo('.pc',
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: .5, stagger: .08, ease: 'power2.out',
        scrollTrigger: { trigger: '.proc-grid', start: 'top 80%' }
      }
    );

    // CTA box
    gsap.fromTo('.cta-box',
      { opacity: 0, scale: .97 },
      { opacity: 1, scale: 1, duration: .7, ease: 'power3.out',
        scrollTrigger: { trigger: '.cta-box', start: 'top 82%' }
      }
    );
  }

})();
