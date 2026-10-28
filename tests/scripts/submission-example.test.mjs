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

test('the published example acquires its lock before async validation', async () => {
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
  const first = submit();
  assert.equal(controller.getSnapshot(), true);
  await submit();
  assert.equal(validations, 1);
  assert.equal(writes, 0);
  release();
  await first;
  assert.equal(writes, 1);
  assert.equal(controller.getSnapshot(), false);
  assert.deepEqual(errors, []);
});
