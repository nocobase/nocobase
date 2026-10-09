import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import {
  consumerOptions,
  emptyDataRequest,
  FREQUENCIES,
  SCOPES,
  validateDataRequest,
  visibility,
  VOLUMES,
  WEEKDAYS,
  type DataRequestForm,
} from '../../shared/data-request.js';
import { pickEditable, EXTRACTION_FIELDS } from '../../shared/fields.js';
import { DATA_REQUEST_ROLES, personName } from '../../shared/people.js';
import {
  Actions,
  Choice,
  Field,
  FilesField,
  History,
  MultiChoice,
  PersonaSelect,
  ReadField,
  RecordList,
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
  type Plain,
  type RecordView,
} from '../lib/api.js';
import { stateLabel } from '../lib/labels.js';
import { useLoader } from '../lib/use-loader.js';
import { text } from '../../shared/text.js';

interface RequestDetail extends RecordView {
  readonly form: DataRequestForm;
  readonly extractions: readonly Plain[];
  readonly schedule: {
    readonly due: readonly string[];
    readonly shifted: readonly { readonly date: string; readonly to: string }[];
  };
}

const YES_NO = [
  { value: true, label: '是' },
  { value: false, label: '否' },
] as const;

function label<T>(
  options: readonly { value: T; label: string }[],
  value: unknown,
): string {
  return options.find((item) => item.value === value)?.label ?? '—';
}

