import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import {
  Actions,
  Choice,
  Field,
  FilesField,
  History,
  PersonaSelect,
  Processing,
  ReadField,
  RowsTable,
  Section,
  StateBar,
  TextArea,
} from '../components/flow-ui.js';
import { NAMESPACE, names } from '../lib/format.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  api,
  errorMessage,
  list,
  type Config,
  type Plain,
  type ProcessingLevel,
  type RecordView,
  type TaskKind,
} from '../lib/api.js';
import { stateLabel, TASK_LIFECYCLE } from '../lib/labels.js';
import { cn } from '../lib/utils.js';
import { useLoader } from '../lib/use-loader.js';
import { text } from '../../shared/text.js';
import { pickEditable, TASK_FIELDS } from '../../shared/fields.js';

interface TaskDetail extends RecordView {
  readonly kind: TaskKind;
  readonly root: Plain | undefined;
  readonly rows: readonly Plain[];
  readonly processing: readonly ProcessingLevel[];
}

const KIND_LABEL: Record<TaskKind, string> = {
  clerk: '办事人员审批',
  team: '执行团队处理',
  executor: '执行人处理',
};

const DECISIONS = [
  { value: 'Y', label: '[Y] 已接收' },
  { value: 'B', label: '[B] 有异议与办公室联系' },
  { value: 'C', label: '[C] 已接收，待反馈' },
];

const YES_NO = [
  { value: true, label: '是' },
  { value: false, label: '否' },
] as const;

const OPEN_STATES = ['reviewing', 'processing'];

