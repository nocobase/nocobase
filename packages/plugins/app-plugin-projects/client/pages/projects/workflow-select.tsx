import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { pmKeys } from '../../api/keys.js';
import { PropertySelect } from '../../components/pm-property-fields.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { workflowName } from '../config/workflows/workflow-model.js';

/**
 * The workflow of a project. `null` is the default workflow, and stays so when another one becomes the default;
 * choosing the default workflow by name is the same as choosing none. While no workflow is the default, `null` is the
 * built-in statuses, offered as their own option.
 */
export function WorkflowSelect({
  id,
  value,
  disabled,
  size,
  onChange,
}: {
  readonly id: string;
  readonly value: string | null;
  readonly disabled?: boolean;
  readonly size?: 'sm' | 'default';
  readonly onChange: (workflowId: string | null) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const workflows = useQuery({
    queryKey: pmKeys.workflows,
    queryFn: () => api.workflows(),
  });
  const defaultId = workflows.data?.find((item) => item.isDefault)?.id ?? null;
  return (
    <PropertySelect
      id={id}
      size={size}
      disabled={disabled || !workflows.data}
      {...(workflows.data && defaultId === null
        ? { noneLabel: t('workflows.builtInStatuses') }
        : {})}
      options={(workflows.data ?? []).map((workflow) => ({
        value: workflow.id,
        label: workflow.isDefault
          ? t('workflows.defaultOption', { name: workflowName(t, workflow) })
          : workflowName(t, workflow),
      }))}
      value={value ?? defaultId}
      onChange={(next) => {
        const chosen = next === defaultId ? null : next;
        if (chosen !== value) onChange(chosen);
      }}
    />
  );
}
