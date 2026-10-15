/**
 * A skill's files on its page: the workbench, read-only, and while editing with a bar pinned above it holding the
 * version's note and Cancel / Save. Saving is one `PATCH`, a new version: `SKILL.md` names and describes the skill (a
 * new `name` renames it) and the files go as text or by the hash of uploaded bytes; empty folders are not kept.
 *
 * The save names the version the editor opened (`expectedRevision`). When someone saved a version since, the draft
 * stays, saving is held back, and a banner offers to load the latest version, which discards the draft. Front matter
 * the server refuses (a name another skill has) is listed with the browser's own checks above the source.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, SaveIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type {
  SkillDetail,
  SkillFrontMatterProblem,
} from '../../../../shared/skills.js';
import { agentsKeys } from '../../../api/keys.js';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '../../../components/ui/alert.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Spinner } from '../../../components/ui/spinner.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { isRevisionConflict } from '../../../lib/revision.js';
import { draftOf, filesInput, SKILL_MD } from '../workbench/model.js';
import { DiscardDialog } from '../workbench/discard-dialog.js';
import { SkillWorkbench } from '../workbench/skill-workbench.js';
import {
  checkDraft,
  frontMatterProblemsOf,
  useWorkbench,
} from '../workbench/state.js';

/** The skill's files as they are saved: read-only. */
export function SkillFiles({
  skill,
}: {
  readonly skill: SkillDetail;
}): ReactElement {
  const state = useWorkbench(draftOf(skill));
  return (
    <SkillWorkbench
      state={state}
      editable={false}
      saved={{ id: skill.id, version: skill.version }}
    />
  );
}

export function SkillEditor({
  skill,
  onDone,
  onReload,
}: {
  readonly skill: SkillDetail;
  readonly onDone: () => void;
  /** Discards the draft and opens the latest version in a fresh editor. */
  readonly onReload?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const state = useWorkbench(draftOf(skill));
  const [note, setNote] = useState('');
  const [conflict, setConflict] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [refused, setRefused] = useState<{
    readonly content: string;
    readonly problems: readonly SkillFrontMatterProblem[];
  } | null>(null);
  const check = checkDraft(state.draft, state.uploading);
  // What the server refused, until SKILL.md changes.
  const serverProblems =
    refused && refused.content === state.draft.content ? refused.problems : [];

  const save = useMutation({
    mutationFn: () =>
      api.saveSkill(skill.id, {
        content: state.draft.content,
        files: filesInput(state.draft),
        note: note.trim() || null,
        expectedRevision: skill.version,
      }),
    onSuccess: (saved) => {
      notify.success(t('skills.saved', { version: saved.version }));
      queryClient.setQueryData(agentsKeys.skill(skill.id), saved);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.skills });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.skillVersions(skill.id),
      });
      onDone();
    },
    onError: (error) => {
      if (isRevisionConflict(error)) {
        setConflict(true);
        return;
      }
      const problems = frontMatterProblemsOf(error);
      if (problems.length > 0) {
        setRefused({ content: state.draft.content, problems });
        state.setSelected(SKILL_MD);
        return;
      }
      notify.error(error);
    },
  });

  return (
    <div className='flex min-w-0 flex-col gap-4' data-testid='skill-editor'>
      <div className='sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur-md md:-mx-6 md:px-6'>
        <span className='shrink-0 text-sm font-medium'>
          {t('skills.editing')}
        </span>
        <Input
          id='ag-skill-edit-note'
          value={note}
          maxLength={500}
          aria-label={t('skills.note')}
          placeholder={t('skills.notePlaceholder')}
          className='min-w-40 flex-1'
          onChange={(event) => setNote(event.target.value)}
        />
        <div className='flex shrink-0 gap-2'>
          <Button
            variant='outline'
            disabled={save.isPending}
            onClick={() =>
              state.dirty || note.trim() ? setLeaving(true) : onDone()
            }
          >
            {t('actions.cancel')}
          </Button>
          <Button
            disabled={
              check.blocked ||
              serverProblems.length > 0 ||
              conflict ||
              save.isPending
            }
            onClick={() => save.mutate()}
          >
            {save.isPending ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <SaveIcon data-icon='inline-start' />
            )}
            {t('skills.saveVersion')}
          </Button>
        </div>
      </div>
      {conflict ? (
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>{t('skills.conflictTitle')}</AlertTitle>
          <AlertDescription>{t('skills.conflictDraft')}</AlertDescription>
          {onReload ? (
            <AlertAction>
              <Button size='sm' variant='outline' onClick={onReload}>
                {t('skills.loadLatest')}
              </Button>
            </AlertAction>
          ) : null}
        </Alert>
      ) : null}
      <SkillWorkbench
        state={state}
        editable
        saved={{ id: skill.id, version: skill.version }}
        serverProblems={serverProblems}
      />
      <DiscardDialog
        open={leaving}
        onKeep={() => setLeaving(false)}
        onDiscard={onDone}
      />
    </div>
  );
}
