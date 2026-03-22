/**
 * Export / Import all Sable data to/from a single JSON file.
 *
 * Collected keys:
 *   - sable_documents
 *   - sable_settings
 *   - sable_writing_stats
 *   - sable-goal-*   (per-document writing goals)

 */

const KNOWN_KEYS = ['sable_documents', 'sable_settings', 'sable_writing_stats'];

function collectAllSableKeys(): Record<string, string> {
  const data: Record<string, string> = {};

  // Fixed keys
  for (const key of KNOWN_KEYS) {
    const val = localStorage.getItem(key);
    if (val) data[key] = val;
  }

  // Dynamic keys (goals, history)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sable-goal-') || key.startsWith('sable_history_'))) {
      const val = localStorage.getItem(key);
      if (val) data[key] = val;
    }
  }

  return data;
}

/** Download all Sable data as a JSON file */
export function exportAllData(): void {
  const data = collectAllSableKeys();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  a.download = `sable-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import Sable data from a JSON file.
 * Validates the structure and overwrites localStorage, then reloads the page.
 */
export function importAllData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const data = JSON.parse(text) as Record<string, unknown>;

        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          throw new Error('Invalid backup file format: must be a JSON object');
        }

        // Validate that at least one Sable key exists
        const hasSableKey = Object.keys(data).some(
          (k) =>
            KNOWN_KEYS.includes(k) ||
            k.startsWith('sable-goal-') ||
            k.startsWith('sable_history_')
        );

        if (!hasSableKey) {
          throw new Error('This file does not appear to be a Sable backup');
        }

        // Write only Sable-related entries to localStorage with validation
        for (const [key, value] of Object.entries(data)) {
          if (typeof value !== 'string') {
            console.warn(`Skipping invalid value for key "${key}": expected string, got ${typeof value}`);
            continue;
          }
          if (KNOWN_KEYS.includes(key) || key.startsWith('sable-goal-') || key.startsWith('sable_history_')) {
            try {
              // Validate JSON structure for known keys
              if (key === 'sable_documents' || key === 'sable_settings' || key === 'sable_writing_stats') {
                JSON.parse(value); // Ensure it's valid JSON
              }
              localStorage.setItem(key, value);
            } catch (error) {
              console.error(`Failed to import key "${key}":`, error instanceof Error ? error.message : String(error));
              throw new Error(`Corrupted data in backup file for key: ${key}`);
            }
          }
        }

        // Reload to pick up the new data
        window.location.reload();
        resolve();
      } catch (err) {
        console.error('Import error:', err instanceof Error ? err.message : String(err));
        reject(err);
      }
    };

    reader.onerror = () => {
      const error = new Error('Failed to read backup file');
      console.error(error);
      reject(error);
    };
    reader.readAsText(file);
  });
}
