/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { RunLog } from '../hooks/useCodeRunner';
import { WRAPPER_PRELUDE_LINES } from '../errorHelpers';

export const LogsPanel: React.FC<{
  logs: RunLog[];
  onJumpTo?: (line: number, column: number) => void;
  tr: (s: string, o?: any) => string;
}> = ({ logs, onJumpTo, tr }) => {
  return (
    <div
      style={{
        borderTop: '1px solid #d9d9d9',
        maxHeight: 180,
        overflow: 'auto',
        padding: '8px 12px',
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{tr('Logs')}</div>
      {logs.length === 0 ? (
        <div style={{ color: '#999' }}>{tr('No logs yet. Click Run to execute.')}</div>
      ) : (
        logs.map((l, i) => {
          const color = l.level === 'error' ? '#ff4d4f' : l.level === 'warn' ? '#faad14' : '#333';
          const clickable =
            (l.level === 'error' || l.level === 'warn') && typeof l.line === 'number' && typeof l.column === 'number';
          const displayLine =
            typeof l.line === 'number' ? Math.max(1, l.line - WRAPPER_PRELUDE_LINES) : (l.line as any);
          const msgHasInlinePos = typeof l.msg === 'string' && /[（(]line\s*\d+(:\d+)?[）)]/i.test(l.msg);
          return (
            <pre
              key={i}
              onClick={
                clickable
                  ? () => {
                      if (typeof l.line === 'number' && typeof l.column === 'number') {
                        onJumpTo?.(l.line, l.column);
                      }
                    }
                  : undefined
              }
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                color,
                cursor: clickable ? 'pointer' : 'default',
                textDecoration: clickable ? 'underline dotted' : 'none',
              }}
            >
              [{l.level}] {l.msg}
              {clickable && !msgHasInlinePos ? ` (${tr('at')} ${displayLine}:${l.column})` : ''}
            </pre>
          );
        })
      )}
    </div>
  );
};
