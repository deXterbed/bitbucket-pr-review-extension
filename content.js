// Run on Bitbucket PR diff pages
if (window.location.href.includes('/pull-requests/') && window.location.href.includes('/diff')) {
  // Add notification styles
  const style = document.createElement('style');
  style.textContent = `
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
  document.head.appendChild(style);

  // Function to show notifications
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

  // Wait for the page to load
  window.addEventListener('load', () => {
    // Function to inject the Review button
    function injectReviewButton() {
      const branchesSection = document.querySelector('[data-qa="pr-branches-and-state-styles"]');
      if (branchesSection && !document.querySelector('#review-pr-button')) {
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
        branchesSection.appendChild(reviewButton);

        reviewButton.addEventListener('click', () => {
          reviewButton.classList.add('loading');
          reviewButton.disabled = true;
          reviewButton.querySelector('.button-text').textContent = 'Reviewing…';

          // Function to attempt extracting the diff with retries
          const extractDiffWithRetry = (retries = 10, delay = 2000) => {
            console.log('Attempting to extract diff...');
            showNotification('Extracting diff content...', 'info');

            const diffLines = document.querySelectorAll('.lines-wrapper .code-component');
            console.log(`Found ${diffLines.length} diff lines with selector .lines-wrapper .code-component`);

            let diffText = '';
            let hasChanges = false;

            if (diffLines.length > 0) {
              diffLines.forEach(line => {
                const lineTypeElement = line.parentElement.querySelector('.diff-line-type');
                if (lineTypeElement) {
                  const lineType = lineTypeElement.textContent.trim();
                  const lineContent = line.textContent.trim();

                  // Skip empty lines and unchanged lines
                  if (lineContent && lineType !== ' ') {
                    hasChanges = true;
                    const cleanedContent = lineContent.replace(/^[+\-\s]/, '').trim();
                    diffText += `${lineType} ${cleanedContent}\n`;
                    console.log(`Extracted line: ${lineType} ${cleanedContent}`);
                  }
                }
              });
            } else {
              console.log('No diff lines found with .lines-wrapper .code-component');
            }

            if (diffText && hasChanges) {
              console.log('Diff extracted successfully:', diffText);
              showNotification('Diff extracted successfully', 'success');

              // Send the diff to the background script for review
              chrome.runtime.sendMessage({ action: "reviewPR", diff: diffText }, (response) => {
                console.log('Received response from background script:', response);
                reviewButton.classList.remove('loading');
                reviewButton.disabled = false;
                reviewButton.querySelector('.button-text').textContent = 'Review this PR';

                if (!response) {
                  console.error('No response received from background script');
                  showNotification('No response from review process', 'error');
                } else if (response.error) {
                  console.error('Error from API request:', response.error, response.details);
                  showNotification(`Error: ${response.error}`, 'error');
                } else {
                  // Notify the popup to refresh the review
                  chrome.runtime.sendMessage({ action: "reviewUpdated" });
                  showNotification('Review generated successfully! Click the extension icon to view.', 'success');
                }
              });
            } else if (retries > 0) {
              // No diff found, retry after a delay
              console.log(`Diff not found, retrying... (${retries} attempts left)`);
              showNotification(`Retrying diff extraction... (${retries} attempts left)`, 'info');
              setTimeout(() => extractDiffWithRetry(retries - 1, delay), delay);
            } else {
              // Out of retries, show alert
              console.log('No diff found after all retries.');
              showNotification('No changes found in this PR', 'error');
              reviewButton.classList.remove('loading');
              reviewButton.disabled = false;
              reviewButton.querySelector('.button-text').textContent = 'Review this PR';
            }
          };
          extractDiffWithRetry();
        });
      }
    }

    // Initial injection
    injectReviewButton();

    // MutationObserver to keep the button present
    const targetNode = document.querySelector('main') || document.body;
    const observer = new MutationObserver(() => {
      injectReviewButton();
    });
    observer.observe(targetNode, { childList: true, subtree: true });

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
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
    document.head.appendChild(style);
  });
}