/** The applicant's form; hidden questions appear as the choices ask for them. */
function RequestEditor({
  form,
  onChange,
  errors,
}: {
  readonly form: DataRequestForm;
  readonly onChange: (form: DataRequestForm) => void;
  readonly errors: Record<string, string>;
}): ReactElement {
  const shown = visibility(form);
  const set = <K extends keyof DataRequestForm>(
    key: K,
    value: DataRequestForm[K],
  ): void => onChange({ ...form, [key]: value });
  const number = (value: string): number | null =>
    value === '' ? null : Number(value);
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <Field label='主题' required error={errors.subject} wide>
        <Input
          value={form.subject}
          onChange={(event) => set('subject', event.target.value)}
        />
      </Field>
      <Field label='原因' required error={errors.reason} wide>
        <TextArea
          label='原因'
          value={form.reason}
          onChange={(value) => set('reason', value)}
        />
      </Field>
      <Field label='预估数据量（记录条数）' required error={errors.volume} wide>
        <Choice
          options={VOLUMES.map((value) => ({ value, label: value }))}
          value={form.volume}
          onChange={(value) => set('volume', value)}
        />
      </Field>
      <Field label='数据使用频次' required error={errors.frequency} wide>
        <Choice
          options={FREQUENCIES}
          value={form.frequency}
          onChange={(value) => set('frequency', value)}
        />
      </Field>
      {shown.deliveryDate ? (
        <Field label='数据交付日期' required error={errors.deliveryDate}>
          <Input
            type='date'
            value={form.deliveryDate}
            onChange={(event) => set('deliveryDate', event.target.value)}
          />
        </Field>
      ) : null}
      {shown.periodDates ? (
        <>
          <Field label='数据首次使用日期' required error={errors.firstUseDate}>
            <Input
              type='date'
              value={form.firstUseDate}
              onChange={(event) => set('firstUseDate', event.target.value)}
            />
          </Field>
          <Field
            label='最后一次交付日期'
            required
            error={errors.lastDeliveryDate}
          >
            <Input
              type='date'
              value={form.lastDeliveryDate}
              onChange={(event) => set('lastDeliveryDate', event.target.value)}
            />
          </Field>
        </>
      ) : null}
      {shown.quarterDay ? (
        <Field label='每季度的第几天' required error={errors.quarterDay}>
          <Input
            type='number'
            min={1}
            max={92}
            value={form.quarterDay ?? ''}
            onChange={(event) => set('quarterDay', number(event.target.value))}
          />
        </Field>
      ) : null}
      {shown.monthDay ? (
        <Field label='每月几号' required error={errors.monthDay}>
          <Input
            type='number'
            min={1}
            max={31}
            value={form.monthDay ?? ''}
            onChange={(event) => set('monthDay', number(event.target.value))}
          />
        </Field>
      ) : null}
      {shown.weekDay ? (
        <Field label='每周周几' required error={errors.weekDay} wide>
          <Choice
            options={WEEKDAYS.map((name, index) => ({
              value: index + 1,
              label: name,
            }))}
            value={form.weekDay}
            onChange={(value) => set('weekDay', value)}
          />
        </Field>
      ) : null}
      {shown.frequencyNote ? (
        <Field label='其他频次描述' required error={errors.frequencyNote} wide>
          <Input
            value={form.frequencyNote}
            onChange={(event) => set('frequencyNote', event.target.value)}
          />
        </Field>
      ) : null}
      <Field label='数据使用范围' required error={errors.scope} wide>
        <Choice
          options={SCOPES}
          value={form.scope}
          // Changing the scope changes the consumer types it offers.
          onChange={(value) =>
            onChange({ ...form, scope: value, consumers: [] })
          }
        />
      </Field>
      <Field label='使用方类型（多选）' required error={errors.consumers} wide>
        {form.scope ? (
          <MultiChoice
            options={consumerOptions(form.scope)}
            values={form.consumers}
            onChange={(value) => set('consumers', value)}
          />
        ) : (
          <p className='text-sm text-muted-foreground'>请先选择数据使用范围</p>
        )}
      </Field>
      {shown.fileShield ? (
        <fieldset className='grid gap-4 rounded-lg border p-3 sm:col-span-2 sm:grid-cols-2'>
          <legend className='px-1 text-sm font-medium'>
            文件盾权限需求（内部员工）
          </legend>
          <Field
            label='申请人是否接受使用文件盾'
            required
            error={errors.fileShieldAccepted}
          >
            <Choice
              options={YES_NO}
              value={form.fileShieldAccepted}
              onChange={(value) => set('fileShieldAccepted', value)}
            />
          </Field>
          <Field label='复制权限' required error={errors.fileShieldCopy}>
            <Choice
              options={YES_NO}
              value={form.fileShieldCopy}
              onChange={(value) => set('fileShieldCopy', value)}
            />
          </Field>
          <Field label='授权人员范围' required error={errors.fileShieldScope}>
            <Input
              value={form.fileShieldScope}
              onChange={(event) => set('fileShieldScope', event.target.value)}
            />
          </Field>
          <Field
            label='数据有效截至日期'
            required
            error={errors.fileShieldValidUntil}
          >
            <Input
              type='date'
              value={form.fileShieldValidUntil}
              onChange={(event) =>
                set('fileShieldValidUntil', event.target.value)
              }
            />
          </Field>
        </fieldset>
      ) : null}
      {shown.thirdParty ? (
        <fieldset className='grid gap-4 rounded-lg border p-3 sm:col-span-2 sm:grid-cols-2'>
          <legend className='px-1 text-sm font-medium'>第三方</legend>
          <Field
            label='第三方保密协议（保密框架协议或合同中的保密条款扫描件）'
            required
            error={errors.ndaFiles}
          >
            <FilesField
              label='第三方保密协议'
              value={form.ndaFiles}
              onChange={(value) => set('ndaFiles', value)}
            />
          </Field>
          <Field label='第三方安全评估（按评估模板附上安全评估结果）'>
            <FilesField
              label='第三方安全评估'
              value={form.securityFiles}
              onChange={(value) => set('securityFiles', value)}
            />
          </Field>
        </fieldset>
      ) : null}
    </div>
  );
}

