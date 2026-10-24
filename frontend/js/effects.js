/**
 * Romantic Pink — Love Messenger Mouse Effects & Ambient Animations
 * - Custom Glowing Heart Cursor
 * - Smooth Particle Mouse Trail (Hearts & Sparkles)
 * - Click Heart Burst / Ripple
 * - Floating Background Pastel Hearts
 * Performance optimized with requestAnimationFrame, bounded particles, and reduced motion support.
 */

(function () {
  'use strict';

  // Check for reduced motion preference or touch devices
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (prefersReducedMotion || isTouchDevice) {
    // Graceful fallback: do not load heavy cursor trails on touch or reduced motion
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. Custom Cursor & Glow Follower
    // -------------------------------------------------------------
    const cursor = document.createElement('div');
    cursor.className = 'love-custom-cursor';
    cursor.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF5C9A" stroke="#FFFFFF" stroke-width="1.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;
    document.body.appendChild(cursor);

    const follower = document.createElement('div');
    follower.className = 'love-cursor-follower';
    document.body.appendChild(follower);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;
    let isMoving = false;
    let moveTimeout = null;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate3d(${mouseX - 11}px, ${mouseY - 11}px, 0)`;

      isMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 100);

      // Trigger sparkle trail on move
      createTrailParticle(mouseX, mouseY);
    }, { passive: true });

    // Smooth follower animation loop
    function animateFollower() {
      followerX += (mouseX - followerX) * 0.18;
      followerY += (mouseY - followerY) * 0.18;
      follower.style.transform = `translate3d(${followerX - 18}px, ${followerY - 18}px, 0)`;
      requestAnimationFrame(animateFollower);
    }
    requestAnimationFrame(animateFollower);

    // Hover effect on clickable elements
    const interactiveSelectors = 'a, button, input, textarea, .channel-item, .user-item, .rail-item, .stack-avatar';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        cursor.classList.add('cursor-hover');
        follower.classList.add('follower-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        cursor.classList.remove('cursor-hover');
        follower.classList.remove('follower-hover');
      }
    });

    // -------------------------------------------------------------
    // 2. Click Heart Burst / Ripple
    // -------------------------------------------------------------
    window.addEventListener('click', (e) => {
      createClickBurst(e.clientX, e.clientY);
    }, { passive: true });

    function createClickBurst(x, y) {
      const burstCount = 6;
      for (let i = 0; i < burstCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'love-click-heart';
        particle.textContent = ['💖', '💕', '✨', '🌸'][Math.floor(Math.random() * 4)];

        const angle = (i / burstCount) * 2 * Math.PI + (Math.random() * 0.4);
        const distance = 30 + Math.random() * 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
      }
    }

    // -------------------------------------------------------------
    // 3. Mouse Trail (Limited to 16 particles for max 60fps performance)
    // -------------------------------------------------------------
    let lastTrailTime = 0;
    const maxParticles = 16;
    let activeParticles = 0;

    function createTrailParticle(x, y) {
      const now = performance.now();
      if (now - lastTrailTime < 45 || activeParticles >= maxParticles) return;
      lastTrailTime = now;

      activeParticles++;
      const p = document.createElement('span');
      p.className = 'love-trail-particle';
      const symbols = ['♥', '♡', '✦', '✧', '🌸'];
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];

      const offsetX = (Math.random() - 0.5) * 16;
      const offsetY = (Math.random() - 0.5) * 16;
      p.style.left = `${x + offsetX}px`;
      p.style.top = `${y + offsetY}px`;

      const colors = ['#FF5C9A', '#FF8FAB', '#C8A2FF', '#FFA6C9', '#FFD1DC'];
      p.style.color = colors[Math.floor(Math.random() * colors.length)];
      p.style.fontSize = `${10 + Math.random() * 8}px`;

      document.body.appendChild(p);

      setTimeout(() => {
        p.remove();
        activeParticles = Math.max(0, activeParticles - 1);
      }, 650);
    }

    // -------------------------------------------------------------
    // 4. Ambient Floating Hearts Background
    // -------------------------------------------------------------
    function initAmbientHearts() {
      const bgContainer = document.createElement('div');
      bgContainer.className = 'love-ambient-bg';
      bgContainer.setAttribute('aria-hidden', 'true');
      document.body.prepend(bgContainer);

      const totalFloating = 12;
      for (let i = 0; i < totalFloating; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-ambient-heart';
        heart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        `;
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.animationDelay = `${Math.random() * 15}s`;
        heart.style.animationDuration = `${18 + Math.random() * 14}s`;
        const scale = 0.6 + Math.random() * 1.0;
        heart.style.transform = `scale(${scale})`;
        heart.style.opacity = `${0.04 + Math.random() * 0.1}`;

        bgContainer.appendChild(heart);
      }
    }

    initAmbientHearts();
  });
})();
