import { usePageBreadcrumb } from '@nocobase/app-client';
/**
 * Route `/skills/new`: a new skill, written in the same workbench as an existing one, over the library. It starts from
 * a template: front matter naming (`name`, the skill's directory) and describing it, and the sections a skill usually
 * has. Files and folders can be added before it is created. "Create" saves version 1 and opens the skill's page; the
 * front matter's problems, the browser's and the server's (a name another skill has), are listed above the source.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import type { SkillFrontMatterProblem } from '../../../shared/skills.js';
import { agentsKeys } from '../../api/keys.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { RouteChildPage } from '../../components/route-child-page.js';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { filesInput, SKILL_MD, skillTemplate } from './workbench/model.js';
import { DiscardDialog } from './workbench/discard-dialog.js';
import { SkillWorkbench } from './workbench/skill-workbench.js';
import {
  checkDraft,
  frontMatterProblemsOf,
  useWorkbench,
} from './workbench/state.js';

export default function NewSkillPage(): ReactElement {
  return (
    <RouteChildPage>
      <NewSkill />
    </RouteChildPage>
  );
}

function NewSkill(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const state = useWorkbench({
    content: skillTemplate({
      description: t('skills.template.description'),
      title: t('skills.template.title'),
      whenToUse: t('skills.template.whenToUse'),
      whenToUseHint: t('skills.template.whenToUseHint'),
      steps: t('skills.template.steps'),
      stepsHint: t('skills.template.stepsHint'),
      examples: t('skills.template.examples'),
      examplesHint: t('skills.template.examplesHint'),
    }),
    files: [],
    folders: [],
  });
  const [refused, setRefused] = useState<{
    readonly content: string;
    readonly problems: readonly SkillFrontMatterProblem[];
  } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const leave = () => void navigate('/skills');
  const check = checkDraft(state.draft, state.uploading);
  const serverProblems =
    refused && refused.content === state.draft.content ? refused.problems : [];
  const create = useMutation({
    mutationFn: () =>
      api.createSkill({
        content: state.draft.content,
        files: filesInput(state.draft),
      }),
    onSuccess: (skill) => {
      notify.success(t('skills.created', { name: skill.name }));
      void queryClient.invalidateQueries({ queryKey: agentsKeys.skills });
      void navigate(`/skills/${encodeURIComponent(skill.id)}`, {
        replace: true,
      });
    },
    onError: (error) => {
      const problems = frontMatterProblemsOf(error);
      if (problems.length > 0) {
        setRefused({ content: state.draft.content, problems });
        state.setSelected(SKILL_MD);
        return;
      }
      notify.error(error);
    },
  });
  usePageBreadcrumb([
    { label: t('skills.title'), to: '/skills' },
    { label: t('skills.newTitle') },
  ]);
  return (
    <PageContainer>
      <PageHeader
        title={t('skills.newTitle')}
        description={t('skills.newDescription')}
        actions={
          <>
            <Button
              variant='outline'
              disabled={create.isPending}
              onClick={() => (state.dirty ? setLeaving(true) : leave())}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              disabled={
                check.blocked || serverProblems.length > 0 || create.isPending
              }
              onClick={() => create.mutate()}
            >
              {create.isPending ? <Spinner data-icon='inline-start' /> : null}
              {create.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </>
        }
      />
      <SkillWorkbench
        state={state}
        editable
        saved={null}
        serverProblems={serverProblems}
      />
      <DiscardDialog
        open={leaving}
        onKeep={() => setLeaving(false)}
        onDiscard={leave}
      />
    </PageContainer>
  );
}
