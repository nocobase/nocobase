/** A knowledge file previewed in place: HTML runs in a script-only sandbox with its source one tab away; SVG and XML only download. */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import {
  FilePreview,
  type FileRecord,
} from '../client/extensions/file-preview/file-preview.js';
import { resolveFilePreviewKind } from '../client/extensions/file-preview/lib/file-preview.js';

function record(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: 'doc-1',
    disk: 'local',
    key: 'knowledge/doc-1',
    ext: 'html',
    filename: 'report.html',
    mimeType: 'text/html',
    size: 10,
    createdAt: '2026-11-12T00:00:00Z',
    updatedAt: '2026-11-12T00:00:00Z',
    contentUrl: '/main/api/knowledge/docs/doc-1/file',
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it.each([
  ['text/html', 'report.html', 'html'],
  ['application/octet-stream', 'report.htm', 'html'],
  ['image/svg+xml', 'drawing.svg', 'unsupported'],
  ['text/html', 'drawing.svg', 'unsupported'],
  ['application/xml', 'data.xml', 'unsupported'],
  ['application/xhtml+xml', 'page.xhtml', 'unsupported'],
])('resolves %s %s as %s', (mimeType, filename, kind) => {
  expect(resolveFilePreviewKind(record({ mimeType, filename }))).toBe(kind);
});

it('renders HTML in a script-only sandbox and shows its source', async () => {
  const source = '<h1>Report</h1><script>document.title = "ran";</script>';
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(source)),
  );
  const user = userEvent.setup();
  render(<FilePreview file={record()} />);

  const frame = await screen.findByTitle('report.html');
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  expect(frame.getAttribute('srcdoc')).toMatch(
    /^<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; [^"]*">/u,
  );
  expect(frame.getAttribute('srcdoc')?.endsWith(source)).toBe(true);

  await user.click(screen.getByRole('tab', { name: 'Source' }));
  expect(screen.getByText(source)).toBeInTheDocument();
});
