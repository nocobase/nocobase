import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';

import demoMode, { useDemoMode } from '../../client/index.js';
import { renderDemo } from '../helpers/render-demo.js';

function Mode({ label = 'mode' }: { label?: string }) {
  return <output aria-label={label}>{String(useDemoMode())}</output>;
}

it('returns false outside an application and without a plugin provider', async () => {
  const standalone = render(<Mode />);
  expect(screen.getByLabelText('mode')).toHaveTextContent('false');
  standalone.unmount();
  const fetch = vi.fn();
  await renderDemo(<Mode />, { fetch });
  expect(screen.getByLabelText('mode')).toHaveTextContent('false');
  expect(fetch).not.toHaveBeenCalled();
});

it('returns false without published mode config and makes no requests', async () => {
  const fetch = vi.fn();
  await renderWithApp(<Mode />, { plugins: [demoMode()], fetch });
  expect(screen.getByLabelText('mode')).toHaveTextContent('false');
  expect(fetch).not.toHaveBeenCalled();
});

it('shares startup mode across consumers and remounts without status requests or leaking across apps', async () => {
  function Page() {
    const [revision, setRevision] = useState(0);
    return (
      <>
        <Mode label='first' key={revision} />
        <Mode label='second' />
        <button onClick={() => setRevision(revision + 1)}>Remount</button>
      </>
    );
  }
  const paths: string[] = [];
  const fetch = answerApi((call) => {
    paths.push(call.path);
    return { data: [] };
  });
  await renderDemo(<Page />, {
    plugins: [demoMode()],
    route: '/projects',
    fetch,
  });
  expect(screen.getByLabelText('first')).toHaveTextContent('true');
  expect(screen.getByLabelText('second')).toHaveTextContent('true');
  fireEvent.click(screen.getByText('Remount'));
  expect(screen.getByLabelText('first')).toHaveTextContent('true');
  await renderDemo(<Mode label='other-app' />, {
    plugins: [demoMode()],
    demoModeEnabled: false,
    fetch,
  });
  expect(screen.getByLabelText('other-app')).toHaveTextContent('false');
  expect(screen.getByLabelText('first')).toHaveTextContent('true');
  expect(paths).not.toContain('demoMode/status');
});
