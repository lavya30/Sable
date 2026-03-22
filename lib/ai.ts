/**
 * Client-side AI helper for the desktop app.
 *
 * Instead of routing through a Next.js API route (which doesn't exist in
 * the packaged Electron build), we call the OpenAI API directly from the
 * renderer process. This is safe for a desktop app because the API key
 * never leaves the user's own machine.
 */

export type AgentAction = 'fix_grammar' | 'rewrite' | 'summarize' | 'continue';

const MAX_TEXT_LENGTH = 10000;
const MAX_CONTEXT_LENGTH = 20000;

function buildTaskPrompt(action: AgentAction, text: string, instruction?: string): string {
  const extra = instruction?.trim() ? `\nExtra instruction: ${instruction.trim()}` : '';

  if (action === 'fix_grammar') {
    return [
      'Task: Fix grammar, spelling, and punctuation.',
      'Keep meaning and tone the same.',
      'Do not add commentary. Return only revised text.',
      extra,
      '',
      'Text:',
      text,
    ].join('\n');
  }

  if (action === 'rewrite') {
    return [
      'Task: Rewrite the text for clarity and flow.',
      'Preserve core meaning and keep roughly similar length unless instructed otherwise.',
      'Do not add commentary. Return only revised text.',
      extra,
      '',
      'Text:',
      text,
    ].join('\n');
  }

  if (action === 'summarize') {
    return [
      'Task: Summarize this text in 3-5 concise sentences.',
      'Preserve key points and important context.',
      'Do not add commentary. Return only the summary.',
      extra,
      '',
      'Text:',
      text,
    ].join('\n');
  }

  return [
    'Task: Continue the writing in a natural way.',
    'Write one coherent paragraph that follows the same voice and topic.',
    'Do not add commentary. Return only the continuation paragraph.',
    extra,
    '',
    'Current text:',
    text,
  ].join('\n');
}

interface AIRequestParams {
  action: AgentAction;
  text: string;
  context?: string;
  instruction?: string;
  apiKey: string;
  model?: string;
  provider?: 'openai' | 'gemini' | 'claude';
}

interface AIResult {
  suggestion?: string;
  error?: string;
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'gemini': return 'gemini-2.0-flash';
    case 'claude': return 'claude-sonnet-4-20250514';
    default: return 'gpt-4o-mini';
  }
}

export async function callAI({
  action,
  text,
  context,
  instruction,
  apiKey,
  model,
  provider = 'openai',
}: AIRequestParams): Promise<AIResult> {
  if (!apiKey) {
    return { error: 'No API key provided. Add your key in Settings → AI Assistant.' };
  }

  const trimmedText = text.trim();

  if (!trimmedText || trimmedText.length > MAX_TEXT_LENGTH) {
    return { error: 'Invalid text input.' };
  }

  const safeContext = (context ?? '').slice(0, MAX_CONTEXT_LENGTH);
  const usedModel = model || getDefaultModel(provider);
  const systemPrompt = 'You are a writing assistant for a notebook app. Output plain text only with no markdown, no bullet points, and no explanations unless explicitly requested.';
  const userPrompt = buildTaskPrompt(action, trimmedText, instruction) + (safeContext ? `\n\nDocument context (for style continuity):\n${safeContext}` : '');

  try {
    // ── Gemini ──
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${usedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData = await response.json().catch(() => ({})) as any;
        const msg =
          response.status === 400 && errorData?.error?.message?.includes('API key')
            ? 'Invalid API key. Check your Gemini key in Settings.'
            : response.status === 429
              ? 'Rate limit exceeded. Please wait a moment.'
              : errorData?.error?.message ?? 'Gemini request failed.';
        return { error: msg };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await response.json()) as any;
      const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!suggestion) return { error: 'Empty AI response from Gemini.' };
      return { suggestion };
    }

    // ── Claude (Anthropic) ──
    if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: usedModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData = await response.json().catch(() => ({})) as any;
        const msg =
          response.status === 401
            ? 'Invalid API key. Check your Claude key in Settings.'
            : response.status === 429
              ? 'Rate limit exceeded. Please wait a moment.'
              : errorData?.error?.message ?? 'Claude request failed.';
        return { error: msg };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await response.json()) as any;
      const suggestion = data.content?.[0]?.text?.trim();
      if (!suggestion) return { error: 'Empty AI response from Claude.' };
      return { suggestion };
    }

    // ── OpenAI (default) ──
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: usedModel,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorData = await response.json().catch(() => ({})) as any;
      const msg =
        response.status === 401
          ? 'Invalid API key. Check your OpenAI key in Settings.'
          : response.status === 429
            ? 'Rate limit exceeded. Please wait a moment.'
            : errorData?.error?.message ?? 'OpenAI request failed.';
      return { error: msg };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any;
    const suggestion = data.choices?.[0]?.message?.content?.trim();
    if (!suggestion) return { error: 'Empty AI response from OpenAI.' };
    return { suggestion };

  } catch {
    return { error: 'Network error. Please try again.' };
  }
}
