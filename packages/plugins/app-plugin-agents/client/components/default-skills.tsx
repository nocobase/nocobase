/**
 * The skills every run in a scope (a working directory, or a scope the application registers) gets besides its
 * agent's own: a team's pull request conventions, how a repository is built. Saved on their own.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SaveIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { useNotify } from '../hooks/use-notify.js';
import { AgSection } from './ag-section.js';
import { SkillScriptsNotice, SkillsSelect } from './skills-select.js';
import { Button } from './ui/button.js';
import { Skeleton } from './ui/skeleton.js';
import { Spinner } from './ui/spinner.js';

export function DefaultSkillsPanel({
  scope,
  scopeId,
  canEdit,
  description,
  className,
}: {
  readonly scope: string;
  readonly scopeId: string;
  readonly canEdit: boolean;
  /** What the section says, in the viewer's language; a general line when absent. */
  readonly description?: string;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const key = agentsKeys.scopeSkills(scope, scopeId);
  const current = useQuery({
    queryKey: key,
    queryFn: () => api.scopeSkills(scope, scopeId),
  });
  return (
    <AgSection
      id={`ag-default-skills-${scope}-${scopeId}`}
      title={t('defaultSkills.title')}
      description={description ?? t('defaultSkills.description')}
      {...(className ? { className } : {})}
    >
      {current.data ? (
        <DefaultSkillsForm
          key={current.data.join(',')}
          scope={scope}
          scopeId={scopeId}
          initial={current.data}
          canEdit={canEdit}
        />
      ) : current.isError ? (
        <p className='text-sm text-muted-foreground'>
          {t('common.requestFailed')}
        </p>
      ) : (
        <Skeleton className='h-8 w-full' />
      )}
    </AgSection>
  );
}

function DefaultSkillsForm({
  scope,
  scopeId,
  initial,
  canEdit,
}: {
  readonly scope: string;
  readonly scopeId: string;
  readonly initial: readonly string[];
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([...initial]);
  const dirty =
    selected.length !== initial.length ||
    selected.some((id) => !initial.includes(id));
  const save = useMutation({
    mutationFn: () => api.setScopeSkills(scope, scopeId, selected),
    onSuccess: (skillIds) => {
      queryClient.setQueryData(
        agentsKeys.scopeSkills(scope, scopeId),
        skillIds,
      );
      void queryClient.invalidateQueries({ queryKey: agentsKeys.skills });
      notify.success(t('defaultSkills.saved'));
    },
    onError: (error) => notify.error(error),
  });
  return (
    <div className='space-y-3'>
      <SkillsSelect
        id={`ag-default-skills-${scope}-${scopeId}-select`}
        value={selected}
        disabled={!canEdit || save.isPending}
        onChange={setSelected}
      />
      <SkillScriptsNotice value={selected} />
      {canEdit ? (
        <div className='flex justify-end'>
          <Button
            variant='outline'
            size='sm'
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <SaveIcon data-icon='inline-start' />
            )}
            {t('defaultSkills.save')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
