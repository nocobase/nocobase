import { useState, type ReactElement } from 'react';
import { FeedbackForm } from '#components/feedback-form';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';

export function FeedbackFormDemo(): ReactElement {
  const [fail, setFail] = useState(true);
  const [saved, setSaved] = useState(false);
  return (
    <section className='max-w-lg space-y-4 p-6 text-foreground'>
      <h2 className='font-semibold'>Form failure feedback</h2>
      <p className='text-sm text-muted-foreground'>
        Save an empty form to locate its required field. Enter a name, then save
        again to see a connection failure without losing your input.
      </p>
      <FeedbackForm
        className='space-y-4'
        onSubmit={async (event) => {
          event.preventDefault();
          setSaved(false);
          if (fail) throw new TypeError('Demonstration connection failure');
          setSaved(true);
        }}
      >
        <div className='space-y-2'>
          <label htmlFor='feedback-name' className='text-sm font-medium'>
            Equipment name
          </label>
          <Input
            id='feedback-name'
            name='name'
            required
            aria-describedby='feedback-help'
          />
          <p id='feedback-help' className='text-sm text-muted-foreground'>
            Keep this name while correcting the request.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            aria-pressed={fail}
            onClick={() => setFail(!fail)}
          >
            {fail ? 'Connection failure enabled' : 'Successful save enabled'}
          </Button>
          <Button type='submit'>Save</Button>
        </div>
        {saved && <p role='status'>Saved successfully.</p>}
      </FeedbackForm>
    </section>
  );
}
