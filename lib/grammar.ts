import { Node as PMNode } from '@tiptap/pm/model';

export interface LTMatch {
  offset: number;
  length: number;
  message: string;
  replacements: string[];
  issueType: string;
}

export function buildTextAndMap(doc: PMNode): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  doc.descendants((node, pos) => {
    if (node.isText) {
      for (let i = 0; i < node.text!.length; i++) {
        map.push(pos + i);
        text += node.text![i];
      }
    } else if (node.isBlock && text.length > 0) {
      map.push(-1);
      text += '\n';
    }
  });
  return { text, map };
}

export async function checkGrammar(text: string): Promise<LTMatch[]> {
  if (!text.trim() || text.length > 50000) return [];
  try {
    const res = await fetch('/api/grammar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { matches?: Record<string, unknown>[] };
    return (data.matches ?? []).map((m) => ({
      offset: m.offset as number,
      length: m.length as number,
      message: m.message as string,
      replacements: ((m.replacements as Array<{ value: string }>) ?? [])
        .slice(0, 5)
        .map((r) => r.value),
      issueType: ((m.rule as Record<string, string>)?.issueType) ?? 'other',
    }));
  } catch {
    return [];
  }
}
