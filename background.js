chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "reviewPR") {
    const diff = request.diff;
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      const apiKey = result.openaiApiKey;
      if (!apiKey) {
        sendResponse({ error: "OpenAI API key not set. Please set it in the extension popup." });
        return;
      }

      // Call OpenAI API
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are a senior code reviewer. Analyze the provided Git diff for:
- Code quality, logic, and correctness
- Bugs, edge cases, and potential runtime errors
- Security vulnerabilities and data privacy issues
- Performance and scalability concerns
- Maintainability, readability, and adherence to best practices

Format your response in markdown using this structure:

# 🚦 Code Review Feedback

## ⚠️ Issues & Suggestions
- Description, code block in question, and suggested code block

## 🔒 Security
- Security concerns or confirmation if none found.

## 🚀 Performance
- Performance improvements or concerns.

## 🧹 Style & Best Practices
- Style, naming, or best practice issues.

**Summary:**
- Short summary and recommendation (approve, needs changes, etc.).
`
            },
            {
              role: "user",
              content: `Review this branch diff:\n${diff}`
            }
          ],
          max_tokens: 1000
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          sendResponse({ error: "OpenAI API request failed", details: data.error.message });
        } else {
          const review = data.choices[0].message.content;
          // Store the review in chrome.storage.local
          chrome.storage.local.set({ latestReview: review }, () => {
            sendResponse({ review: review });
          });
        }
      })
      .catch(error => {
        sendResponse({ error: "Failed to fetch review", details: error.message });
      });
    });
    return true; // Keep the message channel open for async response
  }
});

// Listen for reviewUpdated message to show badge
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reviewUpdated') {
    chrome.action.setBadgeText({ text: '1' });
    chrome.action.setBadgeBackgroundColor({ color: '#36B37E' }); // green
    chrome.action.setBadgeTextColor && chrome.action.setBadgeTextColor({ color: '#fff' });
    // Set badge position to top left if supported (not all browsers support this, but Chrome does for Manifest V3)
    if (chrome.action.setBadgeGravity) {
      chrome.action.setBadgeGravity({ gravity: 'top-left' });
    }
  }
});

// Clear badge when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});