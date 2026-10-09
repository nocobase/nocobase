import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import { INCOMING_ROLES, PEOPLE, personName } from '../../shared/people.js';
import { pickEditable, INCOMING_FIELDS } from '../../shared/fields.js';
import {
  Actions,
  Choice,
  Field,
  FilesField,
  History,
  MultiChoice,
  PersonaSelect,
  Processing,
  ReadField,
  RecordList,
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
} from '../lib/api.js';
import { stateLabel } from '../lib/labels.js';
import { useLoader } from '../lib/use-loader.js';
import { text } from '../../shared/text.js';

interface IncomingDetail extends RecordView {
  readonly rows: readonly Plain[];
  readonly management: readonly Plain[];
  readonly processing: readonly ProcessingLevel[];
}

const DISTRIBUTION = [
  { value: 'review', label: '呈阅处' },
  { value: 'circulate', label: '传阅' },
];

const TEXT_FIELDS: readonly (readonly [string, string])[] = [
  ['code', '收文编码'],
  ['sender', '来文单位'],
  ['senderRef', '来文文号'],
];

function IncomingEditor({
  values,
  onChange,
}: {
  readonly values: Plain;
  readonly onChange: (values: Plain) => void;
}): ReactElement {
  const field = (key: string): string => text(values[key]);
  const set = (key: string, value: unknown): void =>
    onChange({ ...values, [key]: value });
  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      <div className='sm:col-span-3'>
        <Field label='标题' required>
          <Input
            value={field('title')}
            onChange={(event) => set('title', event.target.value)}
          />
        </Field>
      </div>
      {TEXT_FIELDS.map(([key, label]) => (
        <Field key={key} label={label} required>
          <Input
            value={field(key)}
            onChange={(event) => set(key, event.target.value)}
          />
        </Field>
      ))}
      <div className='sm:col-span-3'>
        <Field label='摘要' required>
          <TextArea
            label='摘要'
            value={field('summary')}
            onChange={(value) => set('summary', value)}
          />
        </Field>
      </div>
      <div className='sm:col-span-3'>
        <Field label='办公室意见' required>
          <TextArea
            label='办公室意见'
            value={field('officeOpinion')}
            onChange={(value) => set('officeOpinion', value)}
          />
        </Field>
      </div>
      <div className='sm:col-span-3'>
        <Field label='来文'>
          <FilesField
            label='来文'
            value={list(values.attachments)}
            onChange={(value) => set('attachments', value)}
          />
        </Field>
      </div>
      <Field label='分发类型' required>
        <Choice
          options={DISTRIBUTION}
          value={field('distributionType')}
          onChange={(value) => set('distributionType', value)}
        />
      </Field>
      <ReadField
        label='办公室部门主管'
        value={personName(field('officeHeadId') || INCOMING_ROLES.officeHead)}
      />
      <ReadField
        label='办公室分管领导'
        value={personName(
          field('officeLeaderId') || INCOMING_ROLES.officeLeader,
        )}
      />
    </div>
  );
}

function IncomingSummary({ record }: { readonly record: Plain }): ReactElement {
  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      <ReadField label='标题' value={text(record.title)} wide />
      {TEXT_FIELDS.map(([key, label]) => (
        <ReadField key={key} label={label} value={text(record[key] ?? '')} />
      ))}
      <ReadField label='摘要' value={text(record.summary ?? '')} wide />
      <ReadField
        label='办公室意见'
        value={text(record.officeOpinion ?? '')}
        wide
      />
      <ReadField label='来文' value={list(record.attachments).join('、')} />
      <ReadField
        label='分发类型'
        value={
          DISTRIBUTION.find((item) => item.value === record.distributionType)
            ?.label ?? ''
        }
      />
      <ReadField
        label='办公室部门主管 / 分管领导'
        value={`${personName(text(record.officeHeadId))} / ${personName(text(record.officeLeaderId))}`}
      />
    </div>
  );
}

