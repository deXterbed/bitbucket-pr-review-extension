// ── DOM Selectors ────────────────────────────────────────────────────────────
export const CONTAINER_SELECTORS = [
  '[data-qa="pr-branches-and-state-styles"]',
  '[data-testid="pull-request-header-right"]',
  '.pull-request-header',
  '.pr-header-actions',
  '#pr-menu',
];

export const DIFF_FILE_SELECTOR = '[data-qa="branch-diff-file"]';
export const FILEPATH_SELECTOR = '[data-qa="bk-filepath"]';
export const DIFF_CHUNK_SELECTOR = '.diff-chunk';
export const CHUNK_HEADING_SELECTOR = '.chunk-heading';
export const CHUNK_HEADING_MIDDLE_SELECTOR = '.chunk-heading-middle';
export const CODE_LINE_SELECTOR = '.code-component';

// ── Button IDs ───────────────────────────────────────────────────────────────
export const REVIEW_BUTTON_ID = 'review-pr-button';

// ── Message Actions ──────────────────────────────────────────────────────────
export const MSG_REVIEW_PR = 'reviewPR';
export const MSG_REVIEW_UPDATED = 'reviewUpdated';
export const MSG_REVIEW_STARTED = 'reviewStarted';

// ── Storage Keys ─────────────────────────────────────────────────────────────
export const STORE_API_KEY = 'openaiApiKey';
export const STORE_LATEST_REVIEW = 'latestReview';
export const STORE_REVIEW_META = 'reviewMeta';
export const STORE_REVIEW_STATUS = 'reviewStatus';

// ── API ──────────────────────────────────────────────────────────────────────
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_MODEL = 'gpt-4o';
export const OPENAI_MAX_TOKENS = 4000;
export const DIFF_CHAR_LIMIT = 100000;
export const STORE_MODEL = 'openaiModel';

// ── UI ───────────────────────────────────────────────────────────────────────
export const NOTIFICATION_DURATION_MS = 3000;
export const INJECTION_RETRY_MS = 500;
export const INJECTION_MAX_ATTEMPTS = 20;