function TaskPanel({
  kind,
  id,
  actor,
  config,
  onOpen,
  onChanged,
}: {
  readonly kind: TaskKind;
  readonly id: string;
  readonly actor: string;
  readonly config: Config | undefined;
  readonly onOpen: (kind: TaskKind, id: string) => void;
  readonly onChanged: () => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = api(useApiClient());
  const [tick, setTick] = useState(0);
  const { data: view, error: loadError } = useLoader(
    () => client.get<TaskDetail>(`tasks/${kind}/${id}`, actor),
    `${kind}:${id}:${actor}:${tick}`,
  );
  const [draft, setDraft] = useState<Plain>({});
  const [decision, setDecision] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!view)
    return (
      <p className='text-sm text-muted-foreground'>
        {loadError || t('common.loading')}
      </p>
    );
  const lifecycle = TASK_LIFECYCLE[kind];
  const record = { ...view.record, ...draft };
  const assignee = list(view.record.assignees).includes(actor);
  const editable = assignee && OPEN_STATES.includes(text(view.record.status));
  const set = (key: string, value: unknown): void =>
    setDraft({ ...draft, [key]: value });
  const redHead =
    record.redHeadFeedback === null || record.redHeadFeedback === undefined
      ? null
      : Boolean(record.redHeadFeedback);

  async function act(work: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await work();
      setDraft({});
      setTick((value) => value + 1);
      onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const save = (): Promise<void> =>
    client.patch(`tasks/${kind}/${id}`, {
      actAs: actor,
      values: pickEditable(draft, TASK_FIELDS[kind]),
    });
  const fire = (transition: string, input: Plain = {}): Promise<void> =>
    act(async () => {
      if (Object.keys(draft).length) await save();
      await client.post(`tasks/${kind}/${id}/fire`, {
        actAs: actor,
        transition,
        input,
      });
    });

  return (
    <div className='space-y-6'>
      <Section
        title={`${text(view.record.number)} · ${KIND_LABEL[kind]} · ${text(view.record.departmentName)}`}
        actions={<Badge>{stateLabel(lifecycle, view.record.status)}</Badge>}
      >
        <StateBar lifecycle={lifecycle} view={view} />
        <div className='grid gap-3 sm:grid-cols-3'>
          <ReadField
            label='收文'
            value={`${text(view.root?.number ?? '')} ${text(view.root?.title ?? '')}`}
            wide
          />
          <ReadField
            label='分发类型'
            value={
              view.root?.distributionType === 'circulate' ? '传阅' : '呈阅处'
            }
          />
          <ReadField label='摘要' value={text(view.root?.summary ?? '')} wide />
          <ReadField label='办事人员' value={names(view.record.assignees)} />
          <ReadField
            label='抄送（部门主管及其他）'
            value={names(view.record.ccHeads)}
          />
          <ReadField
            label='抄送（分管领导）'
            value={names(view.record.ccLeaders)}
          />
        </div>

        {kind === 'clerk' && view.record.status === 'signing' ? (
          <div className='space-y-2 rounded-lg border p-3'>
            <div className='text-sm font-medium'>是否同意（办事人员会签）</div>
            <p className='text-xs text-muted-foreground'>
              已会签：{names(view.record.signedBy)}。[Y]、[B]
              直接结束；所有办事人员选 [C] 后进入办事人员审批。
            </p>
            <Choice
              options={DECISIONS}
              value={decision}
              disabled={!assignee}
              onChange={setDecision}
            />
            <Button
              size='sm'
              disabled={
                busy ||
                !decision ||
                !view.available.find((item) => item.name === 'sign')?.allowed
              }
              onClick={() => void fire('sign', { decision })}
            >
              提交会签
            </Button>
          </div>
        ) : null}

        {kind !== 'clerk' ||
        !['signing', 'accepted', 'objected'].includes(
          text(view.record.status),
        ) ? (
          <div className='grid gap-4 sm:grid-cols-2'>
            {kind !== 'executor' ? (
              <Field
                label={kind === 'clerk' ? '办事人员意见' : '执行团队意见'}
                required
                wide
              >
                <TextArea
                  label='意见'
                  disabled={!editable}
                  value={text(record.opinion ?? '')}
                  onChange={(value) => set('opinion', value)}
                />
              </Field>
            ) : null}
            <Field label='是否反馈红头文件' required>
              <Choice
                options={YES_NO}
                value={redHead}
                disabled={!editable}
                onChange={(value) => set('redHeadFeedback', value)}
              />
            </Field>
            {kind === 'clerk' ? (
              <Field label='对外发文文号' required={redHead === true}>
                <div className='flex gap-2'>
                  <Input
                    disabled={!editable}
                    value={text(record.outgoingRef ?? '')}
                    onChange={(event) => set('outgoingRef', event.target.value)}
                  />
                  <Button
                    size='sm'
                    variant='outline'
                    disabled
                    title='示例中不对接发文系统'
                  >
                    新建对外发文
                  </Button>
                </div>
              </Field>
            ) : null}
            <Field label='附件' wide>
              <FilesField
                label='附件'
                disabled={!editable}
                value={list(record.attachments)}
                onChange={(value) => set('attachments', value)}
              />
            </Field>
            <Field label='反馈信息' required wide>
              <TextArea
                label='反馈信息'
                disabled={!editable}
                value={text(record.feedback ?? '')}
                onChange={(value) => set('feedback', value)}
              />
            </Field>
          </div>
        ) : null}

        {error ? (
          <p role='alert' className='text-sm text-destructive'>
            {error}
          </p>
        ) : null}
        <div className='flex flex-wrap items-start gap-2'>
          {editable ? (
            <Button
              variant='outline'
              disabled={busy || !Object.keys(draft).length}
              onClick={() => void act(save)}
            >
              {t('common.save')}
            </Button>
          ) : null}
          <Actions
            available={view.available}
            busy={busy}
            hidden={[
              'sign',
              'dispatchTeams',
              'requestAssist',
              'dispatchExecutors',
            ]}
            onFire={(transition) => void fire(transition)}
          />
        </div>
      </Section>

      {kind !== 'executor' && (editable || view.rows.length) ? (
        <Section title={kind === 'clerk' ? '执行团队信息' : '执行人信息'}>
          {kind === 'clerk' ? (
            <p className='text-xs text-muted-foreground'>
              “是否派发其他部门协助”选是时，这一行不进执行团队信息，而是在收文主单下直接生成一张同级的办事人员子单，并在主单留痕。
            </p>
          ) : null}
          <RowsTable
            rows={view.rows}
            config={config}
            editable={editable}
            allowAssist={kind === 'clerk'}
            dispatchLabel={kind === 'clerk' ? '派发执行团队信息' : '派发执行人'}
            busy={busy}
            onAdd={(row) =>
              void act(() =>
                client.post(`tasks/${kind}/${id}/rows`, {
                  actAs: actor,
                  ...row,
                }),
              )
            }
            onRemove={(rowId) =>
              void act(() => client.remove(`rows/${rowId}`, actor))
            }
            onDispatch={() =>
              void fire(
                kind === 'clerk' ? 'dispatchTeams' : 'dispatchExecutors',
              )
            }
          />
        </Section>
      ) : null}

      <Section title='处理列表'>
        <Processing
          levels={view.processing}
          onOpen={(next, nextId) => onOpen(next as TaskKind, nextId)}
        />
      </Section>
      <Section title={t('common.history')}>
        <History lifecycle={lifecycle} view={view} />
      </Section>
    </div>
  );
}

export default function TasksPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = api(useApiClient());
  const [actor, setActor] = useState('gaoyan');
  const [open, setOpen] = useState<
    { kind: TaskKind; id: string } | undefined
  >();
  const [tick, setTick] = useState(0);
  const config = useLoader(() => client.get<Config>('config'), 'config');
  const tasks = useLoader(
    () => client.list('tasks', actor),
    `tasks:${actor}:${tick}`,
  );
  const notices = useLoader(
    () => client.list('notices', actor),
    `notices:${actor}:${tick}`,
  );
  return (
    <PageContainer>
      <PageHeader
        title={t('tasks.title')}
        description={t('tasks.description')}
        actions={
          <PersonaSelect
            value={actor}
            onChange={(id) => {
              setActor(id);
              setOpen(undefined);
            }}
          />
        }
      />
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'>
        <div className='min-w-0 space-y-6'>
          <Section title={t('tasks.mine')}>
            {(tasks.data ?? []).length ? (
              <ul className='space-y-1'>
                {(tasks.data ?? []).map((task) => {
                  const kind = task.kind as TaskKind;
                  const key = `${kind}:${text(task.id)}`;
                  return (
                    <li key={key}>
                      <button
                        type='button'
                        onClick={() => setOpen({ kind, id: text(task.id) })}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted',
                          open &&
                            `${open.kind}:${open.id}` === key &&
                            'bg-muted',
                        )}
                      >
                        <span className='min-w-0'>
                          <span className='block font-mono text-xs text-muted-foreground'>
                            {text(task.number)}
                          </span>
                          <span className='block truncate'>
                            {KIND_LABEL[kind]} · {text(task.departmentName)}
                          </span>
                        </span>
                        <Badge variant='secondary'>
                          {stateLabel(TASK_LIFECYCLE[kind], task.status)}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>{t('tasks.none')}</p>
            )}
          </Section>
          <Section title={t('tasks.notices')}>
            <p className='text-xs text-muted-foreground'>
              {t('tasks.noticesNote')}
            </p>
            {(notices.data ?? []).length ? (
              <ul className='space-y-2'>
                {(notices.data ?? []).map((notice) => (
                  <li
                    key={text(notice.id)}
                    className='rounded-md border px-3 py-2 text-sm'
                  >
                    <p>{text(notice.message)}</p>
                    <p className='text-xs text-muted-foreground'>
                      {text(notice.level).startsWith('objection')
                        ? '异议提醒'
                        : `第 ${text(notice.level)} 层`}{' '}
                      ·{' '}
                      {new Date(text(notice.createdAt)).toLocaleString(
                        'zh-CN',
                        { hour12: false },
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('tasks.noNotices')}
              </p>
            )}
          </Section>
        </div>
        <div className='min-w-0'>
          {open ? (
            <TaskPanel
              key={`${open.kind}:${open.id}`}
              kind={open.kind}
              id={open.id}
              actor={actor}
              config={config.data}
              onOpen={(kind, id) => setOpen({ kind, id })}
              onChanged={() => setTick((value) => value + 1)}
            />
          ) : (
            <p className='rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground'>
              {t('tasks.pick')}
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
