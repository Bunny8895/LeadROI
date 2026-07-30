(function () {
  'use strict';

  const previewPanel   = document.getElementById('previewPanel');
  const styleCards      = document.querySelectorAll('.style-card');
  const toolbarPills    = document.querySelectorAll('.pill');
  const currentLabel    = document.getElementById('currentThemeLabel');
  const selectionBanner = document.getElementById('selectionBanner');
  const selectedName    = document.getElementById('selectedStyleName');
  const selectionClose  = document.getElementById('selectionClose');
  const toast           = document.getElementById('toast');
  const siteNav         = document.getElementById('siteNav');

  const THEME_NAMES = {
    glass: 'Glassmorphism',
    bento: 'Bento UI',
    aurora: 'Aurora UI',
    minimal: 'Minimalism',
    material: 'Material Design',
    dark: 'Dark Mode',
    neumorphism: 'Neumorphism'
  };

  let currentTheme = 'glass';
  let toastTimer = null;
  let bannerTimer = null;

  /* ---------------------------------------------------------
     Apply a theme to the live preview panel
  --------------------------------------------------------- */
  function setTheme(theme, { scrollToPreview = false } = {}) {
    if (!THEME_NAMES[theme]) return;
    currentTheme = theme;

    // trigger the cross-fade/blur transition
    previewPanel.classList.remove('switching');
    // force reflow so the animation can restart
    void previewPanel.offsetWidth;
    previewPanel.classList.add('switching');
    previewPanel.setAttribute('data-theme', theme);

    // sync toolbar pills
    toolbarPills.forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.theme === theme);
    });

    // sync card highlight (hover/preview state, not "selected")
    currentLabel.textContent = THEME_NAMES[theme];

    // mark which card is currently live-previewed (not necessarily "chosen")
    styleCards.forEach((card) => {
      card.classList.toggle('active-preview', card.dataset.theme === theme);
    });

    // On narrow screens the preview isn't pinned beside the list, so bring it into view
    if (scrollToPreview && window.innerWidth <= 1100) {
      document.getElementById('preview').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ---------------------------------------------------------
     Mark a style as chosen
  --------------------------------------------------------- */
  function chooseStyle(theme) {
    styleCards.forEach((card) => {
      card.classList.toggle('selected', card.dataset.theme === theme);
    });
    setTheme(theme);
    selectedName.textContent = THEME_NAMES[theme];
    showSelectionBanner();
    showToast(`✅ ${THEME_NAMES[theme]} selected as your website style`);
  }

  function showSelectionBanner() {
    selectionBanner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => selectionBanner.classList.remove('show'), 6000);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ---------------------------------------------------------
     Style card interactions
  --------------------------------------------------------- */
  styleCards.forEach((card) => {
    const theme = card.dataset.theme;

    // Hovering / focusing a card live-previews it (no scroll)
    card.addEventListener('mouseenter', () => setTheme(theme));
    card.addEventListener('focus', () => setTheme(theme));

    // Clicking the card body previews + scrolls to it
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return; // buttons handle themselves
      setTheme(theme, { scrollToPreview: true });
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setTheme(theme, { scrollToPreview: true });
      }
    });
  });

  document.querySelectorAll('[data-action="choose"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      chooseStyle(btn.dataset.theme);
    });
  });

  /* ---------------------------------------------------------
     Toolbar pills inside the preview section
  --------------------------------------------------------- */
  toolbarPills.forEach((pill) => {
    pill.addEventListener('click', () => setTheme(pill.dataset.theme));
  });

  selectionClose.addEventListener('click', () => {
    selectionBanner.classList.remove('show');
    clearTimeout(bannerTimer);
  });

  /* ---------------------------------------------------------
     Sticky nav background on scroll
  --------------------------------------------------------- */
  function handleNavScroll() {
    siteNav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ---------------------------------------------------------
     Scroll-reveal animation
  --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );
  revealTargets.forEach((el) => revealObserver.observe(el));

  /* ---------------------------------------------------------
     Animated stat counters (run once when stats enter view)
  --------------------------------------------------------- */
  const statEls = document.querySelectorAll('.pv-stat-num');
  let countersRan = false;

  function animateCounters() {
    if (countersRan) return;
    countersRan = true;
    statEls.forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + (progress === 1 ? '+' : '');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  const statsSection = document.querySelector('.pv-stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounters();
            statsObserver.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    statsObserver.observe(statsSection);
  }

  /* ---------------------------------------------------------
     Button ripple / glow-follow micro-interaction
  --------------------------------------------------------- */
  document.querySelectorAll('.btn-primary').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--rx', `${e.clientX - rect.left}px`);
      btn.style.setProperty('--ry', `${e.clientY - rect.top}px`);
    });
  });

  /* ---------------------------------------------------------
     Final CTA -> jump back to style picker
  --------------------------------------------------------- */
  const finalCtaBtn = document.getElementById('finalCtaBtn');
  if (finalCtaBtn) {
    finalCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('🎉 Great choice! Your design team will follow up shortly.');
      document.getElementById('styles').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     Init: default theme + pre-select first card as example
  --------------------------------------------------------- */
  setTheme('glass');
})();
