import { useState, type ReactElement } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FeedbackForm } from '#components/feedback-form';
import { PageContainer } from '#components/page-container';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';

// Isolated browser regression workload; all feedback behavior comes from the selected template component.
export default function EquipmentRegressions(): ReactElement {
  const form = useForm<{ items: { name: string }[] }>({
    defaultValues: { items: [{ name: 'Camera' }] },
    shouldFocusError: false,
  });
  const rows = useFieldArray({
    control: form.control,
    name: 'items',
    rules: {
      minLength: { value: 2, message: 'Add at least two equipment items.' },
    },
  });
  const [saved, setSaved] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [corrected, setCorrected] = useState(false);
  return (
    <PageContainer>
      <h1 className='text-xl font-semibold'>Equipment validation</h1>
      <div className='grid gap-8 max-w-2xl'>
        <FeedbackForm
          aria-label='Equipment group'
          className='space-y-4'
          noValidate
          validationErrors={form.formState.errors}
          submitting={form.formState.isSubmitting}
          onSubmit={form.handleSubmit(() => setSaved(true))}
        >
          <h2 id='equipment-group-label' className='text-lg font-semibold'>
            Equipment group
          </h2>
          <div>
            <Button
              type='button'
              data-field-path='items'
              aria-labelledby='equipment-group-label'
              onClick={() => rows.append({ name: 'Projector' })}
            >
              Add equipment
            </Button>
          </div>
          {rows.fields.map((row, i) => (
            <div key={row.id}>
              <label htmlFor={'group-' + row.id}>Equipment item {i + 1}</label>
              <Input
                id={'group-' + row.id}
                {...form.register(`items.${i}.name`)}
              />
            </div>
          ))}
          <Button type='submit'>Save equipment group</Button>
          {saved && <p role='status'>Equipment group saved.</p>}
        </FeedbackForm>
        <FeedbackForm
          aria-label='Unique equipment'
          className='space-y-4'
          noValidate
          onSubmit={() => setInvalid(true)}
        >
          <h2 className='text-lg'>Unique equipment name</h2>
          <div data-slot='field'>
            <label htmlFor='unique-equipment'>Unique name</label>
            <Input
              id='unique-equipment'
              name='uniqueName'
              defaultValue='Existing camera'
              aria-invalid={invalid}
              aria-describedby={corrected ? 'updated-help' : 'original-help'}
              onChange={() => {
                setInvalid(false);
                setCorrected(true);
              }}
            />
            <p id='original-help'>Use a unique inventory name.</p>
            <p id='updated-help'>Corrected input is retained.</p>
            {invalid && (
              <p data-slot='field-error' className='text-destructive'>
                Choose a unique equipment name.
              </p>
            )}
          </div>
          <Button type='submit'>Save unique name</Button>
        </FeedbackForm>
      </div>
    </PageContainer>
  );
}
