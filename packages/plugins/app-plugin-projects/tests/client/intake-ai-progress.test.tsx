import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { IntakeAiJob } from '../../shared/intake-ai.js';
import { clientMocks } from './fake-client.js';

vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());

const { IntakeAiProgress } =
  await import('../../client/pages/intake/intake-ai-progress.js');
const { IntakeWaitFormatContext } =
  await import('../../client/lib/intake-wait.js');

const queued = (
  waitReason: string | null,
  waitParams?: Readonly<Record<string, string | number | readonly string[]>>,
): IntakeAiJob => ({
  id: 'j1',
  mode: 'split',
  status: 'running',
  instruction: null,
  basePlanId: null,
  issue: null,
  planId: null,
  changes: null,
  unknownLabels: [],
  dropped: 0,
  error: null,
  progress: {
    phase: 'queued',
    by: null,
    waitReason,
    ...(waitParams ? { waitParams } : {}),
    activity: null,
    since: null,
  },
  createdAt: new Date().toISOString(),
  finishedAt: null,
});

describe('a queued request to AI', () => {
  it('names a reason nobody words, without knowing any', () => {
    render(
      <IntakeAiProgress
        job={queued('secretsNotAllowed')}
        cancelling={false}
        onCancel={() => undefined}
      />,
    );
    expect(
      screen.getByText('intakeAi.wait.reason(reason=secretsNotAllowed)'),
    ).toBeInTheDocument();
  });

  it('words the reason and its values as the application says', () => {
    render(
      <IntakeWaitFormatContext.Provider
        value={(wait) =>
          `${wait.reason}: ${String(wait.params?.variables ?? '')}`
        }
      >
        <IntakeAiProgress
          job={queued('secretsNotAllowed', { variables: ['NPM_TOKEN'] })}
          cancelling={false}
          onCancel={() => undefined}
        />
      </IntakeWaitFormatContext.Provider>,
    );
    expect(
      screen.getByText('secretsNotAllowed: NPM_TOKEN'),
    ).toBeInTheDocument();
  });

  it('just waits when no reason is given', () => {
    render(
      <IntakeAiProgress
        job={queued(null)}
        cancelling={false}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByText('intakeAi.wait.queued')).toBeInTheDocument();
  });
});
