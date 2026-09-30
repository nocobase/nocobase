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
  ManagedSkillDetail,
  ManagedSkillSummary,
} from '../client/skills-management-service.js';
import packageMetadata from '../package.json' with { type: 'json' };

const mocks = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useService: () => mocks.api,
  useApiClient: () => mocks.api,
}));

const skills: ManagedSkillSummary[] = [
  {
    name: 'analyze-data',
    title: 'Data analysis',
    description: 'Summarize trends',
    tools: [
      {
        name: 'queryRecords',
        title: 'Query records',
        description: 'Read collection records',
        about: 'Browse **business data** safely.',
        available: true,
      },
      {
        name: 'missingTool',
        title: '',
        description: 'Do not show this description',
        about: '',
        available: false,
      },
    ],
  },
  {
    name: 'draft-document',
    title: '',
    description: 'Write a report',
    tools: [],
  },
];
const detail: ManagedSkillDetail = {
  ...skills[0],
  content:
    '# Analysis guide\n\nUse **evidence** and `queryRecords`.\n\n- Compare trends\n\n```js\n' +
    'longCode'.repeat(100) +
    '\n```\n\n| Column | Value |\n| --- | --- |\n| Wide content | ' +
    'wideValue'.repeat(80) +
    ' |\n\n<script>alert("unsafe")</script>\n\n<img src="x" onerror="alert(1)">\n\n[unsafe link](javascript:alert%281%29)',
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
      <RouterProvider router={createCatalogTestRouter('skills')} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  mocks.api.request.mockReset().mockResolvedValue({ rows: skills });
});

