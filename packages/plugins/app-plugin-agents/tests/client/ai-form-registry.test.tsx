// @vitest-environment jsdom
import { cleanup, render, renderHook } from '@testing-library/react';
import { StrictMode, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AIFormRegistryProvider,
  useAIForm,
  useAIFormRegistry,
} from '../../client/chat/ai-form.js';
import {
  AIFormRegistry,
  type AIFormField,
  type AIFormOperationContext,
  type AIFormRegistration,
  type AIFormSetResult,
  type AIFormValues,
} from '../../client/chat/form-registry.js';

const fields: readonly AIFormField[] = [
  { name: 'name', type: 'string', editable: true },
  { name: 'count', type: 'number', editable: true },
  { name: 'enabled', type: 'boolean', editable: true },
  { name: 'category', type: 'string', editable: true, enum: ['a', 'b'] },
  { name: 'record', type: 'string', editable: false },
  { name: 'details', type: 'json', editable: true },
];

function fixture(id: string = 'profile', identity: string = 'user:record-A') {
  let revision = 0;
  let draft: AIFormValues = {
    name: 'initial',
    count: 0,
    enabled: false,
    category: 'a',
    record: 'A',
    details: { nested: [null, false, 0, ''] },
  };
  const getValues = vi.fn(
    (_context: AIFormOperationContext): AIFormValues | Promise<AIFormValues> =>
      draft,
  );
  const setValues = vi.fn(
    (
      patch: AIFormValues,
      context: AIFormOperationContext,
    ): void | AIFormSetResult | Promise<void | AIFormSetResult> => {
      if (!context.isCurrent()) throw new Error('Stale adapter commit blocked');
      draft = { ...draft, ...patch };
      revision += 1;
    },
  );
  const registration: AIFormRegistration = {
    id,
    identity,
    title: 'Profile',
    fields,
    getRevision: () => String(revision),
    getValues,
    setValues,
  };
  return {
    registration,
    getValues,
    setValues,
    values: () => draft,
    edit: (patch: AIFormValues): void => {
      draft = { ...draft, ...patch };
      revision += 1;
    },
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Deferred was not initialized');
  };
  let reject: (error: Error) => void = () => {
    throw new Error('Deferred was not initialized');
  };
  const promise = new Promise<T>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}

afterEach(cleanup);

