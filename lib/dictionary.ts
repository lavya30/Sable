export interface DictMeaning {
  partOfSpeech: string;
  definitions: { definition: string; example?: string }[];
}

export interface DictResult {
  word: string;
  phonetic: string;
  meanings: DictMeaning[];
}

export async function lookupWord(word: string): Promise<DictResult | null> {
  if (!word.trim()) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>[];
    if (!Array.isArray(data) || !data[0]) return null;
    const entry = data[0];
    return {
      word: entry.word as string,
      phonetic: (entry.phonetic as string) ?? '',
      meanings: ((entry.meanings as Array<Record<string, unknown>>) ?? [])
        .slice(0, 3)
        .map((m) => ({
          partOfSpeech: m.partOfSpeech as string,
          definitions: ((m.definitions as Array<Record<string, unknown>>) ?? [])
            .slice(0, 2)
            .map((d) => ({
              definition: d.definition as string,
              example: d.example as string | undefined,
            })),
        })),
    };
  } catch {
    return null;
  }
}
