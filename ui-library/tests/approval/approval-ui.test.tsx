import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  ApprovalActionBar,
  ApprovalBranches,
  ApprovalProgress,
  ApprovalReceipts,
  ApprovalRoutePreview,
  ApprovalTimeline,
  ApprovalUiProvider,
  approvalUiLocaleEnUS,
  approvalUiLocaleZhCN,
  type ApprovalBarAction,
} from '../../registry/approval/approval-ui';
import {
  BRANCHES,
  COPIES,
  LINES,
  PEOPLE,
  RECEIPTS,
  ROUTE,
  STEPS,
} from '../../website/demo/approval/fixtures';

// The block's own locales in a strict runtime: a key they lack fails the test instead of rendering its English
// default. Everything else on screen comes translated in the data.
async function runtime(locale: 'en-US' | 'zh-CN') {
  return createTestI18nRuntime({
    locale,
    application: {
      namespace: '@nocobase/ui-library',
      resources:
        locale === 'en-US' ? approvalUiLocaleEnUS : approvalUiLocaleZhCN,
    },
  });
}

const english = await runtime('en-US');
const chinese = await runtime('zh-CN');

function Providers({
  children,
  i18n = english,
}: {
  readonly children: ReactNode;
  readonly i18n?: Awaited<ReturnType<typeof runtime>>;
}): ReactElement {
  return (
    <TestI18nProvider runtime={i18n}>
      <ApprovalUiProvider
        personName={(id) => PEOPLE[id] ?? id}
        formatDateTime={(iso) => iso.slice(0, 16)}
      >
        {children}
      </ApprovalUiProvider>
    </TestI18nProvider>
  );
}

function rows(): HTMLElement[] {
  return screen
    .getAllByRole('listitem')
    .filter((item) => item.parentElement?.tagName === 'OL');
}

describe('ApprovalProgress', () => {
  it('shows each step with where it stands and who decides it, then the copies', () => {
    render(<ApprovalProgress steps={STEPS} copies={COPIES} />, {
      wrapper: Providers,
    });
    const steps = rows();
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringContaining('Manager review'),
      expect.stringContaining('Finance review'),
      expect.stringContaining('CFO sign-off'),
    ]);
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    expect(steps[1]).toHaveTextContent('in progress');
    expect(steps[1]).toHaveTextContent('everyone approves');
    expect(steps[1]).toHaveTextContent('Wang WeiApproved');
    expect(steps[1]).toHaveTextContent('Zhao LeiWaiting');
    expect(steps[1]).toHaveTextContent('handed over');
    expect(steps[0]).toHaveTextContent('“Receipts look fine.”');
    expect(screen.getByText('Copied to')).toBeInTheDocument();
    expect(screen.getByText('unread')).toBeInTheDocument();
  });

  it('counts the answers of a step several people decide, marks what carries it, and says when an answer is overdue', () => {
    render(
      <ApprovalProgress
        steps={[
          {
            key: 'vote',
            title: 'Committee',
            state: 'current',
            tally: {
              total: 5,
              needed: 3,
              counts: [
                {
                  key: 'approve',
                  label: 'Approve',
                  count: 2,
                  tone: 'positive',
                },
                { key: 'reject', label: 'Reject', count: 1, tone: 'negative' },
              ],
              rules: ['The chair may veto'],
            },
            tasks: [
              {
                key: 'm1',
                personId: 'li',
                badges: [{ label: 'Waiting' }],
                due: { label: 'overdue by 2 hours', overdue: true },
              },
            ],
          },
        ]}
      />,
      { wrapper: Providers },
    );
    expect(
      screen.getByRole('img', { name: '3 of 5 answered' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3 needed to pass')).toBeInTheDocument();
    expect(screen.getByText('The chair may veto')).toBeInTheDocument();
    expect(screen.getByText('overdue by 2 hours')).toHaveClass(
      'text-destructive',
    );
  });

  it('words its own chrome in the page’s language', () => {
    render(
      <Providers i18n={chinese}>
        <ApprovalProgress steps={STEPS} copies={COPIES} />
      </Providers>,
    );
    expect(screen.getByText('处理中')).toBeInTheDocument();
    expect(screen.getByText('抄送给')).toBeInTheDocument();
  });

  it('shows a notice, and says so when no approval has started', () => {
    render(<ApprovalProgress steps={[]} notice={<p>Read only</p>} />, {
      wrapper: Providers,
    });
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(
      screen.getByText('No approval has started yet.'),
    ).toBeInTheDocument();
  });
});

describe('ApprovalTimeline', () => {
  it('lists lines oldest first, names the actor of an event, and folds what an action changed', () => {
    render(<ApprovalTimeline lines={[...LINES].reverse()} />, {
      wrapper: Providers,
    });
    const lines = rows().map((item) => item.textContent ?? '');
    expect(lines[0]).toContain('Ming Chencreated the claim');
    expect(lines[1]).toContain('2 system updates');
    expect(lines[2]).toContain('Li Na approved');
    expect(lines.at(-1)).toContain('Ming Chen sent a copy to Chen Jie');

    expect(screen.queryByText('concluded a stage')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'What changed (2)' }));
    expect(screen.getByText('concluded a stage')).toBeInTheDocument();
  });

  it('folds bookkeeping in a row into one line until opened, unless told not to', () => {
    const { unmount } = render(<ApprovalTimeline lines={LINES} />, {
      wrapper: Providers,
    });
    expect(screen.queryByText(/started the approval/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 system updates' }));
    expect(screen.getByText(/started the approval/)).toBeInTheDocument();
    unmount();
    render(<ApprovalTimeline lines={LINES} foldMuted={false} />, {
      wrapper: Providers,
    });
    expect(screen.getByText('started the approval')).toBeInTheDocument();
  });
});

describe('ApprovalBranches', () => {
  it('counts the branches the request waits for and points at the one holding it up', () => {
    const onOpen = vi.fn();
    render(<ApprovalBranches branches={BRANCHES} onOpen={onOpen} />, {
      wrapper: Providers,
    });
    expect(screen.getByText('1 of 3 finished')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
    expect(screen.getByText('Holding the request up')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^IT/ }));
    expect(onOpen).toHaveBeenCalledWith('it');
  });
});

