/**
 * Limits per coding tool beside a runtime's concurrent runs (`Runner.toolSlots`), as the "Add runtime" dialog edits
 * them: one row per checked tool, its name and its limit, empty for no limit of its own. `ToolLimitInput` and
 * `OverTotalHint` are the pieces the runtime's settings put in their tools table.
 */
import type { AgentTool } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Input } from '../../components/ui/input.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { toolsOverTotal, type ToolSlotsDraft } from '../../lib/tool-slots.js';

/** One tool's limit: a short number field, empty for no limit of its own. */
export function ToolLimitInput({
  id,
  tool,
  draft,
  invalid,
  disabled = false,
  onChange,
}: {
  readonly id: string;
  readonly tool: AgentTool;
  readonly draft: ToolSlotsDraft;
  readonly invalid: boolean;
  readonly disabled?: boolean;
  readonly onChange: (draft: ToolSlotsDraft) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Input
      id={id}
      inputMode='numeric'
      className='h-8 w-20'
      placeholder={t('runtimes.toolSlots.none')}
      aria-label={t('runtimes.toolSlots.inputLabel', {
        tool: t(`tools.${tool}`),
      })}
      value={draft[tool] ?? ''}
      disabled={disabled}
      aria-invalid={invalid ? true : undefined}
      onChange={(event) => onChange({ ...draft, [tool]: event.target.value })}
    />
  );
}

/** Says which limits are above the concurrent runs, and that the concurrent runs bound them; nothing when none is. */
export function OverTotalHint({
  tools,
  draft,
  total,
}: {
  readonly tools: readonly AgentTool[];
  readonly draft: ToolSlotsDraft;
  readonly total: string;
}): ReactElement | null {
  const { t } = useTranslation();
  const over = toolsOverTotal(draft, tools, total);
  if (over.length === 0) return null;
  return (
    <p
      role='status'
      data-testid='tool-slots-over-total'
      className='text-xs text-amber-700 dark:text-amber-400'
    >
      {t('runtimes.toolSlots.overTotal', {
        tools: over.map((tool) => t(`tools.${tool}`)).join(', '),
        slots: total.trim(),
      })}
    </p>
  );
}

export function ToolSlotsFields({
  idPrefix,
  tools,
  draft,
  total,
  invalid,
  onChange,
}: {
  readonly idPrefix: string;
  readonly tools: readonly AgentTool[];
  readonly draft: ToolSlotsDraft;
  /** The concurrent runs as typed, for the hint about limits above them. */
  readonly total: string;
  readonly invalid: boolean;
  readonly onChange: (draft: ToolSlotsDraft) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>
        {t('runtimes.toolSlots.hint')}
      </p>
      {tools.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('runtimes.toolSlots.noneChecked')}
        </p>
      ) : (
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('runtimes.toolTable.tool')}</TableHead>
                <TableHead className='w-28'>
                  {t('runtimes.toolTable.limit')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool} data-testid={`${idPrefix}-row-${tool}`}>
                  <TableCell>
                    <label htmlFor={`${idPrefix}-${tool}`}>
                      {t(`tools.${tool}`)}
                    </label>
                  </TableCell>
                  <TableCell>
                    <ToolLimitInput
                      id={`${idPrefix}-${tool}`}
                      tool={tool}
                      draft={draft}
                      invalid={invalid}
                      onChange={onChange}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {invalid ? (
        <p className='text-sm text-destructive' role='alert'>
          {t('runtimes.toolSlots.invalid')}
        </p>
      ) : null}
      <OverTotalHint tools={tools} draft={draft} total={total} />
    </div>
  );
}
