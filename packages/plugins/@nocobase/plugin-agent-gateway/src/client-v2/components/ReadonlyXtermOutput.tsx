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
import React, { useCallback, useEffect, useRef } from 'react';

import { TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME } from '../../shared/terminalStreamProtocol';
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

const textEncoder = new TextEncoder();
const XTERM_WRITE_FLUSH_BYTES = 1024;
const MAX_XTERM_VISIBLE_BYTES = Math.min(96 * 1024, TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME);
const XTERM_REPLAY_AFTER_TRIM_BYTES = MAX_XTERM_VISIBLE_BYTES / 2;
const XTERM_WRITE_CALLBACK_FALLBACK_MS = 50;

function getByteLength(text: string) {
  return textEncoder.encode(text).byteLength;
}

function splitTextByByteLimit(text: string, maxBytes: number) {
  const parts: string[] = [];
  let part = '';
  let partBytes = 0;
  for (const char of text) {
    const charBytes = textEncoder.encode(char).byteLength;
    if (part && partBytes + charBytes > maxBytes) {
      parts.push(part);
      part = '';
      partBytes = 0;
    }
    part += char;
    partBytes += charBytes;
  }
  if (part) {
    parts.push(part);
  }
  return parts;
}

function trimTextToByteLimit(text: string, maxBytes: number) {
  if (getByteLength(text) <= maxBytes) {
    return text;
  }
  let result = '';
  let bytes = 0;
  for (const char of Array.from(text).reverse()) {
    const charBytes = getByteLength(char);
    if (result && bytes + charBytes > maxBytes) {
      break;
    }
    result = `${char}${result}`;
    bytes += charBytes;
  }
  return result;
}

function selectTrailingChunksByByteLimit(chunks: TerminalStreamHookChunk[], maxBytes: number) {
  const selected: TerminalStreamHookChunk[] = [];
  let bytes = 0;
  for (let index = chunks.length - 1; index >= 0; index -= 1) {
    const chunk = chunks[index];
    const chunkBytes = getByteLength(chunk.text);
    if (chunkBytes > maxBytes) {
      selected.unshift({
        ...chunk,
        text: trimTextToByteLimit(chunk.text, maxBytes),
      });
      break;
    }
    if (selected.length && bytes + chunkBytes > maxBytes) {
      break;
    }
    selected.unshift(chunk);
    bytes += chunkBytes;
  }
  return selected;
}

function scheduleFrame(callback: () => void) {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16);
}

function cancelFrame(frame: ReturnType<typeof scheduleFrame>) {
  if (typeof frame === 'number' && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frame);
    return;
  }
  clearTimeout(frame as ReturnType<typeof setTimeout>);
}

interface TerminalResetRequest {
  texts: string[];
  displayedBytes: number;
  lastWrittenChunkSequence: number;
  version: number;
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
  const pendingWritesRef = useRef<string[]>([]);
  const scheduledFlushRef = useRef<ReturnType<typeof scheduleFrame> | null>(null);
  const writeInFlightRef = useRef(false);
  const displayedBytesRef = useRef(0);
  const flushGenerationRef = useRef(0);
  const resetVersionRef = useRef(0);
  const latestAppliedResetVersionRef = useRef(0);
  const latestAppliedResetRef = useRef<TerminalResetRequest | null>(null);
  const pendingResetRef = useRef<TerminalResetRequest | null>(null);
  const writeCompletionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fitFrameRef = useRef<ReturnType<typeof scheduleFrame> | null>(null);
  const scheduleFlushRef = useRef<() => void>(() => {});

  const cancelScheduledFlush = useCallback(() => {
    if (!scheduledFlushRef.current) {
      return;
    }
    cancelFrame(scheduledFlushRef.current);
    scheduledFlushRef.current = null;
  }, []);

  const appendPendingWrite = useCallback((text: string) => {
    if (!text) {
      return;
    }
    pendingWritesRef.current.push(...splitTextByByteLimit(text, XTERM_WRITE_FLUSH_BYTES));
  }, []);

