import {
  DIFF_FILE_SELECTOR,
  FILEPATH_SELECTOR,
  DIFF_CHUNK_SELECTOR,
  CHUNK_HEADING_SELECTOR,
  CHUNK_HEADING_MIDDLE_SELECTOR,
  CODE_LINE_SELECTOR,
} from '../shared/constants.js';

/**
 * Extracts a unified-diff-style text from the Bitbucket PR diff page.
 * @returns {{ diff: string, hasChanges: boolean }}
 */
export function extractDiff() {
  const fileBlocks = document.querySelectorAll(DIFF_FILE_SELECTOR);
  let diff = '';
  let hasChanges = false;

  for (const block of fileBlocks) {
    const fileHeader = block.querySelector(FILEPATH_SELECTOR);
    const fileName = fileHeader ? fileHeader.textContent.trim() : 'unknown_file';

    diff += `diff --git a/${fileName} b/${fileName}\n`;
    diff += `--- a/${fileName}\n`;
    diff += `+++ b/${fileName}\n`;

    const hunks = block.querySelectorAll(DIFF_CHUNK_SELECTOR);
    for (const hunk of hunks) {
      const hunkHeader = hunk.querySelector(CHUNK_HEADING_SELECTOR);
      if (hunkHeader) diff += `${hunkHeader.textContent.trim()}\n`;

      const hunkMiddle = hunk.querySelector(CHUNK_HEADING_MIDDLE_SELECTOR);
      if (hunkMiddle) diff += `${hunkMiddle.textContent.trim()}\n`;

      const lines = hunk.querySelectorAll(CODE_LINE_SELECTOR);
      for (const line of lines) {
        const text = line.textContent;
        diff += `${text}\n`;
        if (text.startsWith('+') || text.startsWith('-')) hasChanges = true;
      }
    }
  }

  return { diff, hasChanges };
}
