import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { SubmissionController } from '../../packages/app/app-client/src/submission.ts';

const require = createRequire(
  new URL(
    '../../packages/templates/app-template-examples/package.json',
    import.meta.url,
  ),
);
const { createFormControl } = require('react-hook-form');
const document = readFileSync(
  new URL(
    '../../packages/app/app-skills/skills/nocobase-app-development/references/submission.md',
    import.meta.url,
  ),
  'utf8',
);
const source = document
  .split('```tsx\n')[1]
  .split('// Enter and the footer')[0];

function example(form, write) {
  const controller = new SubmissionController();
  const errors = [];
  const submit = new Function(
    'useSubmission',
    'useRef',
    'userId',
    'formId',
    'form',
    'order',
    'api',
    'showSuccess',
    'onSaved',
    'showSubmissionError',
    `${source}\nreturn submit;`,
  )(
    () => controller,
    (current) => ({ current }),
    'user',
    'order-form',
    form,
    undefined,
    { repository: () => ({ createOne: write }) },
    () => {},
    () => {},
    (error) => errors.push(error),
  );
  return { submit, controller, errors };
}

test('the published submission example clears a corrected field after an invalid submit', async () => {
  const form = createFormControl({ defaultValues: { name: '' } });
  const field = form.register('name', { required: 'Required' });
  const writes = [];
  const { submit, errors } = example(form, async (options) => {
    writes.push(options);
    return { record: options.values };
  });
  await submit();
  assert.equal(form.getFieldState('name').error?.message, 'Required');
  assert.equal(writes.length, 0);
  await field.onChange({
    target: { name: 'name', value: ' Valid name ' },
    type: 'change',
  });
  assert.equal(form.getFieldState('name').error, undefined);
  await submit();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].values.name, 'Valid name');
  assert.ok(writes[0].signal instanceof AbortSignal);
  assert.deepEqual(errors, []);
});

test('the published example ignores a repeated submit while validating, without taking the save lock', async () => {
  let release;
  const validation = new Promise((resolve) => {
    release = resolve;
  });
  let validations = 0;
  const form = createFormControl({ defaultValues: { name: 'Order' } });
  form.register('name', {
    validate: async () => {
      validations++;
      await validation;
      return true;
    },
  });
  let writes = 0;
  const { submit, controller, errors } = example(form, async () => {
    writes++;
    return { record: { name: 'Order' } };
  });
  // While validation runs nothing is saving, so leaving the form still asks before discarding its input.
  const first = submit();
  const second = submit();
  assert.equal(controller.getSnapshot(), false);
  release();
  await Promise.all([first, second]);
  assert.equal(validations, 1);
  assert.equal(writes, 1);
  assert.equal(controller.getSnapshot(), false);
  assert.deepEqual(errors, []);
});

test('the published example writes once when a repeated submit finishes validating after the first save', async () => {
  const gates = [];
  const form = createFormControl({ defaultValues: { name: 'Order' } });
  form.register('name', {
    validate: () =>
      new Promise((resolve) => {
        gates.push(() => resolve(true));
      }),
  });
  let writes = 0;
  const { submit, controller, errors } = example(form, async () => {
    writes++;
    return { record: { name: 'Order' } };
  });
  const first = submit();
  const second = submit();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(controller.getSnapshot(), false);
  gates.shift()();
  await first;
  assert.equal(writes, 1);
  // The repeated submit's own validation, if it started one, ends only after the first save is done.
  for (const release of gates.splice(0)) release();
  await second;
  assert.equal(writes, 1);
  assert.equal(controller.getSnapshot(), false);
  assert.deepEqual(errors, []);
});
