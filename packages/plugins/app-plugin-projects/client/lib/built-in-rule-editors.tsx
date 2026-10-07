/** The settings editors and summaries of this plugin's own status rule types (`built-in-rule-types.ts`). */
import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  CHECKLIST_ITEMS_MAX,
  CHECKLIST_LABEL_MAX,
  NOTIFY_MESSAGE_MAX,
  START_LABEL_MAX,
  messageText,
  type ChecklistItemDefinition,
} from '../../shared/workflows.js';
import { PmExpandableTextarea } from '../components/pm-expandable-textarea.js';
import { Button } from '../components/ui/button.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { Input } from '../components/ui/input.js';
import type {
  StatusRuleConfig,
  StatusRuleEditorProps,
  StatusRuleSummaryProps,
} from './status-rule-types.js';

const itemsOf = (config: StatusRuleConfig): ChecklistItemDefinition[] =>
  Array.isArray(config.items)
    ? (config.items as ChecklistItemDefinition[])
    : [];

/** A key for a new checklist item: `item_1`, `item_2`… whichever is free; it stays when the label changes. */
function newItemKey(items: readonly ChecklistItemDefinition[]): string {
  const taken = new Set(items.map((item) => item.key));
  for (let n = 1; ; n += 1) if (!taken.has(`item_${n}`)) return `item_${n}`;
}

/** The items, each with its label and whether it is required. A checklist keeps at least one; remove the rule instead. */
export function ChecklistEditor({
  config,
  onChange,
}: StatusRuleEditorProps): ReactElement {
  const { t } = useTranslation();
  const items = itemsOf(config);
  const setItems = (next: readonly ChecklistItemDefinition[]) =>
    onChange({ items: next });
  const update = (key: string, patch: Partial<ChecklistItemDefinition>) =>
    setItems(
      items.map((entry) =>
        entry.key === key ? { ...entry, ...patch } : entry,
      ),
    );
  return (
    <ul className='space-y-2'>
      {items.map((item, index) => (
        <li key={item.key} className='flex min-w-0 items-center gap-2'>
          <Input
            value={item.label}
            maxLength={CHECKLIST_LABEL_MAX}
            placeholder={t('workflows.rules.itemPlaceholder')}
            aria-label={t('workflows.rules.itemLabel', {
              position: index + 1,
            })}
            className='h-8 min-w-0 flex-1'
            onChange={(event) =>
              update(item.key, { label: event.target.value })
            }
          />
          <label className='flex shrink-0 items-center gap-1.5 text-xs'>
            <Checkbox
              checked={item.required}
              onCheckedChange={(checked) =>
                update(item.key, { required: checked === true })
              }
            />
            {t('workflows.rules.required')}
          </label>
          <Button
            variant='ghost'
            size='icon-sm'
            disabled={items.length <= 1}
            aria-label={t('workflows.rules.removeItem', {
              position: index + 1,
            })}
            onClick={() =>
              setItems(items.filter((entry) => entry.key !== item.key))
            }
          >
            <Trash2Icon />
          </Button>
        </li>
      ))}
      <li>
        <Button
          variant='outline'
          size='sm'
          disabled={items.length >= CHECKLIST_ITEMS_MAX}
          onClick={() =>
            setItems([
              ...items,
              { key: newItemKey(items), label: '', required: true },
            ])
          }
        >
          <PlusIcon data-icon='inline-start' />
          {t('workflows.rules.addItem')}
        </Button>
      </li>
    </ul>
  );
}

export function ChecklistSummary({
  config,
}: StatusRuleSummaryProps): ReactElement {
  const { t } = useTranslation();
  const items = itemsOf(config);
  return (
    <>
      {t('workflows.ruleChecklistShort', {
        count: items.length,
        required: items.filter((item) => item.required).length,
      })}
    </>
  );
}

export function NotifyOwnerEditor({
  config,
  onChange,
  idPrefix,
}: StatusRuleEditorProps): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='space-y-1.5'>
      <label htmlFor={`${idPrefix}-message`} className='text-sm font-medium'>
        {t('workflows.rules.message')}
      </label>
      <PmExpandableTextarea
        id={`${idPrefix}-message`}
        // A keyed message (a template's) shows in the reader's words; editing it makes it plain text.
        value={messageText(config.message, t) ?? ''}
        maxLength={NOTIFY_MESSAGE_MAX}
        rows={2}
        placeholder={t('workflows.rules.messagePlaceholder')}
        onChange={(event) =>
          onChange(event.target.value ? { message: event.target.value } : {})
        }
      />
    </div>
  );
}

export function NotifyOwnerSummary({
  config,
}: StatusRuleSummaryProps): ReactElement {
  const { t } = useTranslation();
  const message = messageText(config.message, t);
  return (
    <>
      {message
        ? t('workflows.ruleNotifyOwnerWith', {
            message,
            interpolation: { escapeValue: false },
          })
        : t('workflows.ruleNotifyOwnerShort')}
    </>
  );
}

export function SubtasksDoneSummary(): ReactElement {
  const { t } = useTranslation();
  return <>{t('workflows.ruleSubtasksDoneShort')}</>;
}

export function BlockersDoneSummary(): ReactElement {
  const { t } = useTranslation();
  return <>{t('workflows.ruleBlockersDoneShort')}</>;
}

/** A `startOption` rule's label and hint; a keyed one (a template's) shows in the reader's words until edited. */
export function StartOptionEditor({
  config,
  onChange,
  idPrefix,
}: StatusRuleEditorProps): ReactElement {
  const { t } = useTranslation();
  const set = (field: 'label' | 'hint', value: string) => {
    const { [field]: _dropped, ...rest } = config;
    onChange(value ? { ...rest, [field]: value } : rest);
  };
  return (
    <div className='space-y-3'>
      <div className='space-y-1.5'>
        <label htmlFor={`${idPrefix}-label`} className='text-sm font-medium'>
          {t('workflows.rules.startLabel')}
        </label>
        <Input
          id={`${idPrefix}-label`}
          value={messageText(config.label, t) ?? ''}
          maxLength={START_LABEL_MAX}
          placeholder={t('workflows.rules.startLabelPlaceholder')}
          onChange={(event) => set('label', event.target.value)}
        />
      </div>
      <div className='space-y-1.5'>
        <label htmlFor={`${idPrefix}-hint`} className='text-sm font-medium'>
          {t('workflows.rules.startHint')}
        </label>
        <PmExpandableTextarea
          id={`${idPrefix}-hint`}
          value={messageText(config.hint, t) ?? ''}
          maxLength={NOTIFY_MESSAGE_MAX}
          rows={2}
          placeholder={t('workflows.rules.startHintPlaceholder')}
          onChange={(event) => set('hint', event.target.value)}
        />
      </div>
    </div>
  );
}

export function StartOptionSummary({
  config,
}: StatusRuleSummaryProps): ReactElement {
  const { t } = useTranslation();
  const label = messageText(config.label, t);
  return (
    <>
      {label
        ? t('workflows.ruleStartOptionWith', {
            label,
            interpolation: { escapeValue: false },
          })
        : t('workflows.ruleStartOptionShort')}
    </>
  );
}
