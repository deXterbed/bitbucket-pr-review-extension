import { NOTIFICATION_CSS } from './styles.js';
import { NOTIFICATION_DURATION_MS } from '../shared/constants.js';

const NOTIFICATION_CLASS = 'pr-review-notification';

/**
 * Shows a toast notification on the page.
 * @param {string} message - The text to display.
 * @param {'success'|'error'|'info'} type - Notification style.
 */
export function showNotification(message, type = 'info') {
  const existing = document.querySelector(`.${NOTIFICATION_CLASS}`);
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = `${NOTIFICATION_CLASS} ${type}`;
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, NOTIFICATION_DURATION_MS);
}

/**
 * Injects notification styles into the document <head>.
 * Safe to call multiple times — only injects once.
 */
let stylesInjected = false;
export function injectNotificationStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = NOTIFICATION_CSS;
  document.head.appendChild(style);
  stylesInjected = true;
}