describe('AIFormRegistry read and lifecycle capabilities', () => {
  it('registers fresh instance tokens without secure-context randomUUID on LAN HTTP', () => {
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('randomUUID is unavailable on LAN HTTP');
    });
    try {
      const registry = new AIFormRegistry();
      const first = registry.register(fixture().registration);
      const second = registry.register(fixture('other').registration);
      expect(first.instance).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
      );
      expect(second.instance).not.toBe(first.instance);
      expect(randomUUID).not.toHaveBeenCalled();
    } finally {
      randomUUID.mockRestore();
    }
  });
  it('locates multiple forms without reading or executing, and rejects duplicate ids', () => {
    const registry = new AIFormRegistry();
    const first = fixture();
    registry.register(first.registration);
    registry.register(fixture('other').registration);
    expect(registry.list().map((item) => item.id)).toEqual([
      'profile',
      'other',
    ]);
    expect(registry.locate('profile')?.fields).toEqual(fields);
    expect(registry.locate('missing')).toBeUndefined();
    expect(first.getValues).not.toHaveBeenCalled();
    expect(first.setValues).not.toHaveBeenCalled();
    expect(() => registry.register(first.registration)).toThrow(
      'already mounted',
    );
  });

  it('reads latest explicitly selected values and clones snapshot values and field metadata', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register(form.registration);
    form.edit({ name: 'latest' });
    const source = await registry.snapshot('profile');
    expect(source).toMatchObject({
      kind: 'form',
      id: 'profile',
      title: 'Profile',
      identity: 'user:record-A',
      values: { name: 'latest', count: 0, enabled: false },
    });
    form.values().name = 'external mutation';
    expect(source.values.name).toBe('latest');
    source.values.name = 'snapshot mutation';
    expect(form.values().name).toBe('external mutation');
    source.fields.splice(0);
    expect(registry.locate('profile')?.fields).toHaveLength(fields.length);
  });

  it('does not let stale cleanup remove a new instance with the same id', async () => {
    const registry = new AIFormRegistry();
    const old = registry.register(fixture().registration);
    old.unregister();
    const current = registry.register(fixture().registration);
    old.unregister();
    expect((await registry.snapshot('profile')).instance).toBe(
      current.instance,
    );
    expect(current.instance).not.toBe(old.instance);
  });

  it('changes the instance for A→B→A even with the same business id', async () => {
    const registry = new AIFormRegistry();
    const a = registry.register(fixture().registration);
    const source = await registry.snapshot('profile');
    a.unregister();
    const b = registry.register(
      fixture('profile', 'user:record-B').registration,
    );
    b.unregister();
    const again = fixture();
    registry.register(again.registration);
    expect(
      await registry.apply({
        source,
        operationId: 'old',
        values: { name: 'wrong' },
      }),
    ).toMatchObject({ status: 'rejected', code: 'stale-form' });
    expect(again.setValues).not.toHaveBeenCalled();
  });

  it('refreshes callbacks without changing the instance and rejects in-place identity changes', async () => {
    const registry = new AIFormRegistry();
    const first = fixture();
    const handle = registry.register(first.registration);
    const second = fixture();
    second.edit({ name: 'fresh callback' });
    handle.update(second.registration);
    expect((await registry.snapshot('profile')).values.name).toBe(
      'fresh callback',
    );
    expect(registry.locate('profile')?.instance).toBe(handle.instance);
    expect(() =>
      handle.update({ ...second.registration, identity: 'B' }),
    ).toThrow('new registration');
    expect(first.getValues).not.toHaveBeenCalled();
  });

  it('rejects an asynchronous read after record switch or manual draft change', async () => {
    for (const change of ['identity', 'revision']) {
      const registry = new AIFormRegistry();
      const form = fixture();
      const read = deferred<AIFormValues>();
      form.getValues.mockReturnValue(read.promise);
      const handle = registry.register(form.registration);
      const snapshot = registry.snapshot('profile');
      if (change === 'identity') {
        handle.unregister();
        registry.register(fixture('profile', 'B').registration);
      } else form.edit({ name: 'manual' });
      read.resolve({ name: 'old' });
      await expect(snapshot).rejects.toMatchObject({ code: 'stale-form' });
      expect(form.getValues.mock.calls[0]?.[0].isCurrent()).toBe(false);
    }
  });

  it('rejects async reads when field capabilities change and surfaces reader failures', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const read = deferred<AIFormValues>();
    form.getValues.mockReturnValue(read.promise);
    const handle = registry.register(form.registration);
    const snapshot = registry.snapshot('profile');
    handle.update({ ...form.registration, fields: fields.slice(1) });
    read.resolve({ count: 1 });
    await expect(snapshot).rejects.toMatchObject({ code: 'stale-form' });
    form.getValues.mockRejectedValue(new Error('reader unavailable'));
    await expect(registry.snapshot('profile')).rejects.toThrow(
      'reader unavailable',
    );
  });
});