/** 公司管理层信息: rows from configuration, or a group typed in with people picked. */
function Management({
  detail,
  config,
  editable,
  busy,
  onAdd,
  onRemove,
  onForward,
}: {
  readonly detail: IncomingDetail;
  readonly config: Config | undefined;
  readonly editable: boolean;
  readonly busy: boolean;
  readonly onAdd: (row: Plain) => void;
  readonly onRemove: (rowId: string) => void;
  readonly onForward: () => void;
}): ReactElement {
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const pending = detail.management.filter((row) => !row.forwarded).length;
  const options = PEOPLE.filter(
    (person) =>
      person.title.includes('管理层') || person.title.includes('领导'),
  );
  return (
    <div className='space-y-3'>
      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-xs text-muted-foreground'>
            <tr>
              <th className='px-3 py-2 font-medium'>群组</th>
              <th className='px-3 py-2 font-medium'>抄送人员</th>
              <th className='px-3 py-2 font-medium'>是否转发</th>
              <th className='px-3 py-2' />
            </tr>
          </thead>
          <tbody>
            {detail.management.length ? (
              detail.management.map((row) => (
                <tr key={text(row.id)} className='border-t'>
                  <td className='px-3 py-2'>
                    {text(row.groupName)}
                    {row.fromConfig ? null : (
                      <span className='ml-1 text-xs text-muted-foreground'>
                        （自行添加）
                      </span>
                    )}
                  </td>
                  <td className='px-3 py-2'>{names(row.members)}</td>
                  <td className='px-3 py-2'>
                    <Badge variant={row.forwarded ? 'default' : 'outline'}>
                      {row.forwarded ? '是' : '否'}
                    </Badge>
                  </td>
                  <td className='px-3 py-2 text-right'>
                    {editable && !row.forwarded ? (
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => onRemove(text(row.id))}
                      >
                        删除
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className='px-3 py-4 text-center text-muted-foreground'
                >
                  暂无群组
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editable ? (
        <div className='space-y-3 rounded-lg border border-dashed p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm text-muted-foreground'>从配置选择：</span>
            {(config?.managementGroups ?? []).map((group) => (
              <Button
                key={group.id}
                size='sm'
                variant='outline'
                disabled={busy}
                onClick={() => onAdd({ groupId: group.id })}
              >
                {group.name}（{names(group.members)}）
              </Button>
            ))}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              className='w-40'
              aria-label='群组'
              placeholder='自行添加：群组'
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
            <MultiChoice
              options={options.map((person) => person.name)}
              values={members.map(personName)}
              onChange={(picked) =>
                setMembers(
                  options
                    .filter((person) => picked.includes(person.name))
                    .map((person) => person.id),
                )
              }
            />
            <Button
              size='sm'
              variant='secondary'
              disabled={busy || !groupName.trim() || !members.length}
              onClick={() => {
                onAdd({ groupName, members });
                setGroupName('');
                setMembers([]);
              }}
            >
              添加行
            </Button>
            <Button size='sm' disabled={busy || !pending} onClick={onForward}>
              转发管理人员（{pending}）
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function IncomingPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = api(useApiClient());
  const [actor, setActor] = useState(INCOMING_ROLES.registrar);
  const [selected, setSelected] = useState<string | undefined>();
  const [values, setValues] = useState<Plain | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const config = useLoader(() => client.get<Config>('config'), 'config');
  const records = useLoader(() => client.list('incoming'), `list:${tick}`);
  const detailId = selected && selected !== 'new' ? selected : undefined;
  const detail = useLoader(
    detailId
      ? () => client.get<IncomingDetail>(`incoming/${detailId}`, actor)
      : undefined,
    `${detailId}:${actor}:${tick}`,
  );
  const view = detail.data;
  const editing =
    selected === 'new' ||
    (view?.record.status === 'draft' && view.record.registrarId === actor);
  const current =
    values ?? (selected === 'new' ? { distributionType: '' } : view?.record);
  const dispatcher =
    view?.record.status === 'dispatching' && view.record.registrarId === actor;

  function pick(id: string): void {
    setSelected(id);
    setValues(undefined);
    setError('');
  }

  async function act(work: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await work();
      setValues(undefined);
      setTick((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function save(): Promise<string> {
    if (selected === 'new') {
      const created = await client.post<Plain>('incoming', {
        actAs: actor,
        values: pickEditable(current ?? {}, INCOMING_FIELDS),
      });
      setSelected(text(created.id));
      return text(created.id);
    }
    await client.patch(`incoming/${text(selected)}`, {
      actAs: actor,
      values: pickEditable(current ?? {}, INCOMING_FIELDS),
    });
    return text(selected);
  }

  const fire = (transition: string, input: Plain = {}): Promise<void> =>
    act(() =>
      client.post(`incoming/${detailId}/fire`, {
        actAs: actor,
        transition,
        input,
      }),
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('incoming.title')}
        description={t('incoming.description')}
        actions={<PersonaSelect value={actor} onChange={setActor} />}
      />
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'>
        <Section
          title={t('incoming.list')}
          actions={
            actor === INCOMING_ROLES.registrar ? (
              <Button size='sm' onClick={() => pick('new')}>
                {t('incoming.create')}
              </Button>
            ) : null
          }
        >
          <RecordList
            records={records.data ?? []}
            lifecycle='incoming'
            selected={selected}
            summarize={(record) => text(record.title || '（未填写标题）')}
            onSelect={pick}
            empty={t('common.empty')}
          />
        </Section>
        <div className='min-w-0 space-y-6'>
          {!selected ? (
            <p className='rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground'>
              {t('common.pick')}
            </p>
          ) : (
            <>
              <Section
                title={
                  selected === 'new'
                    ? t('incoming.create')
                    : `${text(view?.record.number ?? '')} · ${text(view?.record.title ?? '')}`
                }
                actions={
                  view ? (
                    <Badge>{stateLabel('incoming', view.record.status)}</Badge>
                  ) : null
                }
              >
                {view ? <StateBar lifecycle='incoming' view={view} /> : null}
                {view?.record.returnReason && view.record.status === 'draft' ? (
                  <p className='text-sm text-destructive'>
                    退回原因：{text(view.record.returnReason)}
                  </p>
                ) : null}
                {current && editing ? (
                  <IncomingEditor values={current} onChange={setValues} />
                ) : current ? (
                  <IncomingSummary record={current} />
                ) : null}
                {error || detail.error ? (
                  <p role='alert' className='text-sm text-destructive'>
                    {error || detail.error}
                  </p>
                ) : null}
                <div className='flex flex-wrap items-start gap-2'>
                  {editing ? (
                    <>
                      <Button
                        variant='outline'
                        disabled={busy}
                        onClick={() =>
                          void act(async () => void (await save()))
                        }
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            const id = await save();
                            await client.post(`incoming/${id}/fire`, {
                              actAs: actor,
                              transition: 'submit',
                              input: {},
                            });
                          })
                        }
                      >
                        {t('incoming.submit')}
                      </Button>
                    </>
                  ) : null}
                  {view ? (
                    <Actions
                      available={view.available}
                      busy={busy}
                      hidden={['submit', 'dispatchClerks', 'forwardManagement']}
                      needsReason={['returnToRegistrar']}
                      onFire={(transition, input) =>
                        void fire(transition, input)
                      }
                    />
                  ) : null}
                </div>
              </Section>
              {view &&
              ['dispatching', 'closed'].includes(text(view.record.status)) ? (
                <>
                  <Section title='办事人员信息'>
                    <p className='text-xs text-muted-foreground'>
                      选部门后勾选要带入的人员，按部门配置带出。派发时同一抄送人只收到一次提醒，重新审批分派后再派发也不会重复提醒。
                    </p>
                    <RowsTable
                      rows={view.rows}
                      config={config.data}
                      editable={Boolean(dispatcher)}
                      dispatchLabel='派发办事人员'
                      busy={busy}
                      onAdd={(row) =>
                        void act(() =>
                          client.post(`incoming/${detailId}/rows`, {
                            actAs: actor,
                            ...row,
                          }),
                        )
                      }
                      onRemove={(rowId) =>
                        void act(() => client.remove(`rows/${rowId}`, actor))
                      }
                      onDispatch={() => void fire('dispatchClerks')}
                    />
                  </Section>
                  <Section title='公司管理层信息'>
                    <Management
                      detail={view}
                      config={config.data}
                      editable={Boolean(dispatcher)}
                      busy={busy}
                      onAdd={(row) =>
                        void act(() =>
                          client.post(`incoming/${detailId}/managementRows`, {
                            actAs: actor,
                            ...row,
                          }),
                        )
                      }
                      onRemove={(rowId) =>
                        void act(() =>
                          client.remove(`managementRows/${rowId}`, actor),
                        )
                      }
                      onForward={() => void fire('forwardManagement')}
                    />
                  </Section>
                  <Section title='处理列表'>
                    <Processing levels={view.processing} />
                  </Section>
                </>
              ) : null}
              {view ? (
                <Section title={t('common.history')}>
                  <p className='text-xs text-muted-foreground'>
                    主单留痕包括各办事人员子单的二次派发（执行团队、其他部门协助）；子子单的反馈只留在子单。
                  </p>
                  <History lifecycle='incoming' view={view} />
                </Section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
