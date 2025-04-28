// Run on Bitbucket PR diff pages
if (window.location.href.includes('/pull-requests/') && window.location.href.includes('/diff')) {
  // Wait for the page to load
  window.addEventListener('load', () => {
    // Add the "Review this PR" button in the branches and state section
    const branchesSection = document.querySelector('[data-qa="pr-branches-and-state-styles"]');
    if (branchesSection && !document.querySelector('#review-pr-button')) {
      const reviewButton = document.createElement('button');
      reviewButton.id = 'review-pr-button';
      reviewButton.textContent = 'Review this PR';
      reviewButton.style.marginLeft = '10px';
      reviewButton.style.padding = '5px 10px';
      reviewButton.style.backgroundColor = '#007bff';
      reviewButton.style.color = 'white';
      reviewButton.style.border = 'none';
      reviewButton.style.borderRadius = '3px';
      reviewButton.style.cursor = 'pointer';
      branchesSection.appendChild(reviewButton);

      reviewButton.addEventListener('click', () => {
        reviewButton.textContent = 'Reviewing...';
        reviewButton.disabled = true;

        // Function to attempt extracting the diff with retries
        const extractDiffWithRetry = (retries = 10, delay = 2000) => {
          console.log('Attempting to extract diff...');
          const diffLines = document.querySelectorAll('.lines-wrapper .code-component');
          console.log(`Found ${diffLines.length} diff lines with selector .lines-wrapper .code-component`);
          
          let diffText = '';
          if (diffLines.length > 0) {
            diffLines.forEach(line => {
              const lineTypeElement = line.parentElement.querySelector('.diff-line-type');
              if (lineTypeElement) {
                const lineType = lineTypeElement.textContent.trim(); // "+", "-", or " "
                const lineContent = line.textContent.trim();
                // Remove the line type prefix from the content and use the extracted lineType
                const cleanedContent = lineContent.replace(/^[+\-\s]/, '').trim();
                diffText += `${lineType} ${cleanedContent}\n`;
                console.log(`Extracted line: ${lineType} ${cleanedContent}`);
              }
            });
          } else {
            console.log('No diff lines found with .lines-wrapper .code-component');
          }

          if (diffText) {
            console.log('Diff extracted successfully:', diffText);
            // Diff found, proceed with the review
            chrome.runtime.sendMessage({ action: "reviewPR", diff: diffText }, (response) => {
              console.log('Received response from background script:', response);
              reviewButton.textContent = 'Review this PR';
              reviewButton.disabled = false;

              if (!response) {
                console.error('No response received from background script');
                alert('No response from review process. Check console for details.');
              } else if (response.error) {
                console.error('Error from API request:', response.error, response.details);
                alert(`Error: ${response.error}\nDetails: ${response.details || 'N/A'}`);
              } else {
                // Notify the popup to refresh the review
                chrome.runtime.sendMessage({ action: "reviewUpdated" }, (updateResponse) => {
                  console.log('Review updated message sent:', updateResponse);
                  if (chrome.runtime.lastError) {
                    console.error('Error sending reviewUpdated message:', chrome.runtime.lastError.message);
                  }
                  // Alert the user to manually open the popup
                  alert('Review generated successfully! Please click the extension icon to view the review.');
                });
              }
            });
          } else if (retries > 0) {
            // No diff found, retry after a delay
            console.log(`Diff not found, retrying... (${retries} attempts left)`);
            setTimeout(() => extractDiffWithRetry(retries - 1, delay), delay);
          } else {
            // Out of retries, show alert
            console.log('No diff found after all retries.');
            alert('No diff found on this PR page after retries.');
            reviewButton.textContent = 'Review this PR';
            reviewButton.disabled = false;
          }
        };

        // Start the diff extraction with retries
        extractDiffWithRetry();
      });
    } else {
      console.log('Branches section not found with selector [data-qa="pr-branches-and-state-styles"]');
    }
  });
}