describe('AIFormRegistry safe local execution', () => {
  it('applies the user-edited patch, never the original tool proposal or a save operation', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register(form.registration);
    const source = await registry.snapshot('profile');
    const edited = {
      name: 'user edited',
      count: 3,
      enabled: true,
      category: 'b',
    };
    const outcome = await registry.apply({
      source,
      operationId: 'edited',
      values: edited,
    });
    expect(outcome.status).toBe('applied');
    expect(form.values()).toMatchObject(edited);
    expect(form.setValues.mock.calls[0]?.[0]).toEqual(edited);
    expect(form.setValues.mock.calls[0]?.[0]).not.toBe(edited);
  });

  it('requires the exact originating selected snapshot and prevents cross-form/identity targeting', async () => {
    const registry = new AIFormRegistry();
    const first = fixture();
    const second = fixture('other', 'different-user');
    registry.register(first.registration);
    registry.register(second.registration);
    const source = await registry.snapshot('profile');
    for (const candidate of [
      { kind: 'other', id: 'profile' },
      { kind: 'form', id: 'profile' },
      { ...source, id: 'other' },
      { ...source, identity: 'different-user' },
    ]) {
      expect(
        (
          await registry.apply({
            source: candidate,
            operationId: JSON.stringify(candidate),
            values: { name: 'bad' },
          })
        ).status,
      ).toBe('rejected');
    }
    expect(first.setValues).not.toHaveBeenCalled();
    expect(second.setValues).not.toHaveBeenCalled();
  });

  it.each([
    [{ unknown: 'x' }, 'undeclared-field'],
    [{ record: 'new' }, 'readonly-field'],
    [{ count: '3' }, 'invalid-value'],
    [{ category: 'outside' }, 'invalid-value'],
    [{ 'details.nested': 'x' }, 'invalid-field'],
    [{ 'name[0]': 'x' }, 'invalid-field'],
    [{}, 'empty-patch'],
  ])('rejects invalid or undeclared patches %j', async (values, code) => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register(form.registration);
    const source = await registry.snapshot('profile');
    expect(
      await registry.apply({ source, operationId: 'invalid', values }),
    ).toMatchObject({ status: 'rejected', code });
    expect(form.setValues).not.toHaveBeenCalled();
  });

  it('rejects proposals after manual edits, capability changes, or unregister', async () => {
    for (const change of ['revision', 'fields', 'unmount']) {
      const registry = new AIFormRegistry();
      const form = fixture();
      const handle = registry.register(form.registration);
      const source = await registry.snapshot('profile');
      if (change === 'revision') form.edit({ count: 8 });
      if (change === 'fields')
        handle.update({ ...form.registration, fields: fields.slice(1) });
      if (change === 'unmount') handle.unregister();
      expect(
        (
          await registry.apply({
            source,
            operationId: 'stale',
            values: { name: 'bad' },
          })
        ).status,
      ).toBe('rejected');
      expect(form.setValues).not.toHaveBeenCalled();
    }
  });

  it('deduplicates concurrent and completed operation ids and rejects reuse with edited payload', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const write = deferred<void>();
    form.setValues.mockReturnValue(write.promise);
    registry.register(form.registration);
    const source = await registry.snapshot('profile');
    const request = {
      source,
      operationId: 'one-card',
      values: { name: 'edited' },
    };
    const first = registry.apply(request);
    const second = registry.apply(request);
    expect(first).toBe(second);
    await Promise.resolve();
    await Promise.resolve();
    expect(form.setValues).toHaveBeenCalledTimes(1);
    expect(
      await registry.apply({ ...request, values: { name: 'other' } }),
    ).toMatchObject({ code: 'operation-conflict' });
    write.resolve();
    expect((await first).status).toBe('applied');
    expect(await registry.apply(request)).toEqual(await first);
    expect(form.setValues).toHaveBeenCalledTimes(1);
    expect(
      await registry.apply({ ...request, operationId: 'another-card' }),
    ).toMatchObject({ code: 'revision-conflict' });
  });

  it('blocks competing operations and context reads while a setter is pending', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const write = deferred<void>();
    form.setValues.mockReturnValue(write.promise);
    registry.register(form.registration);
    const source = await registry.snapshot('profile');
    const first = registry.apply({
      source,
      operationId: 'one',
      values: { name: 'x' },
    });
    await Promise.resolve();
    expect(
      await registry.apply({
        source,
        operationId: 'two',
        values: { count: 2 },
      }),
    ).toMatchObject({ code: 'form-busy' });
    await expect(registry.snapshot('profile')).rejects.toMatchObject({
      code: 'form-busy',
    });
    write.resolve();
    await first;
  });

  it('validates the edited values and never calls setter on rejection or cancellation', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const validate = vi.fn((values: AIFormValues) =>
      values.name === 'edited' ? 'Business validation failed' : undefined,
    );
    registry.register({ ...form.registration, validate });
    const source = await registry.snapshot('profile');
    expect(
      await registry.apply({
        source,
        operationId: 'invalid',
        values: { name: 'edited' },
      }),
    ).toMatchObject({
      code: 'validation-failed',
      message: 'Business validation failed',
    });
    const cancelled = new AbortController();
    cancelled.abort();
    expect(
      await registry.apply({
        source,
        operationId: 'cancel',
        values: { name: 'other' },
        signal: cancelled.signal,
      }),
    ).toMatchObject({ status: 'cancelled' });
    expect(validate).toHaveBeenCalledTimes(1);
    expect(form.setValues).not.toHaveBeenCalled();
  });

  it('clones request before async work and isolates validator mutations from the actual edited patch', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register({
      ...form.registration,
      validate: (values) => {
        values.name = 'validator mutation';
        return undefined;
      },
    });
    const source = await registry.snapshot('profile');
    const values = { name: 'final edit' };
    const pending = registry.apply({ source, values, operationId: 'cloned' });
    values.name = 'later mutation';
    source.identity = 'later mutation';
    expect((await pending).status).toBe('applied');
    expect(form.values().name).toBe('final edit');
  });

  it('does not call setter when cancellation, revision or identity changes during validation', async () => {
    for (const change of ['cancel', 'revision', 'identity']) {
      const registry = new AIFormRegistry();
      const form = fixture();
      const validation = deferred<string | undefined>();
      const handle = registry.register({
        ...form.registration,
        validate: () => validation.promise,
      });
      const source = await registry.snapshot('profile');
      const abort = new AbortController();
      const pending = registry.apply({
        source,
        operationId: 'validate',
        values: { name: 'x' },
        signal: abort.signal,
      });
      await Promise.resolve();
      if (change === 'cancel') abort.abort();
      if (change === 'revision') form.edit({ count: 9 });
      if (change === 'identity') {
        handle.unregister();
        registry.register(fixture('profile', 'B').registration);
      }
      validation.resolve(undefined);
      expect((await pending).status).toBe(
        change === 'cancel' ? 'cancelled' : 'rejected',
      );
      expect(form.setValues).not.toHaveBeenCalled();
    }
  });

  it('passes an abort signal and commit guard to async adapters so stale writes cannot commit', async () => {
    for (const change of ['unmount', 'revision', 'cancel']) {
      const registry = new AIFormRegistry();
      const form = fixture();
      const pause = deferred<void>();
      let committed = false;
      let captured: AIFormOperationContext | undefined;
      form.setValues.mockImplementation(async (_values, context) => {
        captured = context;
        await pause.promise;
        if (!context.isCurrent()) throw new Error('Stale commit prevented');
        committed = true;
      });
      const handle = registry.register(form.registration);
      const source = await registry.snapshot('profile');
      const abort = new AbortController();
      const pending = registry.apply({
        source,
        operationId: 'async',
        values: { name: 'x' },
        signal: abort.signal,
      });
      await Promise.resolve();
      await Promise.resolve();
      if (change === 'unmount') handle.unregister();
      if (change === 'revision') form.edit({ count: 7 });
      if (change === 'cancel') abort.abort();
      expect(captured?.isCurrent()).toBe(false);
      if (change !== 'revision') expect(captured?.signal.aborted).toBe(true);
      pause.resolve();
      expect((await pending).status).toBe('failed');
      expect(committed).toBe(false);
    }
  });

  it('awaits setters and honestly reports asynchronous failure and partial application', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const write = deferred<void>();
    form.setValues.mockReturnValue(write.promise);
    registry.register(form.registration);
    const source = await registry.snapshot('profile');
    const pending = registry.apply({
      source,
      operationId: 'failed',
      values: { name: 'x' },
    });
    await Promise.resolve();
    write.reject(new Error('Adapter failed after writing one field'));
    expect(await pending).toMatchObject({
      status: 'failed',
      message: 'Adapter failed after writing one field',
    });
    expect(
      await registry.apply({
        source,
        operationId: 'retry',
        values: { name: 'x' },
      }),
    ).toMatchObject({ code: 'revision-conflict' });
    form.setValues.mockReturnValue({
      status: 'partial',
      message: 'One field changed; review the draft',
    });
    expect(
      await registry.apply({
        source: await registry.snapshot('profile'),
        operationId: 'partial',
        values: { name: 'x' },
      }),
    ).toMatchObject({
      status: 'partial',
      message: 'One field changed; review the draft',
    });
  });

  it('does not claim success when an uncooperative setter resolves after unmount', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const write = deferred<void>();
    form.setValues.mockReturnValue(write.promise);
    const handle = registry.register(form.registration);
    const pending = registry.apply({
      source: await registry.snapshot('profile'),
      operationId: 'unknown',
      values: { name: 'x' },
    });
    await Promise.resolve();
    await Promise.resolve();
    handle.unregister();
    write.resolve();
    expect(await pending).toMatchObject({
      status: 'failed',
      code: 'stale-after-write',
    });
  });
});

