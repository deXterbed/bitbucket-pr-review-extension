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
You are a code review assistant. Review the provided Git diff for code quality, bugs, security issues, and performance optimizations.
Provide clear, concise feedback in markdown format, using the following structure:

# 🚦 Code Review Feedback

## 📝 Overview
- Briefly summarize what the diff changes.

## ✅ Strengths
- List positive aspects or improvements in this PR.

## ⚠️ Issues & Suggestions
- List any issues, bugs, or code smells found.
- Provide actionable suggestions for improvement.

## 🔒 Security
- Mention any security concerns or confirm if none found.

## 🚀 Performance
- Mention any performance improvements or concerns.

## 🧹 Style & Best Practices
- Note any style, naming, or best practice issues.

---

**Summary:**
- Give a short summary and, if appropriate, a recommendation (approve, needs changes, etc.).

Use markdown formatting, bullet points, and emojis for clarity and readability.`
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