  const clearWriteCompletionTimer = useCallback(() => {
    if (!writeCompletionTimerRef.current) {
      return;
    }
    clearTimeout(writeCompletionTimerRef.current);
    writeCompletionTimerRef.current = null;
  }, []);

  const cancelScheduledFit = useCallback(() => {
    if (!fitFrameRef.current) {
      return;
    }
    cancelFrame(fitFrameRef.current);
    fitFrameRef.current = null;
  }, []);

  const applyResetNow = useCallback(
    (reset: TerminalResetRequest) => {
      const terminal = terminalRef.current;
      cancelScheduledFlush();
      clearWriteCompletionTimer();
      pendingWritesRef.current = [];
      writeInFlightRef.current = false;
      displayedBytesRef.current = reset.displayedBytes;
      lastWrittenChunkSequenceRef.current = reset.lastWrittenChunkSequence;
      flushGenerationRef.current += 1;
      latestAppliedResetVersionRef.current = reset.version;
      latestAppliedResetRef.current = reset;
      if (!terminal) {
        return;
      }
      terminal.reset();
      for (const text of reset.texts) {
        appendPendingWrite(text);
      }
      scheduleFlushRef.current();
    },
    [appendPendingWrite, cancelScheduledFlush, clearWriteCompletionTimer],
  );

  const requestReset = useCallback(
    (reset: TerminalResetRequest) => {
      cancelScheduledFlush();
      pendingWritesRef.current = [];
      if (writeInFlightRef.current) {
        pendingResetRef.current = reset;
        flushGenerationRef.current += 1;
        return;
      }
      pendingResetRef.current = null;
      applyResetNow(reset);
    },
    [applyResetNow, cancelScheduledFlush],
  );

  const finishWrite = useCallback(
    (generation: number, allowPendingReset: boolean) => {
      clearWriteCompletionTimer();
      const pendingReset = pendingResetRef.current;
      if (pendingReset && !allowPendingReset) {
        return;
      }
      writeInFlightRef.current = false;
      if (pendingReset) {
        pendingResetRef.current = null;
        applyResetNow(pendingReset);
        return;
      }
      if (generation !== flushGenerationRef.current) {
        if (pendingWritesRef.current.length) {
          scheduleFlushRef.current();
        }
        return;
      }
      if (pendingWritesRef.current.length) {
        scheduleFlushRef.current();
      }
    },
    [applyResetNow, clearWriteCompletionTimer],
  );

  const scheduleFlush = useCallback(() => {
    if (scheduledFlushRef.current || writeInFlightRef.current) {
      return;
    }
    const generation = flushGenerationRef.current;
    scheduledFlushRef.current = scheduleFrame(() => {
      scheduledFlushRef.current = null;
      if (generation !== flushGenerationRef.current) {
        return;
      }
      const terminal = terminalRef.current;
      if (!terminal) {
        pendingWritesRef.current = [];
        return;
      }

      let bytes = 0;
      let text = '';
      while (pendingWritesRef.current.length) {
        const next = pendingWritesRef.current[0];
        const nextBytes = getByteLength(next);
        if (text && bytes + nextBytes > XTERM_WRITE_FLUSH_BYTES) {
          break;
        }
        pendingWritesRef.current.shift();
        text += next;
        bytes += nextBytes;
        if (bytes >= XTERM_WRITE_FLUSH_BYTES) {
          break;
        }
      }

      if (text) {
        writeInFlightRef.current = true;
        clearWriteCompletionTimer();
        let completed = false;
        let fallbackReplayBaseVersion: number | null = null;
        const complete = (allowPendingReset: boolean) => {
          if (completed) {
            return;
          }
          completed = true;
          finishWrite(generation, allowPendingReset);
        };
        writeCompletionTimerRef.current = setTimeout(() => {
          fallbackReplayBaseVersion = latestAppliedResetVersionRef.current;
          complete(Boolean(pendingResetRef.current));
        }, XTERM_WRITE_CALLBACK_FALLBACK_MS);
        terminal.write(text, () => {
          if (completed && fallbackReplayBaseVersion !== null) {
            const replayBaseVersion = fallbackReplayBaseVersion;
            const pendingReset = pendingResetRef.current;
            const latestAppliedReset = latestAppliedResetRef.current;
            let resetToReplay: TerminalResetRequest | null = null;
            for (const reset of [latestAppliedReset, pendingReset]) {
              if (
                reset &&
                reset.version > replayBaseVersion &&
                (!resetToReplay || reset.version > resetToReplay.version)
              ) {
                resetToReplay = reset;
              }
            }
            if (resetToReplay) {
              if (pendingReset?.version === resetToReplay.version) {
                pendingResetRef.current = null;
              }
              requestReset(resetToReplay);
            }
            fallbackReplayBaseVersion = null;
            return;
          }
          complete(true);
        });
        return;
      }
      if (pendingWritesRef.current.length) {
        scheduleFlushRef.current();
      }
    });
  }, [clearWriteCompletionTimer, finishWrite, requestReset]);

