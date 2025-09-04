  
        // Preloader
        window.addEventListener('load', () => {
            const preloader = document.querySelector('#preloader');
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 1000);
        });


        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            const isExpanded = navLinks.classList.contains('show');
            mobileMenuBtn.querySelector('i').classList.toggle('fa-bars', !isExpanded);
            mobileMenuBtn.querySelector('i').classList.toggle('fa-times', isExpanded);
        });

        // Scroll behavior for navbar
        const navbar = document.querySelector('#navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Scroll to top
        const scrollTopBtn = document.querySelector('.scroll-top');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Section animations on scroll
        const sections = document.querySelectorAll('.section, .timeline-item, .skill-category, .project-card, .achievement-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            observer.observe(section);
        });

        // Smooth scrolling for nav links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
                if (navLinks.classList.contains('show')) {
                    navLinks.classList.remove('show');
                    mobileMenuBtn.querySelector('i').classList.add('fa-bars');
                    mobileMenuBtn.querySelector('i').classList.remove('fa-times');
                }
            });
        });

        // Parallax effect for header
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            const scrollPosition = window.scrollY;
            header.style.backgroundPositionY = `${scrollPosition * 0.3}px`;
        });

        // Particle background with mouse interaction
        function createParticles() {
            const canvas = document.getElementById('particle-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const particles = [];
            const particleCount = 100;
            let mouse = { x: null, y: null };

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 1,
                    speedX: Math.random() * 1 - 0.5,
                    speedY: Math.random() * 1 - 0.5,
                });
            }

            canvas.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });

            function animateParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(229, 190, 236, 0.3)';
                particles.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();

                    if (mouse.x && mouse.y) {
                        const dx = mouse.x - p.x;
                        const dy = mouse.y - p.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < 100) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(229, 190, 236, ${1 - distance / 100})`;
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(mouse.x, mouse.y);
                            ctx.stroke();
                            p.speedX += dx * 0.001;
                            p.speedY += dy * 0.001;
                        }
                    }

                    p.x += p.speedX;
                    p.y += p.speedY;

                    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
                });
                requestAnimationFrame(animateParticles);
            }

            animateParticles();
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        }

        document.addEventListener('DOMContentLoaded', createParticles);

        // Ripple effect for buttons
        document.querySelectorAll('.resume-btn, .submit-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Contact form validation
    const form = document.getElementById('contact-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const message = form.querySelector('#message');

    function setError(input, messageText) {
        const formGroup = input.parentElement;
        const errorMessage = formGroup.querySelector('.error-message');
        formGroup.classList.add('error');
        errorMessage.textContent = messageText;
        isValid = false;
    }

    function clearError(input) {
        const formGroup = input.parentElement;
        formGroup.classList.remove('error');
        formGroup.querySelector('.error-message').textContent = '';
    }

    // Clear previous errors
    clearError(name);
    clearError(email);
    clearError(message);

    // Validation checks
    if (!name.value.trim()) {
        setError(name, 'Name is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
        setError(email, 'Email is required');
    } else if (!emailRegex.test(email.value.trim())) {
        setError(email, 'Please enter a valid email');
    }

    if (!message.value.trim()) {
        setError(message, 'Message is required');
    } else if (message.value.trim().length < 10) {
        setError(message, 'Message must be at least 10 characters long');
    }

    // If valid, send data to Formspree
    if (isValid) {
        const data = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                alert("✅ Thanks for your message, Navraj will get back to you soon!");
                form.reset();
            } else {
                alert("❌ Something went wrong. Please try again later.");
            }
        } catch (error) {
            alert("❌ Network error. Please try again.");
        }
    }
});

            
    
    