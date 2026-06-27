/**
 * ARDigital — Main Entry Point
 * Initializes physics, animations, and navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mark body as loaded for CSS animations
    requestAnimationFrame(() => {
        document.body.classList.add('loaded');
    });

    // Initialize Matter.js physics
    PhysicsEngine.init();

    // Initialize GSAP scroll animations
    ScrollAnimations.init();

    // ===== Mobile Navigation =====
    const burger = document.getElementById('navBurger');
    const menu = document.getElementById('navMenu');

    if (burger && menu) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            menu.classList.toggle('active');
        });

        // Close menu on link click
        menu.querySelectorAll('.nav__link').forEach((link) => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                menu.classList.remove('active');
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !burger.contains(e.target)) {
                burger.classList.remove('active');
                menu.classList.remove('active');
            }
        });
    }

    // ===== Smooth scroll for anchor links =====
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = 80;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                });
            }
        });
    });

    // ===== Counter Animation for Stats =====
    const observerOptions = {
        threshold: 0.5,
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCounters(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const statsSection = document.querySelector('.hero__stats');
    if (statsSection) {
        counterObserver.observe(statsSection);
    }

    // ===== Performance: Pause physics when tab is hidden =====
    document.addEventListener('visibilitychange', () => {
        // Matter.js Runner handles pause/resume via visibility automatically in newer versions
    });
});

/**
 * Animate counter numbers in stats section
 */
function animateCounters(container) {
    const counters = container.querySelectorAll('.hero__stat-number');
    counters.forEach((counter) => {
        const text = counter.textContent;
        const hasPercent = text.includes('%');
        const hasPlus = text.includes('+');
        const hasSlash = text.includes('/');
        const numericValue = parseInt(text.replace(/\D/g, ''), 10);

        if (isNaN(numericValue)) return;

        let start = 0;
        const duration = 1500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * numericValue);

            let display = current.toString();
            if (hasPlus) display += '+';
            if (hasPercent) display += '%';
            if (hasSlash) display = current + '/7';

            counter.textContent = display;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                counter.textContent = text; // Restore original text
            }
        }

        requestAnimationFrame(update);
    });
}
