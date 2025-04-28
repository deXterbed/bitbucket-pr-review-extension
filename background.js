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
              content: "You are a code review assistant. Review the provided Git diff for code quality, bugs, security issues, and performance optimizations. Provide clear, concise feedback in markdown format."
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