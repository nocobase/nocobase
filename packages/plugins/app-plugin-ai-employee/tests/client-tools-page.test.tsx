// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import { RouterProvider } from 'react-router';
import { createCatalogTestRouter } from './catalog-test-router.js';
import type {
  ManagedToolDetail,
  ManagedToolSummary,
} from '../client/tools-management-service.js';
import packageMetadata from '../package.json' with { type: 'json' };

const mocks = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => mocks.api,
}));

const tools: ManagedToolSummary[] = [
  {
    name: 'queryRecords',
    title: 'Query records',
    description: 'Read collection records',
    about: 'Browse collection data',
    scope: 'SPECIFIED',
    source: 'builtin',
  },
  {
    name: 'draft-document',
    title: '',
    description: 'Write a report',
    about: '',
    scope: '',
    source: '',
  },
];
const detail: ManagedToolDetail = {
  ...tools[0],
  about:
    '# Query guide\n\nUse **evidence**.\n\n<script>alert("unsafe")</script>\n\n<img src="x" onerror="alert(1)">\n\n[unsafe link](javascript:alert%281%29)',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '<img src=x onerror=alert(1)>',
        default: '</code></pre><script>alert(1)</script>',
      },
    },
    $ref: 'https://example.test/do-not-fetch-schema.json',
    description: '[unsafe](javascript:alert(1))',
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function renderPage(locale = 'en-US') {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: '@test/app',
  });
  runtime.registerNamespace(packageMetadata.name, locales);
  await runtime.init(locale);
  return render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={createCatalogTestRouter('tools')} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  mocks.api.request.mockReset().mockResolvedValue({ rows: tools });
});

