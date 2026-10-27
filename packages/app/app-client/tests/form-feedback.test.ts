import { ApiClientError } from '@nocobase/api-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FormFeedback,
  formFeedbackErrors,
  type FormFeedbackField,
} from '../src/form-feedback.js';

const messages = {
  invalid: 'Correct the field.',
  failed: 'Unable to save.',
  denied: 'Access denied.',
  network: 'Connection failed.',
};
const apiError = (violations: unknown, status = 400) =>
  new ApiClientError('secret stack', {
    status,
    method: 'POST',
    url: '/api/items',
    payload: {
      error: {
        fieldViolations: violations,
        message: 'private developer detail',
      },
    },
  });

function field(id: string, path = id) {
  const input = document.createElement('input');
  document.body.append(input);
  const mutable = { path, value: 'draft', accessible: true, editable: true };
  const descriptor: FormFeedbackField = {
    id,
    path: () => mutable.path,
    value: () => mutable.value,
    anchor: () => input,
    control: () => input,
    accessible: () => mutable.accessible,
    editable: () => mutable.editable,
  };
  return { input, mutable, descriptor };
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    {},
  ] as unknown as DOMRectList);
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('form feedback', () => {
  it('rejects stale errors when another selected file has identical file metadata', () => {
    const input = field('attachments');
    const first = new File(['first'], 'file.txt');
    let files = [first, new File(['before'], 'same.txt', { lastModified: 1 })];
    const feedback = new FormFeedback({ messages });
    feedback.register({ ...input.descriptor, value: () => files });
    const attempt = feedback.begin();
    files = [first, new File(['after!'], 'same.txt', { lastModified: 1 })];
    feedback.failure(apiError([{ field: 'attachments' }]), attempt);
    expect(feedback.errors()).toEqual([]);
  });

  it('focuses in document order, independently of registration and violation order', async () => {
    const first = field('first');
    const last = field('last');
    const feedback = new FormFeedback({ messages });
    feedback.register(last.descriptor);
    feedback.register(first.descriptor);
    feedback.failure(
      apiError([{ field: 'last', description: 'secret' }, { field: 'first' }]),
      feedback.begin(),
    );
    await feedback.focus(null);
    expect(document.activeElement).toBe(first.input);
    expect(feedback.errors().map((error) => error.message)).toEqual([
      messages.invalid,
      messages.invalid,
    ]);
  });

  it('reveals an unmounted editor through its persistent layout anchor before focusing', async () => {
    const section = document.createElement('div');
    document.body.append(section);
    const editor = document.createElement('input');
    const order: string[] = [];
    const feedback = new FormFeedback({ messages });
    feedback.register({
      id: 'tab',
      path: () => 'tab.name',
      value: () => '',
      accessible: () => true,
      editable: () => true,
      anchor: () => section,
      control: () => editor,
      reveal: async () => {
        order.push('outer tab');
        await Promise.resolve();
        order.push('inner collapse');
        section.append(editor);
      },
    });
    feedback.invalid(
      [{ field: 'tab.name', message: 'Required' }],
      feedback.begin(),
    );
    await feedback.focus(null);
    expect(order).toEqual(['outer tab', 'inner collapse']);
    expect(document.activeElement).toBe(editor);
  });

  it('keeps row identity across reorder and bracket/dot paths', () => {
    const row = field('row-key', 'items.2.name');
    const feedback = new FormFeedback({ messages });
    feedback.register(row.descriptor);
    const attempt = feedback.begin();
    row.mutable.path = 'items.0.name';
    feedback.failure(
      apiError([{ field: 'items[2].name', description: 'wrong row' }]),
      attempt,
    );
    expect(feedback.errors()).toEqual([
      { id: 'row-key', message: messages.invalid },
    ]);
  });

  it('discards errors for edited, deleted and replaced rows and superseded requests', () => {
    const row = field('row', 'items.0.name');
    const feedback = new FormFeedback({ messages });
    const remove = feedback.register(row.descriptor);
    const first = feedback.begin();
    row.mutable.value = 'new input';
    feedback.failure(apiError([{ field: 'items.0.name' }]), first);
    expect(feedback.errors()).toEqual([]);
    const second = feedback.begin();
    remove();
    feedback.register(field('row', 'items.0.name').descriptor);
    feedback.failure(apiError([{ field: 'items.0.name' }]), second);
    expect(feedback.errors()).toEqual([]);
    feedback.begin();
    feedback.failure(apiError([{ field: 'items.0.name' }]), first);
    expect(feedback.getSnapshot().message).toBeUndefined();
  });

  it('does not reveal or name inaccessible fields, including permission changes during a request', async () => {
    const hidden = field('private');
    const reveal = vi.fn();
    const feedback = new FormFeedback({ messages });
    feedback.register({ ...hidden.descriptor, reveal });
    const attempt = feedback.begin();
    hidden.mutable.accessible = false;
    feedback.failure(
      apiError([
        { field: 'private', description: 'private salary 123' },
        { field: 'unknown', description: 'secret' },
      ]),
      attempt,
    );
    await feedback.focus(null);
    expect(reveal).not.toHaveBeenCalled();
    expect(feedback.errors()).toEqual([]);
    expect(JSON.stringify(feedback.getSnapshot())).not.toContain('private');
    expect(feedback.getSnapshot().message).toBe(messages.failed);
  });

  it('uses a focusable summary when fields are disabled, hidden or cannot accept focus', async () => {
    const disabled = field('disabled');
    disabled.input.disabled = true;
    const hidden = field('hidden');
    hidden.input.hidden = true;
    const feedback = new FormFeedback({ messages });
    feedback.register(disabled.descriptor);
    feedback.register(hidden.descriptor);
    const summary = document.createElement('div');
    summary.tabIndex = -1;
    document.body.append(summary);
    feedback.invalid(
      [
        { field: 'hidden', message: 'Required' },
        { field: 'disabled', message: 'Required' },
      ],
      feedback.begin(),
    );
    await feedback.focus(summary);
    expect(document.activeElement).toBe(summary);
  });

  it('cancels an asynchronous reveal when the user changes a field or starts a new attempt', async () => {
    const row = field('name');
    let release!: () => void;
    const feedback = new FormFeedback({ messages });
    feedback.register({
      ...row.descriptor,
      reveal: () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    });
    feedback.invalid(
      [{ field: 'name', message: 'Required' }],
      feedback.begin(),
    );
    const focusing = feedback.focus(null);
    feedback.clear('name');
    release();
    await focusing;
    expect(document.activeElement).not.toBe(row.input);
  });

  it('clears changed field errors and obsolete errors on retry without changing values', () => {
    const row = field('name');
    const attachment = { id: 'uploaded-file' };
    const feedback = new FormFeedback({ messages });
    feedback.register(row.descriptor);
    feedback.invalid(
      [{ field: 'name', message: 'Required' }],
      feedback.begin(),
    );
    feedback.clear('name');
    expect(feedback.errors()).toEqual([]);
    feedback.failure(new TypeError('fetch failed'), feedback.begin());
    expect(feedback.getSnapshot().message).toBe(messages.network);
    feedback.begin();
    expect(feedback.getSnapshot().message).toBeUndefined();
    expect(row.mutable.value).toBe('draft');
    expect(attachment.id).toBe('uploaded-file');
  });

  it('maps only application-approved copy and treats access errors as form errors', () => {
    const row = field('name');
    const feedback = new FormFeedback({
      messages,
      fieldMessage: ({ reason }) =>
        reason === 'TAKEN' ? 'Choose another name.' : undefined,
    });
    feedback.register(row.descriptor);
    feedback.failure(
      apiError([{ field: 'name', reason: 'TAKEN', description: 'private' }]),
      feedback.begin(),
    );
    expect(feedback.errors()[0]?.message).toBe('Choose another name.');
    feedback.failure(apiError([{ field: 'name' }], 403), feedback.begin());
    expect(feedback.errors()).toEqual([]);
    expect(feedback.getSnapshot().message).toBe(messages.denied);
  });

  it('adapts nested RHF errors without traversing DOM refs or root errors', () => {
    expect(
      formFeedbackErrors({
        items: [{ name: { message: 'Required', ref: document.body } }],
        root: { message: 'Form error' },
      }),
    ).toEqual([{ field: 'items.0.name', message: 'Required' }]);
  });
});