describe('ApprovalReceipts', () => {
  it('shows how far a notice has got and each recipient', () => {
    render(<ApprovalReceipts receipts={RECEIPTS} confirm />, {
      wrapper: Providers,
    });
    expect(screen.getByRole('meter', { name: 'Read' })).toHaveAttribute(
      'aria-valuenow',
      '2',
    );
    expect(screen.getByRole('meter', { name: 'Confirmed' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(screen.getByText('“Noted, thanks.”')).toBeInTheDocument();
  });
});

describe('ApprovalRoutePreview', () => {
  it('shows each stop, the ones it skips and why, and the notes', () => {
    render(<ApprovalRoutePreview route={ROUTE} applicantId='ming' />, {
      wrapper: Providers,
    });
    expect(screen.getByText('Who will decide')).toBeInTheDocument();
    expect(screen.getByText('Finance review')).toBeInTheDocument();
    expect(screen.getByText('everyone approves')).toBeInTheDocument();
    expect(
      screen.getByText('Not needed: CFO sign-off (Under 5,000)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Over 1,000')).toBeInTheDocument();
    expect(screen.getByText('Li Na manages Ming Chen.')).toBeInTheDocument();
  });

  it('says it is working while the route loads', () => {
    render(<ApprovalRoutePreview route={undefined} applicantId='ming' />, {
      wrapper: Providers,
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Working out the route…',
    );
  });
});

describe('ApprovalActionBar', () => {
  function actions(
    run: (name: string, values: object) => void,
    load: (signal: AbortSignal) => Promise<unknown>,
  ): ApprovalBarAction[] {
    const send = (name: string) => (values: object) => {
      run(name, values);
      return Promise.resolve();
    };
    return [
      {
        key: 'approve',
        label: 'Approve',
        tone: 'primary',
        primary: true,
        run: send('approve'),
      },
      {
        key: 'reject',
        label: 'Reject',
        tone: 'danger',
        primary: true,
        form: {
          validate: (values) => (values.comment ? [] : ['comment']),
          render: ({ values, setValues, invalid }) => (
            <input
              aria-label='Reason'
              aria-invalid={invalid.includes('comment')}
              value={String(values.comment ?? '')}
              onChange={(event) => setValues({ comment: event.target.value })}
            />
          ),
        },
        run: send('reject'),
      },
      {
        key: 'transfer',
        label: 'Hand over',
        form: {
          load,
          loadError: 'The people could not be loaded.',
          render: ({ loaded }) => <p>{(loaded as string[]).join(', ')}</p>,
        },
        run: send('transfer'),
      },
      {
        key: 'comment',
        label: 'Comment',
        run: send('comment'),
      },
      {
        key: 'cc',
        label: 'Copy to',
        run: send('cc'),
      },
      {
        key: 'reassign',
        label: 'Reassign',
        group: 'admin',
        run: send('reassign'),
      },
    ];
  }

  it('runs a primary action without a form at once', async () => {
    const run = vi.fn();
    render(
      <ApprovalActionBar actions={actions(run, () => Promise.resolve([]))} />,
      { wrapper: Providers },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(run).toHaveBeenCalledWith('approve', {}));
  });

  it('opens a form for an action that asks for input, and holds it until the input is valid', async () => {
    const run = vi.fn();
    render(
      <ApprovalActionBar actions={actions(run, () => Promise.resolve([]))} />,
      { wrapper: Providers },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    const form = screen.getByRole('form', { name: 'Reject' });
    fireEvent.submit(form);
    expect(screen.getByLabelText('Reason')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(run).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Reason'), {
      target: { value: 'Over budget' },
    });
    fireEvent.submit(form);
    await waitFor(() =>
      expect(run).toHaveBeenCalledWith('reject', { comment: 'Over budget' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('form')).not.toBeInTheDocument(),
    );
  });

  it('puts the rest under More, administration apart, and drops a load the form no longer waits for', async () => {
    let signal: AbortSignal | undefined;
    const load = vi.fn((given: AbortSignal) => {
      signal = given;
      return new Promise<unknown>(() => undefined);
    });
    render(
      <ApprovalActionBar actions={actions(vi.fn(), load)}>
        <button type='button'>Simulate</button>
      </ApprovalActionBar>,
      { wrapper: Providers },
    );
    expect(
      screen.getByRole('button', { name: 'Simulate' }),
    ).toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole('button', { name: 'More', expanded: false }),
    );
    expect(await screen.findByText('Administration')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hand over' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
    expect(load).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(signal?.aborted).toBe(true);
  });

  it('lays every action out as a button while there are few, administration still apart', async () => {
    const run = vi.fn();
    render(
      <ApprovalActionBar
        actions={actions(run, () => Promise.resolve([])).filter(
          (action) => action.key !== 'cc' && action.key !== 'transfer',
        )}
      />,
      { wrapper: Providers },
    );
    expect(
      screen.getAllByRole('button').map((button) => button.textContent),
    ).toEqual(['Approve', 'Reject', 'Comment', 'Administration']);
    expect(
      screen.queryByRole('button', { name: 'More' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
    await waitFor(() => expect(run).toHaveBeenCalledWith('comment', {}));
  });

  it('shows a lone secondary action as a button rather than a menu of one', async () => {
    const run = vi.fn();
    render(
      <ApprovalActionBar
        actions={[
          {
            key: 'withdraw',
            label: 'Withdraw',
            tone: 'danger',
            form: { description: 'It goes back to draft.', render: () => null },
            run: () => {
              run();
              return Promise.resolve();
            },
          },
        ]}
      />,
      { wrapper: Providers },
    );
    expect(
      screen.queryByRole('button', { name: 'Actions' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(screen.getByText('It goes back to draft.')).toBeInTheDocument();
  });

  it('says what could not be loaded, in the form’s own words', async () => {
    render(
      <ApprovalActionBar
        actions={actions(vi.fn(), () => Promise.reject(new Error('down')))}
      />,
      { wrapper: Providers },
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'More', expanded: false }),
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Hand over' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The people could not be loaded.',
    );
    expect(screen.getByRole('button', { name: 'Hand over' })).toBeDisabled();
  });
});
