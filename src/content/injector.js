import { CONTAINER_SELECTORS, REVIEW_BUTTON_ID, MSG_REVIEW_PR, MSG_REVIEW_UPDATED, MSG_REVIEW_STARTED, STORE_REVIEW_STATUS, DIFF_CHAR_LIMIT } from '../shared/constants.js';
import { BUTTON_CSS } from './styles.js';
import { extractDiff } from './extractor.js';
import { showNotification } from './notification.js';

const SPINNER_SVG = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2Z" fill="white" fill-opacity="0.2"/>
  <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0Z" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/>
  </path>
</svg>`;

let stylesInjected = false;

function injectButtonStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = BUTTON_CSS;
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * Returns true if the current page is a PR diff page.
 */
export function isDiffPage() {
  return location.href.includes('/pull-requests/') && location.href.includes('/diff');
}

/**
 * Shows or hides the review button based on the current URL.
 */
export function updateButtonVisibility() {
  const button = document.getElementById(REVIEW_BUTTON_ID);
  if (button) button.style.display = isDiffPage() ? 'inline-flex' : 'none';
}

/**
 * Creates and injects the "Review this PR" button into the page header.
 * Safe to call multiple times — only injects once.
 */
export function injectReviewButton() {
  if (document.getElementById(REVIEW_BUTTON_ID)) {
    updateButtonVisibility();
    return;
  }

  injectButtonStyles();

  const container = CONTAINER_SELECTORS.reduce(
    (found, sel) => found || document.querySelector(sel), null
  );
  if (!container) return;

  const btn = document.createElement('button');
  btn.id = REVIEW_BUTTON_ID;
  btn.innerHTML = `
    <span class="button-text">Review this PR</span>
    <span class="spinner" style="display:none">${SPINNER_SVG}</span>
  `;
  container.appendChild(btn);
  updateButtonVisibility();

  btn.addEventListener('click', handleReviewClick);
}

/**
 * Handles the button click: extracts diff, sends for review, shows notifications.
 */
async function handleReviewClick() {
  const btn = document.getElementById(REVIEW_BUTTON_ID);
  if (!btn) return;

  const label = btn.querySelector('.button-text');

  btn.classList.add('loading');
  btn.disabled = true;
  label.textContent = 'Reviewing…';

  try {
    const { diff, hasChanges } = extractDiff();

    if (!diff || !hasChanges) {
      showNotification('No changes found in this PR', 'error');
      return;
    }

    if (diff.length > DIFF_CHAR_LIMIT) {
      const kb = Math.round(diff.length / 1024);
      showNotification(`Diff is too large (${kb}KB) to review in one pass. Try reviewing individual files.`, 'error');
      return;
    }

    await chrome.storage.local.set({ [STORE_REVIEW_STATUS]: 'reviewing' });
    chrome.runtime.sendMessage({ action: MSG_REVIEW_STARTED });

    const response = await chrome.runtime.sendMessage({ action: MSG_REVIEW_PR, diff, url: location.href });

    if (!response) {
      showNotification('No response from review process', 'error');
    } else if (response.error) {
      showNotification(`Error: ${response.error}`, 'error');
    } else {
      chrome.runtime.sendMessage({ action: MSG_REVIEW_UPDATED });
      showNotification('Review generated! Click the extension icon to view.', 'success');
    }
  } catch (err) {
    showNotification(`Unexpected error: ${err.message}`, 'error');
  } finally {
    await chrome.storage.local.set({ [STORE_REVIEW_STATUS]: 'idle' });
    btn.classList.remove('loading');
    btn.disabled = false;
    label.textContent = 'Review this PR';
  }
}
