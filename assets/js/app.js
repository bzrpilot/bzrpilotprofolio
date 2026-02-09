// Typewriter Effect
class TypeWriter {
    constructor(txtElement, words, wait = 3000) {
        this.txtElement = txtElement;
        this.words = words;
        this.txt = '';
        this.wordIndex = 0;
        this.wait = parseInt(wait, 10);
        this.type();
        this.isDeleting = false;
    }

    type() {
        // Current index of word
        const current = this.wordIndex % this.words.length;
        // Get full text of current word
        const fullTxt = this.words[current];

        // Check if deleting
        if (this.isDeleting) {
            // Remove char
            this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
            // Add char
            this.txt = fullTxt.substring(0, this.txt.length + 1);
        }

        // Insert txt into element
        this.txtElement.innerHTML = `<span class="txt">${this.txt}</span>`;

        // Initial Type Speed
        let typeSpeed = 100;

        if (this.isDeleting) {
            typeSpeed /= 2;
        }

        // If word is complete
        if (!this.isDeleting && this.txt === fullTxt) {
            // Make pause at end
            typeSpeed = this.wait;
            // Set delete to true
            this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            // Move to next word
            this.wordIndex++;
            // Pause before start typing
            typeSpeed = 500;
        }

        setTimeout(() => this.type(), typeSpeed);
    }
}

// Init On DOM Load
document.addEventListener('DOMContentLoaded', init);

function init() {
    const txtElement = document.querySelector('.txt-type');
    const words = JSON.parse(txtElement.getAttribute('data-words'));
    const wait = txtElement.getAttribute('data-wait');
    // Init TypeWriter
    new TypeWriter(txtElement, words, wait);
}

// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const links = document.querySelectorAll('.nav-links li');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('toggle');
});

// Close menu when clicking link
links.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Smooth Scroll for anchor links (if browser doesn't support css scroll-behavior)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Form Submission Handling
let submitted = false;

function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear form
        const form = document.querySelector('.contact-form');
        if (form) form.reset();
        submitted = false;
    }
}

// Close Modal Logic
const modal = document.getElementById('success-modal');
const span = document.querySelector(".close-modal");

if (span) {
    span.onclick = function () {
        if (modal) modal.style.display = "none";
    }
}

window.onclick = function (event) {
    if (event.target == modal) {
        if (modal) modal.style.display = "none";
    }
}

// About Section Tabs
const aboutCards = document.querySelectorAll('.about-card');
const contentBlocks = document.querySelectorAll('.content-block');

aboutCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        aboutCards.forEach(c => c.classList.remove('active'));
        // Add active class to clicked card
        card.classList.add('active');

        // Hide all content blocks
        contentBlocks.forEach(block => {
            block.classList.remove('active');
            block.style.display = 'none'; // Ensure it's hidden immediately for transition logic
        });

        // Show target content block
        const target = card.getAttribute('data-tab');
        const targetBlock = document.getElementById(target);

        if (targetBlock) {
            // Small timeout to allow display:block to apply before opacity transition
            targetBlock.style.display = 'block';
            setTimeout(() => {
                targetBlock.classList.add('active');
            }, 10);
        }
    });
});
