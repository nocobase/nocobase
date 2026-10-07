/**
 * An agent's tools and models, in order, as a compact list: one header row names the columns, and each row is one entry
 * with its reasoning effort. A runner agent's rows pair a coding tool with a model (free text, suggested from what the
 * tool is commonly run with; empty for the tool's default), an online agent's rows a model service with one of its
 * models. The efforts offered are the row's tool's or the online ones. The first row is the default. Rows are added,
 * removed and moved up or down; an online agent may remove its last row and wait for a model, a runner agent may not.
 */
import { Autocomplete } from '@base-ui/react';
import {
  TOOL_MODEL_SUGGESTIONS,
  type AgentTool,
} from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FlaskConicalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import {
  effortsFor,
  MAX_MODEL_ENTRIES,
  type AgentType,
} from '../../shared/agents.js';
import type { ModelCatalog } from '../../shared/models.js';
import type { RunnerSummary } from '../../shared/runners.js';
import { cn } from 'cn';
import {
  moveEntry,
  newEntryDraft,
  type EntryDraft,
} from '../pages/agents/agent-model.js';
import { EffortSelect, ToolSelect } from './agent-fields.js';
import { ModelFields } from './agent-type.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { InputGroup, InputGroupInput } from './ui/input-group.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

/** A model typed freely, with the tool's common models suggested as the person types. */
export function ModelInput({
  id,
  tool,
  value,
  disabled,
  placeholder,
  ariaLabel,
  onChange,
}: {
  readonly id: string;
  readonly tool: AgentTool;
  readonly value: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  /** For a field with no visible label. */
  readonly ariaLabel?: string;
  readonly onChange: (model: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Autocomplete.Root
      items={TOOL_MODEL_SUGGESTIONS[tool]}
      value={value}
      openOnInputClick
      disabled={disabled}
      onValueChange={(next: string) => onChange(next)}
    >
      <InputGroup className='w-full'>
        <Autocomplete.Input
          id={id}
          render={<InputGroupInput disabled={disabled} />}
          placeholder={placeholder}
          aria-label={ariaLabel}
          title={t('modelEntries.suggestions')}
        />
      </InputGroup>
      <Autocomplete.Portal>
        <Autocomplete.Positioner
          side='bottom'
          sideOffset={6}
          align='start'
          className='isolate z-50'
        >
          <Autocomplete.Popup
            data-slot='combobox-content'
            className='max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          >
            <Autocomplete.List className='max-h-72 scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0'>
              {(item: string) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className='relative flex w-full cursor-default items-center gap-2 rounded-md px-1.5 py-1 font-mono text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground'
                >
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

/**
 * Columns: index and default badge, tool or service, model, effort, the row's buttons. The header and every row are
 * subgrids of one grid, so a column is as wide in each; the selects keep room for their placeholders.
 */
const COLUMNS =
  'grid grid-cols-[auto_minmax(10rem,1fr)_minmax(10rem,1.5fr)_minmax(8rem,1fr)_auto] items-center gap-x-2 gap-y-1.5';
const ROW = 'col-span-full grid grid-cols-subgrid items-center';

/** The effort a row keeps when its tool changes: its own while the new tool takes it, else the default. */
function effortFor(tool: AgentTool, effort: string): string {
  return effortsFor({ tool }).includes(effort) ? effort : '';
}

/** A new online row starts on the first service and model offered, when there is one. */
function firstOffered(
  catalog: ModelCatalog | undefined,
): Partial<Omit<EntryDraft, 'key'>> {
  const service = catalog?.services[0];
  const model = service?.models[0]?.value;
  return service && model ? { modelService: service.name, model } : {};
}

/** Removes a row; the last row of a runner agent stays, with a tooltip saying why. */
function RemoveButton({
  required,
  disabled,
  onClick,
}: {
  readonly required: boolean;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const button = (
    <Button
      type='button'
      variant='ghost'
      size='icon-sm'
      aria-label={t('modelEntries.remove')}
      title={required ? undefined : t('modelEntries.remove')}
      disabled={disabled || required}
      onClick={onClick}
    >
      <Trash2Icon />
    </Button>
  );
  if (!required) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className='inline-flex' />}>
        {button}
      </TooltipTrigger>
      <TooltipContent>{t('modelEntries.runnerNeedsOne')}</TooltipContent>
    </Tooltip>
  );
}

export function ModelEntriesEditor({
  idPrefix,
  type,
  value,
  runners,
  catalog,
  disabled,
  onChange,
  onTest,
  testing,
  empty,
}: {
  readonly idPrefix: string;
  readonly type: AgentType;
  readonly value: readonly EntryDraft[];
  /** For the count of runners each tool can run on now. */
  readonly runners?: readonly RunnerSummary[] | undefined;
  /** The services and models online rows choose from. */
  readonly catalog?: ModelCatalog | undefined;
  readonly disabled?: boolean;
  readonly onChange: (entries: EntryDraft[]) => void;
  /** Online rows: asks the model of a row for a short answer. */
  readonly onTest?: (entry: EntryDraft) => void;
  /** The key of the row being tested. */
  readonly testing?: string | null;
  /** What an online list without rows says: which model answers instead (`DefaultModelNote`). */
  readonly empty?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const replace = (index: number, patch: Partial<EntryDraft>): void =>
    onChange(
      value.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)),
    );
  const add = (): void =>
    onChange([
      ...value,
      newEntryDraft(
        type === 'online'
          ? firstOffered(catalog)
          : value.length > 0
            ? { tool: value[value.length - 1].tool }
            : {},
      ),
    ]);
  return (
    <div className='flex flex-col gap-2'>
      {value.length > 0 ? (
        <div className='overflow-x-auto'>
          <div className={COLUMNS}>
            <div
              aria-hidden
              className={cn(ROW, 'text-xs font-medium text-muted-foreground')}
            >
              <span />
              <span>
                {type === 'online'
                  ? t('agentForm.modelService')
                  : t('agentForm.tool')}
              </span>
              <span>{t('agentForm.model')}</span>
              <span>{t('agentForm.reasoningEffort')}</span>
              <span />
            </div>
            <ol
              className={cn(ROW, 'gap-y-1.5')}
              aria-label={t('modelEntries.title')}
            >
              {value.map((entry, index) => {
                const rowId = `${idPrefix}-${index}`;
                return (
                  <li
                    key={entry.key}
                    data-testid='ag-model-entry'
                    aria-label={t('modelEntries.row', { index: index + 1 })}
                    className={ROW}
                  >
                    <div className='flex items-center gap-1.5'>
                      <span className='w-4 text-right text-sm text-muted-foreground tabular-nums'>
                        {index + 1}
                      </span>
                      {index === 0 ? (
                        <Badge variant='secondary'>
                          {t('modelEntries.default')}
                        </Badge>
                      ) : null}
                    </div>
                    {type === 'online' ? (
                      <ModelFields
                        idPrefix={rowId}
                        catalog={catalog}
                        modelService={entry.modelService}
                        model={entry.model}
                        disabled={disabled}
                        onChange={(modelService, model) =>
                          replace(index, { modelService, model })
                        }
                      />
                    ) : (
                      <>
                        <ToolSelect
                          id={`${rowId}-tool`}
                          value={entry.tool}
                          runners={runners}
                          disabled={disabled}
                          ariaLabel={t('agentForm.tool')}
                          onChange={(tool) =>
                            replace(index, {
                              tool,
                              effort: effortFor(tool, entry.effort),
                            })
                          }
                        />
                        <ModelInput
                          id={`${rowId}-model`}
                          tool={entry.tool}
                          value={entry.model}
                          disabled={disabled}
                          placeholder={t('agents.defaultModel')}
                          ariaLabel={t('agentForm.model')}
                          onChange={(model) => replace(index, { model })}
                        />
                      </>
                    )}
                    <EffortSelect
                      id={`${rowId}-effort`}
                      efforts={effortsFor(
                        type === 'online'
                          ? { modelService: entry.modelService }
                          : { tool: entry.tool },
                      )}
                      value={entry.effort}
                      disabled={disabled}
                      ariaLabel={t('agentForm.reasoningEffort')}
                      onChange={(effort) => replace(index, { effort })}
                    />
                    <div className='flex items-center'>
                      {type === 'online' && onTest ? (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          aria-label={t('modelSection.test')}
                          title={t('modelSection.test')}
                          disabled={
                            !entry.modelService ||
                            !entry.model ||
                            testing === entry.key
                          }
                          onClick={() => onTest(entry)}
                        >
                          <FlaskConicalIcon />
                        </Button>
                      ) : null}
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        aria-label={t('modelEntries.moveUp')}
                        title={t('modelEntries.moveUp')}
                        disabled={disabled || index === 0}
                        onClick={() =>
                          onChange(moveEntry(value, index, index - 1))
                        }
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        aria-label={t('modelEntries.moveDown')}
                        title={t('modelEntries.moveDown')}
                        disabled={disabled || index === value.length - 1}
                        onClick={() =>
                          onChange(moveEntry(value, index, index + 1))
                        }
                      >
                        <ArrowDownIcon />
                      </Button>
                      <RemoveButton
                        // A runner agent needs an entry to run; an online one may wait for a model.
                        required={type === 'runner' && value.length === 1}
                        disabled={disabled}
                        onClick={() =>
                          onChange(value.filter((_, at) => at !== index))
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : type === 'online' ? (
        empty
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('modelEntries.required')}
        </p>
      )}
      <div>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={disabled || value.length >= MAX_MODEL_ENTRIES}
          onClick={add}
        >
          <PlusIcon data-icon='inline-start' />
          {type === 'online' && value.length === 0
            ? t('modelEntries.choose')
            : t('modelEntries.add')}
        </Button>
      </div>
    </div>
  );
}