describe('additional stale-source boundaries', () => {
  it('deduplicates equivalent JSON patches independent of object key insertion order', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register(form.registration);
    const source = await registry.snapshot('profile');
    const first = registry.apply({
      source,
      operationId: 'key-order',
      values: { name: 'x', details: { a: 1, b: 2 } },
    });
    const again = registry.apply({
      source,
      operationId: 'key-order',
      values: { details: { b: 2, a: 1 }, name: 'x' },
    });
    expect(first).toBe(again);
    expect((await first).status).toBe('applied');
    expect(form.setValues).toHaveBeenCalledTimes(1);
  });

  it('compares declared JSON enum members structurally without treating property order as a value', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register({
      ...form.registration,
      fields: [
        ...fields.filter((field) => field.name !== 'details'),
        {
          name: 'details',
          type: 'json',
          editable: true,
          enum: [{ a: 1, b: 2 }],
        },
      ],
    });
    form.getValues.mockReturnValue({ name: 'x', details: { b: 2, a: 1 } });
    const source = await registry.snapshot('profile');
    expect(
      await registry.apply({
        source,
        operationId: 'json-enum',
        values: { details: { b: 2, a: 1 } },
      }),
    ).toMatchObject({ status: 'applied' });
  });
  it('does not revive a source when capabilities change and later revert', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const handle = registry.register(form.registration);
    const source = await registry.snapshot('profile');
    handle.update({ ...form.registration, fields: fields.slice(1) });
    handle.update(form.registration);
    expect(
      await registry.apply({
        source,
        operationId: 'capabilities-aba',
        values: { name: 'bad' },
      }),
    ).toMatchObject({ code: 'revision-conflict' });
    expect(form.setValues).not.toHaveBeenCalled();
  });

  it('rejects pollution nested inside an otherwise declared JSON patch before a setter is called', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register(form.registration);
    const source = await registry.snapshot('profile');
    const unsafe: AIFormValues = {};
    Object.defineProperty(unsafe, 'constructor', {
      value: { prototype: { polluted: true } },
      enumerable: true,
    });
    expect(
      await registry.apply({
        source,
        operationId: 'unsafe',
        values: { details: unsafe },
      }),
    ).toMatchObject({ status: 'rejected', code: 'invalid-json' });
    expect(form.setValues).not.toHaveBeenCalled();
  });

  it('reports async validator rejection without calling a setter or poisoning later valid operations', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    const validate = vi.fn(async (): Promise<undefined> => {
      throw new Error('Validator unavailable');
    });
    const handle = registry.register({ ...form.registration, validate });
    const source = await registry.snapshot('profile');
    expect(
      await registry.apply({
        source,
        operationId: 'validator-error',
        values: { name: 'x' },
      }),
    ).toMatchObject({ status: 'rejected', message: 'Validator unavailable' });
    expect(form.setValues).not.toHaveBeenCalled();
    handle.update(form.registration);
    expect(
      await registry.apply({
        source,
        operationId: 'valid-after-rejection',
        values: { name: 'x' },
      }),
    ).toMatchObject({ status: 'applied' });
  });
});

