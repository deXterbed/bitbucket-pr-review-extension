# Bitbucket PR Review Extension

This Chrome extension adds a "Review this PR" button to Bitbucket pull request diff pages, allowing you to generate AI-powered code reviews using OpenAI's GPT models.

## Features
- Adds a "Review this PR" button to Bitbucket PR diff pages
- Extracts the diff and sends it to OpenAI for review
- Displays the review in the extension popup
- Securely stores your OpenAI API key locally

## Installation (Local/Development)

1. **Clone or Download the Repository**
   ```sh
   git clone <this-repo-url>
   cd <repo-directory>
   ```

2. **Open Chrome Extensions Page**
   - Go to `chrome://extensions` in your Chrome browser.
   - Enable **Developer mode** (toggle in the top right).

3. **Load the Unpacked Extension**
   - Click **Load unpacked**.
   - Select the root directory of this project (where `manifest.json` is located).

4. **Set Your OpenAI API Key**
   - Click the extension icon in Chrome's toolbar.
   - Enter your OpenAI API key in the popup and save it.

5. **Usage**
   - Navigate to a Bitbucket pull request diff page (URL should contain `/pull-requests/` and `/diff`).
   - Click the "Review this PR" button that appears near the PR header.
   - Wait for the review to be generated. You will see a notification when it's ready.
   - Click the extension icon to view the review in the popup.

## Notes
- The extension only works on Bitbucket PR diff pages (URLs like `https://bitbucket.org/<workspace>/<repo>/pull-requests/<id>/diff`).
- Your OpenAI API key is stored locally and never shared.
- If you update the code, click the **Reload** button on the `chrome://extensions` page to apply changes.

## Troubleshooting
- If the button does not appear, make sure you are on a PR diff page and have reloaded the extension after any code changes.
- Check the extension's permissions and ensure it is enabled.
- If you encounter issues, try removing and re-adding the extension.

## Uninstalling
- Go to `chrome://extensions`, find the extension, and click **Remove**.

---

Feel free to contribute or open issues for improvements!