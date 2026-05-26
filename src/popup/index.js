import { marked } from 'marked';
import { MSG_REVIEW_UPDATED, STORE_API_KEY, STORE_LATEST_REVIEW } from '../shared/constants.js';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// ── DOM refs ─────────────────────────────────────────────────────────────────

const apiKeySection = document.getElementById('apiKeySection');
const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('saveButton');
const settingsButton = document.getElementById('settingsButton');
const reviewSection = document.getElementById('reviewSection');
const reviewContent = document.getElementById('reviewContent');

// ── Review rendering ─────────────────────────────────────────────────────────

function renderReview(markdown) {
  reviewSection.style.display = 'block';
  reviewContent.innerHTML = marked.parse(markdown);
}

async function loadReview() {
  const { [STORE_LATEST_REVIEW]: review } = await chrome.storage.local.get(STORE_LATEST_REVIEW);
  if (review) {
    renderReview(review);
  } else {
    reviewSection.style.display = 'none';
  }
}

// ── API key management ───────────────────────────────────────────────────────

async function loadApiKey() {
  const { [STORE_API_KEY]: key } = await chrome.storage.local.get(STORE_API_KEY);
  return key;
}

async function updateApiKeyUI() {
  const key = await loadApiKey();
  if (key) {
    apiKeySection.style.display = 'none';
    settingsButton.style.display = 'block';
  } else {
    apiKeySection.style.display = 'block';
    settingsButton.style.display = 'none';
    apiKeyInput.value = '';
  }
}

saveButton.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    alert('Please enter a valid API key.');
    return;
  }
  await chrome.storage.local.set({ [STORE_API_KEY]: key });
  alert('API key saved successfully!');
  await updateApiKeyUI();
});

settingsButton.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to clear the OpenAI API key?')) return;
  await chrome.storage.local.remove(STORE_API_KEY);
  alert('API key cleared successfully.');
  await updateApiKeyUI();
});

// ── Live updates ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === MSG_REVIEW_UPDATED) {
    loadReview();
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadReview();
  await updateApiKeyUI();
});
