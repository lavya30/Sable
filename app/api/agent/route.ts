import { NextRequest, NextResponse } from 'next/server';

type AgentAction = 'fix_grammar' | 'rewrite' | 'summarize' | 'continue';

interface AgentRequestBody {
  action?: AgentAction;
  text?: string;
  context?: string;
  instruction?: string;
}

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentRequestBody;

    const action = body.action;
    const text = body.text?.trim() ?? '';
    const context = (body.context ?? '').slice(0, MAX_CONTEXT_LENGTH);
    const instruction = body.instruction?.trim();

    if (!action || !['fix_grammar', 'rewrite', 'summarize', 'continue'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    if (!text || text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: 'Invalid text input.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI is not configured. Set OPENAI_API_KEY in your environment.' },
        { status: 503 }
      );
    }

    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are a writing assistant for a notebook app. Output plain text only with no markdown, no bullet points, and no explanations unless explicitly requested.',
          },
          {
            role: 'user',
            content: buildTaskPrompt(action, text, instruction),
          },
          ...(context
            ? [
                {
                  role: 'user' as const,
                  content: `Document context (for style continuity):\n${context}`,
                },
              ]
            : []),
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'AI request failed.' }, { status: 502 });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const suggestion = data.choices?.[0]?.message?.content?.trim();
    if (!suggestion) {
      return NextResponse.json({ error: 'Empty AI response.' }, { status: 502 });
    }

    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json({ error: 'Failed to process AI request.' }, { status: 500 });
  }
}
