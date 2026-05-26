import { OPENAI_API_URL, OPENAI_MODEL, OPENAI_MAX_TOKENS } from '../shared/constants.js';
import { SYSTEM_PROMPT, buildUserMessage } from '../shared/prompt.js';

/**
 * Calls the OpenAI Chat Completions API to generate a code review.
 * @param {string} diff - The Git diff text.
 * @param {string} apiKey - OpenAI API key.
 * @returns {Promise<string>} The review markdown.
 */
export async function requestReview(diff, apiKey) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(diff) },
      ],
      max_tokens: OPENAI_MAX_TOKENS,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body.error?.message || `HTTP ${response.status}`;
    throw new Error(`OpenAI API request failed: ${msg}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`);
  }

  return data.choices[0].message.content;
}
