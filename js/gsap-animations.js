/**
 * ARDigital — GSAP Scroll Animations
 * Fade-up reveals, staggered card animations, parallax effects
 */

const ScrollAnimations = (() => {
    let initialized = false;

    function init() {
        if (initialized || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        // ===== Text Section Reveals =====
        gsap.utils.toArray('.reveal-text').forEach((el) => {
            gsap.to(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    end: 'top 55%',
                    toggleActions: 'play none none reverse',
                },
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
            });
        });

        // ===== Card Stagger Reveals =====
        gsap.utils.toArray('.services__grid').forEach((grid) => {
            const cards = grid.querySelectorAll('.service-card');
            
            gsap.to(cards, {
                scrollTrigger: {
                    trigger: grid,
                    start: 'top 80%',
                    end: 'top 30%',
                    toggleActions: 'play none none reverse',
                },
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power3.out',
            });
        });

        // ===== About Section Visual =====
        const aboutVisual = document.querySelector('.about__visual');
        if (aboutVisual) {
            gsap.to(aboutVisual, {
                scrollTrigger: {
                    trigger: aboutVisual,
                    start: 'top 85%',
                    end: 'top 50%',
                    toggleActions: 'play none none reverse',
                },
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: 'power3.out',
            });
        }

        // ===== CTA Section =====
        const ctaContent = document.querySelector('.cta__content');
        if (ctaContent) {
            gsap.to(ctaContent, {
                scrollTrigger: {
                    trigger: ctaContent,
                    start: 'top 85%',
                    end: 'top 50%',
                    toggleActions: 'play none none reverse',
                },
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
            });
        }

        // ===== Nav scroll state =====
        ScrollTrigger.create({
            start: 'top -80',
            onUpdate: (self) => {
                const nav = document.getElementById('nav');
                if (nav) {
                    if (self.scroll() > 80) {
                        nav.classList.add('nav--scrolled');
                    } else {
                        nav.classList.remove('nav--scrolled');
                    }
                }
            },
        });

        // ===== Parallax for hero stats =====
        const heroStats = document.querySelector('.hero__stats');
        if (heroStats) {
            gsap.to(heroStats, {
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                },
                y: -60,
                opacity: 0,
                ease: 'none',
            });
        }

        initialized = true;
    }

    return { init };
})();