describe('Tools settings page', () => {
  it('sorts by title with a name fallback rather than identifier', async () => {
    mocks.api.request.mockResolvedValue({
      rows: [
        { ...tools[0], name: 'a-first', title: 'Zebra' },
        { ...tools[1], name: 'middle', title: ' ' },
        { ...tools[0], name: 'z-last', title: 'alpha' },
      ],
    });
    await renderPage();
    const list = await screen.findByRole('list', { name: 'Tools' });
    expect(
      within(list)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['alpha', 'middle', 'Zebra']);
  });

  it('uses a compact single-column directory with whole-row buttons and summary counts', async () => {
    await renderPage();
    const list = await screen.findByRole('list', { name: 'Tools' });
    expect(
      screen.getByRole('heading', { name: 'Tools', level: 1 }).closest('header')
        ?.parentElement,
    ).toHaveClass('w-full', 'p-6', 'md:p-8');
    expect(
      screen.getByText(
        'Browse the tools available to AI employees and review their usage instructions and input parameters.',
      ),
    ).toBeVisible();
    expect(list).toHaveClass('divide-y', 'rounded-xl', 'border', 'bg-card');
    expect(list.querySelector('[data-slot="card"]')).toBeNull();
    expect(screen.getByText('2 tools')).toBeVisible();
    const rows = within(list).getAllByRole('listitem');
    const queryCard = rows[1];
    const draftCard = rows[0];
    const trigger = within(queryCard).getByRole('button', {
      name: 'Query records',
    });
    expect(trigger).toHaveAttribute('data-slot', 'item');
    expect(trigger).toHaveClass(
      'w-full',
      'min-h-32',
      'focus-visible:ring-inset',
    );
    expect(trigger).not.toHaveClass('h-64', 'underline', 'focus-within:ring-2');
    expect(within(draftCard).getAllByText('draft-document')).toHaveLength(1);
    expect(draftCard.querySelector('.line-clamp-2')).toBeNull();
    expect(
      within(queryCard).getByText('Query records').parentElement,
    ).toHaveClass('min-w-0', 'items-center');
    expect(within(queryCard).getByText('queryRecords')).toHaveClass(
      'truncate',
      'font-mono',
    );
    expect(within(queryCard).getByText('Browse collection data')).toBeVisible();
    expect(
      within(list).queryByText('Read collection records'),
    ).not.toBeInTheDocument();
    expect(within(list).queryByText('Write a report')).not.toBeInTheDocument();
    for (const text of ['Scope', 'Source', 'SPECIFIED', 'builtin']) {
      expect(within(queryCard).queryByText(text)).not.toBeInTheDocument();
    }
    expect(within(draftCard).queryByText('Scope')).not.toBeInTheDocument();
    expect(within(draftCard).queryByText('Source')).not.toBeInTheDocument();
    expect(
      within(draftCard).getByRole('button', { name: 'draft-document' }),
    ).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /create|edit|delete|execute|test|run/i,
      }),
    ).not.toBeInTheDocument();
    expect(mocks.api.request).toHaveBeenCalledExactlyOnceWith({
      path: 'ai/aiTools:listAll',
      method: 'GET',
      signal: expect.any(AbortSignal),
    });
  });

  it('renders Markdown introductions as safe plain-text summaries', async () => {
    mocks.api.request.mockResolvedValue({
      rows: [
        {
          ...tools[0],
          about:
            '# Read data\n\nUse **filters** and `query` with [instructions](https://example.com).\n\n![image](https://example.com/image.png)\n\n<script>alert(1)</script>',
        },
      ],
    });
    await renderPage();
    const row = await screen.findByRole('button', { name: 'Query records' });
    expect(row).toHaveTextContent(
      'Read data Use filters and query with instructions.',
    );
    expect(row.querySelector('a, img, script, h1, strong, code')).toBeNull();
    expect(row).not.toHaveTextContent('https://example.com');
    expect(row).not.toHaveTextContent('alert(1)');
    expect(row.querySelector('.line-clamp-2')).not.toBeNull();
  });

  it('searches title, name and about locally without additional API requests', async () => {
    await renderPage();
    await screen.findByRole('list', { name: 'Tools' });
    const search = screen.getByRole('searchbox', { name: 'Search tools' });
    for (const query of [' QUERY RECORDS ', 'queryRecords', 'COLLECTION']) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expect(screen.getByText('1 tool')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Query records' }),
      ).toBeVisible();
    }
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.getByRole('status')).toHaveTextContent(
      'No tools match your search.',
    );
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(mocks.api.request).toHaveBeenCalledTimes(1);
  });

  it('shows list loading, error, retry and empty states', async () => {
    const pending = deferred<{ rows: ManagedToolSummary[] }>();
    mocks.api.request
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ rows: [] });
    await renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading tools…');
    await act(async () => pending.reject(new Error('Unavailable')));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load tools.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No tools are available.')).toBeVisible();
  });

  it('renders about Markdown safely and schema as inert JSON, without fetching refs or exposing execution controls', async () => {
    mocks.api.request
      .mockResolvedValueOnce({ rows: tools })
      .mockResolvedValueOnce(detail);
    await renderPage();
    const trigger = await screen.findByRole('button', {
      name: 'Query records',
    });
    fireEvent.click(within(trigger).getByText('Browse collection data'));
    const dialog = screen.getByRole('dialog', { name: 'Tool details' });
    expect(dialog).toHaveAccessibleDescription(
      'Read about this tool and review its input schema.',
    );
    expect(
      await within(dialog).findByRole('heading', { name: 'Query guide' }),
    ).toBeVisible();
    expect(within(dialog).getByText('evidence').tagName).toBe('STRONG');
    expect(
      within(dialog)
        .getAllByRole('region')
        .map((region) => region.getAttribute('aria-label')),
    ).toEqual(['Overview', 'Tool description', 'Input JSON Schema']);
    expect(
      within(
        within(dialog).getByRole('region', { name: 'Tool description' }),
      ).getByText('Read collection records'),
    ).toBeVisible();
    expect(
      within(dialog).queryByText(
        'Read-only JSON schema. Viewing a tool does not execute it.',
      ),
    ).not.toBeInTheDocument();
    const schema = within(dialog).getByRole('region', {
      name: 'Input JSON Schema',
    });
    const code = schema.querySelector('pre code')!;
    expect(code.textContent).toBe(JSON.stringify(detail.inputSchema, null, 2));
    expect(code.children).toHaveLength(0);
    expect(
      schema.querySelector('a, input, textarea, button, script, img, iframe'),
    ).toBeNull();
    expect(dialog.querySelector('script, img, iframe')).toBeNull();
    expect(dialog.querySelector('a')?.getAttribute('href') ?? '').not.toMatch(
      /javascript:/i,
    );
    expect(schema.querySelector('pre')).toHaveClass(
      'overflow-x-auto',
      'max-w-full',
    );
    expect(schema.querySelector('pre')).toHaveAttribute('tabindex', '0');
    expect(within(dialog).getAllByRole('button')).toHaveLength(1);
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
    expect(mocks.api.request).toHaveBeenLastCalledWith({
      path: 'ai/aiTools:getDetails',
      method: 'GET',
      query: { name: 'queryRecords' },
      signal: expect.any(AbortSignal),
    });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('opens from its keyboard-operable title and retains a fixed header over the scrollable details', async () => {
    mocks.api.request
      .mockResolvedValueOnce({ rows: tools })
      .mockResolvedValueOnce(detail);
    await renderPage();
    const trigger = await screen.findByRole('button', {
      name: 'Query records',
    });
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger.tabIndex).toBe(0);
    trigger.focus();
    fireEvent.click(trigger, { detail: 0 });
    const dialog = screen.getByRole('dialog', { name: 'Tool details' });
    const close = within(dialog).getByRole('button', { name: 'Close' });
    await waitFor(() => expect(close).toHaveFocus());
    await within(dialog).findByRole('heading', { name: 'Query guide' });
    expect(dialog).toHaveClass(
      'right-0',
      'top-0',
      'h-svh',
      'sm:max-w-2xl',
      'overflow-hidden',
      'motion-reduce:transition-none',
    );
    const header = within(dialog)
      .getByRole('heading', { name: 'Tool details' })
      .closest('header')!;
    expect(header).toHaveClass('shrink-0');
    expect(header.nextElementSibling).toHaveClass('min-h-0', 'overflow-y-auto');
    fireEvent.click(close);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it.each([null, {}])(
    'distinguishes unavailable schema from an empty schema: %j',
    async (inputSchema) => {
      const summary = { ...tools[1], description: '' };
      mocks.api.request
        .mockResolvedValueOnce({ rows: [summary] })
        .mockResolvedValueOnce({ ...summary, about: '', inputSchema });
      await renderPage();
      fireEvent.click(
        await screen.findByRole('button', { name: 'draft-document' }),
      );
      const dialog = screen.getByRole('dialog', { name: 'Tool details' });
      expect(dialog).toHaveAccessibleDescription(
        'Read about this tool and review its input schema.',
      );
      expect(
        await within(dialog).findByText(
          'No additional documentation is available.',
        ),
      ).toBeVisible();
      if (inputSchema === null) {
        expect(
          within(dialog).getByText('No input schema is available.'),
        ).toBeVisible();
        expect(dialog.querySelector('pre')).toBeNull();
      } else {
        expect(dialog.querySelector('pre code')?.textContent).toBe('{}');
        expect(
          within(dialog).queryByText('No input schema is available.'),
        ).not.toBeInTheDocument();
      }
    },
  );

  it('truncates card metadata while keeping full details and authoritative scope/source values', async () => {
    const longTool = {
      ...tools[0],
      name: 'long-name'.repeat(40),
      title: 'LongTitle'.repeat(40),
      description: 'LongDescription'.repeat(80),
      about: 'LongAbout'.repeat(80),
      scope: 'FUTURE_SCOPE',
      source: 'third-party-source'.repeat(30),
    };
    mocks.api.request
      .mockResolvedValueOnce({ rows: [longTool] })
      .mockResolvedValueOnce({ ...longTool, about: '', inputSchema: {} });
    await renderPage();
    const list = await screen.findByRole('list', { name: 'Tools' });
    expect(
      within(list).getByText(longTool.about).closest('.line-clamp-2'),
    ).not.toBeNull();
    expect(within(list).queryByText(longTool.source)).not.toBeInTheDocument();
    expect(within(list).queryByText(longTool.scope)).not.toBeInTheDocument();
    const trigger = within(list).getByRole('button', { name: longTool.title });
    expect(trigger).not.toHaveClass('hover:underline');
    expect(within(trigger).getByText(longTool.title)).toHaveClass('truncate');
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Tool details' });
    expect(
      await within(dialog).findByText(
        'No additional documentation is available.',
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('heading', { name: longTool.title }),
    ).toHaveClass('[overflow-wrap:anywhere]');
    expect(within(dialog).getByText(longTool.name)).toHaveClass('break-all');
    for (const text of ['Scope', 'Source', longTool.scope, longTool.source]) {
      expect(within(dialog).queryByText(text)).not.toBeInTheDocument();
    }
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('retries failed details while retaining summary metadata', async () => {
    const pending = deferred<ManagedToolDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: tools })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(detail);
    await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Query records' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Tool details' });
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Loading tool details…',
    );
    await act(async () => pending.reject(new Error('Unavailable')));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Unable to load tool details.',
    );
    expect(
      within(dialog).getByRole('heading', { name: 'Query records' }),
    ).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }));
    expect(
      await within(dialog).findByRole('heading', { name: 'Query guide' }),
    ).toBeVisible();
  });

  it.each(['resolve', 'reject'] as const)(
    'ignores stale detail %s after closing and opening another tool',
    async (outcome) => {
      const pending = deferred<ManagedToolDetail>();
      const next = deferred<ManagedToolDetail>();
      mocks.api.request
        .mockResolvedValueOnce({ rows: tools })
        .mockReturnValueOnce(pending.promise)
        .mockReturnValueOnce(next.promise);
      await renderPage();
      fireEvent.click(
        await screen.findByRole('button', { name: 'Query records' }),
      );
      const signal = (
        mocks.api.request.mock.calls[1][0] as { signal: AbortSignal }
      ).signal;
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(signal.aborted).toBe(true));
      fireEvent.click(screen.getByRole('button', { name: 'draft-document' }));
      const dialog = screen.getByRole('dialog', { name: 'Tool details' });
      await act(async () => {
        if (outcome === 'resolve') pending.resolve(detail);
        else pending.reject(new Error('Stale failure'));
      });
      expect(within(dialog).getByRole('status')).toHaveTextContent(
        'Loading tool details…',
      );
      expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
      expect(within(dialog).queryByText('Query guide')).not.toBeInTheDocument();
      await act(async () =>
        next.resolve({ ...tools[1], about: '', inputSchema: null }),
      );
      expect(
        within(dialog).getByText('No input schema is available.'),
      ).toBeVisible();
    },
  );

  it('starts fresh on reopening the same tool and ignores its previous response', async () => {
    const previous = deferred<ManagedToolDetail>();
    const current = deferred<ManagedToolDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: tools })
      .mockReturnValueOnce(previous.promise)
      .mockReturnValueOnce(current.promise);
    await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Query records' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Query records' }));
    const dialog = screen.getByRole('dialog', { name: 'Tool details' });
    await act(async () => previous.resolve(detail));
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Loading tool details…',
    );
    await act(async () =>
      current.resolve({ ...detail, about: '# Current documentation' }),
    );
    expect(
      within(dialog).getByRole('heading', { name: 'Current documentation' }),
    ).toBeVisible();
  });

  it('cancels list and detail requests on unmount', async () => {
    const pending = deferred<ManagedToolDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: tools })
      .mockReturnValueOnce(pending.promise);
    const view = await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Query records' }),
    );
    const signals = mocks.api.request.mock.calls.map(
      ([request]: [{ signal: AbortSignal }]) => request.signal,
    );
    view.unmount();
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    await act(async () => pending.reject(new Error('Late failure')));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ignores a list response after unmount', async () => {
    const pending = deferred<{ rows: ManagedToolSummary[] }>();
    mocks.api.request.mockReturnValueOnce(pending.promise);
    const view = await renderPage();
    const signal = (
      mocks.api.request.mock.calls[0][0] as { signal: AbortSignal }
    ).signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve({ rows: tools }));
    expect(
      screen.queryByRole('list', { name: 'Tools' }),
    ).not.toBeInTheDocument();
  });

  it('localizes catalog and drawer labels in Chinese', async () => {
    mocks.api.request
      .mockResolvedValueOnce({ rows: tools })
      .mockResolvedValueOnce({ ...detail, about: '', inputSchema: null });
    await renderPage('zh-CN');
    expect(await screen.findByRole('list', { name: '工具' })).toBeVisible();
    expect(screen.getByRole('searchbox', { name: '搜索工具' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Query records' }));
    const dialog = screen.getByRole('dialog', { name: '工具详情' });
    expect(await within(dialog).findByText('暂无输入结构。')).toBeVisible();
    expect(within(dialog).getByText('暂无补充说明。')).toBeVisible();
    expect(within(dialog).queryByText('来源')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('范围')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '关闭' })).toBeVisible();
  });
});
