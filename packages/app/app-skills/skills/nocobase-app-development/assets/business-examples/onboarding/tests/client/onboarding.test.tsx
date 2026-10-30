import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Route, Routes, Navigate } from 'react-router';
import { randomUUID } from 'node:crypto';
import OnboardingPage from '../../client/pages/onboarding/index.js';
import OnboardingWizard from '../../client/pages/onboarding/wizard.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';
import {
  emptyOnboarding,
  onboardingResumeStep,
  OnboardingSubmit,
  type OnboardingInput,
  type OnboardingDetail,
} from '../../shared/onboarding.js';
const write = (input: unknown, method = 'POST') => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    'Idempotency-Key': `${Date.now()}.${randomUUID()}`,
  },
  body: JSON.stringify(input),
});
const departmentId = randomUUID();
const complete: OnboardingInput = {
  ...emptyOnboarding,
  fullName: 'Example employee',
  workEmail: 'employee@example.test',
  nationality: 'CN',
  departmentId,
  jobTitle: 'Engineer',
  employmentType: 'fullTime',
  startDate: '2026-12-01',
  probationMonths: 3,
  documents: [
    { kind: 'identity', title: 'Identity', referenceNo: 'SYNTHETIC-ID' },
  ],
};
const choose = async (label: string, name: string) => {
  const control = await screen.findByRole('combobox', {
    name: label,
    exact: true,
  });
  await waitFor(() => expect(control).toBeEnabled());
  await userEvent.click(control);
  await userEvent.click(
    await screen.findByRole('option', { name, exact: true }),
  );
};
it('derives the first incomplete step with shared conditional and cross-step validation', () => {
  expect(onboardingResumeStep(emptyOnboarding)).toBe(0);
  expect(
    onboardingResumeStep({
      ...emptyOnboarding,
      fullName: 'Example',
      workEmail: 'e@example.test',
      nationality: 'CN',
    }),
  ).toBe(1);
  expect(onboardingResumeStep({ ...complete, documents: [] })).toBe(2);
  expect(onboardingResumeStep(complete)).toBe(3);
  expect(
    OnboardingSubmit.safeParse({ ...complete, nationality: 'US' }).success,
  ).toBe(false);
  expect(
    OnboardingSubmit.safeParse({
      ...complete,
      employmentType: 'contractor',
      contractEndDate: '2026-11-30',
    }).success,
  ).toBe(false);
});
it('retains input while changing steps, validates conditions and recovers a private draft from the real API', async () => {
  const writes: string[] = [];
  await renderAuthenticatedClient(
    <Routes>
      <Route path='/onboarding' element={<OnboardingPage />}>
        <Route path='new' element={<OnboardingWizard />} />
        <Route path=':id' element={<OnboardingWizard />} />
      </Route>
    </Routes>,
    {
      route: '/onboarding/new',
      async prepare(app) {
        await app.connection.repository('onboardingDepartments').createOne({
          values: {
            id: departmentId,
            name: 'Engineering',
            active: true,
            allowedUserId: null,
          },
        });
      },
      beforeRequest(request) {
        if (request.method !== 'GET') writes.push(request.method);
      },
    },
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Next', exact: true }),
  );
  expect(
    await screen.findByText(
      'Check the highlighted fields and required documents before continuing.',
    ),
  ).toBeVisible();
  await userEvent.type(screen.getByLabelText('Full name'), 'Example employee');
  fireEvent.change(screen.getByLabelText('Work email'), {
    target: { value: 'employee@example.test' },
  });
  fireEvent.change(screen.getByLabelText('Nationality (two-letter code)'), {
    target: { value: 'US' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Next', exact: true }),
  );
  await choose('Department', 'Engineering');
  await userEvent.type(screen.getByLabelText('Job title'), 'Engineer');
  await userEvent.click(
    screen.getByRole('button', { name: 'Full-time', exact: true }),
  );
  fireEvent.change(screen.getByLabelText('Start date'), {
    target: { value: '2026-12-01' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Next', exact: true }),
  );
  expect(
    await screen.findByText(
      'Check the highlighted fields and required documents before continuing.',
    ),
  ).toBeVisible();
  await userEvent.type(screen.getByLabelText('Probation months'), '3');
  await userEvent.click(
    screen.getByRole('button', { name: 'Previous', exact: true }),
  );
  expect(screen.getByLabelText('Full name')).toHaveValue('Example employee');
  await userEvent.click(
    screen.getByRole('button', { name: 'Next', exact: true }),
  );
  expect(screen.getByLabelText('Job title')).toHaveValue('Engineer');
  expect(writes).toEqual([]);
  await userEvent.click(
    screen.getByRole('link', { name: 'Back to onboarding', exact: true }),
  );
  expect(await screen.findByRole('alertdialog')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Job title')).toHaveValue('Engineer');
  await userEvent.click(
    screen.getByRole('button', { name: 'Save draft', exact: true }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Documents', exact: true }),
  ).toBeVisible();
  expect(await screen.findByText('Draft saved')).toBeVisible();
  expect(screen.queryByText('Draft restored')).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('link', { name: 'Back to onboarding', exact: true }),
  );
  await userEvent.click(
    await screen.findByRole('link', { name: 'Example employee', exact: true }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Documents', exact: true }),
  ).toBeVisible();
  expect(screen.getByText('Draft restored')).toBeVisible();
  // A completed step can be reopened from the step list; moving forward still goes through Next.
  await userEvent.click(
    screen.getByRole('button', { name: /^Employment information/ }),
  );
  expect(screen.getByLabelText('Job title')).toHaveValue('Engineer');
  expect(
    screen.queryByRole('button', { name: /^Confirm submission/ }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Next', exact: true }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Next', exact: true }),
  );
  expect(
    await screen.findByText(
      'Check the highlighted fields and required documents before continuing.',
    ),
  ).toBeVisible();
  // Nationality US requires a work permit as well as the identity document.
  expect(
    screen.getByRole('button', { name: 'Add a complete Work permit.' }),
  ).toBeVisible();
  expect(screen.getByText(/Work permit · nationality US/)).toBeVisible();
  for (const [kind, title, reference] of [
    ['Identity document', 'Synthetic identity', 'ID-001'],
    ['Work permit', 'Synthetic permit', 'WP-001'],
  ]) {
    await userEvent.click(
      screen.getByRole('button', { name: 'Add document', exact: true }),
    );
    const index = screen.getAllByLabelText(/Document title/).length;
    await choose(`Document type ${index}`, kind);
    fireEvent.change(screen.getByLabelText(`Document title ${index}`), {
      target: { value: title },
    });
    fireEvent.change(screen.getByLabelText(`Reference number ${index}`), {
      target: { value: reference },
    });
  }
  await userEvent.click(
    screen.getByRole('button', { name: 'Next', exact: true }),
  );
  expect(
    await screen.findByRole('heading', {
      name: 'Confirm submission',
      exact: true,
    }),
  ).toBeVisible();
  expect(
    screen.getByText('employee@example.test', { selector: 'dd' }),
  ).toBeVisible();
  expect(screen.getByText('All required documents are present.')).toBeVisible();
  expect(screen.getByText('Unsaved changes')).toBeVisible();
  await userEvent.click(
    screen.getByRole('button', { name: 'Edit Basic information' }),
  );
  expect(screen.getByLabelText('Full name')).toHaveValue('Example employee');
  for (let step = 0; step < 3; step++)
    await userEvent.click(
      screen.getByRole('button', { name: 'Next', exact: true }),
    );
  expect(
    screen.getByRole('button', { name: 'Submit onboarding' }),
  ).toBeDisabled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Save draft', exact: true }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Submit onboarding' }),
    ).toBeEnabled(),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Submit onboarding' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Employee created' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Save draft' }),
  ).not.toBeInTheDocument();
});
it('keeps unsaved child-page input until leaving is confirmed', async () => {
  await renderAuthenticatedClient(
    <Routes>
      <Route path='/onboarding' element={<OnboardingPage />}>
        <Route path='new' element={<OnboardingWizard />} />
      </Route>
    </Routes>,
    { route: '/onboarding/new' },
  );
  await userEvent.type(
    await screen.findByLabelText('Full name'),
    'Unsaved example',
  );
  await userEvent.click(
    screen.getByRole('link', { name: 'Back to onboarding', exact: true }),
  );
  expect(await screen.findByRole('alertdialog')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Full name')).toHaveValue('Unsaved example');
  await userEvent.click(
    screen.getByRole('link', { name: 'Back to onboarding', exact: true }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );
  await waitFor(() =>
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('button', { name: 'New onboarding' })).toBeVisible();
});
it('locks save and submit through refresh and replays an uncertain submission without another employee', async () => {
  let id: string;
  let drop = true;
  const keys: string[] = [];
  const refreshStarted = Promise.withResolvers<void>(),
    refreshGate = Promise.withResolvers<void>();
  let hold = false;
  function RequestRoutes() {
    return (
      <Routes>
        <Route
          path='/start'
          element={<Navigate to={`/onboarding/${id}`} replace />}
        />
        <Route path='/onboarding' element={<OnboardingPage />}>
          <Route path=':id' element={<OnboardingWizard />} />
        </Route>
      </Routes>
    );
  }
  try {
    const view = await renderAuthenticatedClient(<RequestRoutes />, {
      route: '/start',
      async prepare(app, session) {
        await app.connection.repository('onboardingDepartments').createOne({
          values: {
            id: departmentId,
            name: 'Engineering',
            active: true,
            allowedUserId: null,
          },
        });
        const response = await session.fetch('/onboarding', write(complete));
        expect(response.status).toBe(200);
        id = (await response.json()).data.id;
      },
      beforeRequest(request) {
        if (request.url.endsWith('/fire'))
          keys.push(request.headers.get('Idempotency-Key')!);
      },
      async afterResponse(request, response) {
        if (
          request.url.endsWith(`/onboarding/${id}`) &&
          request.method === 'PATCH' &&
          response.ok
        )
          hold = true;
        else if (
          request.url.endsWith(`/onboarding/${id}`) &&
          request.method === 'GET' &&
          hold
        ) {
          hold = false;
          refreshStarted.resolve();
          await refreshGate.promise;
        } else if (request.url.endsWith('/fire') && response.ok && drop) {
          drop = false;
          throw new TypeError('Synthetic response loss after commit');
        }
      },
    });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Save draft' }),
    );
    await refreshStarted.promise;
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Submit onboarding' }),
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole('link', { name: 'Back to onboarding', exact: true }),
    );
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
    await act(async () => refreshGate.resolve());
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Submit onboarding' }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit onboarding' }),
    );
    expect(
      await screen.findByText(
        'The previous result is uncertain. Retry the same action with the original data before editing.',
      ),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('link', { name: 'Back to onboarding', exact: true }),
    );
    expect(
      screen.getByRole('button', { name: 'Submit onboarding' }),
    ).toBeEnabled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit onboarding' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Employee created' }),
    ).toBeVisible();
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
    expect(
      await view.server.connection.repository('onboardingEmployees').count(),
    ).toBe(1);
    const detail = (
      await (await view.session.fetch(`/onboarding/${id!}`)).json()
    ).data as OnboardingDetail;
    expect(detail.history).toHaveLength(2);
  } finally {
    refreshGate.resolve();
  }
});