function RequestSummary({
  form,
}: {
  readonly form: DataRequestForm;
}): ReactElement {
  const shown = visibility(form);
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      <ReadField label='主题' value={form.subject} wide />
      <ReadField label='原因' value={form.reason} wide />
      <ReadField label='预估数据量' value={form.volume} />
      <ReadField
        label='数据使用频次'
        value={label(FREQUENCIES, form.frequency)}
      />
      {shown.deliveryDate ? (
        <ReadField label='数据交付日期' value={form.deliveryDate} />
      ) : null}
      {shown.periodDates ? (
        <ReadField
          label='首次使用 / 最后一次交付'
          value={`${form.firstUseDate} 至 ${form.lastDeliveryDate}`}
        />
      ) : null}
      {shown.quarterDay ? (
        <ReadField label='每季度第几天' value={text(form.quarterDay)} />
      ) : null}
      {shown.monthDay ? (
        <ReadField label='每月几号' value={text(form.monthDay)} />
      ) : null}
      {shown.weekDay ? (
        <ReadField label='每周周几' value={WEEKDAYS[(form.weekDay ?? 1) - 1]} />
      ) : null}
      {shown.frequencyNote ? (
        <ReadField label='其他频次描述' value={form.frequencyNote} />
      ) : null}
      <ReadField label='数据使用范围' value={label(SCOPES, form.scope)} />
      <ReadField label='使用方类型' value={form.consumers.join('、')} />
      {shown.fileShield ? (
        <ReadField
          label='文件盾权限需求'
          wide
          value={`接受文件盾：${label(YES_NO, form.fileShieldAccepted)}；授权人员范围：${form.fileShieldScope}；复制权限：${label(YES_NO, form.fileShieldCopy)}；有效截至：${form.fileShieldValidUntil}`}
        />
      ) : null}
      {shown.thirdParty ? (
        <ReadField
          label='第三方保密协议 / 安全评估'
          wide
          value={`${form.ndaFiles.join('、') || '—'} / ${form.securityFiles.join('、') || '—'}`}
        />
      ) : null}
    </div>
  );
}

const CATEGORY = ['一次性清单数据抽取', '一次性分析数据整理'].map((value) => ({
  value,
  label: value,
}));
const COMPLEXITY = ['简单', '复杂'].map((value) => ({ value, label: value }));

