import { MSG_REVIEW_PR, MSG_REVIEW_UPDATED, STORE_API_KEY, STORE_LATEST_REVIEW } from '../shared/constants.js';
import { requestReview } from './reviewer.js';

/**
 * Handles a review request: fetches the API key, calls OpenAI, stores the result.
 */
async function handleReviewPR(request, sendResponse) {
  try {
    const { [STORE_API_KEY]: apiKey } = await chrome.storage.local.get(STORE_API_KEY);

    if (!apiKey) {
      sendResponse({ error: 'OpenAI API key not set. Please set it in the extension popup.' });
      return;
    }

    const review = await requestReview(request.diff, apiKey);

    await chrome.storage.local.set({ [STORE_LATEST_REVIEW]: review });
    sendResponse({ review });
  } catch (err) {
    sendResponse({ error: err.message || 'Unknown error during review.' });
  }
}

/**
 * Updates the extension badge to notify the user a review is ready.
 */
function handleReviewUpdated() {
  chrome.action.setBadgeText({ text: '1' });
  chrome.action.setBadgeBackgroundColor({ color: '#36B37E' });
  if (chrome.action.setBadgeTextColor) {
    chrome.action.setBadgeTextColor({ color: '#fff' });
  }
}

// ── Message routing ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === MSG_REVIEW_PR) {
    handleReviewPR(request, sendResponse);
    return true; // keep channel open for async response
  }

  if (request.action === MSG_REVIEW_UPDATED) {
    handleReviewUpdated();
  }
});

// Clear badge when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});
