import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { LifecycleDescriptionView } from '@nocobase/lifecycle/react';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { IdentitySelect } from '../components/identity.js';
import { Choice } from '../components/choice.js';
import { Button } from '../components/ui/button.js';
import { ParameterEditor } from '../components/parameter-editor.js';
import { ProcessDiagram } from '../components/process-diagram.js';
import { useParameterBindingEditor } from '../components/parameter-binding-editor.js';
import { LifecyclePanel } from '../components/record-ui.js';
import { parameterApi } from '../lib/parameter-api.js';
import { useLoader } from '../lib/use-loader.js';
import { useExampleRecord } from '../lib/use-example-record.js';
import { exampleApi, errorMessage } from '../lib/api.js';
import { NAMESPACE } from '../lib/format.js';
import { LIFECYCLE_ROUTES } from '../../shared/routes.js';

function DefinitionBindings({
  name,
  actor,
}: {
  readonly name: string;
  readonly actor: string;
}): ReactElement {
  const client = useApiClient();
  const { data, error } = useLoader(
    async () =>
      (
        await client.request<{ data: LifecycleDescriptionView }>({
          path: `${LIFECYCLE_ROUTES}/${name}/lifecycle`,
          query: { actAs: actor },
        })
      ).data,
    `definition:${name}:${actor}`,
  );
  return (
    <>
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
      {data && <BoundDiagram data={data} actor={actor} />}
    </>
  );
}
function BoundDiagram({
  data,
  actor,
}: {
  readonly data: LifecycleDescriptionView;
  readonly actor: string;
}): ReactElement {
  const binding = useParameterBindingEditor(data.description, actor);
  return (
    <>
      {binding.editor}
      <ProcessDiagram
        description={data.description}
        onParameterBinding={binding.onBinding}
      />
    </>
  );
}
function ReviewerDemo({ actor }: { readonly actor: string }): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = useApiClient();
  const [name, setName] = useState<'reviewerDemo' | 'reviewerLiveDemo'>(
    'reviewerDemo',
  );
  const [id, setId] = useState<string>();
  const [note, setNote] = useState('');
  const current = useExampleRecord(name, id, actor);
  const run = async (work: () => Promise<void>): Promise<void> => {
    try {
      await work();
      setNote('');
    } catch (error) {
      setNote(errorMessage(error));
    }
  };
  return (
    <section className='space-y-4 rounded-xl border p-4'>
      <h2 className='text-lg font-semibold'>{t('parameters.reviewerDemo')}</h2>
      <p className='text-sm text-muted-foreground'>
        {t('parameters.candidateBoundary')}
      </p>
      <Choice
        label={t('parameters.demoWorkflow')}
        value={name}
        options={[
          { value: 'reviewerDemo', label: t('parameters.snapshotDemo') },
          { value: 'reviewerLiveDemo', label: t('parameters.liveDemo') },
        ]}
        onChange={(value) => {
          setName(value as typeof name);
          setId(undefined);
        }}
      />
      <Button
        onClick={() =>
          void run(async () => {
            const record = await exampleApi(client).create(name, actor, {});
            setId(String(record.id));
          })
        }
      >
        {t('parameters.createReview')}
      </Button>
      {note || current.error ? (
        <p role='alert' className='text-sm text-destructive'>
          {note || current.error}
        </p>
      ) : null}
      {current.detail && (
        <>
          <p className='text-sm'>
            #{id} · {current.detail.state} · {t('parameters.candidates')}:{' '}
            {JSON.stringify(current.detail.record.candidates)}
          </p>
          <div className='flex flex-wrap gap-2'>
            {current.detail.available.map((transition) => (
              <Button
                key={transition.name}
                disabled={!transition.allowed || current.lifecycle.busy}
                onClick={() =>
                  void run(async () => {
                    await current.lifecycle.fire(transition.name);
                  })
                }
              >
                {transition.title}
              </Button>
            ))}
          </div>
          <LifecyclePanel
            actor={actor}
            detail={current.detail}
            actions={current.lifecycle}
            onChange={current.lifecycle.reload}
          />
        </>
      )}
    </section>
  );
}
export default function ParametersPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = useApiClient();
  const [actor, setActor] = useState('zhao');
  const [diagram, setDiagram] = useState('expenses');
  const api = parameterApi(client, actor);
  const { data, error, reload } = useLoader(
    () => api.list(),
    `parameterGroups:${actor}`,
  );
  return (
    <PageContainer>
      <PageHeader
        title={t('parameters.title')}
        description={t('parameters.description')}
        actions={
          <IdentitySelect
            roles={[
              'finance',
              'director',
              'manager',
              'applicant',
              'agent',
              'customer',
            ]}
            value={actor}
            onChange={setActor}
          />
        }
      />
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}
      <div className='grid items-start gap-4 lg:grid-cols-2'>
        {data?.map((group) => (
          <ParameterEditor
            key={`${actor}:${group.key}`}
            group={group}
            api={api}
            actor={actor}
            onSaved={() => {
              void reload();
            }}
          />
        ))}
      </div>
      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>
          {t('parameters.diagramEntry')}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {t('parameters.diagramHint')}
        </p>
        <Choice
          label={t('parameters.workflow')}
          value={diagram}
          options={[
            'expenses',
            'tickets',
            'reviewerDemo',
            'reviewerLiveDemo',
          ].map((name) => ({ value: name, label: name }))}
          onChange={setDiagram}
        />
        <DefinitionBindings name={diagram} actor={actor} />
      </section>
      <ReviewerDemo actor={actor} />
    </PageContainer>
  );
}
