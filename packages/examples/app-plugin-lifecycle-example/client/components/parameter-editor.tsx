import {
  useEffect,
  useId,
  useState,
  useImperativeHandle,
  type Ref,
  type ReactElement,
} from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type { JsonObject, ReviewerSelection } from '@nocobase/lifecycle';
import type { ParameterGroupView } from '../../shared/parameter-configuration.js';
import type { ParameterApi } from '../lib/parameter-api.js';
import { ReviewerReferenceSelect } from './reviewer-reference-select.js';
import { errorMessage } from '../lib/api.js';
import { NAMESPACE } from '../lib/format.js';
import { Choice } from './choice.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Textarea } from './textarea.js';

const businessParameterFields = new Set([
  'paymentWindowMinutes',
  'escalateAfterMinutes',
  'waitMinutes',
  'querySeconds',
  'pollSeconds',
  'maxMinutes',
  'periodMinutes',
  'dunningMinutes',
  'maxDunning',
  'reopenDays',
]);

function requestKey(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
function ReviewerRuleEditor({
  value,
  api,
  disabled,
  onChange,
}: {
  readonly value: readonly ReviewerSelection[];
  readonly api: ParameterApi;
  readonly disabled: boolean;
  readonly onChange: (value: readonly ReviewerSelection[]) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const groups = [...new Set(value.map((item) => item.group))];
  return (
    <div className='space-y-3'>
      <p className='text-sm text-muted-foreground'>
        {t('parameters.ruleExplanation')}
      </p>
      {groups.map((group, groupIndex) => (
        <fieldset key={group} className='min-w-0 space-y-2'>
          <legend className='mb-2 text-sm font-medium'>
            {t(
              groupIndex === 0
                ? 'parameters.allConditions'
                : 'parameters.alsoInclude',
            )}
          </legend>
          {value.map((item, index) =>
            item.group === group ? (
              <div
                /* Rows have no local state; repeated selections need distinct positional keys. */
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={index}
                className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2'
              >
                <Choice
                  label={t('parameters.selectionType')}
                  disabled={disabled}
                  value={item.type}
                  options={['department', 'role', 'user'].map((type) => ({
                    value: type,
                    label: t(`parameters.types.${type}`),
                  }))}
                  onChange={(type) =>
                    onChange(
                      value.map((current, offset) =>
                        offset === index
                          ? {
                              ...current,
                              type,
                              referenceId: '',
                            }
                          : current,
                      ),
                    )
                  }
                />
                <ReviewerReferenceSelect
                  key={item.type}
                  api={api}
                  type={
                    item.type as import('../../shared/parameter-configuration.js').ReviewerReferenceType
                  }
                  value={item.referenceId}
                  disabled={disabled}
                  onChange={(referenceId) =>
                    onChange(
                      value.map((current, offset) =>
                        offset === index
                          ? { ...current, referenceId }
                          : current,
                      ),
                    )
                  }
                />
                {!disabled && (
                  <Button
                    variant='ghost'
                    type='button'
                    onClick={() =>
                      onChange(
                        value.filter((_item, offset) => offset !== index),
                      )
                    }
                  >
                    {t('parameters.remove')}
                  </Button>
                )}
              </div>
            ) : null,
          )}
          {!disabled && (
            <Button
              type='button'
              variant='outline'
              onClick={() =>
                onChange([
                  ...value,
                  {
                    group,
                    type: 'department',
                    referenceId: '',
                  },
                ])
              }
            >
              {t('parameters.addCondition')}
            </Button>
          )}
        </fieldset>
      ))}
      {!disabled && (
        <Button
          type='button'
          variant='outline'
          onClick={() =>
            onChange([
              ...value,
              {
                group: Math.max(0, ...groups) + 1,
                type: 'user',
                referenceId: '',
              },
            ])
          }
        >
          {t('parameters.addGroup')}
        </Button>
      )}
    </div>
  );
}
/** Shared by the central page, an embedded form and code-bound diagram entry points. */
export function ParameterEditor({
  group,
  api,
  actor,
  onSaved,
  onBusyChange,
  onDirtyChange,
  embedded = false,
  saveRef,
  hideRevision = false,
}: {
  readonly saveRef?: Ref<{
    save: () => Promise<boolean>;
    values: () => JsonObject | undefined;
  }>;
  readonly hideRevision?: boolean;
  readonly group: ParameterGroupView;
  readonly api: ParameterApi;
  readonly actor: string;
  readonly onSaved?: (group: ParameterGroupView) => void;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly onBusyChange?: (busy: boolean) => void;
  readonly embedded?: boolean;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const id = useId();
  const [draft, setDraft] = useState<JsonObject>(() =>
    structuredClone(group.values),
  );
  const [baseline, setBaseline] = useState(group.values);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  const [revision, setRevision] = useState(group.revision);
  const [requestId, setRequestId] = useState(requestKey);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [conflict, setConflict] = useState<ParameterGroupView>();
  const [preview, setPreview] = useState<readonly string[]>();
  const [objectErrors, setObjectErrors] = useState<Record<string, string>>({});
  const [objectText, setObjectText] = useState<Record<string, string>>({});
  const hasReviewers = Object.values(group.fields).some(
    (field) => field.type === 'reviewers',
  );
  const change = (key: string, value: JsonObject[string]): void => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setRequestId(requestKey());
    setNote('');
  };
  const save = async (): Promise<boolean> => {
    if (Object.values(objectErrors).some(Boolean)) return false;
    setBusy(true);
    onBusyChange?.(true);
    setNote('');
    try {
      const saved = await api.save(group.key, draft, revision, requestId);
      setBaseline(saved.values);
      setDraft(saved.values);
      setRevision(saved.revision);
      setConflict(undefined);
      setNote(t('parameters.saved'));
      onSaved?.(saved);
      return true;
    } catch (error) {
      setNote(errorMessage(error));
      if (
        error &&
        typeof error === 'object' &&
        'reason' in error &&
        error.reason === 'CONFIGURATION_CONFLICT'
      ) {
        try {
          setConflict(await api.read(group.key));
          setNote(t('parameters.conflict'));
        } catch (readError) {
          setNote(errorMessage(readError));
        }
      }
      return false;
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  useImperativeHandle(saveRef, () => ({
    values: () =>
      Object.values(objectErrors).some(Boolean) ? undefined : draft,
    save: async () =>
      Object.values(objectErrors).some(Boolean) ? false : !dirty || save(),
  }));
  return (
    <section
      className={
        embedded
          ? 'space-y-4 py-2'
          : 'space-y-4 rounded-xl border bg-card p-4 text-card-foreground'
      }
    >
      <div>
        <h3 className='font-medium'>{group.title}</h3>
        {!hideRevision && (
          <p className='text-sm text-muted-foreground'>
            {t('parameters.revision', { revision })} ·{' '}
            {group.origin === 'default' && revision === 0
              ? t('parameters.codeDefaults')
              : t('parameters.databaseVersion')}
          </p>
        )}
      </div>
      {Object.entries(group.fields).map(([key, field]) => (
        <div key={key} className='space-y-2'>
          <label htmlFor={`${id}:${key}`} className='text-sm font-medium'>
            {businessParameterFields.has(key)
              ? t(`parameters.fields.${key}.title`)
              : field.title}
          </label>
          <p className='text-xs text-muted-foreground'>
            {businessParameterFields.has(key)
              ? t(`parameters.fields.${key}.description`)
              : [
                  ...new Set(
                    group.uses
                      .filter((use) => use.field === key)
                      .map((use) => use.readMode),
                  ),
                ]
                  .map((mode) => t(`parameters.${mode}Effect`))
                  .join(' · ')}
          </p>
          {field.type === 'reviewers' ? (
            <ReviewerRuleEditor
              value={draft[key] as unknown as ReviewerSelection[]}
              key={actor}
              api={api}
              disabled={!group.canUpdate || busy}
              onChange={(value) =>
                change(
                  key,
                  [...value].map((item) => ({ ...item })),
                )
              }
            />
          ) : field.type === 'boolean' ? (
            <Choice
              label={
                businessParameterFields.has(key)
                  ? t(`parameters.fields.${key}.title`)
                  : field.title
              }
              value={draft[key] === true ? 'true' : 'false'}
              disabled={!group.canUpdate || busy}
              options={[
                { value: 'true', label: t('parameters.yes') },
                { value: 'false', label: t('parameters.no') },
              ]}
              onChange={(value) => change(key, value === 'true')}
            />
          ) : field.type === 'object' ? (
            <Textarea
              id={`${id}:${key}`}
              disabled={!group.canUpdate || busy}
              value={objectText[key] ?? JSON.stringify(draft[key], null, 2)}
              onChange={(event) => {
                const text = event.target.value;
                setObjectText((current) => ({ ...current, [key]: text }));
                try {
                  change(key, JSON.parse(text) as JsonObject);
                  setObjectErrors((current) => ({ ...current, [key]: '' }));
                } catch {
                  setObjectErrors((current) => ({
                    ...current,
                    [key]: t('parameters.invalidObject'),
                  }));
                }
              }}
            />
          ) : (
            <Input
              id={`${id}:${key}`}
              type={field.type === 'number' ? 'number' : 'text'}
              min={field.minimum}
              max={field.maximum}
              value={
                typeof draft[key] === 'number' || typeof draft[key] === 'string'
                  ? draft[key]
                  : ''
              }
              disabled={!group.canUpdate || busy}
              onChange={(event) =>
                change(
                  key,
                  field.type === 'number'
                    ? Number(event.target.value)
                    : event.target.value,
                )
              }
            />
          )}
          {objectErrors[key] && (
            <p role='alert' className='text-sm text-destructive'>
              {objectErrors[key]}
            </p>
          )}
        </div>
      ))}
      {note && (
        <p role='status' className='text-sm'>
          {note}
        </p>
      )}
      {conflict && (
        <div className='space-y-2 rounded-lg bg-muted p-3 text-sm'>
          <p>
            {t('parameters.currentRevision', { revision: conflict.revision })}
          </p>
          <pre className='overflow-auto text-xs'>
            {JSON.stringify(conflict.values, null, 2)}
          </pre>
          <Button
            variant='outline'
            onClick={() => {
              setRevision(conflict.revision);
              setConflict(undefined);
              setRequestId(requestKey());
            }}
          >
            {t('parameters.keepDraft')}
          </Button>
        </div>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        {group.canUpdate && !saveRef ? (
          <Button
            disabled={busy || Object.values(objectErrors).some(Boolean)}
            onClick={() => void save()}
          >
            {t('parameters.save')}
          </Button>
        ) : !group.canUpdate ? (
          <p className='text-sm text-muted-foreground'>
            {t('parameters.readOnly')}
          </p>
        ) : null}
        {hasReviewers && group.canUpdate && (
          <Button
            variant='outline'
            onClick={() => {
              void api
                .candidates(draft, 'lin')
                .then(setPreview)
                .catch((error: unknown) => setNote(errorMessage(error)));
            }}
          >
            {t('parameters.preview')}
          </Button>
        )}
      </div>
      {preview && (
        <p role='status' className='text-sm'>
          {t('parameters.candidates')}:{' '}
          {preview.join(', ') || t('parameters.noCandidates')}
        </p>
      )}
    </section>
  );
}
