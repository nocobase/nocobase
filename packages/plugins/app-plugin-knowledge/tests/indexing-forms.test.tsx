import { useState, type ReactElement } from 'react';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from '@nocobase/app-testing/client';
import { expect, it, vi } from 'vitest';
import knowledge from '../client/plugin.js';
import {
  createIndexingFormRegistry,
  knowledgeIndexingFormsToken,
  type IndexingFormProps,
} from '../client/indexing/index.js';
import { IndexingForm } from '../client/indexing/form.js';
import { ACCESS_NAMESPACE } from '../shared/access.js';
import type { JsonObject } from '../shared/indexing.js';

function props(type = 'fixture-text'): IndexingFormProps {
  return {
    instance: { key: 'local', name: 'Local', type },
    value: { retained: 'draft' },
    onChange: vi.fn(),
    errors: [],
    disabled: false,
    services: [],
    modelsLoading: false,
    modelsError: null,
  };
}
const content = (p: IndexingFormProps) => (
  <IndexingForm
    {...p}
    loading={<p>Loading form</p>}
    unavailable={<p>Form unavailable</p>}
  />
);
it('keeps form registries application-local and seals them only after boot', async () => {
  const load = vi.fn(async () => ({ default: () => <p>Custom form</p> }));
  const a = await renderWithApp(<p>First app</p>, {
    plugins: [
      knowledge({
        routes: false,
        indexingForms: [{ type: 'fixture-text', load }],
      }),
    ],
  });
  const b = await renderWithApp(<p>Second app</p>, {
    plugins: [knowledge({ routes: false })],
  });
  const first = a.app.container.resolve(knowledgeIndexingFormsToken);
  const second = b.app.container.resolve(knowledgeIndexingFormsToken);
  expect(first.list().map((d) => d.type)).toEqual([
    'sqlite-vec',
    'pgvector',
    'fixture-text',
  ]);
  expect(first.get('sqlite-vec')?.requiresEmbedding).toBe(true);
  expect(first.get('pgvector')?.requiresEmbedding).toBe(true);
  expect(first.get('fixture-text')?.requiresEmbedding).toBe(false);
  expect(second.get('fixture-text')).toBeUndefined();
  expect(load).not.toHaveBeenCalled();
  expect(() => first.register({ type: 'late', load })).toThrow('sealed');
  const release = createIndexingFormRegistry();
  const remove = release.register({ type: 'fixture-text', load });
  expect(() => release.register({ type: 'fixture-text', load })).toThrow(
    'Duplicate',
  );
  remove();
  release.register({ type: 'fixture-text', load });
  remove();
  expect(release.get('fixture-text')).toBeDefined();
  release.seal();
  expect(() => remove()).toThrow('sealed');
  await a.app.shutdown();
  expect(first.list()).toEqual([]);
  expect(second.get('sqlite-vec')).toBeDefined();
});
it('does not invoke unselected loaders or let a late loader replace the selected type', async () => {
  let resolve!: (module: { default: () => ReactElement }) => void;
  const load = vi.fn(
    () =>
      new Promise<{ default: () => ReactElement }>((done) => {
        resolve = done;
      }),
  );
  const other = vi.fn(async () => ({ default: () => <p>Other loaded</p> }));
  const p = props();
  const view = await renderWithApp(content(p), {
    plugins: [
      knowledge({
        routes: false,
        indexingForms: [
          { type: 'fixture-text', load },
          { type: 'other', load: other },
        ],
      }),
    ],
  });
  expect(load).toHaveBeenCalledTimes(1);
  expect(other).not.toHaveBeenCalled();
  expect(screen.getByText('Loading form')).toBeTruthy();
  view.rerender(content({ ...p, instance: { ...p.instance, type: 'other' } }));
  expect(await screen.findByText('Other loaded')).toBeTruthy();
  await act(async () => resolve({ default: () => <p>Stale loaded</p> }));
  expect(screen.queryByText('Stale loaded')).toBeNull();
  expect(screen.getByText('Other loaded')).toBeTruthy();
});
it('does not overwrite a missing type with an empty form or discard its original options', async () => {
  const p = props('not-installed');
  await renderWithApp(content(p), { plugins: [knowledge({ routes: false })] });
  expect(screen.getByText('Form unavailable')).toBeTruthy();
  expect(p.onChange).not.toHaveBeenCalled();
  expect(p.value).toEqual({ retained: 'draft' });
});
it('edits only controlled JSON, clears the model on a service change, and never selects the first model automatically', async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  function Form(): ReactElement {
    const [value, setValue] = useState<JsonObject>({
      embedding: { modelService: 'first', model: 'one' },
      table: 'saved',
    });
    return content({
      ...props('pgvector'),
      value,
      onChange: (next) => {
        changed(next);
        setValue(next);
      },
      services: [
        {
          name: 'first',
          title: 'First service',
          provider: 'fixture',
          models: [{ value: 'one', label: 'First model', dimensions: 3 }],
        },
        {
          name: 'second',
          title: 'Second service',
          provider: 'fixture',
          models: [{ value: 'two', label: 'Second model', dimensions: 3 }],
        },
      ],
    });
  }
  await renderWithApp(<Form />, {
    plugins: [knowledge({ routes: false })],
    namespace: ACCESS_NAMESPACE,
  });
  await screen.findByRole('combobox', { name: 'Model service' });
  expect(screen.queryByRole('textbox', { name: 'Table name' })).toBeNull();
  expect(
    screen.queryByText(/table prefix are managed in deployment configuration/),
  ).toBeNull();
  await user.click(screen.getByRole('combobox', { name: 'Model service' }));
  await user.click(
    await screen.findByRole('option', { name: 'Second service' }),
  );
  expect(changed).toHaveBeenLastCalledWith({
    embedding: { modelService: 'second', model: '' },
  });
  expect(screen.getByRole('combobox', { name: 'Embedding model' })).toHaveValue(
    '',
  );
  expect(document.querySelector('form')).toBeNull();
});
it.each([
  'en-US',
  'zh-CN',
  'zh-TW',
  'de-DE',
  'es-ES',
  'fr-FR',
  'id-ID',
  'ja-JP',
  'pt-BR',
  'vi-VN',
])(
  'renders unavailable model state without mutating the saved JSON in %s',
  async (locale) => {
    const p = {
      ...props('sqlite-vec'),
      value: {
        embedding: { modelService: 'deleted-service', model: 'saved-model' },
      },
      modelsError: 'private diagnostics must not be rendered',
    };
    const view = await renderWithApp(content(p), {
      plugins: [knowledge({ routes: false })],
      namespace: ACCESS_NAMESPACE,
      locale,
    });
    await within(view.container).findByRole('alert');
    expect(view.container.textContent).not.toContain('private diagnostics');
    const selects = within(view.container).getAllByRole('combobox');
    expect(selects.every((element) => element.hasAttribute('disabled'))).toBe(
      true,
    );
    expect(within(view.container).getAllByRole('combobox').at(-1)).toHaveValue(
      'saved-model',
    );
    expect(p.onChange).not.toHaveBeenCalled();
  },
);

