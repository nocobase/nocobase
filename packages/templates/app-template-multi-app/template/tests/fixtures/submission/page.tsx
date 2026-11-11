import { useState, type ReactElement } from 'react';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useApiClient,
  useSubmission,
  PendingSubmissionError,
} from '@nocobase/app-client';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';

/** A synthetic customized business form, used against generated and upgraded applications. */
export default function SubmissionFixture(): ReactElement {
  const api = useApiClient();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:synthetic-borrowing-form`,
  });
  const [name, setName] = useState('Camera');
  const [assetTag, setAssetTag] = useState('CUSTOM-001');
  const [id, setId] = useState<string>();
  const [message, setMessage] = useState('Ready');
  const [mode, setMode] = useState<'create' | 'update' | 'approve'>('create');
  const submit = async (): Promise<void> => {
    try {
      const result = await submission.run(
        { name, assetTag, mode, id },
        async (key, signal) => {
          if (!name.trim() || !assetTag.startsWith('CUSTOM-')) {
            setMessage('Name and CUSTOM- asset tag are required');
            return null;
          }
          if (mode === 'approve')
            return api.request({
              path: `submissionFixture/${id}/approve`,
              method: 'POST',
              signal,
              headers: { 'Idempotency-Key': key },
              json: { note: 'Approved synthetic request' },
            });
          return mode === 'update'
            ? api
                .repository<{
                  id: string;
                  name: string;
                  assetTag: string;
                  statusChangedAt: string;
                }>('borrowings')
                .updateOne({
                  idempotencyKey: key,
                  signal,
                  filter: { id },
                  values: { name, assetTag },
                })
            : api
                .repository<{
                  id: string;
                  name: string;
                  assetTag: string;
                  statusChangedAt: string;
                }>('borrowings')
                .createOne({
                  idempotencyKey: key,
                  signal,
                  values: {
                    id: key.slice(14),
                    name,
                    assetTag,
                    statusChangedAt: new Date(
                      Number(key.slice(0, 13)),
                    ).toISOString(),
                  },
                });
        },
      );
      if (result)
        setMessage(mode === 'approve' ? 'Approved once' : 'Saved successfully');
      if (result && typeof result === 'object' && 'record' in result)
        setId((result.record as { id: string }).id);
    } catch (error) {
      setMessage(
        error instanceof PendingSubmissionError
          ? 'Retry the original operation before changing input'
          : 'Request failed; input retained. Retry to confirm the outcome.',
      );
    }
  };
  return (
    <main
      className='mx-auto max-w-xl space-y-5 p-8'
      style={{ borderTop: '6px solid #2563eb' }}
    >
      <h1 className='text-2xl font-semibold'>Equipment borrowing</h1>
      <p>
        Custom business form • Asset tag validation • Existing data retained
      </p>
      <form
        id='borrowing-form'
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className='space-y-3'
      >
        <label htmlFor='name'>Equipment name</label>
        <Input
          id='name'
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label htmlFor='assetTag'>Custom asset tag</label>
        <Input
          id='assetTag'
          value={assetTag}
          onChange={(event) => setAssetTag(event.target.value)}
        />
        <label htmlFor='mode'>Operation</label>
        <select
          id='mode'
          value={mode}
          onChange={(event) => setMode(event.target.value as typeof mode)}
        >
          <option value='create'>Create</option>
          <option value='update'>Update</option>
          <option value='approve'>Approve</option>
        </select>
      </form>
      <Button
        type='submit'
        form='borrowing-form'
        disabled={submission.submitting}
      >
        {submission.submitting ? 'Submitting…' : 'Save'}
      </Button>
      <p role='status'>{submission.submitting ? 'Submitting…' : message}</p>
      <p data-testid='record-id'>{id}</p>
    </main>
  );
}
