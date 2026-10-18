import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { useAgentSessionAvailability } from '../../client/panel.js';

function Entry() {
  const check = useAgentSessionAvailability();
  const [result, setResult] = useState('unchecked');
  return (
    <button
      onClick={() => {
        void check().then((ready) => setResult(String(ready)));
      }}
    >
      {result}
    </button>
  );
}

it('checks fresh owner availability only when asked, including agents on a second computer', async () => {
  let computers: object[] = [];
  const calls = vi.fn(() => ({ data: computers }));
  await renderWithApp(<Entry />, { fetch: answerApi(calls) });
  expect(calls).not.toHaveBeenCalled();
  const button = screen.getByRole('button');
  for (const [data, expected] of [
    [[], false],
    [[{ online: false, agents: [{ id: 'codex' }] }], false],
    [[{ online: true, agents: [] }], false],
    [
      [
        {
          online: true,
          agents: [{ problem: 'notInstalled' }, { problem: 'notSignedIn' }],
        },
      ],
      false,
    ],
    [
      [
        { online: true, agents: [] },
        { online: true, agents: [{ id: 'codex' }] },
      ],
      true,
    ],
    [[], false],
  ] as const) {
    computers = [...data];
    const before = calls.mock.calls.length;
    fireEvent.click(button);
    await waitFor(() => expect(calls).toHaveBeenCalledTimes(before + 1));
    await waitFor(() => expect(button).toHaveTextContent(String(expected)));
  }
});
