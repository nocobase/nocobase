import { useSubmission } from '@nocobase/app-client';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useId, useState, type ReactElement } from 'react';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import type { RelationMutationCall } from '../relation-mutations.js';
import {
  relationOperations,
  prepareRelationLab,
  loadRelationLab,
  relationLabRequest,
  executeRelationLab,
  type RelationOperation,
  type LabRelation,
  type RelationLab,
  type RelationLabState,
  type LabInput,
} from '../relation-lab.js';

const NS = '@nocobase/app-plugin-repository-example';
const NEW_TARGET = '__new__';
function scalarText(value: unknown): string {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value)
    : '—';
}

function OperationCard({
  operation,
}: {
  readonly operation: RelationOperation;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(NS);
  const formId = useId();
  const [relation, setRelation] = useState<LabRelation>('tasks');
  const [lab, setLab] = useState<RelationLab>();
  const [state, setState] = useState<RelationLabState>();
  const [requestBusy, setRequestBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [call, setCall] = useState<RelationMutationCall>();
  const [target, setTarget] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [points, setPoints] = useState('1');
  const [status, setStatus] = useState('draft');
  const [role, setRole] = useState('primary');
  const edits =
    operation === 'create' || operation === 'update' || operation === 'upsert';
  const needsTarget =
    operation === 'connect' ||
    (relation !== 'profile' &&
      ['disconnect', 'update', 'upsert', 'delete'].includes(operation));
  const targets = state?.targets ?? [];
  const eligible = targets.filter(
    (item) =>
      item.exists &&
      (operation === 'connect'
        ? !item.linked
        : operation === 'set'
          ? true
          : item.linked),
  );
  const currentProfile = state?.project.project?.profile;
  const input: LabInput = {
    targetId: target === NEW_TARGET ? (lab?.nextId ?? '') : target,
    selectedIds: selected,
    content: content.trim(),
    points: Number(points),
    status,
    role,
  };
  const valid =
    !!state &&
    !!lab &&
    (!edits ||
      (input.content.length > 0 &&
        (relation !== 'tasks' ||
          (points.trim() !== '' &&
            Number.isSafeInteger(input.points) &&
            input.points >= 0)))) &&
    (!needsTarget ||
      (target === NEW_TARGET && operation === 'upsert') ||
      eligible.some((item) => item.id === target)) &&
    !(relation === 'profile' && operation === 'create' && currentProfile) &&
    !(
      relation === 'profile' &&
      ['update', 'disconnect', 'delete'].includes(operation) &&
      !currentProfile
    );
  const label =
    relation === 'profile'
      ? t('labSummary')
      : relation === 'tags'
        ? t('labLabel')
        : t('labTitle');
  const options = [
    ...(operation === 'upsert' && relation !== 'profile'
      ? [{ value: NEW_TARGET, label: t('labNewTarget') }]
      : []),
    ...eligible.map((item) => ({
      value: item.id,
      label: `${scalarText(item.record?.title ?? item.record?.summary ?? item.record?.label ?? item.id)} · ${item.id.slice(-8)}`,
    })),
  ];
  const submission = useSubmission();
  const busy = requestBusy || submission.submitting;
  async function prepare(): Promise<void> {
    setRequestBusy(true);
    setError('');
    setSaved(false);
    setCall(undefined);
    try {
      const next = await submission.run(
        { phase: 'prepare', operation, relation },
        async (key) => {
          try {
            return await prepareRelationLab(api, operation, relation, key);
          } catch (cause) {
            // Earlier steps may already have committed, even when this step returns a definite rejection.
            throw new Error(
              cause instanceof Error ? cause.message : String(cause),
              { cause },
            );
          }
        },
      );
      if (!next) return;
      setLab(next);
      const snapshot = await loadRelationLab(api, next);
      setState(snapshot);
      const first = snapshot.targets.find((item) =>
        operation === 'connect' ? !item.linked : item.linked,
      );
      setTarget(operation === 'upsert' ? NEW_TARGET : (first?.id ?? ''));
      setSelected(
        snapshot.targets.filter((item) => item.linked).map((item) => item.id),
      );
      setContent(
        operation === 'update' && first?.record
          ? scalarText(
              first.record.title ?? first.record.summary ?? first.record.label,
            )
          : t('labDefaultContent', { operation, id: next.projectId.slice(-8) }),
      );
      setPoints(
        scalarText(operation === 'update' ? (first?.record?.points ?? 1) : 1),
      );
      setStatus(
        scalarText(
          operation === 'update' ? (first?.record?.status ?? 'draft') : 'draft',
        ),
      );
      setRole('primary');
    } catch (value) {
      setError(value instanceof Error ? value.message : t('error'));
    } finally {
      setRequestBusy(false);
    }
  }
  async function refresh(): Promise<void> {
    if (!lab) return;
    setRequestBusy(true);
    setError('');
    try {
      setState(await loadRelationLab(api, lab));
    } catch (value) {
      setState(undefined);
      setError(value instanceof Error ? value.message : t('loadError'));
    } finally {
      setRequestBusy(false);
    }
  }
  async function submit(): Promise<void> {
    if (!lab || !valid) return;
    setRequestBusy(true);
    setError('');
    setSaved(false);
    let written = false;
    try {
      const result = await submission.run(
        { phase: 'mutation', lab, input },
        (key, _signal, snapshot) =>
          executeRelationLab(api, snapshot.lab, snapshot.input, key),
      );
      if (!result) return;
      written = true;
      setSaved(true);
      setLab(result.lab);
      setCall(result.call);
      if (operation === 'upsert') setTarget(input.targetId);
      setState(await loadRelationLab(api, result.lab));
    } catch (value) {
      if (written) setState(undefined);
      setError(
        `${written ? `${t('labRefreshFailed')} ` : ''}${value instanceof Error ? value.message : t('error')}`,
      );
    } finally {
      setRequestBusy(false);
    }
  }
  return (
    <Card
      role='region'
      aria-label={operation}
      id={`relation-${operation}`}
      className='min-w-0 rounded-xl shadow-2xs'
    >
      <CardHeader>
        <div className='flex flex-wrap items-center gap-3'>
          <CardTitle className='text-base font-semibold'>
            <code>{operation}</code> · {t(`lab_${operation}_title`)}
          </CardTitle>
          <Badge variant='outline'>
            {t(operation === 'set' ? 'labManyOnly' : 'labBoth')}
          </Badge>
        </div>
        <CardDescription className='text-xs leading-relaxed'>
          {t(`lab_${operation}_description`)}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='w-full space-y-2 sm:w-64'>
            <label htmlFor={`${formId}-relation`}>{t('labRelation')}</label>
            <Select
              value={relation}
              items={{
                profile: 'hasOne · profile',
                tasks: 'hasMany · tasks',
                tags: 'belongsToMany · tags',
              }}
              onValueChange={(value) => {
                if (!value) return;
                setRelation(value);
                setLab(undefined);
                setState(undefined);
                setCall(undefined);
                setError('');
                setSaved(false);
              }}
              disabled={busy || submission.pending}
            >
              <SelectTrigger id={`${formId}-relation`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(operation === 'set'
                  ? ['tasks', 'tags']
                  : ['profile', 'tasks', 'tags']
                ).map((name) => (
                  <SelectItem key={name} value={name}>
                    {name === 'profile'
                      ? 'hasOne'
                      : name === 'tasks'
                        ? 'hasMany'
                        : 'belongsToMany'}{' '}
                    · {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => void prepare()}
          >
            {t(lab ? 'labPrepareAgain' : 'labPrepare')}
          </Button>
          {lab && (
            <Button
              variant='outline'
              disabled={busy || submission.pending}
              onClick={() => void refresh()}
            >
              {t('labRefresh')}
            </Button>
          )}
        </div>
        {!lab && (
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {t('labPrepareHint')}
          </p>
        )}
        {lab && (
          <p className='break-all text-xs text-muted-foreground'>
            {t('labProject')}: <code>{lab.projectId}</code>
          </p>
        )}
        {busy && (
          <p
            role='status'
            className='text-xs leading-relaxed text-muted-foreground'
          >
            {t('loading')}
          </p>
        )}
        {error && (
          <p
            role='alert'
            className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs font-medium text-destructive'
          >
            {error}
          </p>
        )}
        {saved && (
          <p
            role='status'
            className='text-xs leading-relaxed text-muted-foreground'
          >
            {t('labSaved', { operation })}
          </p>
        )}
        {lab && (
          <form
            className='space-y-4 rounded-lg border bg-muted/20 p-4'
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset
              disabled={busy || submission.pending}
              className='grid gap-4 md:grid-cols-2'
            >
              {needsTarget && (
                <div className='space-y-2'>
                  <label htmlFor={`${formId}-target`}>{t('labTarget')}</label>
                  <Select
                    value={target}
                    items={options}
                    onValueChange={(value) => {
                      setTarget(value ?? '');
                      const row = targets.find(
                        (item) => item.id === value,
                      )?.record;
                      if (row && operation === 'update') {
                        setContent(
                          scalarText(
                            row.title ?? row.summary ?? row.label ?? '',
                          ),
                        );
                        setPoints(scalarText(row.points ?? 1));
                        setStatus(scalarText(row.status ?? 'draft'));
                      }
                    }}
                  >
                    <SelectTrigger id={`${formId}-target`} className='w-full'>
                      <SelectValue placeholder={t('labChoose')} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!options.length && (
                    <p className='text-xs leading-relaxed text-muted-foreground'>
                      {t('labNoEligible')}
                    </p>
                  )}
                </div>
              )}
              {operation === 'set' && (
                <fieldset className='space-y-2 md:col-span-2'>
                  <legend>{t('labSetTargets')}</legend>
                  {eligible.map((item) => (
                    <label key={item.id} className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={selected.includes(item.id)}
                        onChange={(event) =>
                          setSelected(
                            event.target.checked
                              ? [...selected, item.id]
                              : selected.filter((id) => id !== item.id),
                          )
                        }
                      />
                      {scalarText(
                        item.record?.title ?? item.record?.label ?? item.id,
                      )}
                    </label>
                  ))}
                  <p className='text-xs leading-relaxed text-muted-foreground'>
                    {t('labSetEmpty')}
                  </p>
                </fieldset>
              )}
              {edits && (
                <div className='space-y-2'>
                  <label htmlFor={`${formId}-content`}>{label}</label>
                  <Input
                    id={`${formId}-content`}
                    required
                    maxLength={
                      relation === 'profile'
                        ? 255
                        : relation === 'tags'
                          ? 120
                          : 160
                    }
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                  />
                </div>
              )}
              {edits && relation === 'tasks' && (
                <>
                  <div className='space-y-2'>
                    <label htmlFor={`${formId}-points`}>{t('labPoints')}</label>
                    <Input
                      id={`${formId}-points`}
                      type='number'
                      required
                      min={0}
                      step={1}
                      value={points}
                      onChange={(event) => setPoints(event.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label htmlFor={`${formId}-status`}>{t('status')}</label>
                    <Select
                      value={status}
                      onValueChange={(value) => {
                        if (value) setStatus(value);
                      }}
                    >
                      <SelectTrigger id={`${formId}-status`} className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['draft', 'open', 'done'].map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {relation === 'tags' &&
                ['create', 'connect', 'set'].includes(operation) && (
                  <div className='space-y-2'>
                    <label htmlFor={`${formId}-role`}>
                      {t('labThroughRole')}
                    </label>
                    <Input
                      id={`${formId}-role`}
                      maxLength={64}
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                    />
                  </div>
                )}
            </fieldset>
            {relation === 'profile' && (
              <p className='text-xs leading-relaxed text-muted-foreground'>
                {t(currentProfile ? 'labCurrentProfile' : 'labNoProfile')}
                {currentProfile ? `: ${currentProfile.summary}` : ''}
              </p>
            )}
            {operation === 'delete' && (
              <p className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs font-medium text-destructive'>
                {t('labDeleteHint')}
              </p>
            )}
            {operation === 'upsert' && (
              <p className='text-xs leading-relaxed text-muted-foreground'>
                {t('labUpsertHint')}
              </p>
            )}
            <Button
              type='submit'
              variant={operation === 'delete' ? 'destructive' : 'default'}
              disabled={busy || !valid}
            >
              {t('labExecute', { operation })}
            </Button>
            <details>
              <summary className='cursor-pointer text-xs font-medium text-foreground'>
                {t('labRequest')}
              </summary>
              <pre className='mt-2 max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs text-foreground'>
                {JSON.stringify(relationLabRequest(lab, input), null, 2)}
              </pre>
            </details>
          </form>
        )}
        {state && (
          <div className='space-y-2'>
            <h3 className='font-medium'>{t('labTargets')}</h3>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              {t('labTableHint')}
            </p>
            <Table aria-label={`${operation} — ${t('labTargets')}`}>
              <TableHeader className='bg-muted/30'>
                <TableRow>
                  <TableHead>{t('labRecord')}</TableHead>
                  <TableHead>{t('labLinked')}</TableHead>
                  <TableHead>{t('labExists')}</TableHead>
                  {relation === 'tasks' && (
                    <>
                      <TableHead>{t('labPoints')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                    </>
                  )}
                  {relation === 'tags' && <TableHead>through.role</TableHead>}
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.targets.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {scalarText(
                        item.record?.title ??
                          item.record?.summary ??
                          item.record?.label ??
                          t('labDeleted'),
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.linked ? 'default' : 'secondary'}>
                        {t(item.linked ? 'labYes' : 'labNo')}
                      </Badge>
                    </TableCell>
                    <TableCell>{t(item.exists ? 'labYes' : 'labNo')}</TableCell>
                    {relation === 'tasks' && (
                      <>
                        <TableCell>
                          {item.record?.points === undefined
                            ? '—'
                            : scalarText(item.record.points)}
                        </TableCell>
                        <TableCell>
                          {item.record?.status === undefined
                            ? '—'
                            : scalarText(item.record.status)}
                        </TableCell>
                      </>
                    )}
                    {relation === 'tags' && (
                      <TableCell>{item.role ?? '—'}</TableCell>
                    )}
                    <TableCell>
                      <code className='text-xs'>{item.id}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {call && (
          <details className='rounded-lg border bg-muted/15 p-3 text-xs'>
            <summary className='cursor-pointer text-xs font-medium text-foreground'>
              {t('labLastCall')}
            </summary>
            <pre className='mt-3 max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs text-foreground'>
              {JSON.stringify(call, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
export default function RelationMutationsPage(): ReactElement {
  const { t } = useTranslation(NS);
  return (
    <PageContainer>
      <PageHeader
        description={t('labIntro')}
        title={t('relationMutationsTitle')}
      />
      <nav aria-label={t('labOperations')} className='flex flex-wrap gap-2'>
        {relationOperations.map((operation) => (
          <a
            key={operation}
            href={`#relation-${operation}`}
            className='rounded-lg border bg-card px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            {operation}
          </a>
        ))}
      </nav>
      {relationOperations.map((operation) => (
        <OperationCard key={operation} operation={operation} />
      ))}
    </PageContainer>
  );
}
