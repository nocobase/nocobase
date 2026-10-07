import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanCard } from '../../registry/projects/plan-card/plan-card';
import enUS from '../../registry/projects/plan-card/locales/en-US';
import { resetPlanDemo } from '../../website/demo/projects/projects-plan-kit';

const toast = vi.hoisted(() => vi.fn());

// The plugin's hooks, answering from the preview's in-memory plans: what the card does with them is under test.
vi.mock(
  '@nocobase/app-plugin-projects/client/kit',
  () => import('../../website/demo/projects/projects-plan-kit'),
);

vi.mock('@nocobase/app-client', () => ({
  useToaster: () => ({ show: toast, close: vi.fn() }),
}));

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/test-app',
    resources: enUS as unknown as Record<string, string>,
  },
});

function renderCard(planId: string): void {
  render(
    <MemoryRouter>
      <TestI18nProvider runtime={runtime}>
        <PlanCard planId={planId} />
      </TestI18nProvider>
    </MemoryRouter>,
  );
}

const card = (): HTMLElement => screen.getByTestId('plan-card');

beforeEach(() => {
  resetPlanDemo();
  toast.mockReset();
});

describe('the plan card', () => {
  it('shows a pending plan: its status, source, rows and what they wake or risk', () => {
    renderCard('plan-pending');
    expect(card()).toHaveAttribute('data-plan-status', 'pending');
    expect(
      screen.getByRole('heading', { name: 'Plan the CSV export' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Waiting for you')).toBeInTheDocument();
    expect(screen.getByText('4 changes')).toBeInTheDocument();
    expect(screen.getByText('From a conversation')).toBeInTheDocument();
    expect(screen.getByText('Proposed by Coding agent')).toBeInTheDocument();
    const rows = within(screen.getByRole('list', { name: 'Changes' }));
    expect(rows.getByText('Export issues as CSV')).toBeInTheDocument();
    expect(rows.getByText('Wakes Coding agent')).toBeInTheDocument();
    expect(rows.getByText('Makes an agent the executor')).toBeInTheDocument();
    // The update reads as "was → becomes", in the target's workflow.
    expect(rows.getByText('In progress')).toHaveClass('line-through');
    expect(rows.getByText('In review')).toBeInTheDocument();
  });

  it('asks again before executing risky rows, then executes', async () => {
    renderCard('plan-pending');
    fireEvent.click(screen.getByTestId('plan-execute'));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Execute this plan?')).toBeInTheDocument();
    expect(
      within(within(dialog).getByTestId('plan-risky-rows')).getByText(
        'Changes an owner',
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Execute' }));
    await waitFor(() =>
      expect(card()).toHaveAttribute('data-plan-status', 'executed'),
    );
    expect(toast).toHaveBeenCalledWith({
      type: 'success',
      title: 'The plan was executed.',
    });
    expect(screen.getByTestId('plan-undo')).toBeInTheDocument();
  });

  it('voids after asking', async () => {
    renderCard('plan-pending');
    fireEvent.click(screen.getByRole('button', { name: 'Void' }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Void' }));
    await waitFor(() =>
      expect(card()).toHaveAttribute('data-plan-status', 'voided'),
    );
    expect(toast).toHaveBeenCalledWith({
      type: 'success',
      title: 'The plan was voided.',
    });
  });

  it('undoes an executed plan after previewing what reverts', async () => {
    renderCard('plan-executed');
    expect(screen.getByText(/Can be undone for \d+ h/u)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('plan-undo'));
    const dialog = await screen.findByTestId('plan-undo-dialog');
    expect(
      within(dialog).getByText('1 change will be reverted'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('PM-12 Sign-in form: Status back as before'),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByTestId('plan-undo-confirm'));
    await waitFor(() =>
      expect(card()).toHaveAttribute('data-plan-status', 'undone'),
    );
    expect(toast).toHaveBeenCalledWith({
      type: 'success',
      title: 'The plan was undone.',
    });
  });

  it('names the failing change of a failed plan and checks it again', async () => {
    renderCard('plan-failed');
    expect(
      screen.getByText('A change failed, so nothing was applied.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Change 1: You may not change this issue.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('plan-retry'));
    await waitFor(() =>
      expect(card()).toHaveAttribute('data-plan-status', 'pending'),
    );
  });

  it('edits the rows in place and saves them', async () => {
    renderCard('plan-pending');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const editor = screen.getByTestId('plan-editor');
    expect(
      within(editor).getByLabelText('Export issues as CSV Title'),
    ).toHaveValue('Export issues as CSV');
    expect(
      within(editor).getByLabelText('Export issues as CSV Executor'),
    ).toHaveTextContent('Coding agent');
    // The comment on PM-34 goes; nothing points at it.
    fireEvent.click(
      within(editor).getAllByRole('button', {
        name: 'Remove PM-34 Mentions',
      })[1]!,
    );
    expect(within(editor).getByText('Unsaved changes')).toBeInTheDocument();
    fireEvent.click(
      within(editor).getByRole('button', { name: 'Save changes' }),
    );
    await waitFor(() =>
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument(),
    );
    fireEvent.click(within(editor).getByRole('button', { name: 'Done' }));
    expect(screen.getByText('3 changes')).toBeInTheDocument();
  });

  it("hands its parts to a caller's frame instead of its own header", () => {
    render(
      <MemoryRouter>
        <TestI18nProvider runtime={runtime}>
          <PlanCard
            planId='plan-pending'
            frame={({ title, href, meta, actions, content }) => (
              <article>
                <header data-testid='frame-header'>
                  <h2>
                    <a href={href}>{title}</a>
                  </h2>
                  <p>{meta}</p>
                  <div>{actions}</div>
                </header>
                {content}
              </article>
            )}
          />
        </TestI18nProvider>
      </MemoryRouter>,
    );
    // One title, the frame's: the card draws no header, band or fold of its own.
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: 'Plan the CSV export' }),
    ).toHaveAttribute('href', '/issues/plans/plan-pending');
    expect(
      screen.queryByRole('button', { name: 'Hide the changes' }),
    ).toBeNull();
    const header = within(screen.getByTestId('frame-header'));
    expect(header.getByText('4 changes')).toBeInTheDocument();
    // The actions sit in the frame's header as full-size buttons: execute primary, the others outline.
    expect(header.getByTestId('plan-execute').className).toContain('h-8');
    expect(header.getByTestId('plan-void').className).toContain(
      'border-border',
    );
    expect(header.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    // The rows show in the content, below the header.
    expect(card()).toHaveAttribute('data-plan-status', 'pending');
    expect(
      within(card()).getByRole('list', { name: 'Changes' }),
    ).toBeInTheDocument();
  });
});