describe('lossless form JSON and pollution protection', () => {
  it('rejects unsafe declared names and duplicate fields', () => {
    for (const name of [
      '__proto__',
      'constructor',
      'prototype',
      'a.b',
      'a[0]',
      'a/b',
    ]) {
      expect(() =>
        new AIFormRegistry().register({
          ...fixture().registration,
          fields: [{ name, type: 'json', editable: true }],
        }),
      ).toThrow('flat names');
    }
    expect(() =>
      new AIFormRegistry().register({
        ...fixture().registration,
        fields: [fields[0], fields[0]],
      }),
    ).toThrow('Duplicate');
  });

  it('rejects cyclic, non-finite, unsafe, sparse, accessor, undefined and non-plain read values', async () => {
    const cyclic: AIFormValues = {};
    cyclic.self = cyclic;
    const unsafe: AIFormValues = {};
    Object.defineProperty(unsafe, '__proto__', {
      value: { polluted: true },
      enumerable: true,
    });
    const accessor: AIFormValues = {};
    const getter = vi.fn(() => 'not executed');
    Object.defineProperty(accessor, 'name', { get: getter, enumerable: true });
    const sparse: AppSparse = [];
    sparse.length = 2;
    for (const value of [
      cyclic,
      unsafe,
      accessor,
      { count: NaN },
      { count: Infinity },
      { details: sparse },
    ]) {
      const registry = new AIFormRegistry();
      const form = fixture();
      form.getValues.mockReturnValue(value);
      registry.register(form.registration);
      await expect(registry.snapshot('profile')).rejects.toMatchObject({
        code: 'invalid-json',
      });
    }
    for (const invalid of [undefined, 1n, () => {}, new Date(), Symbol('x')]) {
      const registry = new AIFormRegistry();
      const form = fixture();
      form.getValues.mockImplementation(() => {
        const values: AIFormValues = {};
        Object.defineProperty(values, 'details', {
          value: invalid,
          enumerable: true,
        });
        return values;
      });
      registry.register(form.registration);
      await expect(registry.snapshot('profile')).rejects.toMatchObject({
        code: 'invalid-json',
      });
    }
    expect(getter).not.toHaveBeenCalled();
    expect(
      Object.getOwnPropertyDescriptor(Object.prototype, 'polluted'),
    ).toBeUndefined();
  });

  it('bounds depth and bytes and refuses undeclared read data instead of accidentally uploading it', async () => {
    const registry = new AIFormRegistry();
    const form = fixture();
    registry.register(form.registration);
    let nested: AIFormValues = {};
    for (let index = 0; index < 20; index++) nested = { nested };
    const overBudgetValues: AIFormValues[] = [
      { details: nested },
      { name: 'x'.repeat(70_000) },
    ];
    for (const value of overBudgetValues) {
      form.getValues.mockReturnValue(value);
      await expect(registry.snapshot('profile')).rejects.toMatchObject({
        code: 'invalid-json',
      });
    }
    form.getValues.mockReturnValue({ token: 'must not upload' });
    await expect(registry.snapshot('profile')).rejects.toMatchObject({
      code: 'undeclared-field',
    });
  });
});

