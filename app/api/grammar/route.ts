import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };
    if (!text || !text.trim()) {
      return NextResponse.json({ matches: [] });
    }
    if (text.length > 50000) {
      return NextResponse.json({ matches: [] });
    }

    const params = new URLSearchParams({
      text,
      language: 'en-US',
      disabledRules: 'WHITESPACE_RULE,EN_QUOTES',
    });

    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('LanguageTool API error:', res.status, res.statusText);
      return NextResponse.json({ matches: [] });
    }

    const data = await res.json() as { matches?: Record<string, unknown>[] };
    return NextResponse.json({ matches: data.matches ?? [] });
  } catch (error) {
    console.error('Grammar check error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ matches: [] });
  }
}
