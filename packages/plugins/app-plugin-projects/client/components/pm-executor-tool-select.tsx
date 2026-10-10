import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import type { Executor } from '../../shared/issues.js';
import { useExecutorTools } from '../hooks/use-executor-tools.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';

const DEFAULT = '__default__';

export function PmExecutorToolSelect({
  executor,
  onChange,
  disabled,
}: {
  readonly executor: Executor;
  readonly onChange: (executor: Executor) => void;
  readonly disabled?: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const { tools, defaultTool } = useExecutorTools(executor);
  if (tools.length === 0) return null;
  const defaultLabel = defaultTool
    ? t('executor.defaultToolWithName', { name: defaultTool.name })
    : t('executor.defaultTool');
  return (
    <Select
      value={executor.tool ?? DEFAULT}
      disabled={disabled}
      items={[
        { value: DEFAULT, label: defaultLabel },
        ...tools.map((tool) => ({ value: tool.id, label: tool.name })),
      ]}
      onValueChange={(tool) => {
        if (tool === null) return;
        onChange({
          type: executor.type,
          id: executor.id,
          tool: tool === DEFAULT ? null : tool,
          ...(tool === DEFAULT ? {} : { toolSource: 'explicit' }),
        });
      }}
    >
      <SelectTrigger
        aria-label={t('executor.tool')}
        className='w-auto min-w-24'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT}>{defaultLabel}</SelectItem>
        {tools.map((tool) => (
          <SelectItem key={tool.id} value={tool.id}>
            {tool.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
