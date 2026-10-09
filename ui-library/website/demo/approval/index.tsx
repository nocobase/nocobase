import { useState, type ReactElement } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { Textarea } from '#components/ui/textarea';

import {
  ApprovalActionBar,
  ApprovalBranches,
  ApprovalProgress,
  ApprovalReceipts,
  ApprovalRoutePreview,
  ApprovalTimeline,
  ApprovalUiProvider,
  type ApprovalActionForm,
  type ApprovalActionValues,
  type ApprovalBarAction,
} from '#extensions/nocobase-approval-ui/index';
import {
  BRANCHES,
  COPIES,
  LINES,
  PEOPLE,
  RECEIPTS,
  ROUTE,
  STEPS,
} from './fixtures.js';

function personName(id: string): string {
  return PEOPLE[id] ?? id;
}

function Avatar({ id }: { readonly id: string }): ReactElement {
  const initials = personName(id)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
  return (
    <span
      aria-hidden='true'
      className='inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground'
    >
      {initials}
    </span>
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

const reasonForm: ApprovalActionForm = {
  validate: (values) =>
    typeof values.comment === 'string' && values.comment.trim()
      ? []
      : ['comment'],
  render: ({ values, setValues, invalid }) => (
    <Textarea
      aria-label='Reason'
      aria-invalid={invalid.includes('comment')}
      placeholder='Why?'
      value={typeof values.comment === 'string' ? values.comment : ''}
      onChange={(event) =>
        setValues({ ...values, comment: event.target.value })
      }
    />
  ),
};

const transferForm: ApprovalActionForm = {
  // Stands in for paging through the approval service's `candidatesFor`.
  load: async () => {
    await wait(600);
    return ['li', 'zhou', 'chen'];
  },
  validate: (values) => (typeof values.to === 'string' ? [] : ['to']),
  render: ({ values, setValues, loaded }) => (
    <div role='radiogroup' aria-label='Hand over to' className='flex gap-2'>
      {(loaded as readonly string[]).map((id) => (
        <button
          key={id}
          type='button'
          role='radio'
          aria-checked={values.to === id}
          onClick={() => setValues({ ...values, to: id })}
          className='rounded-full border px-3 py-1 text-sm aria-checked:border-primary aria-checked:bg-primary/10'
        >
          {personName(id)}
        </button>
      ))}
    </div>
  ),
};

function Request(): ReactElement {
  const [status, setStatus] = useState('');
  // An application builds these from the actions its approval backend offers,
  // and sends each to its own route.
  const send =
    (name: string) =>
    async (values: ApprovalActionValues): Promise<void> => {
      await wait(400);
      setStatus(`Sent ${name} with ${JSON.stringify(values)}`);
    };
  const actions: ApprovalBarAction[] = [
    {
      key: 'approve',
      label: 'Approve',
      tone: 'primary',
      primary: true,
      run: send('approve'),
    },
    {
      key: 'reject',
      label: 'Reject',
      tone: 'danger',
      primary: true,
      form: {
        ...reasonForm,
        description: 'The claim ends here; the applicant can start a new one.',
      },
      run: send('reject'),
    },
    {
      key: 'transfer',
      label: 'Hand over',
      form: transferForm,
      run: send('transfer'),
    },
    {
      key: 'comment',
      label: 'Comment',
      form: reasonForm,
      run: send('comment'),
    },
    {
      key: 'reassign',
      label: 'Reassign',
      group: 'admin',
      run: send('reassign'),
    },
  ];
  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'>
      <div className='min-w-0 space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalProgress steps={STEPS} copies={COPIES} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalTimeline lines={LINES} />
          </CardContent>
        </Card>
        <ApprovalActionBar actions={actions} />
        <p role='status' className='text-xs text-muted-foreground'>
          {status}
        </p>
      </div>
      <aside className='min-w-0 space-y-4'>
        <ApprovalRoutePreview route={ROUTE} applicantId='ming' />
        <Card>
          <CardHeader>
            <CardTitle>Parallel branches</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalBranches branches={BRANCHES} onOpen={() => undefined} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notice receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalReceipts receipts={RECEIPTS} confirm />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

/** One expense claim waiting for finance, seen by Zhao Lei, who still has to decide. */
export function ApprovalDemo(): ReactElement {
  return (
    <ApprovalUiProvider
      personName={personName}
      renderAvatar={(id) => <Avatar id={id} />}
    >
      <main className='mx-auto max-w-5xl p-4 sm:p-6'>
        <Request />
      </main>
    </ApprovalUiProvider>
  );
}
