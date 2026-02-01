(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var bus = window.__app;

  function debounce(fn, delay) {
    var timer = null;
    return function() {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    var inThrottle = false;
    return function() {
      var ctx = this;
      var args = arguments;
      if (!inThrottle) {
        fn.apply(ctx, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function initBurgerMenu() {
    if (bus.burgerInit) return;
    bus.burgerInit = true;

    var toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    var navCollapse = document.querySelector('.navbar-collapse');
    var navList = document.querySelector('.navbar-nav, .c-nav__list');

    if (!toggle || !navCollapse) return;

    var focusableElements = null;

    function updateFocusableElements() {
      if (!navList) return;
      focusableElements = navList.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    }

    function openMenu() {
      navCollapse.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    function closeMenu() {
      navCollapse.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function trapFocus(e) {
      if (!navCollapse.classList.contains('show')) return;
      if (!focusableElements || focusableElements.length === 0) return;

      var first = focusableElements[0];
      var last = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab' || e.keyCode === 9) {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (navCollapse.classList.contains('show')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && navCollapse.classList.contains('show')) {
        closeMenu();
        toggle.focus();
      }
      trapFocus(e);
    });

    document.addEventListener('click', function(e) {
      if (!navCollapse.classList.contains('show')) return;
      if (!navCollapse.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    var navLinks = document.querySelectorAll('.nav-link, .c-nav__link');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (window.innerWidth < 1024) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && navCollapse.classList.contains('show')) {
        closeMenu();
      }
    }, 150);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initSmoothScroll() {
    if (bus.smoothScrollInit) return;
    bus.smoothScrollInit = true;

    var isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.endsWith('/index.html');

    var anchors = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchors.length; i++) {
      var anchor = anchors[i];
      var href = anchor.getAttribute('href');

      if (href === '#' || href === '#!') continue;

      if (!isHomepage && href.indexOf('#') === 0) {
        var sectionId = href.substring(1);
        if (!document.getElementById(sectionId)) {
          anchor.setAttribute('href', '/#' + sectionId);
        }
      }

      anchor.addEventListener('click', function(e) {
        var targetHref = this.getAttribute('href');
        if (targetHref === '#' || targetHref === '#!') return;

        var targetId = targetHref.indexOf('#') !== -1 ? targetHref.split('#')[1] : null;
        if (!targetId) return;

        var targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        var currentPath = window.location.pathname;
        var linkPath = this.pathname || currentPath;

        if (currentPath === linkPath || (currentPath === '/' && linkPath === '/index.html') || (currentPath === '/index.html' && linkPath === '/')) {
          e.preventDefault();

          var header = document.querySelector('.l-header, header');
          var offset = header ? header.offsetHeight : 80;
          var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          if (window.history && window.history.pushState) {
            window.history.pushState(null, '', '#' + targetId);
          }
        }
      });
    }
  }

  function initScrollSpy() {
    if (bus.scrollSpyInit) return;
    bus.scrollSpyInit = true;

    var sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return;

    var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    if (navLinks.length === 0) return;

    function setActiveLink() {
      var scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      var header = document.querySelector('.l-header, header');
      var offset = header ? header.offsetHeight + 20 : 100;

      var currentSection = null;

      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var sectionTop = section.offsetTop - offset;
        var sectionBottom = sectionTop + section.offsetHeight;

        if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
          currentSection = section.getAttribute('id');
          break;
        }
      }

      for (var j = 0; j < navLinks.length; j++) {
        var link = navLinks[j];
        var href = link.getAttribute('href');
        var linkId = href ? href.substring(1) : '';

        link.classList.remove('active');
        link.removeAttribute('aria-current');

        if (linkId && linkId === currentSection) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      }
    }

    var scrollHandler = throttle(setActiveLink, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    setActiveLink();
  }

  function initActiveMenu() {
    if (bus.activeMenuInit) return;
    bus.activeMenuInit = true;

    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll('.nav-link, .c-nav__link');

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.pathname || link.getAttribute('href');

      link.removeAttribute('aria-current');
      link.classList.remove('active');

      if (linkPath === currentPath || (currentPath === '/' && linkPath === '/index.html') || (currentPath === '/index.html' && linkPath === '/')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      }
    }
  }

  function initImages() {
    if (bus.imagesInit) return;
    bus.imagesInit = true;

    var images = document.querySelectorAll('img');

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      var isCritical = img.classList.contains('c-logo__img') || img.hasAttribute('data-critical');
      if (!img.hasAttribute('loading') && !isCritical) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function() {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><rect width="400" height="300" fill="#e9ecef"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d" font-family="sans-serif" font-size="18">Obrázok sa nepodarilo načítať</text></svg>';
        var encoded = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        this.src = encoded;
      });
    }
  }

  function initForms() {
    if (bus.formsInit) return;
    bus.formsInit = true;

    function createNotificationContainer() {
      var container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }
      return container;
    }

    function notify(message, type) {
      var container = createNotificationContainer();
      var toast = document.createElement('div');
      toast.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Zavrieť"></button>';
      container.appendChild(toast);

      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 150);
      }, 5000);

      var closeBtn = toast.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          toast.classList.remove('show');
          setTimeout(function() {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
          }, 150);
        });
      }
    }

    bus.notify = notify;

    function validateField(field) {
      var value = field.value.trim();
      var type = field.type;
      var id = field.id;
      var name = field.name;
      var isRequired = field.hasAttribute('required') || field.hasAttribute('aria-required');

      if (isRequired && !value) {
        return { valid: false, message: 'Toto pole je povinné.' };
      }

      if (type === 'email' || id === 'email' || name === 'email') {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return { valid: false, message: 'Prosím, zadajte platnú e-mailovú adresu.' };
        }
      }

      if (type === 'tel' || id === 'phone' || name === 'phone') {
        if (value) {
          var phoneRegex = /^[\+\-\d\s\(\)]{7,20}$/;
          if (!phoneRegex.test(value)) {
            return { valid: false, message: 'Prosím, zadajte platné telefónne číslo.' };
          }
        }
      }

      if (id === 'firstName' || id === 'lastName' || name === 'firstName' || name === 'lastName') {
        if (value) {
          var nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
          if (!nameRegex.test(value)) {
            return { valid: false, message: 'Prosím, zadajte platné meno (2-50 znakov).' };
          }
        }
      }

      if (field.tagName === 'TEXTAREA' || id === 'message' || name === 'message') {
        if (isRequired && value.length < 10) {
          return { valid: false, message: 'Správa musí obsahovať aspoň 10 znakov.' };
        }
      }

      if (type === 'checkbox' && isRequired) {
        if (!field.checked) {
          return { valid: false, message: 'Musíte súhlasiť s podmienkami.' };
        }
      }

      return { valid: true, message: '' };
    }

    function showError(field, message) {
      field.classList.add('is-invalid');
      var feedback = field.parentElement.querySelector('.invalid-feedback');
      if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentElement.appendChild(feedback);
      }
      feedback.textContent = message;
    }

    function clearError(field) {
      field.classList.remove('is-invalid');
      var feedback = field.parentElement.querySelector('.invalid-feedback');
      if (feedback) {
        feedback.textContent = '';
      }
    }

    var forms = document.querySelectorAll('#contactForm, #contact-form, .c-form');

    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];

      var formFields = form.querySelectorAll('input, textarea, select');
      for (var j = 0; j < formFields.length; j++) {
        var field = formFields[j];
        field.addEventListener('blur', function() {
          var validation = validateField(this);
          if (!validation.valid) {
            showError(this, validation.message);
          } else {
            clearError(this);
          }
        });

        field.addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) {
            var validation = validateField(this);
            if (validation.valid) {
              clearError(this);
            }
          }
        });
      }

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var allFields = this.querySelectorAll('input, textarea, select');
        var isValid = true;

        for (var k = 0; k < allFields.length; k++) {
          var field = allFields[k];
          var validation = validateField(field);
          
          if (!validation.valid) {
            showError(field, validation.message);
            isValid = false;
          } else {
            clearError(field);
          }
        }

        if (!isValid) {
          notify('Prosím, opravte chyby vo formulári.', 'danger');
          var firstInvalid = this.querySelector('.is-invalid');
          if (firstInvalid) {
            firstInvalid.focus();
          }
          return;
        }

        var submitBtn = this.querySelector('button[type="submit"]');
        var originalText = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Odosielam...';
        }

        var honeypotDelay = setTimeout(function() {}, 1000);

        var formElement = this;

        setTimeout(function() {
          clearTimeout(honeypotDelay);

          notify('Vaša správa bola úspešne odoslaná!', 'success');

          setTimeout(function() {
            window.location.href = 'thank_you.html';
          }, 1500);

        }, 1500);
      });
    }
  }

  function initScrollToTop() {
    if (bus.scrollToTopInit) return;
    bus.scrollToTopInit = true;

    var scrollBtn = document.querySelector('.scroll-to-top, [data-scroll-top]');
    if (!scrollBtn) {
      scrollBtn = document.createElement('button');
      scrollBtn.className = 'scroll-to-top';
      scrollBtn.setAttribute('aria-label', 'Späť na začiatok');
      scrollBtn.innerHTML = '↑';
      document.body.appendChild(scrollBtn);
    }

    function toggleButton() {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    }

    scrollBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    var scrollHandler = throttle(toggleButton, 200);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    toggleButton();
  }

  function initAccordion() {
    if (bus.accordionInit) return;
    bus.accordionInit = true;

    var accordionButtons = document.querySelectorAll('.accordion-button');

    for (var i = 0; i < accordionButtons.length; i++) {
      var button = accordionButtons[i];

      button.addEventListener('click', function() {
        var target = this.getAttribute('data-bs-target');
        if (!target) return;

        var targetElement = document.querySelector(target);
        if (!targetElement) return;

        var isExpanded = this.getAttribute('aria-expanded') === 'true';

        var parent = this.closest('.accordion');
        if (parent) {
          var allCollapses = parent.querySelectorAll('.accordion-collapse');
          var allButtons = parent.querySelectorAll('.accordion-button');

          for (var j = 0; j < allCollapses.length; j++) {
            if (allCollapses[j] !== targetElement) {
              allCollapses[j].classList.remove('show');
            }
          }

          for (var k = 0; k < allButtons.length; k++) {
            if (allButtons[k] !== this) {
              allButtons[k].setAttribute('aria-expanded', 'false');
              allButtons[k].classList.add('collapsed');
            }
          }
        }

        if (isExpanded) {
          targetElement.classList.remove('show');
          this.setAttribute('aria-expanded', 'false');
          this.classList.add('collapsed');
        } else {
          targetElement.classList.add('show');
          this.setAttribute('aria-expanded', 'true');
          this.classList.remove('collapsed');
        }
      });
    }
  }

  function initModalLinks() {
    if (bus.modalLinksInit) return;
    bus.modalLinksInit = true;

    var privacyLinks = document.querySelectorAll('a[href*="privacy"]');

    for (var i = 0; i < privacyLinks.length; i++) {
      var link = privacyLinks[i];
      var href = link.getAttribute('href');

      if (href && (href.indexOf('#') === -1 || href === '#')) {
        link.addEventListener('click', function(e) {
          var linkHref = this.getAttribute('href');
          if (linkHref === '#' || linkHref === '') {
            e.preventDefault();
            window.location.href = 'privacy.html';
          }
        });
      }
    }
  }

  bus.init = function() {
    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenu();
    initImages();
    initForms();
    initScrollToTop();
    initAccordion();
    initModalLinks();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bus.init);
  } else {
    bus.init();
  }

})();
