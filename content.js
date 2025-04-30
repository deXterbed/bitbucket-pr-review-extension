const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `pr-review-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

function injectStyles() {
  const notificationStyle = document.createElement('style');
  notificationStyle.textContent = `
    .pr-review-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pr-review-notification.success {
      background-color: #36B37E;
    }
    .pr-review-notification.error {
      background-color: #FF5630;
    }
    .pr-review-notification.info {
      background-color: #0052CC;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;

  const buttonStyle = document.createElement('style');
  buttonStyle.textContent = `
    #review-pr-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-left: 10px;
      padding: 6px 12px;
      background-color: #2684FF;
      color: #FFFFFF;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      transition: background-color 0.2s;
      box-shadow: 0 1px 2px rgba(9, 30, 66, 0.08);
    }
    #review-pr-button:hover {
      background-color: #0065FF;
    }
    #review-pr-button:active {
      background-color: #0747A6;
    }
    #review-pr-button:disabled {
      background-color: #B3D4FF;
      cursor: not-allowed;
    }
    #review-pr-button .spinner {
      display: none;
    }
    #review-pr-button.loading .spinner {
      display: inline-block;
    }
  `;

  if (document.head) {
    document.head.appendChild(notificationStyle);
    document.head.appendChild(buttonStyle);
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      if (document.head) {
        document.head.appendChild(notificationStyle);
        document.head.appendChild(buttonStyle);
        obs.disconnect();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}

function isPRDiffPage() {
  const url = window.location.href;
  return url.includes('/pull-requests/') && url.includes('/diff');
}

function updateButtonVisibility() {
  const button = document.querySelector('#review-pr-button');
  if (button) {
    button.style.display = isPRDiffPage() ? 'inline-flex' : 'none';
  }
}

function injectReviewButton() {
  if (document.querySelector('#review-pr-button')) {
    updateButtonVisibility();
    return;
  }

  const selectors = [
    '[data-qa="pr-branches-and-state-styles"]',
    '[data-testid="pull-request-header-right"]',
    '.pull-request-header',
    '.pr-header-actions',
    '#pr-menu'
  ];

  const container = selectors.reduce((found, selector) =>
    found || document.querySelector(selector), null);

  if (!container) return;

  const reviewButton = document.createElement('button');
  reviewButton.id = 'review-pr-button';
  reviewButton.innerHTML = `
    <span class="button-text">Review this PR</span>
    <span class="spinner" style="display: none;">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2Z" fill="white" fill-opacity="0.2"/>
        <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0Z" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
    </span>
  `;
  container.appendChild(reviewButton);
  updateButtonVisibility();

  reviewButton.addEventListener('click', () => {
    reviewButton.classList.add('loading');
    reviewButton.disabled = true;
    reviewButton.querySelector('.button-text').textContent = 'Reviewing…';

    const extractDiff = () => {
      const fileBlocks = document.querySelectorAll('[data-qa="branch-diff-file"]');
      let diffText = '';
      let hasChanges = false;

      fileBlocks.forEach(fileBlock => {
        const fileHeader = fileBlock.querySelector('[data-qa="bk-filepath"]');
        const fileName = fileHeader ? fileHeader.textContent.trim() : 'unknown_file';
        diffText += `diff --git a/${fileName} b/${fileName}\n`;
        diffText += `--- a/${fileName}\n`;
        diffText += `+++ b/${fileName}\n`;

        const hunks = fileBlock.querySelectorAll('.diff-chunk');
        hunks.forEach(hunk => {
          const hunkHeader = hunk.querySelector('.chunk-heading');
          if (hunkHeader) {
            diffText += `${hunkHeader.textContent.trim()}\n`;
          }
          const hunkHeaderMiddle = hunk.querySelector('.chunk-heading-middle');
          if (hunkHeaderMiddle) {
            diffText += `${hunkHeaderMiddle.textContent.trim()}\n`;
          }

          const lines = hunk.querySelectorAll('.code-component');
          lines.forEach(line => {
            const lineContent = line.textContent;
            diffText += `${lineContent}\n`;
            if (lineContent.startsWith('+') || lineContent.startsWith('-')) hasChanges = true;
          });
        });
      });

      if (diffText && hasChanges) {
        chrome.runtime.sendMessage({ action: "reviewPR", diff: diffText }, (response) => {
          reviewButton.classList.remove('loading');
          reviewButton.disabled = false;
          reviewButton.querySelector('.button-text').textContent = 'Review this PR';

          if (!response) {
            showNotification('No response from review process', 'error');
          } else if (response.error) {
            showNotification(`Error: ${response.error}`, 'error');
          } else {
            chrome.runtime.sendMessage({ action: "reviewUpdated" });
            showNotification('Review generated! Please click the extension icon to view.', 'success');
          }
        });
      } else {
        showNotification('No changes found in this PR', 'error');
        reviewButton.classList.remove('loading');
        reviewButton.disabled = false;
        reviewButton.querySelector('.button-text').textContent = 'Review this PR';
      }
    };
    extractDiff();
  });
}

function initialize() {
  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleUrlChange);
  } else {
    handleUrlChange();
  }
}

function handleUrlChange() {
  injectReviewButton();

  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    if (document.querySelector('#review-pr-button')) {
      updateButtonVisibility();
      clearInterval(interval);
      return;
    }
    if (attempts >= maxAttempts) {
      clearInterval(interval);
      return;
    }
    injectReviewButton();
    attempts++;
  }, 500);
}

let lastUrl = location.href;

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    handleUrlChange();
  }
});

observer.observe(document, { subtree: true, childList: true });

const pushState = history.pushState;
history.pushState = function() {
  pushState.apply(history, arguments);
  handleUrlChange();
};

const replaceState = history.replaceState;
history.replaceState = function() {
  replaceState.apply(history, arguments);
  handleUrlChange();
};

window.addEventListener('popstate', () => {
  handleUrlChange();
});

window.addEventListener('hashchange', () => {
  updateButtonVisibility();
});

let lastPathname = location.pathname;
const pathnameObserver = new MutationObserver(() => {
  if (location.pathname !== lastPathname) {
    lastPathname = location.pathname;
    updateButtonVisibility();
  }
});

initialize();