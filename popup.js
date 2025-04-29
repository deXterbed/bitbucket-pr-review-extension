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
        let html = result.latestReview;

        // Convert code blocks (```lang\ncode\n```)
        html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
          // Escape HTML in code
          code = code.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
          return `<pre><code class="language-${lang || 'plaintext'}">${code}</code></pre>`;
        });

        // Inline code: `code`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold: **text**
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Headings
        html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

        // Lists
        html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

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
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "reviewUpdated") {
      loadReview();
    }
  });
});