describe('Skills settings page', () => {
  it('sorts by title with a name fallback rather than API order or identifier', async () => {
    mocks.api.request.mockResolvedValue({
      rows: [
        { ...skills[0], name: 'a-first', title: 'Zebra' },
        { ...skills[1], name: 'middle', title: ' ' },
        { ...skills[0], name: 'z-last', title: 'alpha' },
      ],
    });
    await renderPage();
    const list = await screen.findByRole('list', { name: 'Skills' });
    expect(
      within(list)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['alpha', 'middle', 'Zebra']);
  });

  it('uses the settings shell and responsive cards with tool badges in an icon-first footer, loading details only on open', async () => {
    await renderPage();
    const list = await screen.findByRole('list', { name: 'Skills' });
    const heading = screen.getByRole('heading', { name: 'Skills', level: 1 });
    expect(heading.closest('header')?.parentElement).toHaveClass(
      'w-full',
      'space-y-6',
      'p-6',
      'md:p-8',
    );
    expect(
      screen.getByText(
        'Browse the skills available to AI employees and review their instructions and associated tools.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(list).toHaveClass(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'xl:grid-cols-3',
    );
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    const card = cards[0].querySelector('[data-slot="card"]')!;
    expect(card).toHaveClass('h-64', 'min-w-0');
    expect(card).not.toHaveClass(
      'focus-within:ring-2',
      'focus-within:ring-ring',
    );
    expect(
      Array.from(card.children).map((node) => node.getAttribute('data-slot')),
    ).toEqual(['card-header', 'card-content', 'card-footer']);
    const header = card.querySelector('[data-slot="card-header"]')!;
    expect(
      within(header).getByRole('heading', { name: 'Data analysis', level: 2 }),
    ).toBeVisible();
    expect(within(header).getByText('analyze-data')).toBeVisible();
    expect(card.querySelector('[data-slot="card-content"]')).toHaveTextContent(
      'Summarize trends',
    );
    const footer = within(cards[0]).getByRole('group', { name: 'Tools' });
    expect(footer).toHaveAttribute('data-slot', 'card-footer');
    expect(footer).toHaveClass(
      'mt-auto',
      'h-14',
      'shrink-0',
      'flex-nowrap',
      'gap-2',
    );
    expect(footer.firstElementChild).toHaveClass('lucide-wrench');
    expect(footer.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    const badges = Array.from(
      footer.querySelectorAll('[data-slot="badge"]'),
    ).filter((badge) => !badge.closest('[aria-hidden="true"]'));
    expect(badges.map((badge) => badge.textContent)).toEqual([
      'missingTool',
      'Query records',
    ]);
    for (const badge of badges) {
      expect(badge).toHaveAttribute('data-variant', 'secondary');
      expect(badge).toHaveClass('shrink-0');
    }
    const emptyFooter = within(cards[1]).getByRole('group', { name: 'Tools' });
    expect(emptyFooter.firstElementChild).toHaveClass('lucide-wrench');
    expect(emptyFooter).toHaveTextContent('No tools');
    expect(emptyFooter.querySelector('[data-slot="badge"]')).toBeNull();
    expect(screen.getByText('analyze-data')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'draft-document' }),
    ).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /create|edit|delete|execute/i }),
    ).not.toBeInTheDocument();
    expect(mocks.api.request).toHaveBeenCalledExactlyOnceWith({
      path: 'ai/aiSkills:listAll',
      method: 'GET',
      signal: expect.any(AbortSignal),
    });
  });

  it('truncates long card metadata and opens from the overflow badge', async () => {
    const bounds = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        return {
          width: this.classList.contains('relative') ? 100 : 200,
          height: 20,
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 200,
          bottom: 20,
          toJSON: () => ({}),
        };
      });
    const longSkill = {
      ...skills[0],
      title: 'LongTitle'.repeat(40),
      name: 'long-identity'.repeat(40),
      description: 'LongDescription'.repeat(80),
      tools: Array.from({ length: 12 }, (_, index) => ({
        ...skills[0].tools[0],
        name: `tool-${index}-${'long-name'.repeat(30)}`,
      })),
    };
    mocks.api.request
      .mockResolvedValueOnce({ rows: [longSkill] })
      .mockResolvedValueOnce({ ...longSkill, content: '' });
    await renderPage();
    const list = await screen.findByRole('list', { name: 'Skills' });
    const trigger = within(list).getByRole('button', { name: longSkill.title });
    expect(trigger.firstElementChild).toHaveClass('truncate');
    expect(within(list).getByText(longSkill.name)).toHaveClass('truncate');
    expect(within(list).getByText(longSkill.description)).toHaveClass(
      'line-clamp-3',
    );
    const footer = within(list).getByRole('group', { name: 'Tools' });
    const overflow = within(footer)
      .getAllByText('+12')
      .find((badge) => !badge.closest('[aria-hidden="true"]'))!;
    expect(overflow).toBeVisible();
    expect(overflow).toHaveAttribute(
      'title',
      longSkill.tools.map((tool) => tool.title).join(', '),
    );
    bounds.mockRestore();
    fireEvent.click(overflow);
    const dialog = await screen.findByRole('dialog', { name: 'Skill details' });
    await within(dialog).findByText('No instructions are available.');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
  });

  it('searches skill metadata and tool names locally', async () => {
    await renderPage();
    await screen.findByRole('list', { name: 'Skills' });
    const search = screen.getByRole('searchbox', { name: 'Search skills' });
    for (const query of [
      ' DATA ANALYSIS ',
      'analyze-data',
      'trends',
      'QUERYRECORDS',
      'Query records',
    ]) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expect(screen.getByText('1 skill')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Data analysis' }),
      ).toBeVisible();
    }
    fireEvent.change(search, { target: { value: 'not-found' } });
    expect(screen.getByRole('status')).toHaveTextContent(
      'No skills match your search.',
    );
    expect(screen.getByText('0 skills')).toBeVisible();
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getByText('2 skills')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(mocks.api.request).toHaveBeenCalledTimes(1);
  });

  it('shows list loading, empty and retry states', async () => {
    const pending = deferred<{ rows: ManagedSkillSummary[] }>();
    mocks.api.request
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ rows: [] });
    await renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading skills…');
    await act(async () => pending.reject(new Error('Unavailable')));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Unable to load skills.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No skills are available.')).toBeVisible();
  });

  it('opens from the card, renders safe Markdown and descriptive tools, and closes with Escape', async () => {
    mocks.api.request
      .mockResolvedValueOnce({ rows: skills })
      .mockResolvedValueOnce(detail);
    await renderPage();
    const title = await screen.findByRole('button', { name: 'Data analysis' });
    fireEvent.click(title.closest('[data-slot="card"]')!);
    const dialog = await screen.findByRole('dialog', { name: 'Skill details' });
    expect(
      within(dialog).getByRole('heading', { name: 'Data analysis' }),
    ).toBeVisible();
    expect(dialog).toHaveAccessibleDescription('Summarize trends');
    expect(
      await within(dialog).findByRole('heading', { name: 'Analysis guide' }),
    ).toBeVisible();
    expect(within(dialog).getByText('evidence').tagName).toBe('STRONG');
    expect(dialog.querySelector('pre code')).toHaveTextContent(
      'longCode'.repeat(100),
    );
    expect(dialog.querySelector('script, img, iframe')).toBeNull();
    expect(dialog.querySelector('a')?.getAttribute('href') ?? '').not.toMatch(
      /javascript:/i,
    );
    expect(dialog.querySelector('pre')).toHaveClass('overflow-x-auto');
    expect(within(dialog).getByRole('table').parentElement).toHaveClass(
      'overflow-x-auto',
    );
    expect(
      within(dialog).getByRole('tabpanel', { name: 'Instructions' }),
    ).toBeVisible();
    expect(
      within(dialog).queryByRole('heading', { name: 'Query records' }),
    ).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Tools (2)' }));
    const tools = within(dialog).getByRole('tabpanel', { name: 'Tools (2)' });
    expect(within(tools).getByText('Query records')).toBeVisible();
    expect(within(tools).getByText('queryRecords')).toBeVisible();
    const about = within(tools).getByText('Browse business data safely.');
    expect(about).toBeVisible();
    expect(about.closest('.line-clamp-2')).toHaveAttribute(
      'title',
      'Browse business data safely.',
    );
    for (const row of within(tools).getAllByRole('listitem'))
      expect(row).toHaveClass('min-h-32');
    expect(
      within(tools).queryByText('Read collection records'),
    ).not.toBeInTheDocument();
    expect(
      within(tools).queryByText('Do not show this description'),
    ).not.toBeInTheDocument();
    expect(within(tools).queryByText('Available')).not.toBeInTheDocument();
    expect(within(tools).getByText('Missing')).toBeVisible();
    expect(within(dialog).getAllByRole('button')).toHaveLength(1);
    expect(dialog).toHaveClass(
      'right-0',
      'top-0',
      'h-svh',
      'sm:max-w-2xl',
      'overflow-hidden',
      'motion-reduce:transition-none',
    );
    expect(dialog).not.toHaveClass('left-1/2', 'top-1/2', 'overflow-y-auto');
    const header = within(dialog)
      .getByRole('heading', { name: 'Skill details' })
      .closest('header')!;
    expect(header).toHaveClass('shrink-0');
    expect(header.nextElementSibling).toHaveClass('min-h-0', 'overflow-y-auto');
    expect(within(dialog).getByRole('tablist').parentElement).toHaveClass(
      'sticky',
      'top-0',
    );
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(title).toHaveFocus());
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
  });

  it('supports keyboard tab navigation and returns focus to the skill after closing', async () => {
    mocks.api.request
      .mockResolvedValueOnce({ rows: skills })
      .mockResolvedValueOnce(detail);
    await renderPage();
    const trigger = await screen.findByRole('button', {
      name: 'Data analysis',
    });
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger.tabIndex).toBe(0);
    trigger.focus();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger, { detail: 0 });
    const dialog = screen.getByRole('dialog', { name: 'Skill details' });
    const close = within(dialog).getByRole('button', { name: 'Close' });
    const instructions = within(dialog).getByRole('tab', {
      name: 'Instructions',
    });
    await waitFor(() => expect(instructions).toHaveFocus());
    await within(dialog).findByRole('heading', { name: 'Analysis guide' });
    const tools = within(dialog).getByRole('tab', { name: 'Tools (2)' });
    act(() => instructions.focus());
    fireEvent.keyDown(instructions, { key: 'ArrowRight' });
    await waitFor(() => expect(tools).toHaveFocus());
    expect(tools).toHaveAttribute('aria-selected', 'true');
    expect(
      within(dialog).getByRole('tabpanel', { name: 'Tools (2)' }),
    ).toBeVisible();
    fireEvent.keyDown(tools, { key: 'ArrowLeft' });
    await waitFor(() => expect(instructions).toHaveFocus());
    expect(instructions).toHaveAttribute('aria-selected', 'true');
    expect(
      within(dialog).getByRole('heading', { name: 'Analysis guide' }),
    ).toBeVisible();
    fireEvent.click(close);
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
  });

  it('keeps long metadata readable and provides a description fallback', async () => {
    const longSkill = {
      ...skills[1],
      name: 'long-identity'.repeat(40),
      title: 'Long title '.repeat(30),
      description: '',
    };
    mocks.api.request
      .mockResolvedValueOnce({ rows: [longSkill] })
      .mockResolvedValueOnce({ ...longSkill, content: '' });
    await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: longSkill.title.trim() }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Skill details' });
    expect(dialog).toHaveAccessibleDescription(
      'Read the skill instructions and review its tools.',
    );
    expect(
      within(dialog).getByRole('heading', { name: longSkill.title.trim() }),
    ).toHaveClass('[overflow-wrap:anywhere]');
    expect(within(dialog).getByText(longSkill.name)).toHaveClass(
      'break-all',
      'font-mono',
    );
    expect(
      await within(dialog).findByText('No instructions are available.'),
    ).toBeVisible();
  });

  it('opens from the accessible title button and retries a failed detail request', async () => {
    const pending = deferred<ManagedSkillDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: skills })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(detail);
    await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Data analysis' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Skill details' });
    expect(
      within(dialog).getByRole('heading', { name: 'Skill details' }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('tab', { name: 'Instructions' }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('status').querySelector('[aria-hidden]'),
    ).not.toBeNull();
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Loading skill details…',
    );
    await act(async () => pending.reject(new Error('Unavailable')));
    const alert = within(dialog).getByRole('alert');
    expect(alert).toHaveTextContent('Unable to load skill details.');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(
      await within(dialog).findByRole('heading', { name: 'Analysis guide' }),
    ).toBeVisible();
    expect(mocks.api.request).toHaveBeenNthCalledWith(3, {
      path: 'ai/aiSkills:getDetails',
      method: 'GET',
      query: { name: 'analyze-data' },
      signal: expect.any(AbortSignal),
    });
  });

  it.each(['resolve', 'reject'] as const)(
    'ignores stale detail %s after closing and rapidly opening another skill',
    async (outcome) => {
      const pending = deferred<ManagedSkillDetail>();
      const next = deferred<ManagedSkillDetail>();
      mocks.api.request
        .mockResolvedValueOnce({ rows: skills })
        .mockReturnValueOnce(pending.promise)
        .mockReturnValueOnce(next.promise);
      await renderPage();
      fireEvent.click(
        await screen.findByRole('button', { name: 'Data analysis' }),
      );
      const signal = (
        mocks.api.request.mock.calls[1][0] as { signal: AbortSignal }
      ).signal;
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(signal.aborted).toBe(true));
      fireEvent.click(screen.getByRole('button', { name: 'draft-document' }));
      const dialog = screen.getByRole('dialog', { name: 'Skill details' });
      expect(
        within(dialog).getByRole('heading', { name: 'draft-document' }),
      ).toBeVisible();
      await act(async () => {
        if (outcome === 'resolve') pending.resolve(detail);
        else pending.reject(new Error('Stale failure'));
      });
      expect(within(dialog).getByRole('status')).toHaveTextContent(
        'Loading skill details…',
      );
      expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
      expect(
        within(dialog).queryByText('Analysis guide'),
      ).not.toBeInTheDocument();
      await act(async () => next.resolve({ ...skills[1], content: '' }));
      expect(
        within(dialog).getByText('No instructions are available.'),
      ).toBeVisible();
      fireEvent.click(within(dialog).getByRole('tab', { name: 'Tools (0)' }));
      expect(within(dialog).getByText('No tools')).toBeVisible();
    },
  );

  it('cancels on close and unmount without reopening from late responses', async () => {
    const pending = deferred<ManagedSkillDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: skills })
      .mockReturnValueOnce(pending.promise);
    const view = await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Data analysis' }),
    );
    const listSignal = (
      mocks.api.request.mock.calls[0][0] as { signal: AbortSignal }
    ).signal;
    const signal = (
      mocks.api.request.mock.calls[1][0] as { signal: AbortSignal }
    ).signal;
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(signal.aborted).toBe(true));
    await act(async () => pending.resolve(detail));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    view.unmount();
    expect(listSignal.aborted).toBe(true);
  });

  it('cancels a pending detail request when the page unmounts', async () => {
    const pending = deferred<ManagedSkillDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: skills })
      .mockReturnValueOnce(pending.promise);
    const view = await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Data analysis' }),
    );
    const signal = (
      mocks.api.request.mock.calls[1][0] as { signal: AbortSignal }
    ).signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.reject(new Error('Late failure')));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancels a pending list request on unmount and ignores its completion', async () => {
    const pending = deferred<{ rows: ManagedSkillSummary[] }>();
    mocks.api.request.mockReturnValueOnce(pending.promise);
    const view = await renderPage();
    const signal = (
      mocks.api.request.mock.calls[0][0] as { signal: AbortSignal }
    ).signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve({ rows: skills }));
    expect(
      screen.queryByRole('list', { name: 'Skills' }),
    ).not.toBeInTheDocument();
  });

  it('starts fresh when reopening the same skill and ignores the previous response', async () => {
    const previous = deferred<ManagedSkillDetail>();
    const current = deferred<ManagedSkillDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: skills })
      .mockReturnValueOnce(previous.promise)
      .mockReturnValueOnce(current.promise);
    await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Data analysis' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Data analysis' }));
    const dialog = screen.getByRole('dialog', { name: 'Skill details' });
    await act(async () => previous.resolve(detail));
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Loading skill details…',
    );
    expect(
      within(dialog).queryByText('Analysis guide'),
    ).not.toBeInTheDocument();
    await act(async () =>
      current.resolve({ ...detail, content: '# Current instructions' }),
    );
    expect(
      within(dialog).getByRole('heading', { name: 'Current instructions' }),
    ).toBeVisible();
  });

  it('renders Chinese card footers, dialog loading, error and tool statuses', async () => {
    const pending = deferred<ManagedSkillDetail>();
    mocks.api.request
      .mockResolvedValueOnce({ rows: skills })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(detail);
    await renderPage('zh-CN');
    const list = await screen.findByRole('list', { name: '技能' });
    expect(screen.getByText('共 2 个技能')).toBeVisible();
    expect(within(list).getAllByRole('group', { name: '工具' })).toHaveLength(
      2,
    );
    expect(within(list).getByText('无工具')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Data analysis' }));
    expect(screen.getByRole('status')).toHaveTextContent('正在加载技能详情…');
    await act(async () => pending.reject(new Error('Unavailable')));
    expect(screen.getByRole('alert')).toHaveTextContent('无法加载技能详情。');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    const dialog = screen.getByRole('dialog', { name: '技能详情' });
    expect(
      await within(dialog).findByRole('heading', { name: 'Analysis guide' }),
    ).toBeVisible();
    fireEvent.click(within(dialog).getByRole('tab', { name: '工具 (2)' }));
    expect(within(dialog).queryByText('可用')).not.toBeInTheDocument();
    expect(within(dialog).getByText('缺失')).toBeVisible();
  });
});
