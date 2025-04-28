document.addEventListener('DOMContentLoaded', () => {
  const apiKeySection = document.getElementById('apiKeySection');
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const settingsButton = document.getElementById('settingsButton');
  const reviewSection = document.getElementById('reviewSection');
  const reviewContent = document.getElementById('reviewContent');

  // Function to load and display the review
  const loadReview = () => {
    chrome.storage.local.get(['latestReview'], (result) => {
      if (result.latestReview) {
        reviewSection.style.display = 'block';
        // Basic markdown rendering
        let html = result.latestReview
          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
          .replace(/^- (.*$)/gm, '<li>$1</li>')
          .replace(/^```([a-z]*)\n([\s\S]*?)```$/gm, '<pre><code class="$1">$2</code></pre>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        // Wrap list items in <ul>
        html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
        reviewContent.innerHTML = html;
      } else {
        reviewSection.style.display = 'none';
      }
    });
  };

  // Function to toggle API key section visibility
  const toggleApiKeySection = () => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        // API key exists, hide the input section and show the settings button
        apiKeySection.style.display = 'none';
        settingsButton.style.display = 'block';
      } else {
        // No API key, show the input section and hide the settings button
        apiKeySection.style.display = 'block';
        settingsButton.style.display = 'none';
        apiKeyInput.value = '';
      }
    });
  };

  // Load review and API key section when popup opens
  loadReview();
  toggleApiKeySection();

  // Save API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
        alert('API key saved successfully!');
        toggleApiKeySection();
      });
    } else {
      alert('Please enter a valid API key.');
    }
  });

  // Settings button to clear the API key
  settingsButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the OpenAI API key?')) {
      chrome.storage.local.remove('openaiApiKey', () => {
        alert('API key cleared successfully.');
        toggleApiKeySection();
      });
    }
  });

  // Listen for review updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "reviewUpdated") {
      console.log('Popup received reviewUpdated message');
      loadReview();
    }
  });
});