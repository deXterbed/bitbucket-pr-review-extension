import { injectNotificationStyles } from './notification.js';
import { injectReviewButton, updateButtonVisibility, isDiffPage } from './injector.js';
import { INJECTION_RETRY_MS, INJECTION_MAX_ATTEMPTS } from '../shared/constants.js';

/**
 * Attempts to inject the review button, retrying until it appears or max attempts reached.
 */
function tryInjectWithRetry() {
  injectReviewButton();

  let count = 0;
  const timer = setInterval(() => {
    if (document.getElementById('review-pr-button')) {
      updateButtonVisibility();
      clearInterval(timer);
      return;
    }
    if (++count >= INJECTION_MAX_ATTEMPTS) {
      clearInterval(timer);
      return;
    }
    injectReviewButton();
  }, INJECTION_RETRY_MS);
}

// ── SPA-aware URL change detection ───────────────────────────────────────────

let lastUrl = location.href;

function onUrlChange() {
  lastUrl = location.href;
  tryInjectWithRetry();
}

// 1) MutationObserver on document
new MutationObserver(() => {
  if (location.href !== lastUrl) onUrlChange();
}).observe(document, { subtree: true, childList: true });

// 2) Monkey-patch history API
const originalPushState = history.pushState.bind(history);
history.pushState = (...args) => {
  originalPushState(...args);
  onUrlChange();
};
const originalReplaceState = history.replaceState.bind(history);
history.replaceState = (...args) => {
  originalReplaceState(...args);
  onUrlChange();
};

// 3) Popstate & hashchange
window.addEventListener('popstate', onUrlChange);
window.addEventListener('hashchange', updateButtonVisibility);

// ── Initialize ───────────────────────────────────────────────────────────────

function init() {
  injectNotificationStyles();
  tryInjectWithRetry();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
