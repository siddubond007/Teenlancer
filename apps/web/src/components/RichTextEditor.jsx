import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo2,
  Redo2
} from 'lucide-react';
import { sanitizeRichTextHtml } from '../utils/richText.js';

const EMPTY_HTML = '<p></p>';

const TOOLBAR_ITEMS = [
  {
    id: 'bold',
    label: 'Bold',
    icon: Bold,
    command: 'bold'
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: Italic,
    command: 'italic'
  },
  {
    id: 'unordered-list',
    label: 'Bulleted list',
    icon: List,
    command: 'insertUnorderedList'
  },
  {
    id: 'ordered-list',
    label: 'Numbered list',
    icon: ListOrdered,
    command: 'insertOrderedList'
  }
];

export default function RichTextEditor({
  value = EMPTY_HTML,
  onChange,
  disabled = false,
  error = false,
  id = 'service-description'
}) {
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isFocused) return;

    const nextValue = sanitizeRichTextHtml(value || EMPTY_HTML);

    if (editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue;
    }
  }, [value, isFocused]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (editor.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    const savedRange = savedSelectionRef.current;

    if (!editor || !selection || !savedRange) return;

    selection.removeAllRanges();
    selection.addRange(savedRange);
  };

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const sanitizedHtml = sanitizeRichTextHtml(editor.innerHTML || EMPTY_HTML);

    onChange?.(sanitizedHtml === EMPTY_HTML ? '' : sanitizedHtml);
    saveSelection();
  };

  const executeCommand = (command) => {
    if (disabled) return;

    editorRef.current?.focus();
    restoreSelection();

    try {
      document.execCommand(command, false);
    } catch {
      return;
    }

    emitChange();
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      executeCommand(event.shiftKey ? 'redo' : 'undo');
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 'y'
    ) {
      event.preventDefault();
      executeCommand('redo');
    }
  };

  const buttonClass = (isActive = false) => [
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
    'transition focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-cyan-400/70',
    isActive
      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-white'
  ].join(' ');

  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border bg-slate-950',
        error
          ? 'border-red-500/50'
          : isFocused
            ? 'border-cyan-500/60'
            : 'border-slate-800'
      ].join(' ')}
    >
      <div
        className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 bg-slate-900/80 p-2"
        aria-label="Description formatting toolbar"
      >
        {TOOLBAR_ITEMS.map(({ id: itemId, label, icon: Icon, command }) => (
          <button
            key={itemId}
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onMouseDown={(event) => {
              event.preventDefault();
              saveSelection();
            }}
            onClick={() => executeCommand(command)}
            className={buttonClass()}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}

        <span
          className="mx-1 h-6 w-px bg-slate-800"
          aria-hidden="true"
        />

        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            saveSelection();
          }}
          onClick={() => executeCommand('undo')}
          className={buttonClass()}
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            saveSelection();
          }}
          onClick={() => executeCommand('redo')}
          className={buttonClass()}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div
        id={id}
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Service description"
        aria-invalid={error || undefined}
        data-placeholder="Describe what you provide, what the buyer receives, and what to expect..."
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          const editor = editorRef.current;

          if (editor) {
            const sanitizedHtml = sanitizeRichTextHtml(editor.innerHTML || EMPTY_HTML);

            if (editor.innerHTML !== sanitizedHtml) {
              editor.innerHTML = sanitizedHtml;
            }

            onChange?.(sanitizedHtml === EMPTY_HTML ? '' : sanitizedHtml);
          }

          saveSelection();
          setIsFocused(false);
        }}
        onKeyDown={handleKeyDown}
        onInput={emitChange}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        className={[
          'min-h-[280px] w-full max-w-full px-4 py-4 text-sm leading-7 text-slate-200 outline-none break-words [overflow-wrap:anywhere]',
          'empty:before:pointer-events-none empty:before:text-slate-600 empty:before:content-[attr(data-placeholder)]',
          '[&_p]:mb-3 [&_p:last-child]:mb-0',
          '[&_strong]:font-black [&_b]:font-black',
          '[&_em]:italic [&_i]:italic',
          '[&_ul]:ml-5 [&_ul]:list-disc',
          '[&_ol]:ml-5 [&_ol]:list-decimal',
          '[&_li]:pl-1',
          disabled ? 'cursor-not-allowed opacity-60' : ''
        ].join(' ')}
      />
    </div>
  );
}
