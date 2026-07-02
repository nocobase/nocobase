/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import React, { useEffect, useRef } from 'react';

import { TerminalStreamHookChunk } from '../hooks/useTerminalStream';

export interface ReadonlyXtermOutputProps {
  ariaLabel: string;
  emptyText: string;
  initialOutput?: string;
  resetKey: string;
  chunks: TerminalStreamHookChunk[];
  height?: number;
}

function isCopyShortcut(event: KeyboardEvent) {
  return (event.ctrlKey || event.metaKey) && ['c', 'a'].includes(event.key.toLowerCase());
}

function hardenReadonlyTextarea(container: HTMLElement) {
  const textarea = container.querySelector('textarea');
  if (!(textarea instanceof HTMLTextAreaElement)) {
    return;
  }
  textarea.readOnly = true;
  textarea.tabIndex = -1;
  textarea.setAttribute('aria-hidden', 'true');
  textarea.setAttribute('aria-label', 'Readonly terminal input disabled');
}

function compactTrailingBlankLines(text: string) {
  return text.replace(/(?:[ \t\r]*\n){3,}$/u, '\n\n');
}

export function ReadonlyXtermOutput({
  ariaLabel,
  emptyText,
  initialOutput,
  resetKey,
  chunks,
  height = 420,
}: ReadonlyXtermOutputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resetKeyRef = useRef('');
  const lastWrittenChunkSequenceRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: false,
      disableStdin: true,
      fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
      fontSize: 12,
      scrollback: 5000,
      theme: {
        background: '#111827',
        foreground: '#d1d5db',
        cursor: '#d1d5db',
        selectionBackground: '#374151',
      },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.attachCustomKeyEventHandler((event) => isCopyShortcut(event));
    terminal.open(container);
    hardenReadonlyTextarea(container);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const fit = () => {
      try {
        fitAddon.fit();
      } catch {
        // xterm can throw when jsdom or a hidden drawer has no measurable geometry.
      }
    };
    fit();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            fit();
          });
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      fitAddonRef.current = null;
      terminalRef.current = null;
      terminal.dispose();
    };
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal || resetKeyRef.current === resetKey) {
      return;
    }
    resetKeyRef.current = resetKey;
    lastWrittenChunkSequenceRef.current = 0;
    terminal.reset();
    const resetOutput = compactTrailingBlankLines(initialOutput ?? emptyText);
    if (resetOutput) {
      terminal.write(resetOutput);
    }
  }, [emptyText, initialOutput, resetKey]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    const unwrittenChunks = chunks.filter((chunk) => chunk.sequence > lastWrittenChunkSequenceRef.current);
    for (const chunk of unwrittenChunks) {
      terminal.write(chunk.text);
      lastWrittenChunkSequenceRef.current = chunk.sequence;
    }
  }, [chunks]);

  return (
    <div
      aria-label={ariaLabel}
      data-testid="agent-gateway-readonly-xterm"
      role="region"
      style={{
        background: '#111827',
        borderRadius: 6,
        minHeight: height,
        overflow: 'hidden',
        padding: 8,
      }}
    >
      <div ref={containerRef} style={{ height, width: '100%' }} />
    </div>
  );
}

export default ReadonlyXtermOutput;