/** 抽数子流程: the processing fields, then submit or void. */
function ExtractionPanel({
  id,
  actor,
  onChanged,
}: {
  readonly id: string;
  readonly actor: string;
  readonly onChanged: () => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = api(useApiClient());
  const { data: view, reload } = useLoader(
    () => client.get<RecordView>(`extractions/${id}`, actor),
    `${id}:${actor}`,
  );
  const [draft, setDraft] = useState<Plain>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!view)
    return (
      <p className='text-sm text-muted-foreground'>{t('common.loading')}</p>
    );
  const record = { ...view.record, ...draft };
  const editable =
    view.record.status === 'pending' &&
    (list(view.record.executorIds).includes(actor) ||
      actor === DATA_REQUEST_ROLES.acceptor);
  const set = (key: string, value: unknown): void =>
    setDraft({ ...draft, [key]: value });
  const field = (key: string): string => text(record[key]);

  async function act(work: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await work();
      setDraft({});
      await reload();
      onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      title={`${text(view.record.number)} · ${text(view.record.topic)}`}
      actions={<Badge>{stateLabel('extractions', view.record.status)}</Badge>}
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <ReadField label='抽数日期' value={text(view.record.scheduledDate)} />
        <ReadField
          label='抽数执行人员'
          value={names(view.record.executorIds)}
        />
        <ReadField
          label='抽数任务建议或要求'
          value={text(view.record.requirement ?? '')}
          wide
        />
        <Field label='数据实施分类' required>
          <Choice
            options={CATEGORY}
            value={field('category')}
            disabled={!editable}
            onChange={(value) => set('category', value)}
          />
        </Field>
        <Field label='取数逻辑复杂程度' required>
          <Choice
            options={COMPLEXITY}
            value={field('complexity')}
            disabled={!editable}
            onChange={(value) => set('complexity', value)}
          />
        </Field>
        <Field label='与用户协商一致的数据交付时间' required>
          <Input
            type='date'
            disabled={!editable}
            value={field('agreedDeliveryAt')}
            onChange={(event) => set('agreedDeliveryAt', event.target.value)}
          />
        </Field>
        <Field label='数据所属系统' required>
          <Input
            disabled={!editable}
            value={field('sourceSystem')}
            onChange={(event) => set('sourceSystem', event.target.value)}
          />
        </Field>
        <Field label='是否需要下载数据' required>
          <Choice
            options={YES_NO}
            value={
              record.needsDownload === null ||
              record.needsDownload === undefined
                ? null
                : Boolean(record.needsDownload)
            }
            disabled={!editable}
            onChange={(value) => set('needsDownload', value)}
          />
        </Field>
        <Field label='反馈附件'>
          <FilesField
            label='反馈附件'
            disabled={!editable}
            value={list(record.feedbackFiles)}
            onChange={(value) => set('feedbackFiles', value)}
          />
        </Field>
        <Field label='反馈说明' required wide>
          <TextArea
            label='反馈说明'
            disabled={!editable}
            value={field('feedbackNote')}
            onChange={(value) => set('feedbackNote', value)}
          />
        </Field>
        <Field label='开发人员复核'>
          <Input
            disabled={!editable}
            value={field('reviewerId')}
            onChange={(event) => set('reviewerId', event.target.value)}
          />
        </Field>
        <Field label='抽数一级主管' required>
          <Input
            disabled={!editable}
            value={field('managerId')}
            onChange={(event) => set('managerId', event.target.value)}
          />
        </Field>
        <Field label='业务部门确认逻辑' required>
          <Input
            disabled={!editable}
            value={field('confirmerId')}
            onChange={(event) => set('confirmerId', event.target.value)}
          />
        </Field>
        {view.record.voidReason ? (
          <ReadField label='作废原因' value={text(view.record.voidReason)} />
        ) : null}
      </div>
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
            onClick={() =>
              void act(() =>
                client.patch(`extractions/${id}`, {
                  actAs: actor,
                  values: pickEditable(draft, EXTRACTION_FIELDS),
                }),
              )
            }
          >
            {t('common.save')}
          </Button>
        ) : null}
        <Actions
          available={view.available}
          busy={busy}
          needsReason={['void']}
          onFire={(transition, input) =>
            void act(async () => {
              if (Object.keys(draft).length)
                await client.patch(`extractions/${id}`, {
                  actAs: actor,
                  values: pickEditable(draft, EXTRACTION_FIELDS),
                });
              await client.post(`extractions/${id}/fire`, {
                actAs: actor,
                transition,
                input,
              });
            })
          }
        />
      </div>
      <History lifecycle='extractions' view={view} />
    </Section>
  );
}

