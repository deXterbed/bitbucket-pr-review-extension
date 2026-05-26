# Bitbucket PR Review Extension

A Chrome extension that adds a "Review this PR" button to Bitbucket pull request diff pages, generating AI-powered code reviews using OpenAI's GPT models.

## Features

- Adds a **"Review this PR"** button to Bitbucket PR diff pages
- Extracts the diff from the page and sends it to OpenAI for review
- Displays the review as formatted Markdown in the extension popup (rendered with `marked`)
- Securely stores your OpenAI API key locally via `chrome.storage.local`
- Green badge notification when a review is ready

## Project Structure

```
├── src/
│   ├── background/             # Service worker
│   │   ├── index.js            # Message routing & badge handling
│   │   └── reviewer.js         # OpenAI API call
│   ├── content/                # Content script
│   │   ├── index.js            # Orchestrator & URL change detection
│   │   ├── injector.js         # Button injection & click handler
│   │   ├── extractor.js        # Diff extraction from DOM
│   │   ├── notification.js     # Toast notifications
│   │   └── styles.js           # Injected CSS
│   ├── popup/                  # Extension popup
│   │   ├── index.js            # UI logic (uses marked)
│   │   ├── index.html
│   │   └── styles.css
│   └── shared/                 # Shared modules
│       ├── constants.js        # Selectors, storage keys, config
│       └── prompt.js           # Review prompt template
├── icons/
│   └── 128.png
├── manifest.json               # Extension manifest (flat references)
├── build.js                    # Build script (esbuild + clean-css)
└── package.json                # Dependencies & scripts
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+

### Setup

```sh
git clone git@github.com:deXterbed/bitbucket-pr-review-extension.git
cd bitbucket-pr-review-extension
npm install
```

### Build

```sh
npm run build   # Bundles & minifies to dist/
npm run zip     # Creates bitbucket-pr-review-extension-vX.X.X.zip
npm run clean   # Removes dist/ and *.zip
```

### Load in Chrome

1. Go to `chrome://extensions`, enable **Developer mode**
2. Click **Load unpacked** and select the `dist/` directory
3. Click the extension icon, enter your OpenAI API key, and save

### Usage

1. Navigate to a Bitbucket PR diff page (`/pull-requests/*/diff`)
2. Click the **"Review this PR"** button in the PR header
3. Wait for the green badge to appear, then click the extension icon to view the review

## Development

The source files under `src/` use ES modules. The build script uses [esbuild](https://esbuild.github.io/) to bundle each entry point (background, content, popup) into IIFE format targeting Chrome 120+, and [clean-css](https://github.com/clean-css/clean-css) for CSS minification. After making changes, run `npm run build` and reload the extension in `chrome://extensions`.

## Troubleshooting

- **Button not appearing?** Make sure you're on a PR diff page, reload the extension, and check the console for errors.
- **Review fails?** Verify your OpenAI API key is set, has quota available, and the extension has the required permissions.
- **Build issues?** Delete `dist/` and `node_modules/`, then run `npm install && npm run build`.

## Uninstalling

Go to `chrome://extensions`, find the extension, and click **Remove**.
