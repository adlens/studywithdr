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