/** 创建抽数子流程 / 已作废抽数执行数据, the schedule and a manual task. */
function Extractions({
  detail,
  actor,
  onChanged,
}: {
  readonly detail: RequestDetail;
  readonly actor: string;
  readonly onChanged: () => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = api(useApiClient());
  const [tab, setTab] = useState<'active' | 'voided'>('active');
  const [open, setOpen] = useState<string | undefined>();
  const [manual, setManual] = useState({
    topic: '',
    scheduledDate: '',
    requirement: '',
  });
  const [error, setError] = useState('');
  const canCreate =
    detail.record.status === 'accepting' &&
    actor === DATA_REQUEST_ROLES.acceptor;
  const shown = detail.extractions.filter((task) =>
    tab === 'voided' ? task.status === 'voided' : task.status !== 'voided',
  );
  return (
    <Section title='抽数子流程'>
      <div className='space-y-1 text-sm'>
        <p>
          <span className='text-muted-foreground'>抽数日程：</span>
          {detail.schedule.due.length
            ? detail.schedule.due.join('、')
            : '无自动日程（其他固定频次请手动创建）'}
        </p>
        {detail.schedule.shifted.length ? (
          <p className='text-xs text-muted-foreground'>
            遇周末或法定节假日顺延：
            {detail.schedule.shifted
              .map((item) => `${item.date} → ${item.to}`)
              .join('；')}
          </p>
        ) : null}
      </div>
      <div className='flex flex-wrap gap-1.5' role='tablist'>
        <Button
          size='sm'
          role='tab'
          aria-selected={tab === 'active'}
          variant={tab === 'active' ? 'default' : 'outline'}
          onClick={() => setTab('active')}
        >
          创建抽数子流程
        </Button>
        <Button
          size='sm'
          role='tab'
          aria-selected={tab === 'voided'}
          variant={tab === 'voided' ? 'default' : 'outline'}
          onClick={() => setTab('voided')}
        >
          已作废抽数执行数据
        </Button>
      </div>
      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-xs text-muted-foreground'>
            <tr>
              <th className='px-3 py-2 font-medium'>抽数任务主题</th>
              <th className='px-3 py-2 font-medium'>抽数日期</th>
              <th className='px-3 py-2 font-medium'>来源</th>
              <th className='px-3 py-2 font-medium'>抽数执行人</th>
              <th className='px-3 py-2 font-medium'>流程环节</th>
            </tr>
          </thead>
          <tbody>
            {shown.length ? (
              shown.map((task) => (
                <tr key={text(task.id)} className='border-t'>
                  <td className='px-3 py-2'>
                    <button
                      type='button'
                      className='text-primary hover:underline'
                      onClick={() => setOpen(text(task.id))}
                    >
                      {text(task.topic)}
                    </button>
                  </td>
                  <td className='px-3 py-2'>{text(task.scheduledDate)}</td>
                  <td className='px-3 py-2'>
                    {
                      { scheduled: '定期', once: '一次性', manual: '手动' }[
                        text(task.origin)
                      ]
                    }
                  </td>
                  <td className='px-3 py-2'>{names(task.executorIds)}</td>
                  <td className='px-3 py-2'>
                    {stateLabel('extractions', task.status)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className='px-3 py-4 text-center text-muted-foreground'
                >
                  暂无任务数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {canCreate && tab === 'active' ? (
        <div className='grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-3'>
          <Input
            placeholder='抽数任务主题'
            aria-label='抽数任务主题'
            value={manual.topic}
            onChange={(event) =>
              setManual({ ...manual, topic: event.target.value })
            }
          />
          <Input
            type='date'
            aria-label='首抽时间'
            value={manual.scheduledDate}
            onChange={(event) =>
              setManual({ ...manual, scheduledDate: event.target.value })
            }
          />
          <Input
            placeholder='抽数任务建议或要求'
            aria-label='抽数任务建议或要求'
            value={manual.requirement}
            onChange={(event) =>
              setManual({ ...manual, requirement: event.target.value })
            }
          />
          <div className='flex items-center gap-2 sm:col-span-3'>
            <Button
              size='sm'
              onClick={() =>
                void client
                  .post(`dataRequests/${text(detail.record.id)}/extractions`, {
                    actAs: actor,
                    ...manual,
                    executorIds: [],
                  })
                  .then(() => {
                    setManual({
                      topic: '',
                      scheduledDate: '',
                      requirement: '',
                    });
                    setError('');
                    onChanged();
                  })
                  .catch((cause: unknown) => setError(errorMessage(cause)))
              }
            >
              {t('extractions.create')}
            </Button>
            {error ? (
              <span className='text-sm text-destructive'>{error}</span>
            ) : null}
          </div>
        </div>
      ) : null}
      {open ? (
        <ExtractionPanel id={open} actor={actor} onChanged={onChanged} />
      ) : null}
    </Section>
  );
}

export default function DataRequestsPage(): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const client = api(useApiClient());
  const [actor, setActor] = useState(DATA_REQUEST_ROLES.applicant);
  const [selected, setSelected] = useState<string | undefined>();
  const [form, setForm] = useState<DataRequestForm | undefined>();
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const records = useLoader(() => client.list('dataRequests'), `list:${tick}`);
  const detailId = selected && selected !== 'new' ? selected : undefined;
  const detail = useLoader(
    detailId
      ? () => client.get<RequestDetail>(`dataRequests/${detailId}`, actor)
      : undefined,
    `${detailId}:${actor}:${tick}`,
  );
  const view = detail.data;
  const editing =
    selected === 'new' ||
    (view?.record.status === 'draft' && view.record.applicantId === actor);
  const current =
    form ?? (selected === 'new' ? emptyDataRequest() : view?.form);
  const errors = showErrors && current ? validateDataRequest(current) : {};

  function pick(id: string): void {
    setSelected(id);
    setForm(undefined);
    setShowErrors(false);
    setError('');
  }

  async function act(work: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await work();
      setForm(undefined);
      setTick((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  /** Saves the form, creating the request first when it is new; returns its id. */
  async function save(): Promise<string> {
    if (!current) throw new Error('nothing to save');
    if (selected === 'new') {
      const created = await client.post<Plain>('dataRequests', {
        actAs: actor,
        form: { ...current },
      });
      setSelected(text(created.id));
      return text(created.id);
    }
    await client.patch(`dataRequests/${text(selected)}`, {
      actAs: actor,
      form: { ...current },
    });
    return text(selected);
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('dataRequests.title')}
        description={t('dataRequests.description')}
        actions={<PersonaSelect value={actor} onChange={setActor} />}
      />
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'>
        <Section
          title={t('dataRequests.list')}
          actions={
            actor === DATA_REQUEST_ROLES.applicant ? (
              <Button size='sm' onClick={() => pick('new')}>
                {t('dataRequests.create')}
              </Button>
            ) : null
          }
        >
          <RecordList
            records={records.data ?? []}
            lifecycle='dataRequests'
            selected={selected}
            summarize={(record) =>
              `${text(record.subject)} · ${personName(text(record.approverId ?? record.applicantId))}`
            }
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
                    ? t('dataRequests.create')
                    : `${text(view?.record.number ?? '')} · ${text(view?.record.subject ?? '')}`
                }
                actions={
                  view ? (
                    <Badge>
                      {stateLabel('dataRequests', view.record.status)}
                    </Badge>
                  ) : null
                }
              >
                {view ? (
                  <StateBar lifecycle='dataRequests' view={view} />
                ) : null}
                {view?.record.returnReason && view.record.status === 'draft' ? (
                  <p className='text-sm text-destructive'>
                    退回原因：{text(view.record.returnReason)}
                  </p>
                ) : null}
                {view && view.record.approverId ? (
                  <p className='text-sm text-muted-foreground'>
                    当前处理人：{personName(text(view.record.approverId))}
                  </p>
                ) : null}
                {current && editing ? (
                  <RequestEditor
                    form={current}
                    onChange={setForm}
                    errors={errors}
                  />
                ) : current ? (
                  <RequestSummary form={current} />
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    {t('common.loading')}
                  </p>
                )}
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
                        onClick={() => {
                          setShowErrors(true);
                          if (
                            current &&
                            Object.keys(validateDataRequest(current)).length
                          )
                            return;
                          void act(async () => {
                            const id = await save();
                            await client.post(`dataRequests/${id}/fire`, {
                              actAs: actor,
                              transition: 'submit',
                              input: {},
                            });
                          });
                        }}
                      >
                        {t('dataRequests.submit')}
                      </Button>
                    </>
                  ) : null}
                  {view ? (
                    <Actions
                      available={view.available}
                      busy={busy}
                      hidden={['submit']}
                      needsReason={['returnToApplicant', 'acceptanceReturn']}
                      onFire={(transition, input) =>
                        void act(() =>
                          client.post(`dataRequests/${detailId}/fire`, {
                            actAs: actor,
                            transition,
                            input,
                          }),
                        )
                      }
                    />
                  ) : null}
                </div>
                {view?.record.status === 'accepting' ? (
                  <p className='text-xs text-muted-foreground'>
                    有抽数子单（进行中或已结束）时不能“返回申请人”；有进行中的抽数子单时不能“提交办结”。
                  </p>
                ) : null}
              </Section>
              {view &&
              (view.record.status === 'accepting' ||
                view.extractions.length) ? (
                <Extractions
                  detail={view}
                  actor={actor}
                  onChanged={() => setTick((value) => value + 1)}
                />
              ) : null}
              {view ? (
                <Section title={t('common.history')}>
                  <History lifecycle='dataRequests' view={view} />
                </Section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
