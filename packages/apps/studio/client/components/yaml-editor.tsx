/**
 * A YAML file in CodeMirror, with syntax highlighting and line numbers: editable for a workflow file being changed,
 * read-only to show one. Styled from the theme's tokens so it follows the light and dark themes.
 */
import { yaml } from '@codemirror/lang-yaml';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef, type ReactElement } from 'react';

import { cn } from 'cn';

const theme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '12px',
    height: '100%',
  },
  '.cm-content': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    lineHeight: '1.6',
    padding: '8px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'color-mix(in oklab, var(--muted) 45%, transparent)',
    borderRight: '1px solid var(--border)',
    color: 'var(--muted-foreground)',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'color-mix(in oklab, var(--muted) 55%, transparent)',
  },
  '.cm-scroller': { overflow: 'auto' },
  '&.cm-focused': { outline: 'none' },
});

export interface YamlEditorProps {
  readonly value: string;
  readonly onChange?: (value: string) => void;
  readonly readOnly?: boolean;
  /** The accessible name of the editable area, such as the file's path. */
  readonly label: string;
  readonly className?: string;
}

export function YamlEditor({
  value,
  onChange,
  readOnly = false,
  label,
  className,
}: YamlEditorProps): ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  }, [onChange, value]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;
    const view = new EditorView({
      parent,
      doc: valueRef.current,
      extensions: [
        basicSetup,
        yaml(),
        theme,
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.contentAttributes.of({
          'aria-label': label,
          'aria-readonly': String(readOnly),
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged)
            onChangeRef.current?.(update.state.doc.toString());
        }),
      ],
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [readOnly, label]);

  // A value replaced from outside (another file, a reset) is shown as it is.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  return (
    <div
      ref={parentRef}
      data-yaml-editor={readOnly ? 'readonly' : 'editable'}
      className={cn(
        'h-80 min-h-0 w-full min-w-0 overflow-hidden rounded-md border border-input',
        className,
      )}
    />
  );
}
