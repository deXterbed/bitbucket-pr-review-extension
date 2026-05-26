import { marked } from 'marked';
import {
  MSG_REVIEW_UPDATED, MSG_REVIEW_STARTED,
  STORE_API_KEY, STORE_LATEST_REVIEW, STORE_REVIEW_META, STORE_REVIEW_STATUS,
  STORE_MODEL, OPENAI_MODEL,
} from '../shared/constants.js';

marked.setOptions({ breaks: true, gfm: true });

// ── DOM refs ──────────────────────────────────────────────────────────────────

const apiKeySection    = document.getElementById('apiKeySection');
const apiKeyInput      = document.getElementById('apiKey');
const saveButton       = document.getElementById('saveButton');
const apiKeyFeedback   = document.getElementById('apiKeyFeedback');
const settingsButton   = document.getElementById('settingsButton');
const settingsPanel    = document.getElementById('settingsPanel');
const modelInput       = document.getElementById('modelInput');
const saveModelBtn     = document.getElementById('saveModelBtn');
const clearKeyBtn      = document.getElementById('clearKeyBtn');
const confirmClearRow  = document.getElementById('confirmClearRow');
const confirmClearBtn  = document.getElementById('confirmClearBtn');
const cancelClearBtn   = document.getElementById('cancelClearBtn');
const modelFeedback    = document.getElementById('modelFeedback');
const reviewSection    = document.getElementById('reviewSection');
const loadingState     = document.getElementById('loadingState');
const emptyState       = document.getElementById('emptyState');
const reviewCard       = document.getElementById('reviewCard');
const reviewContent    = document.getElementById('reviewContent');
const metaUrl          = document.getElementById('metaUrl');
const metaTime         = document.getElementById('metaTime');
const copyButton       = document.getElementById('copyButton');

// ── Helpers ───────────────────────────────────────────────────────────────────

function highlightDiffLines(container) {
  container.querySelectorAll('pre code').forEach((block) => {
    const lines = block.innerHTML.split('\n');
    const wrapped = lines
      .filter((line) => line.replace(/<[^>]+>/g, '').trim() !== '')
      .map((line) => {
        const text = line.replace(/<[^>]+>/g, '');
        if (text.startsWith('+')) return `<span class="diff-add">${line}</span>`;
        if (text.startsWith('-')) return `<span class="diff-remove">${line}</span>`;
        return `<span class="diff-neutral">${line}</span>`;
      });
    block.innerHTML = wrapped.join('\n');
  });
}

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function showFeedback(message, isError = false) {
  apiKeyFeedback.textContent = message;
  apiKeyFeedback.className = `feedback-msg ${isError ? 'error' : 'success'}`;
  setTimeout(() => { apiKeyFeedback.className = 'feedback-msg'; }, 3000);
}

// ── Review states ─────────────────────────────────────────────────────────────

function showLoading() {
  loadingState.style.display  = 'flex';
  emptyState.style.display    = 'none';
  reviewCard.style.display    = 'none';
  copyButton.style.display    = 'none';
}

function showEmpty() {
  loadingState.style.display  = 'none';
  emptyState.style.display    = 'flex';
  reviewCard.style.display    = 'none';
  copyButton.style.display    = 'none';
}

function showReview(markdown, meta) {
  loadingState.style.display  = 'none';
  emptyState.style.display    = 'none';
  reviewCard.style.display    = 'block';
  copyButton.style.display    = 'flex';

  reviewContent.innerHTML = marked.parse(markdown);
  highlightDiffLines(reviewContent);

  if (meta?.url) {
    metaUrl.textContent = meta.url.replace(/^https?:\/\//, '');
    metaUrl.href = meta.url;
  }
  metaTime.textContent = meta?.timestamp ? formatRelativeTime(meta.timestamp) : '';
}

async function loadReview() {
  const result = await chrome.storage.local.get([
    STORE_LATEST_REVIEW, STORE_REVIEW_META, STORE_REVIEW_STATUS,
  ]);

  reviewSection.style.display = 'block';

  if (result[STORE_REVIEW_STATUS] === 'reviewing') {
    showLoading();
  } else if (result[STORE_LATEST_REVIEW]) {
    showReview(result[STORE_LATEST_REVIEW], result[STORE_REVIEW_META]);
  } else {
    showEmpty();
  }
}

// ── API key management ────────────────────────────────────────────────────────

async function updateApiKeyUI() {
  const { [STORE_API_KEY]: key, [STORE_MODEL]: model } =
    await chrome.storage.local.get([STORE_API_KEY, STORE_MODEL]);
  if (key) {
    apiKeySection.style.display = 'none';
    settingsButton.style.display = 'flex';
    modelInput.value = model || OPENAI_MODEL;
    await loadReview();
  } else {
    apiKeySection.style.display = 'block';
    settingsButton.style.display = 'none';
    reviewSection.style.display = 'none';
    settingsPanel.style.display = 'none';
  }
}

saveButton.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showFeedback('Please enter a valid API key.', true);
    return;
  }
  await chrome.storage.local.set({ [STORE_API_KEY]: key });
  apiKeyInput.value = '';
  showFeedback('API key saved!');
  await updateApiKeyUI();
});

// ── Settings panel ────────────────────────────────────────────────────────────

settingsButton.addEventListener('click', () => {
  const isOpen = settingsPanel.style.display !== 'none';
  settingsPanel.style.display = isOpen ? 'none' : 'block';
  confirmClearRow.style.display = 'none';
  modelFeedback.textContent = '';
});

saveModelBtn.addEventListener('click', async () => {
  const model = modelInput.value.trim();
  if (!model) return;
  await chrome.storage.local.set({ [STORE_MODEL]: model });
  modelFeedback.textContent = 'Saved!';
  setTimeout(() => { modelFeedback.textContent = ''; }, 2000);
});

clearKeyBtn.addEventListener('click', () => {
  confirmClearRow.style.display = 'flex';
});

confirmClearBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(STORE_API_KEY);
  settingsPanel.style.display = 'none';
  confirmClearRow.style.display = 'none';
  await updateApiKeyUI();
});

cancelClearBtn.addEventListener('click', () => {
  confirmClearRow.style.display = 'none';
});

// ── Copy button ───────────────────────────────────────────────────────────────

copyButton.addEventListener('click', async () => {
  const html = reviewContent.innerHTML;
  const text = reviewContent.innerText;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(text);
  }

  const original = copyButton.innerHTML;
  copyButton.textContent = 'Copied!';
  copyButton.classList.add('copied');
  setTimeout(() => {
    copyButton.innerHTML = original;
    copyButton.classList.remove('copied');
  }, 2000);
});

// ── Live updates ──────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === MSG_REVIEW_STARTED) {
    reviewSection.style.display = 'block';
    showLoading();
  }
  if (request.action === MSG_REVIEW_UPDATED) {
    loadReview();
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  chrome.action.setBadgeText({ text: '' });
  await updateApiKeyUI();
});
