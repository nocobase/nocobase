import type { ReactElement } from 'react';
import { ListFeedback, ListFeedbackActions } from '#components/list-feedback';

export function ListFeedbackDemo(): ReactElement {
  return (
    <div className='space-y-4 p-6'>
      <ListFeedback state='loading' />
      <ListFeedback state='empty' />
      <div className='space-y-2'>
        <div className='flex justify-end'>
          <ListFeedbackActions state='no-results' onClear={() => undefined} />
        </div>
        <ListFeedback state='no-results' />
      </div>
      <ListFeedback state='forbidden' />
      <div className='space-y-2'>
        <div className='flex justify-end'>
          <ListFeedbackActions state='failed' onRetry={() => undefined} />
        </div>
        <ListFeedback state='failed' />
      </div>
      <div className='space-y-2'>
        <div className='flex justify-end'>
          <ListFeedbackActions
            state='refresh-failed'
            onRetry={() => undefined}
          />
        </div>
        <ListFeedback state='refresh-failed'>
          <p>Previously loaded equipment record</p>
        </ListFeedback>
      </div>
      <div className='space-y-2'>
        <div className='flex justify-end'>
          <ListFeedbackActions state='unauthenticated' />
        </div>
        <ListFeedback state='unauthenticated' />
      </div>
    </div>
  );
}