  scheduleFlushRef.current = scheduleFlush;

  const queueWrite = useCallback(
    (text: string) => {
      appendPendingWrite(text);
      scheduleFlush();
    },
    [appendPendingWrite, scheduleFlush],
  );

  const createResetRequest = useCallback((values: Omit<TerminalResetRequest, 'version'>): TerminalResetRequest => {
    resetVersionRef.current += 1;
    return {
      ...values,
      version: resetVersionRef.current,
    };
  }, []);

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
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      try {
        fitAddon.fit();
      } catch {
        // xterm can throw when jsdom or a hidden drawer has no measurable geometry.
      }
    };
    const scheduleFit = () => {
      if (fitFrameRef.current) {
        return;
      }
      fitFrameRef.current = scheduleFrame(() => {
        fitFrameRef.current = null;
        fit();
      });
    };
    fit();
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            scheduleFit();
          });
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      if (scheduledFlushRef.current) {
        cancelFrame(scheduledFlushRef.current);
        scheduledFlushRef.current = null;
      }
      clearWriteCompletionTimer();
      cancelScheduledFit();
      pendingWritesRef.current = [];
      writeInFlightRef.current = false;
      pendingResetRef.current = null;
      flushGenerationRef.current += 1;
      fitAddonRef.current = null;
      terminalRef.current = null;
      terminal.dispose();
    };
  }, [cancelScheduledFit, clearWriteCompletionTimer]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal || resetKeyRef.current === resetKey) {
      return;
    }
    resetKeyRef.current = resetKey;
    const resetOutput = trimTextToByteLimit(
      compactTrailingBlankLines(initialOutput ?? emptyText),
      MAX_XTERM_VISIBLE_BYTES,
    );
    requestReset(
      createResetRequest({
        texts: resetOutput ? [resetOutput] : [],
        displayedBytes: getByteLength(resetOutput),
        lastWrittenChunkSequence: 0,
      }),
    );
  }, [createResetRequest, emptyText, initialOutput, requestReset, resetKey]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    const unwrittenChunks = chunks.filter((chunk) => chunk.sequence > lastWrittenChunkSequenceRef.current);
    const unwrittenBytes = unwrittenChunks.reduce((total, chunk) => total + getByteLength(chunk.text), 0);
    if (unwrittenChunks.length && displayedBytesRef.current + unwrittenBytes > MAX_XTERM_VISIBLE_BYTES) {
      const trailingChunks = selectTrailingChunksByByteLimit(chunks, XTERM_REPLAY_AFTER_TRIM_BYTES);
      let displayedBytes = 0;
      const texts: string[] = [];
      for (const chunk of trailingChunks) {
        texts.push(chunk.text);
        displayedBytes += getByteLength(chunk.text);
      }
      requestReset(
        createResetRequest({
          texts,
          displayedBytes,
          lastWrittenChunkSequence: chunks.at(-1)?.sequence || 0,
        }),
      );
      return;
    }
    for (const chunk of unwrittenChunks) {
      queueWrite(chunk.text);
      displayedBytesRef.current += getByteLength(chunk.text);
      lastWrittenChunkSequenceRef.current = chunk.sequence;
    }
  }, [chunks, createResetRequest, queueWrite, requestReset]);

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
