// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Newsletter form: submit to Formspree, stay on page and show message
document.getElementById('newsletter-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const emailInput = document.getElementById('email-input');
    if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    try {
        const res = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
            alert('Thanks for subscribing! You\'ll hear from me with study tips and resources.');
            emailInput.value = '';
        } else {
            alert('Something went wrong. Please try again or email me directly.');
        }
    } catch (err) {
        alert('Something went wrong. Please try again or email me directly.');
    }
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
});

// Mobile menu toggle (if we add it later)
function toggleMenu() {
    const nav = document.querySelector('.nav-links');
    if (nav) {
        nav.classList.toggle('active');
    }
}

// Add subtle animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.section, .service-card, .testimonial').forEach(el => {
    observer.observe(el);
});

// Testimonial carousel – rotate reviews (one card centered, gap between cards)
(function () {
    const carousel = document.querySelector('.testimonial-carousel');
    const track = document.getElementById('testimonial-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsEl = document.getElementById('carousel-dots');
    if (!carousel || !track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll('.testimonial');
    const total = cards.length;
    const GAP = 24;
    let current = 0;
    let slotWidth = 0;  // one card width + gap, set in setTrackWidth
    let autoTimer = null;
    const AUTO_MS = 6000;

    function setTrackWidth() {
        var w = carousel.offsetWidth;
        if (w <= 0) {
            requestAnimationFrame(setTrackWidth);
            return;
        }
        slotWidth = w + GAP;
        track.style.width = (total * w + (total - 1) * GAP) + 'px';
        for (var i = 0; i < cards.length; i++) {
            cards[i].style.width = w + 'px';
            cards[i].style.flexBasis = w + 'px';
        }
        track.style.transform = 'translateX(-' + (current * slotWidth) + 'px)';
    }

    function goTo(index) {
        current = (index + total) % total;
        track.style.transform = 'translateX(-' + (current * slotWidth) + 'px)';
        if (dotsEl) {
            var dots = dotsEl.querySelectorAll('.carousel-dot');
            for (var i = 0; i < dots.length; i++) {
                dots[i].classList.toggle('active', i === current);
            }
        }
        resetAuto();
    }

    function resetAuto() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(function () { goTo(current + 1); }, AUTO_MS);
    }

    prevBtn.addEventListener('click', function () { goTo(current - 1); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); });

    for (var i = 0; i < cards.length; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
        dot.addEventListener('click', (function (j) { return function () { goTo(j); }; })(i));
        dotsEl.appendChild(dot);
    }

    setTrackWidth();
    window.addEventListener('resize', setTrackWidth);
    resetAuto();
})();