import {
  AIFormRegistry,
  AIFormRegistryProvider,
  type AIToolRendererProps,
  type AppUIMessage,
  type AIFormSnapshot,
} from '@nocobase/app-plugin-agents/client/chat';
import { renderWithApp } from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormProposalRenderer } from '../../client/components/online-agent/form-proposal-card.js';
import locales from '../../client/locales/index.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

async function setup(
  options: { missingSource?: boolean; write?: () => Promise<void> } = {},
) {
  const registry = new AIFormRegistry();
  let revision = 0;
  let draft = { name: 'Original', budget: 0 };
  const setter = vi.fn(async (patch) => {
    await options.write?.();
    draft = { ...draft, ...patch };
    revision += 1;
  });
  registry.register({
    id: 'request',
    title: 'Request',
    identity: 'user-a:record-a',
    fields: [
      { name: 'name', type: 'string', editable: true },
      { name: 'budget', type: 'number', editable: true },
    ],
    getRevision: () => String(revision),
    getValues: () => draft,
    setValues: setter,
  });
  const snapshot = await registry.snapshot('request');
  const source: AppUIMessage = {
    id: 'user-source',
    role: 'user',
    parts: [{ type: 'text', text: 'Propose a draft' }],
    metadata: {
      conversationId: 'conversation',
      createdAt: '2026-01-01T00:00:00.000Z',
      revision: 1,
      context: {
        route: '/example',
        items: [],
        dropped: 0,
        ui: { version: 1, items: [snapshot] },
      },
    },
  };
  const message: AppUIMessage = {
    id: 'assistant',
    role: 'assistant',
    parts: [],
    metadata: {
      conversationId: 'conversation',
      createdAt: '2026-01-01T00:00:00.000Z',
      revision: 1,
      sourceUserMessageId: source.id,
    },
  };
  const props: AIToolRendererProps = {
    toolName: 'examples_form_proposal',
    message,
    part: {
      type: 'dynamic-tool',
      toolName: 'examples_form_proposal',
      toolCallId: 'proposal-call',
      state: 'output-available',
      input: {},
      output: proposal(snapshot),
    },
    context: {
      readOnly: false,
      streaming: false,
      sourceMessage: options.missingSource ? null : source,
      sourceContext: options.missingSource
        ? null
        : (source.metadata?.context ?? null),
      approval: {
        disabled: true,
        pending: false,
        error: false,
        respond: async () => undefined,
      },
    },
  };
  const view = await renderWithApp(
    <AIFormRegistryProvider registry={registry}>
      <FormProposalRenderer {...props} />
    </AIFormRegistryProvider>,
    {
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: locales },
      locale: 'en-US',
    },
  );
  return {
    view,
    registry,
    setter,
    snapshot,
    props,
    draft: () => draft,
    modify: () => {
      revision += 1;
    },
  };
}
function proposal(snapshot: AIFormSnapshot) {
  return {
    formId: snapshot.id,
    instance: snapshot.instance,
    identity: snapshot.identity,
    revision: snapshot.revision,
    values: { name: 'Suggested', budget: 125 },
  };
}

describe('application-owned draft proposal', () => {
  it('does nothing on mount, applies only edited values after explicit confirmation, and deduplicates clicks', async () => {
    const test = await setup();
    expect(test.setter).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId('proposal-name'), {
      target: { value: 'Reviewed' },
    });
    fireEvent.change(screen.getByTestId('proposal-budget'), {
      target: { value: '500' },
    });
    fireEvent.click(screen.getByTestId('apply-form-proposal'));
    fireEvent.click(screen.getByTestId('apply-form-proposal'));
    await screen.findByText(enUS.aiFormFill.applied);
    expect(test.draft()).toEqual({ name: 'Reviewed', budget: 500 });
    expect(test.setter).toHaveBeenCalledTimes(1);
    expect(test.props.context.approval.pending).toBe(false);
  });

  it('dismisses without invoking the setter and retains a stable card instead of emitting a tool result', async () => {
    const test = await setup();
    fireEvent.click(screen.getByTestId('dismiss-form-proposal'));
    expect(screen.getByText(enUS.aiFormFill.dismissed)).toBeInTheDocument();
    expect(test.setter).not.toHaveBeenCalled();
    expect(screen.getByTestId('form-proposal-card')).toBeInTheDocument();
  });

  it('does not allow a registered form to replace missing originating message context', async () => {
    const test = await setup({ missingSource: true });
    expect(screen.getByTestId('apply-form-proposal')).toBeDisabled();
    expect(screen.getByText(enUS.aiFormFill.missingSource)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('apply-form-proposal'));
    expect(test.setter).not.toHaveBeenCalled();
  });

  it('rejects draft changes since the originating send snapshot', async () => {
    const test = await setup();
    test.modify();
    fireEvent.click(screen.getByTestId('apply-form-proposal'));
    await screen.findByText(enUS.aiFormFill.stale);
    expect(test.setter).not.toHaveBeenCalled();
    expect(test.draft().name).toBe('Original');
  });

  it('validates edited values inline and allows correction before executing', async () => {
    const test = await setup();
    const input = screen.getByTestId('proposal-budget');
    fireEvent.change(input, { target: { value: '-' } });
    fireEvent.click(screen.getByTestId('apply-form-proposal'));
    expect(screen.getByText(enUS.aiFormFill.invalidBudget)).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(test.setter).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '42' } });
    expect(
      screen.queryByText(enUS.aiFormFill.invalidBudget),
    ).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(test.setter).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('apply-form-proposal'));
    await screen.findByText(enUS.aiFormFill.applied);
    expect(test.draft().budget).toBe(42);
  });

  it('waits for asynchronous failure and never reports success prematurely', async () => {
    let fail!: (error: Error) => void;
    const test = await setup({
      write: () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        }),
    });
    fireEvent.click(screen.getByTestId('apply-form-proposal'));
    await waitFor(() => expect(test.setter).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(enUS.aiFormFill.applied)).not.toBeInTheDocument();
    expect(screen.getByTestId('apply-form-proposal')).toBeDisabled();
    await act(async () => fail(new Error('Private adapter detail')));
    await screen.findByText(enUS.aiFormFill.failed);
    expect(
      screen.queryByText('Private adapter detail'),
    ).not.toBeInTheDocument();
    expect(test.draft().name).toBe('Original');
  });
});
