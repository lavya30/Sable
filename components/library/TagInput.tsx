import { useState, KeyboardEvent, useRef } from 'react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Add tags...' }: Props) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter((t) => t !== tagToRemove));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-2 border-ink/20 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(19,236,117,0.25)] transition-all">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-display font-bold bg-mint/50 dark:bg-emerald-900/40 text-ink dark:text-emerald-100 rounded-md border border-mint dark:border-emerald-700/50"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-ink/40 dark:text-emerald-300 hover:text-ink dark:hover:text-emerald-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm font-body text-ink dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />
    </div>
  );
}
