import {
  AIFormRegistry,
  AIFormRegistryProvider,
  type AIToolRendererProps,
  type AppUIMessage,
  type AIFormSnapshot,
  type AIFormOperationContext,
  type AIFormSetResult,
} from '@nocobase/app-plugin-agents/client/chat';
import { renderWithApp } from '@nocobase/app-testing/client';
import { act, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormProposalRenderer } from '../../client/components/online-agent/form-proposal-card.js';
import locales from '../../client/locales/index.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

async function setup(
  options: {
    missingSource?: boolean;
    readOnly?: boolean;
    streaming?: boolean;
    incomplete?: boolean;
    invalid?: boolean;
    strict?: boolean;
    write?: (
      context: AIFormOperationContext,
    ) => Promise<void | AIFormSetResult>;
  } = {},
) {
  const registry = new AIFormRegistry();
  let revision = 0;
  let draft = { name: 'Original', budget: 0 };
  const setter = vi.fn(async (patch, context: AIFormOperationContext) => {
    const result = await options.write?.(context);
    if (!context.isCurrent()) return;
    draft = { ...draft, ...patch };
    revision += 1;
    return result;
  });
  const registration = {
    id: 'request',
    title: 'Request',
    identity: 'user-a:record-a',
    fields: [
      { name: 'name', type: 'string' as const, editable: true },
      { name: 'budget', type: 'number' as const, editable: true },
    ],
    getRevision: () => String(revision),
    getValues: () => draft,
    setValues: setter,
  };
  const handle = registry.register(registration);
  const snapshot = await registry.snapshot('request');
  const source: AppUIMessage = {
    id: 'user-source',
    role: 'user',
    parts: [{ type: 'text', text: 'Fill the selected draft' }],
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
  const respond = vi.fn(async () => undefined);
  let props: AIToolRendererProps = {
    toolName: 'examples_form_proposal',
    message,
    part: {
      type: 'dynamic-tool',
      toolName: 'examples_form_proposal',
      toolCallId: 'proposal-call',
      state: options.incomplete ? 'input-available' : 'output-available',
      input: {},
      output: options.invalid
        ? { ...proposal(snapshot), values: { budget: -1 } }
        : proposal(snapshot),
    },
    context: {
      readOnly: options.readOnly ?? false,
      streaming: options.streaming ?? false,
      sourceMessage: options.missingSource ? null : source,
      sourceContext: options.missingSource
        ? null
        : (source.metadata?.context ?? null),
      approval: { disabled: true, pending: false, error: false, respond },
    },
  };
  const element = () => {
    const content = (
      <AIFormRegistryProvider registry={registry}>
        <FormProposalRenderer {...props} />
      </AIFormRegistryProvider>
    );
    return options.strict ? <StrictMode>{content}</StrictMode> : content;
  };
  const view = await renderWithApp(element(), {
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    locale: 'en-US',
  });
  return {
    view,
    registry,
    setter,
    snapshot,
    respond,
    draft: () => draft,
    modify: () => {
      revision += 1;
      draft = { ...draft, name: 'Manual edit' };
    },
    replaceTarget: () => {
      handle.unregister();
      registry.register(registration);
    },
    rerender: (update: Partial<AIToolRendererProps> = {}) => {
      props = { ...props, ...update };
      view.rerender(element());
    },
    complete: () => {
      props = { ...props, part: { ...props.part, state: 'output-available' } };
      view.rerender(element());
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

describe('automatic application-owned draft filling', () => {
  it('does not steal keyboard focus when completed output fills the draft', async () => {
    const test = await setup({ incomplete: true });
    const input = document.createElement('input');
    document.body.append(input);
    try {
      input.focus();
      test.complete();
      await screen.findByText(enUS.aiFormFill.applied);
      expect(input).toHaveFocus();
    } finally {
      input.remove();
    }
  });
  it('applies completed output without confirmation, including while the assistant is still streaming', async () => {
    const test = await setup({ streaming: true });
    await screen.findByText(enUS.aiFormFill.applied);
    expect(test.draft()).toEqual({ name: 'Suggested', budget: 125 });
    expect(test.setter).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('apply-form-proposal')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('dismiss-form-proposal'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('proposal-name')).toBeDisabled();
    expect(test.respond).not.toHaveBeenCalled();
    test.rerender();
    await act(async () => undefined);
    expect(test.setter).toHaveBeenCalledTimes(1);
  });

  it('waits for complete tool output and never writes partial input', async () => {
    const test = await setup({ incomplete: true });
    expect(test.setter).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.aiFormFill.proposalPending,
    );
    test.complete();
    await screen.findByText(enUS.aiFormFill.applied);
    expect(test.setter).toHaveBeenCalledTimes(1);
  });

  it('applies only once under StrictMode setup/cleanup replay', async () => {
    const test = await setup({ strict: true });
    await screen.findByText(enUS.aiFormFill.applied);
    expect(test.setter).toHaveBeenCalledTimes(1);
    expect(test.draft().name).toBe('Suggested');
  });

  it('does not allow a registered form to replace missing originating message context', async () => {
    const test = await setup({ missingSource: true });
    expect(screen.getByText(enUS.aiFormFill.missingSource)).toBeInTheDocument();
    expect(test.setter).not.toHaveBeenCalled();
  });

  it('does not apply read-only history', async () => {
    const test = await setup({ readOnly: true });
    expect(screen.getByTestId('form-proposal-card')).toBeInTheDocument();
    expect(screen.getByTestId('form-proposal-card')).toHaveAttribute(
      'data-chat-width',
      'full',
    );
    expect(screen.getByTestId('form-proposal-card')).toHaveClass('w-full');
    expect(test.setter).not.toHaveBeenCalled();
    expect(test.draft().name).toBe('Original');
  });

  it('rejects invalid completed output before calling a form adapter', async () => {
    const test = await setup({ invalid: true });
    expect(screen.getByRole('alert')).toHaveTextContent(
      enUS.aiFormFill.invalidProposal,
    );
    expect(test.setter).not.toHaveBeenCalled();
  });

  it('preserves edits made since the originating send snapshot', async () => {
    const test = await setup({ incomplete: true });
    test.modify();
    test.complete();
    await screen.findByText(enUS.aiFormFill.stale);
    expect(test.setter).not.toHaveBeenCalled();
    expect(test.draft().name).toBe('Manual edit');
  });

  it('rejects an A to B to A remounted form even if the logical identity matches', async () => {
    const test = await setup({ incomplete: true });
    test.replaceTarget();
    test.complete();
    await screen.findByText(enUS.aiFormFill.stale);
    expect(test.setter).not.toHaveBeenCalled();
  });

  it('awaits asynchronous failure and never reports success prematurely', async () => {
    let fail!: (error: Error) => void;
    const test = await setup({
      write: () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        }),
    });
    await waitFor(() => expect(test.setter).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(enUS.aiFormFill.applied)).not.toBeInTheDocument();
    expect(screen.getByText(enUS.aiFormFill.applying)).toBeInTheDocument();
    await act(async () => fail(new Error('Private adapter detail')));
    await screen.findByText(enUS.aiFormFill.failed);
    expect(
      screen.queryByText('Private adapter detail'),
    ).not.toBeInTheDocument();
    expect(test.draft().name).toBe('Original');
  });

  it('reports a partial adapter update without claiming full success', async () => {
    await setup({ write: async () => ({ status: 'partial' }) });
    await screen.findByText(enUS.aiFormFill.partial);
    expect(screen.queryByText(enUS.aiFormFill.applied)).not.toBeInTheDocument();
  });

  it('cancels a pending adapter operation on unmount', async () => {
    let finish!: () => void;
    let signal: AbortSignal | undefined;
    const test = await setup({
      write: (context) => {
        signal = context.signal;
        return new Promise<void>((resolve) => {
          finish = resolve;
        });
      },
    });
    await waitFor(() => expect(test.setter).toHaveBeenCalledTimes(1));
    test.view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => finish());
    expect(test.draft().name).toBe('Original');
  });

  it('does not reapply a completed operation when its card is remounted', async () => {
    const test = await setup();
    await screen.findByText(enUS.aiFormFill.applied);
    test.modify();
    test.view.rerender(<div />);
    test.rerender();
    await screen.findByText(enUS.aiFormFill.applied);
    expect(test.setter).toHaveBeenCalledTimes(1);
    expect(test.draft().name).toBe('Manual edit');
  });
});
