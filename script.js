(function () {
  'use strict';

  // --- Config: tanggal akad nikah (untuk countdown) — dari config atau fallback ---
  function getWeddingDate() {
    var c = window.WEDDING_CONFIG;
    if (c && c.weddingDate && c.weddingTime) {
      var t = c.weddingTime.replace(/^(\d{1,2}):(\d{2}).*/, '$1:$2:00');
      return new Date(c.weddingDate + 'T' + t + '+07:00');
    }
    return new Date('2026-04-09T07:00:00+07:00');
  }
  var WEDDING_DATE = getWeddingDate();

  // --- Development: true = saat refresh tetap di halaman terakhir (tidak kembali ke Buka Undangan). Production: ubah ke false agar setiap refresh kembali ke tombol Buka Undangan. ---
  var RESTORE_STATE_ON_REFRESH = true;

  // --- DOM ---
  var cover = document.getElementById('cover');
  var mainContent = document.getElementById('mainContent');
  var btnOpen = document.getElementById('btnOpen');
  var coverVideo = document.getElementById('coverVideo');
  var coverContent = document.getElementById('coverContent');
  var coverIntroText = document.getElementById('coverIntroText');
  var bgMusic = document.getElementById('bgMusic');
  var guestNameEl = document.getElementById('guestName');
  var coverNamesEl = document.getElementById('coverNames');
  var countdownEl = document.getElementById('countdown');
  var daysEl = document.getElementById('days');
  var hoursEl = document.getElementById('hours');
  var minutesEl = document.getElementById('minutes');
  var secondsEl = document.getElementById('seconds');
  var wishForm = document.getElementById('wishForm');
  var wishesList = document.getElementById('wishesList');
  var btnCopyAccount = document.getElementById('btnCopyAccount');
  var btnCopyAddress = document.getElementById('btnCopyAddress');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  var coverFallback = document.getElementById('coverFallback');
  var coverScreen2 = document.getElementById('coverScreen2');
  var musicToggle = document.getElementById('musicToggle');

  var INTRO_TEXT_SHOW_AT = 14; // detik ke-14 video
  var introTextShown = false;

  // --- Guest name from URL ?to= ---
  function getGuestFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var to = params.get('to');
    if (to) {
      try {
        return decodeURIComponent(to.replace(/\+/g, ' '));
      } catch (e) {
        return to;
      }
    }
    return 'Nama Tamu';
  }

  function setGuestName() {
    var name = getGuestFromUrl();
    if (guestNameEl) guestNameEl.textContent = name;
  }

  // --- Buka undangan: tampilkan main content di bawah video, tanpa menutupi tombol/video. Cover tetap di atas (urutan: tombol → video → main). Musik tetap jalan kecuali tombol stop. ---
  function openInvitation() {
    if (!cover || !mainContent) return;
    mainContent.style.display = 'block';
    mainContent.classList.add('visible');
    mainContent.setAttribute('aria-hidden', 'false');
    if (coverVideo) coverVideo.pause();
    document.body.style.overflow = '';
    showMusicWidget();
    try {
      window.sessionStorage.setItem('weddingOpened', '1');
    } catch (e) {}
  }

  // --- Tampilkan widget musik (setelah musik mulai) ---
  function showMusicWidget() {
    if (musicToggle) {
      musicToggle.style.display = '';
      updateMusicWidgetLabel();
    }
  }

  function updateMusicWidgetLabel() {
    if (!musicToggle || !bgMusic) return;
    var paused = bgMusic.paused;
    musicToggle.setAttribute('aria-label', paused ? 'Putar musik' : 'Jeda musik');
    musicToggle.setAttribute('title', paused ? 'Putar musik' : 'Jeda musik');
    musicToggle.querySelector('.music-widget-icon').textContent = paused ? '▶' : '⏸';
  }

  // --- Alur: klik Buka Undangan → putar musik dulu (user gesture) → scroll ke video → putar video; detik 14 teks; akhir video → fallback → scroll ke main ---
  function startIntroVideo() {
    if (!coverScreen2 || !coverVideo || !mainContent) return;

    if (bgMusic) {
      bgMusic.currentTime = 0;
      bgMusic.play().catch(function () {});
    }
    showMusicWidget();
    document.body.style.overflow = '';

    introTextShown = false;
    if (coverIntroText) {
      coverIntroText.classList.remove('visible');
      coverIntroText.setAttribute('aria-hidden', 'true');
    }
    if (coverFallback) {
      coverFallback.classList.remove('visible');
      coverFallback.setAttribute('aria-hidden', 'true');
    }
    coverVideo.style.display = '';
    coverVideo.removeAttribute('loop');
    coverVideo.currentTime = 0;
    coverVideo.play().catch(function () {});

    coverScreen2.scrollIntoView({ behavior: 'smooth', block: 'start' });

    coverVideo.ontimeupdate = function () {
      if (introTextShown) return;
      if (coverVideo.currentTime >= INTRO_TEXT_SHOW_AT) {
        introTextShown = true;
        if (coverIntroText) {
          coverIntroText.classList.add('visible');
          coverIntroText.setAttribute('aria-hidden', 'false');
        }
      }
    };

    coverVideo.onended = function () {
      coverVideo.style.display = 'none';
      if (coverFallback) {
        coverFallback.classList.add('visible');
        coverFallback.setAttribute('aria-hidden', 'false');
      }
      mainContent.style.display = 'block';
      mainContent.classList.add('visible');
      mainContent.setAttribute('aria-hidden', 'false');

      setTimeout(function () {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);

      setTimeout(function () {
        openInvitation();
      }, 1600);
    };
  }

  function initOpenButton() {
    if (!btnOpen) return;
    btnOpen.addEventListener('click', startIntroVideo);
  }

  // --- Widget musik: putar / jeda ---
  function initMusicWidget() {
    if (!musicToggle || !bgMusic) return;
    musicToggle.addEventListener('click', function () {
      if (bgMusic.paused) {
        bgMusic.play().catch(function () {});
      } else {
        bgMusic.pause();
      }
      updateMusicWidgetLabel();
    });
  }

  // --- Restore state: jika sudah pernah buka undangan (sessionStorage), tampilkan main content dan izinkan scroll (untuk development). Nonaktifkan dengan RESTORE_STATE_ON_REFRESH = false. ---
  function restoreState() {
    if (!RESTORE_STATE_ON_REFRESH) return;
    try {
      if (window.sessionStorage.getItem('weddingOpened') === '1') {
        if (mainContent) {
          mainContent.style.display = 'block';
          mainContent.classList.add('visible');
          mainContent.setAttribute('aria-hidden', 'false');
        }
        document.body.style.overflow = '';
        showMusicWidget();
      }
    } catch (e) {}
  }

  // --- Countdown ---
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function updateCountdown() {
    var daysEl = document.getElementById('days');
    var hoursEl = document.getElementById('hours');
    var minutesEl = document.getElementById('minutes');
    var secondsEl = document.getElementById('seconds');
    var target = getWeddingDate();
    var now = new Date();
    if (now >= target) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      return;
    }
    var diff = target - now;
    var days = Math.floor(diff / (24 * 60 * 60 * 1000));
    var hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    var minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    var seconds = Math.floor((diff % (60 * 1000)) / 1000);
    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minutesEl) minutesEl.textContent = pad(minutes);
    if (secondsEl) secondsEl.textContent = pad(seconds);
  }

  function initCountdown() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // --- Copy to clipboard ---
  function copyToClipboard(text, buttonEl) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallbackCopy(text, buttonEl);
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      showCopiedFeedback(buttonEl);
    }).catch(function () {
      fallbackCopy(text, buttonEl);
    });
  }

  function fallbackCopy(text, buttonEl) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopiedFeedback(buttonEl);
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function showCopiedFeedback(buttonEl) {
    if (!buttonEl) return;
    var originalText = buttonEl.textContent;
    buttonEl.textContent = 'Terkopi!';
    buttonEl.classList.add('copied');
    setTimeout(function () {
      buttonEl.textContent = originalText;
      buttonEl.classList.remove('copied');
    }, 2000);
  }

  function initCopyButtons() {
    if (btnCopyAccount) {
      var accountText = (btnCopyAccount.getAttribute('data-copy') || '').trim();
      if (accountText) {
        btnCopyAccount.addEventListener('click', function () {
          copyToClipboard(accountText, btnCopyAccount);
        });
      }
    }
    if (btnCopyAddress) {
      var addressText = (btnCopyAddress.getAttribute('data-copy') || '').trim();
      if (addressText) {
        btnCopyAddress.addEventListener('click', function () {
          copyToClipboard(addressText, btnCopyAddress);
        });
      }
    }
  }

  // --- Wishes: simple local storage (no backend) ---
  var WISHES_KEY = 'wedding_wishes';

  function loadWishes() {
    try {
      var raw = localStorage.getItem(WISHES_KEY);
      var list = raw ? JSON.parse(raw) : [];
      renderWishes(list);
    } catch (e) {
      renderWishes([]);
    }
  }

  function saveWish(name, message) {
    try {
      var list = [];
      var raw = localStorage.getItem(WISHES_KEY);
      if (raw) list = JSON.parse(raw);
      list.unshift({
        name: name,
        message: message,
        date: new Date().toISOString()
      });
      localStorage.setItem(WISHES_KEY, JSON.stringify(list));
      renderWishes(list);
    } catch (e) {}
  }

  function renderWishes(list) {
    if (!wishesList) return;
    if (!list.length) {
      wishesList.innerHTML = '<p class="wish-item" style="text-align:center; color: var(--color-text-muted);">Belum ada ucapan. Jadilah yang pertama!</p>';
      return;
    }
    wishesList.innerHTML = list.map(function (w) {
      var safeName = escapeHtml(w.name || 'Anonim');
      var safeMsg = escapeHtml(w.message || '');
      return '<div class="wish-item"><strong>' + safeName + '</strong>' + safeMsg + '</div>';
    }).join('');
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function initWishForm() {
    if (!wishForm) return;
    wishForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('wishName');
      var messageInput = document.getElementById('wishMessage');
      if (!nameInput || !messageInput) return;
      var name = nameInput.value.trim();
      var message = messageInput.value.trim();
      if (!name || !message) return;
      saveWish(name, message);
      nameInput.value = '';
      messageInput.value = '';
    });
  }

  // --- Gallery lightbox ---
  function initGallery() {
    var items = document.querySelectorAll('.gallery-item img');
    items.forEach(function (img) {
      img.addEventListener('click', function () {
        if (lightbox && lightboxImg) {
          lightboxImg.src = img.src || img.getAttribute('src');
          lightboxImg.alt = img.alt || '';
          lightbox.classList.add('visible');
          lightbox.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      });
    });
    if (lightboxClose && lightbox) {
      lightboxClose.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox && lightbox.classList.contains('visible')) {
        closeLightbox();
      }
    });
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('visible');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // --- Video: tidak autoplay; video & musik mulai saat user klik Buka Undangan ---
  function initVideo() {
    if (!coverVideo) return;
    // Video mulai hanya saat startIntroVideo() (setelah klik)
  }

  // --- Animasi saat scroll (lebih dinamis) ---
  function initScrollAnimations() {
    var animated = document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-item');
    if (!animated.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    animated.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Run (setelah DOM siap agar countdown & elemen lain pasti ada) ---
  function run() {
    setGuestName();
    initOpenButton();
    document.body.style.overflow = 'hidden';
    restoreState();
    initCountdown();
    initCopyButtons();
    loadWishes();
    initWishForm();
    initGallery();
    initVideo();
    initMusicWidget();
    initScrollAnimations();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
