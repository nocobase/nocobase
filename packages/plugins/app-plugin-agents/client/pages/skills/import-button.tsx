/**
 * "Import": a zip in the Agent Skills layout, uploaded (`POST /skills/uploads`) and imported (`POST /skills/import`) as
 * a new skill, or with `skill` as a new version of it. A front matter the server refuses is named in the toast.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileArchiveIcon } from 'lucide-react';
import { useRef, type ReactElement } from 'react';

import {
  formatBytes,
  SKILL_UPLOAD_MAX_BYTES,
  type SkillDetail,
  type SkillView,
} from '../../../shared/skills.js';
import { agentsKeys } from '../../api/keys.js';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { frontMatterProblemsOf } from './workbench/state.js';

export function ImportSkillButton({
  skill,
  onImported,
  variant = 'outline',
}: {
  /** Import as a new version of this skill, made against its current version. */
  readonly skill?: Pick<SkillDetail, 'id' | 'version'>;
  readonly onImported: (skill: SkillView) => void;
  readonly variant?: 'outline' | 'default';
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const run = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > SKILL_UPLOAD_MAX_BYTES)
        throw new Error(
          t('skills.uploadTooLarge', {
            name: file.name,
            max: formatBytes(SKILL_UPLOAD_MAX_BYTES),
          }),
        );
      const stored = await api.uploadSkillFile(file);
      return api.importSkill({
        archive: stored.id,
        ...(skill
          ? { skillId: skill.id, expectedRevision: skill.version }
          : {}),
      });
    },
    onSuccess: (imported) => {
      notify.success(
        skill
          ? t('skills.saved', { version: imported.version })
          : t('skills.imported', { name: imported.name }),
      );
      queryClient.setQueryData(agentsKeys.skill(imported.id), imported);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.skills });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.skillVersions(imported.id),
      });
      onImported(imported);
    },
    onError: (error) => {
      const [problem] = frontMatterProblemsOf(error);
      if (problem)
        notify.error(
          null,
          t('skills.importInvalid', {
            problem: t(`skills.frontMatter.reasons.${problem.reason}`, {
              field: problem.field,
              ...(problem.max === undefined ? {} : { max: problem.max }),
            }),
          }),
        );
      else notify.error(error);
    },
  });
  return (
    <>
      <Button
        variant={variant}
        disabled={run.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {run.isPending ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <FileArchiveIcon data-icon='inline-start' />
        )}
        {skill ? t('skills.importVersion') : t('skills.import')}
      </Button>
      <input
        ref={inputRef}
        type='file'
        accept='.zip,application/zip'
        hidden
        data-testid='skill-import'
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) run.mutate(file);
        }}
      />
    </>
  );
}
