import { renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';

import plugin from '../../client/plugin.js';
import { useSubmission } from '../../client/use-submission.js';
import { SubmissionNotice } from '../../client/components/submission-notice.js';
import { sessionMemoryKey } from '../../client/use-session-memory.js';

it('retains immutable input and ID across a lost confirmation and route remount, and clears the draft only after confirmation', async () => {
  const inputs: {
    content: string;
    settings: { model: string };
    submissionId: string;
  }[] = [];
  const input = {
    content: 'Draft with image and mentions',
    settings: { model: 'first' },
  };
  const write = vi.fn(
    async (value: typeof input & { submissionId: string }) => {
      inputs.push(value);
      if (inputs.length === 1) throw new Error('Lost confirmation');
    },
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(sessionMemoryKey('text:draft'), input.content);
  function Entry() {
    const submission = useSubmission('test', 'draft', write);
    return (
      <>
        <button
          disabled={submission.pending}
          onClick={() => {
            void submission.send(input).catch(() => undefined);
          }}
        >
          Send
        </button>
        <SubmissionNotice
          pending={submission.pending}
          sending={false}
          retry={submission.retry}
          edit={submission.edit}
        />
      </>
    );
  }
  function Harness() {
    const [shown, setShown] = useState(true);
    return (
      <QueryClientProvider client={client}>
        <button onClick={() => setShown(!shown)}>Navigate</button>
        {shown && <Entry />}
      </QueryClientProvider>
    );
  }
  await renderWithApp(<Harness />, {
    plugins: [plugin({ routes: false })],
    namespace: '@nocobase/app-plugin-agent-sessions',
  });
  fireEvent.click(screen.getByText('Send'));
  await screen.findByText('Retry original submission');
  expect(screen.getByText('Send')).toBeDisabled();
  expect(client.getQueryData(sessionMemoryKey('text:draft'))).toBe(
    input.content,
  );
  input.settings.model = 'second';
  fireEvent.click(screen.getByText('Navigate'));
  fireEvent.click(screen.getByText('Navigate'));
  fireEvent.click(await screen.findByText('Retry original submission'));
  await waitFor(() => expect(inputs).toHaveLength(2));
  expect(inputs[1]).toEqual(inputs[0]);
  expect(inputs[1]!.settings.model).toBe('first');
  await waitFor(() =>
    expect(client.getQueryData(sessionMemoryKey('text:draft'))).toBe(''),
  );
  expect(
    screen.queryByText('Retry original submission'),
  ).not.toBeInTheDocument();
});

it('requires an explicit edit-as-new decision to allocate a different submission ID', async () => {
  const inputs: { content: string; submissionId: string }[] = [];
  const write = vi.fn(
    async (input: { content: string; submissionId: string }) => {
      inputs.push(input);
      throw new Error('Unconfirmed');
    },
  );
  function Entry() {
    const submission = useSubmission('new', 'new', write);
    return (
      <>
        <button
          disabled={submission.pending}
          onClick={() => {
            void submission
              .send({ content: 'same text' })
              .catch(() => undefined);
          }}
        >
          Send
        </button>
        <SubmissionNotice
          pending={submission.pending}
          sending={false}
          retry={submission.retry}
          edit={submission.edit}
        />
      </>
    );
  }
  await renderWithApp(
    <QueryClientProvider client={new QueryClient()}>
      <Entry />
    </QueryClientProvider>,
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
    },
  );
  fireEvent.click(screen.getByText('Send'));
  fireEvent.click(await screen.findByText('Edit as new message'));
  await waitFor(() => expect(screen.getByText('Send')).not.toBeDisabled());
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() => expect(inputs).toHaveLength(2));
  expect(inputs[0]!.submissionId).not.toBe(inputs[1]!.submissionId);
});
