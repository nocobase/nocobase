import type { ReactElement } from 'react';
import { ListFeedback } from '#components/list-feedback';

export function ListFeedbackDemo(): ReactElement {
  return (
    <div className='space-y-4 p-6'>
      <ListFeedback state='loading' />
      <ListFeedback state='empty' />
      <ListFeedback state='no-results' onClear={() => undefined} />
      <ListFeedback state='forbidden' />
      <ListFeedback state='failed' onRetry={() => undefined} />
      <ListFeedback state='refresh-failed' onRetry={() => undefined}>
        <p>Previously loaded equipment record</p>
      </ListFeedback>
    </div>
  );
}