it.each(['sqlite-vec', 'pgvector'])(
  'accepts a fixed model ID without selecting an option and preserves it on blur, disabled toggles and catalog refresh (%s)',
  async (type) => {
    const user = userEvent.setup();
    const changed = vi.fn();
    function Form(): ReactElement {
      const [value, setValue] = useState<JsonObject>({
        embedding: { modelService: 'first', model: '' },
      });
      const [disabled, setDisabled] = useState(false);
      const [empty, setEmpty] = useState(false);
      return (
        <>
          {content({
            ...props(type),
            value,
            disabled,
            onChange: (next) => {
              changed(next);
              setValue(next);
            },
            services: [
              {
                name: 'first',
                title: 'First service',
                provider: 'fixture',
                models: empty
                  ? []
                  : [{ value: 'listed', label: 'Listed model', dimensions: 3 }],
              },
            ],
          })}
          <button onClick={() => setDisabled(!disabled)}>
            Toggle disabled
          </button>
          <button onClick={() => setEmpty(!empty)}>Toggle catalog</button>
        </>
      );
    }
    await renderWithApp(<Form />, { plugins: [knowledge({ routes: false })] });
    const input = await screen.findByRole('combobox', {
      name: 'Embedding model',
    });
    expect(changed).not.toHaveBeenCalled();
    await user.type(input, 'fixed-model-v2');
    await user.tab();
    expect(input).toHaveValue('fixed-model-v2');
    expect(changed).toHaveBeenLastCalledWith({
      embedding: { modelService: 'first', model: 'fixed-model-v2' },
    });
    await user.click(screen.getByRole('button', { name: 'Toggle disabled' }));
    expect(input).toBeDisabled();
    expect(input).toHaveValue('fixed-model-v2');
    await user.click(screen.getByRole('button', { name: 'Toggle disabled' }));
    await user.click(screen.getByRole('button', { name: 'Toggle catalog' }));
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue('fixed-model-v2');
    await user.clear(input);
    await user.type(input, 'another-model');
    await user.tab();
    expect(input).toHaveValue('another-model');
    await user.click(screen.getByRole('button', { name: 'Toggle catalog' }));
    await user.clear(input);
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.click(
      await screen.findByRole('option', { name: 'Listed model' }),
    );
    expect(input).toHaveValue('listed');
    expect(changed).toHaveBeenLastCalledWith({
      embedding: { modelService: 'first', model: 'listed' },
    });
  },
);

it('selects a suggested model by keyboard while retaining custom IDs on Escape', async () => {
  const user = userEvent.setup();
  function Form(): ReactElement {
    const [value, setValue] = useState<JsonObject>({
      embedding: { modelService: 'first', model: '' },
    });
    return content({
      ...props('sqlite-vec'),
      value,
      onChange: setValue,
      services: [
        {
          name: 'first',
          title: 'First',
          provider: 'fixture',
          models: [{ value: 'suggested', label: 'Suggested', dimensions: 3 }],
        },
      ],
    });
  }
  await renderWithApp(<Form />, { plugins: [knowledge({ routes: false })] });
  const input = await screen.findByRole('combobox', {
    name: 'Embedding model',
  });
  await user.click(input);
  await screen.findByRole('option', { name: 'Suggested' });
  await user.keyboard('{ArrowDown}{Enter}');
  expect(input).toHaveValue('suggested');
  await user.clear(input);
  await user.type(input, 'fixed-manual');
  await user.keyboard('{Escape}');
  await user.tab();
  expect(input).toHaveValue('fixed-manual');
});