type AppSparse = (string | number)[];

function Form({
  registration,
}: {
  registration: AIFormRegistration;
}): ReactElement {
  const ref = useAIForm(registration);
  return <form ref={ref} />;
}

describe('React ref callback and identity-scoped providers', () => {
  it('survives StrictMode, refreshes callbacks, changes tokens for record transitions, and cleans up', async () => {
    const registry = new AIFormRegistry();
    const first = fixture();
    const tree = (registration: AIFormRegistration): ReactElement => (
      <StrictMode>
        <AIFormRegistryProvider registry={registry}>
          <Form registration={registration} />
        </AIFormRegistryProvider>
      </StrictMode>
    );
    const view = render(tree(first.registration));
    const source = await registry.snapshot('profile');
    const latest = fixture();
    latest.edit({ name: 'new callback' });
    view.rerender(tree(latest.registration));
    expect((await registry.snapshot('profile')).values.name).toBe(
      'new callback',
    );
    expect(registry.locate('profile')?.instance).toBe(source.instance);
    view.rerender(tree(fixture('profile', 'B').registration));
    const b = registry.locate('profile')?.instance;
    view.rerender(tree(first.registration));
    expect(registry.locate('profile')?.instance).not.toBe(b);
    expect(registry.locate('profile')?.instance).not.toBe(source.instance);
    expect(first.setValues).not.toHaveBeenCalled();
    view.unmount();
    expect(registry.list()).toEqual([]);
  });

  it('ignores stale React callback cleanup and legacy null callbacks after record replacement', () => {
    const registry = new AIFormRegistry();
    const first = fixture();
    const view = renderHook(
      (registration: AIFormRegistration) => useAIForm(registration),
      {
        initialProps: first.registration,
        wrapper: ({ children }) => (
          <AIFormRegistryProvider registry={registry}>
            {children}
          </AIFormRegistryProvider>
        ),
      },
    );
    const oldRef = view.result.current;
    const cleanupOld = oldRef(document.createElement('form'));
    oldRef(null);
    view.rerender(fixture('profile', 'B').registration);
    const newRef = view.result.current;
    const cleanupNew = newRef(document.createElement('form'));
    const current = registry.locate('profile')?.instance;
    if (typeof cleanupOld === 'function') cleanupOld();
    oldRef(null);
    expect(registry.locate('profile')?.instance).toBe(current);
    expect(registry.locate('profile')?.identity).toBe('B');
    if (typeof cleanupNew === 'function') cleanupNew();
    expect(registry.list()).toEqual([]);
  });

  it('uses the latest committed callbacks when a stable ref is detached and reattached', async () => {
    const registry = new AIFormRegistry();
    const first = fixture();
    const view = renderHook(
      (registration: AIFormRegistration) => useAIForm(registration),
      {
        initialProps: first.registration,
        wrapper: ({ children }) => (
          <AIFormRegistryProvider registry={registry}>
            {children}
          </AIFormRegistryProvider>
        ),
      },
    );
    const ref = view.result.current;
    const cleanupFirst = ref(document.createElement('form'));
    if (typeof cleanupFirst === 'function') cleanupFirst();
    const next = fixture();
    next.edit({ name: 'latest attachment' });
    view.rerender(next.registration);
    expect(view.result.current).toBe(ref);
    const cleanupNext = ref(document.createElement('form'));
    expect((await registry.snapshot('profile')).values.name).toBe(
      'latest attachment',
    );
    if (typeof cleanupNext === 'function') cleanupNext();
  });

  it('isolates nested provider scopes and does not retain old authenticated forms', () => {
    const outer = new AIFormRegistry();
    const seen: AIFormRegistry[] = [];
    function Capture(): ReactElement {
      seen.push(useAIFormRegistry());
      return <Form registration={fixture().registration} />;
    }
    const tree = (identity: string): ReactElement => (
      <AIFormRegistryProvider registry={outer}>
        <AIFormRegistryProvider key={identity}>
          <Capture />
        </AIFormRegistryProvider>
      </AIFormRegistryProvider>
    );
    const view = render(tree('user-A'));
    const previous = seen[0];
    expect(previous?.list()).toHaveLength(1);
    expect(outer.list()).toEqual([]);
    view.rerender(tree('user-B'));
    expect(previous?.list()).toEqual([]);
    expect(seen.at(-1)).not.toBe(previous);
    expect(seen.at(-1)?.list()).toHaveLength(1);
  });
});
