// ===== COURT FILE INDEXER PWA MANAGER =====

let deferredPrompt = null;
const DEFER_TOAST_KEY = 'cfi-pwa-dismissed';

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker
  registerServiceWorker();

  // Initialize UI Event Listeners
  initPwaUI();
});

// Register the Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
          // Force immediate update check to pick up cache version changes
          registration.update();
        })
        .catch(error => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

// Watch for the PWA install eligibility event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  console.log('[PWA] Eligible for installation. Stashed prompt.');

  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    console.log('[PWA] Already running in standalone mode.');
    return;
  }

  // Show header install action
  const headerBtn = document.getElementById('pwaHeaderBtn');
  if (headerBtn) {
    headerBtn.style.display = 'flex';
  }

  // Trigger floating toast notification if not dismissed recently
  const isDismissed = localStorage.getItem(DEFER_TOAST_KEY);
  if (!isDismissed) {
    setTimeout(() => {
      const toast = document.getElementById('pwaInstallToast');
      if (toast) {
        toast.classList.add('active');
      }
    }, 4000); // 4 second delay
  }
});

// Watch for successful installation
window.addEventListener('appinstalled', (evt) => {
  console.log('[PWA] Court File Indexer successfully installed!');
  hideInstallUI();
  deferredPrompt = null;
});

function initPwaUI() {
  const modalOverlay = document.getElementById('pwaModalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closePwaModal();
      }
    });
  }
}

function hideInstallUI() {
  const headerBtn = document.getElementById('pwaHeaderBtn');
  if (headerBtn) headerBtn.style.display = 'none';

  const toast = document.getElementById('pwaInstallToast');
  if (toast) toast.classList.remove('active');

  const modal = document.getElementById('pwaModalOverlay');
  if (modal) modal.classList.remove('active');
  
  document.body.style.overflow = '';
  if (window.lenis) window.lenis.start();
}

function openPwaModal() {
  const toast = document.getElementById('pwaInstallToast');
  if (toast) toast.classList.remove('active');

  const modal = document.getElementById('pwaModalOverlay');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.lenis) window.lenis.stop();
  }
}

function closePwaModal(e) {
  if (e && e.target.closest('.btn-pwa-install')) return;
  const modal = document.getElementById('pwaModalOverlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  }
}

function dismissPwaToast() {
  const toast = document.getElementById('pwaInstallToast');
  if (toast) {
    toast.classList.remove('active');
  }
  localStorage.setItem(DEFER_TOAST_KEY, 'true');
  console.log('[PWA] User dismissed install toast.');
}

async function triggerPwaInstall() {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt was not deferred or already installed.');
    closePwaModal();
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User choice outcome: ${outcome}`);

  if (outcome === 'accepted') {
    console.log('[PWA] User accepted install.');
    hideInstallUI();
  } else {
    console.log('[PWA] User dismissed install.');
    closePwaModal();
  }
  deferredPrompt = null;
}
