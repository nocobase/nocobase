import { ApiClientError } from '@nocobase/app-client';
import { useForm } from 'react-hook-form';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackForm } from '../../client/components/feedback-form.js';
import { PasswordRegistrationForm } from '../../client/extensions/nocobase-auth-forms/password-registration-form.js';
import locales from '../../client/locales/index.js';

async function mount(children: React.ReactNode) {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', locales);
  await runtime.init('en-US');
  const view = render(
    <I18nProvider runtime={runtime}>{children}</I18nProvider>,
  );
  return { ...view, runtime };
}
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    {},
  ] as unknown as DOMRectList);
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('feedback forms', () => {
  it('ignores a superseded rejection without moving focus on the next edit', async () => {
    let rejectFirst!: (error: unknown) => void;
    let attempts = 0;
    await mount(
      <FeedbackForm
        onSubmit={async (event) => {
          event.preventDefault();
          if (++attempts === 1)
            return new Promise<void>((_resolve, reject) => {
              rejectFirst = reject;
            });
          throw new ApiClientError('private', {
            status: 400,
            method: 'POST',
            url: '/api/items',
            payload: {
              error: {
                fieldViolations: [{ field: 'first' }, { field: 'second' }],
              },
            },
          });
        }}
      >
        <div>
          <label htmlFor='overlap-first'>First</label>
          <input id='overlap-first' name='first' defaultValue='draft' />
        </div>
        <div>
          <label htmlFor='overlap-second'>Second</label>
          <input id='overlap-second' name='second' defaultValue='draft' />
        </div>
        <button>Save</button>
      </FeedbackForm>,
    );
    fireEvent.click(screen.getByText('Save'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByLabelText('First')).toHaveFocus());
    await act(() => {
      rejectFirst(new TypeError('obsolete request'));
    });
    fireEvent.change(screen.getByLabelText('First'), {
      target: { value: 'corrected' },
    });
    expect(screen.getByLabelText('First')).toHaveFocus();
  });

  it('adapts RHF validation, preserves business copy and keeps focus while a field is being corrected', async () => {
    function RhfForm() {
      const form = useForm({
        defaultValues: { first: '', second: '' },
        shouldFocusError: false,
      });
      return (
        <FeedbackForm
          noValidate
          submitting={form.formState.isSubmitting}
          validationErrors={form.formState.errors}
          onSubmit={form.handleSubmit(() => {})}
        >
          <div>
            <label htmlFor='rhf-first'>First field</label>
            <input
              id='rhf-first'
              {...form.register('first', {
                required: 'Business rule: enter a first value.',
              })}
            />
          </div>
          <div>
            <label htmlFor='rhf-second'>Second field</label>
            <input
              id='rhf-second'
              {...form.register('second', {
                required: 'Business rule: enter a second value.',
              })}
            />
          </div>
          <button>Save</button>
        </FeedbackForm>
      );
    }
    await mount(<RhfForm />);
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(screen.getByLabelText('First field')).toHaveFocus(),
    );
    const first = screen.getByLabelText('First field');
    const id = first.getAttribute('aria-describedby')!;
    expect(document.getElementById(id)).toHaveTextContent(
      'Business rule: enter a first value.',
    );
    fireEvent.change(first, { target: { value: 'corrected' } });
    await waitFor(() => expect(first).not.toHaveAttribute('aria-invalid'));
    expect(first).toHaveFocus();
  });

  it('shows inline native errors, preserves help associations and focuses by layout order', async () => {
    const save = vi.fn();
    await mount(
      <FeedbackForm
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div>
          <label htmlFor='first'>First</label>
          <input name='first' id='first' required aria-describedby='help' />
          <p id='help'>Help</p>
        </div>
        <div>
          <label htmlFor='last'>Last</label>
          <input name='last' id='last' required />
        </div>
        <button>Save</button>
      </FeedbackForm>,
    );
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByLabelText('First')).toHaveFocus());
    const first = screen.getByLabelText('First');
    expect(first.getAttribute('aria-describedby')).toContain('help');
    const ids = first.getAttribute('aria-describedby')!.split(' ');
    expect(
      ids.some(
        (id) =>
          document.getElementById(id)?.textContent ===
          'Constraints not satisfied',
      ),
    ).toBe(true);
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(first, { target: { value: 'retained' } });
    expect(first).not.toHaveAttribute('aria-invalid');
    expect(first).toHaveAttribute('aria-describedby', 'help');
  });

  it('retains input and selected files through request failure, then retries successfully', async () => {
    let fail = true;
    const saved = vi.fn();
    await mount(
      <FeedbackForm
        onSubmit={async (event) => {
          event.preventDefault();
          if (fail) throw new TypeError('network internals');
          saved();
        }}
      >
        <div>
          <label htmlFor='name'>Name</label>
          <input
            id='name'
            name='name'
            required
            defaultValue='Custom equipment'
          />
        </div>
        <label htmlFor='file'>Attachment</label>
        <input id='file' name='attachment' type='file' />
        <button>Save</button>
      </FeedbackForm>,
    );
    const upload = new File(['equipment'], 'equipment.txt', {
      type: 'text/plain',
    });
    fireEvent.change(screen.getByLabelText('Attachment'), {
      target: { files: [upload] },
    });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to connect');
    expect(screen.getByLabelText('Name')).toHaveValue('Custom equipment');
    expect(
      (screen.getByLabelText('Attachment') as HTMLInputElement).files?.[0],
    ).toBe(upload);
    fail = false;
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('maps structured errors without displaying server details and associates inline text', async () => {
    await mount(
      <FeedbackForm
        onSubmit={async (event) => {
          event.preventDefault();
          throw new ApiClientError('private stack', {
            status: 400,
            method: 'POST',
            url: '/api/equipment',
            payload: {
              error: {
                fieldViolations: [
                  { field: 'name', description: 'private payload' },
                ],
              },
            },
          });
        }}
      >
        <div>
          <label htmlFor='name'>Name</label>
          <input name='name' id='name' defaultValue='Equipment' />
        </div>
        <button>Save</button>
      </FeedbackForm>,
    );
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    const errorId = screen
      .getByLabelText('Name')
      .getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent(
      'This value was rejected',
    );
    expect(document.body.textContent).not.toContain('private');
  });

  it('keeps password mismatch copy and focuses confirmation without resetting other values', async () => {
    const submit = vi.fn();
    await mount(<PasswordRegistrationForm onSubmit={submit} />);
    for (const [label, value] of [
      ['Name', 'Test'],
      ['Username', 'tester'],
      ['Email', 'test@example.test'],
      ['Password', 'password123'],
      ['Confirm password', 'different'],
    ])
      fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    fireEvent.click(screen.getByText('Create account'));
    await waitFor(() =>
      expect(screen.getByLabelText('Confirm password')).toHaveFocus(),
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Test');
    expect(submit).not.toHaveBeenCalled();
    expect(
      screen.getAllByText("Passwords don't match.").length,
    ).toBeGreaterThan(0);
  });

  it('localizes form errors without replacing business translations', async () => {
    const { runtime } = await mount(
      <FeedbackForm
        onSubmit={async (event) => {
          event.preventDefault();
          throw new Error('private');
        }}
      >
        <button>Save</button>
      </FeedbackForm>,
    );
    await act(() => runtime.changeLanguage('zh-CN'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('保存失败'),
    );
  });
});
