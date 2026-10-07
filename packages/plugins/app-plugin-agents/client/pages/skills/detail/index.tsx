import { usePageBreadcrumb } from '@nocobase/app-client';
/**
 * Route `/skills/:skillId`: the skill as a directory (its files in a tree beside the selected one: SKILL.md rendered,
 * other files shown or previewed), what its front matter says (description, compatibility; whether it holds scripts,
 * which online agents read but never run), where it is attached, and its versions. Who may edit it gets "Edit" (the
 * same workbench, editable; saving makes a new version) and "Delete". Agents always get the latest version; an older
 * one can be compared with it and restored.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DownloadIcon,
  PencilIcon,
  TerminalIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { AgentAvatar } from '../../../components/agent-avatar.js';
import { Link, useNavigate, useParams } from 'react-router';

import type { SkillDetail } from '../../../../shared/skills.js';
import { agentsKeys } from '../../../api/keys.js';
import { AgSection } from '../../../components/ag-section.js';
import { AgListSkeleton, AgLoadError } from '../../../components/ag-states.js';
import { AgTag } from '../../../components/ag-tag.js';
import { PageContainer } from '../../../components/page-container.js';
import { PageHeader } from '../../../components/page-header.js';
import { RouteChildPage } from '../../../components/route-child-page.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { useSetting } from '../../../hooks/use-access.js';
import {
  scopeOf,
  useText,
  useVocabulary,
} from '../../../hooks/use-vocabulary.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { saveBlob } from '../../../lib/download.js';
import { ImportSkillButton } from '../import-button.js';
import { SkillEditor, SkillFiles } from './skill-editor.js';
import { SkillVersions } from './skill-versions.js';

export default function SkillDetailPage(): ReactElement {
  const { skillId = '' } = useParams();
  return (
    <RouteChildPage>
      <SkillView key={skillId} skillId={skillId} />
    </RouteChildPage>
  );
}

function SkillView({ skillId }: { readonly skillId: string }): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const canDelete = useSetting('agents.agents', 'manage');
  const detail = useQuery({
    queryKey: agentsKeys.skill(skillId),
    queryFn: () => api.skill(skillId),
  });
  const levels = [
    { label: t('skills.title'), to: '/skills' },
    { label: detail.data?.name ?? t('skills.breadcrumb') },
  ];
  // The header's trail (the shell renders it): the list, then this skill.
  usePageBreadcrumb(levels);
  if (detail.isError && !detail.data)
    return (
      <PageContainer>
        <AgLoadError
          title={t('skills.loadFailed')}
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
        <Button
          variant='outline'
          size='sm'
          nativeButton={false}
          render={<Link to='/skills' />}
        >
          {t('skills.backToList')}
        </Button>
      </PageContainer>
    );
  if (!detail.data)
    return (
      <PageContainer>
        <AgListSkeleton rows={6} />
      </PageContainer>
    );
  return (
    <SkillBody
      key={`${detail.data.id}:${detail.data.version}`}
      skill={detail.data}
      canEdit={detail.data.canEdit}
      canDelete={canDelete}
    />
  );
}

function SkillBody({
  skill,
  canEdit,
  canDelete,
}: {
  readonly skill: SkillDetail;
  /** Its creator at the related level, or a manager: from the server. */
  readonly canEdit: boolean;
  /** Deleting a skill needs managing agents. */
  readonly canDelete: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const remove = useMutation({
    mutationFn: () => api.deleteSkill(skill.id),
    onSuccess: () => {
      notify.success(t('skills.deleted', { name: skill.name }));
      void queryClient.invalidateQueries({ queryKey: agentsKeys.skills });
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void navigate('/skills');
    },
    onError: (error) => notify.error(error),
  });

  return (
    <PageContainer>
      <PageHeader
        title={
          <span className='inline-flex flex-wrap items-center gap-3'>
            <span className='font-mono'>{skill.name}</span>
            <AgTag tone='grey' className='font-mono'>
              v{skill.version}
            </AgTag>
          </span>
        }
        description={skill.description}
        actions={
          editing ? undefined : (
            <>
              <Button
                variant='outline'
                onClick={() =>
                  void api
                    .exportSkill(skill.id)
                    .then((blob) =>
                      saveBlob(blob, `${skill.slug}-v${skill.version}.zip`),
                    )
                    .catch((error: unknown) => notify.error(error))
                }
              >
                <DownloadIcon data-icon='inline-start' />
                {t('skills.export')}
              </Button>
              {canEdit ? (
                <ImportSkillButton skill={skill} onImported={() => undefined} />
              ) : null}
              {canEdit && canDelete ? (
                <Button
                  variant='outline'
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2Icon data-icon='inline-start' />
                  {t('skills.delete')}
                </Button>
              ) : null}
              {canEdit ? (
                <Button onClick={() => setEditing(true)}>
                  <PencilIcon data-icon='inline-start' />
                  {t('skills.edit')}
                </Button>
              ) : null}
            </>
          )
        }
      />
      <SkillFacts skill={skill} canEdit={canEdit} />
      {editing ? (
        <SkillEditor
          skill={skill}
          onDone={() => setEditing(false)}
          onReload={() => {
            setEditing(false);
            void queryClient.invalidateQueries({
              queryKey: agentsKeys.skill(skill.id),
            });
            void queryClient.invalidateQueries({
              queryKey: agentsKeys.skillVersions(skill.id),
            });
          }}
        />
      ) : (
        <SkillFiles skill={skill} />
      )}
      <SkillAttachments skill={skill} />
      <SkillVersions skill={skill} canEdit={canEdit} />
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('skills.deleteTitle', { name: skill.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('skills.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                setConfirmingDelete(false);
                remove.mutate();
              }}
            >
              {t('skills.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

/** What the front matter says beyond the description, and whether the skill holds scripts. */
function SkillFacts({
  skill,
  canEdit,
}: {
  readonly skill: SkillDetail;
  readonly canEdit: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!skill.compatibility && skill.scriptCount === 0 && canEdit) return null;
  return (
    <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
      {skill.scriptCount > 0 ? (
        <Badge variant='secondary' data-testid='skill-scripts-note'>
          <TerminalIcon data-icon='inline-start' />
          {t('skills.scriptsNote')}
        </Badge>
      ) : null}
      {skill.compatibility ? (
        <Badge variant='outline' className='max-w-full truncate'>
          {t('skills.compatibility', { value: skill.compatibility })}
        </Badge>
      ) : null}
      {canEdit ? null : <span>{t('skills.readOnly')}</span>}
    </div>
  );
}

/** The agents the skill is attached to, and how many places of each scope take it by default. */
function SkillAttachments({
  skill,
}: {
  readonly skill: SkillDetail;
}): ReactElement {
  const { t } = useTranslation();
  const text = useText();
  const vocabulary = useVocabulary();
  const agents = skill.attachments.filter((item) => item.scope === 'agent');
  const defaults = new Map<string, number>();
  for (const item of skill.attachments)
    if (item.scope !== 'agent')
      defaults.set(item.scope, (defaults.get(item.scope) ?? 0) + 1);
  return (
    <AgSection
      id='ag-skill-attachments'
      title={
        <>
          {t('skills.mountedAgents')}
          <span className='ml-2 text-xs font-normal text-muted-foreground tabular-nums'>
            {agents.length}
          </span>
        </>
      }
    >
      {agents.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('skills.noAgents')}</p>
      ) : (
        <ul className='space-y-1'>
          {agents.map((agent) => (
            <li key={agent.scopeId}>
              <Link
                to={`/agents/${encodeURIComponent(agent.scopeId)}`}
                className='flex items-center gap-2 rounded-md p-1 hover:bg-accent'
              >
                <AgentAvatar name={agent.name} size='sm' />
                <span className='truncate text-sm font-medium'>
                  {agent.name ?? agent.scopeId}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {defaults.size > 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('skills.defaults', {
            places: [...defaults]
              .map(
                ([scope, count]) =>
                  `${text(scopeOf(vocabulary, scope)?.title, scope)} × ${count}`,
              )
              .join(t('skills.defaultsSeparator')),
          })}
        </p>
      ) : null}
    </AgSection>
  );
}
