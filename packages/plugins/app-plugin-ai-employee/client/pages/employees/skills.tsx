import type { ReactElement } from 'react';
import { useCatalogDisplay } from '../../catalog-display.js';
import { EmployeeCatalogStatus } from '../../components/employee-catalog-status.js';
import { Switch } from '../../components/ui/switch.js';
import { effectiveSkillNames } from '../../employee-tool-selection.js';
import { useT } from '../../locales/index.js';
import { useEmployeeEditor } from './employee-context.js';
import { Empty, EmptyDescription } from '../../components/ui/empty.js';

export default function EmployeeSkillsPage(): ReactElement {
  const {
    selected,
    draft,
    skills,
    skillsLoading,
    skillsError,
    saving,
    retrySkills,
    updateSkillNames,
  } = useEmployeeEditor();
  const t = useT();
  const { skillTitle, skillDescription, compareTitles } = useCatalogDisplay();
  const skillsByName = new Map(skills.map((item) => [item.name, item]));
  const enabledSkills = new Set(
    effectiveSkillNames(draft.skillSettings, skills),
  );
  const skillNames = [
    ...new Set([
      ...skillsByName.keys(),
      ...draft.skillSettings.skills,
      ...(selected.skillSettings?.enabledSkills ?? []),
      ...(draft.skillSettings.enabledSkills ?? []),
    ]),
  ].sort((left, right) =>
    compareTitles(
      skillTitle(skillsByName.get(left) ?? { name: left }),
      skillTitle(skillsByName.get(right) ?? { name: right }),
      left,
      right,
    ),
  );
  return (
    <div className='space-y-4' aria-busy={skillsLoading}>
      <EmployeeCatalogStatus
        loading={skillsLoading}
        error={skillsError}
        loadingLabel={t('employeeSkills.loading')}
        errorLabel={t('employeeSkills.error')}
        onRetry={retrySkills}
      />
      {skillNames.length ? (
        <ul aria-label={t('Skills')} className='divide-y divide-border'>
          {skillNames.map((name) => {
            const item = skillsByName.get(name);
            const title = skillTitle(item ?? { name });
            return (
              <li
                key={name}
                className='flex items-start justify-between gap-4 py-4'
              >
                <div className='min-w-0 flex-1 space-y-1 [overflow-wrap:anywhere]'>
                  <div className='font-medium'>{title}</div>
                  {title !== name ? (
                    <div className='text-sm text-muted-foreground'>{name}</div>
                  ) : null}
                  {item?.description ? (
                    <p className='text-sm text-muted-foreground'>
                      {skillDescription(item)}
                    </p>
                  ) : null}
                  {!item && !skillsLoading && !skillsError ? (
                    <p className='text-sm text-muted-foreground'>
                      {t('employeeSkills.unavailable')}
                    </p>
                  ) : null}
                </div>
                <Switch
                  className='mt-1'
                  aria-label={t('employeeSkills.use', { name: title })}
                  checked={enabledSkills.has(name)}
                  disabled={skillsLoading || skillsError || saving}
                  onCheckedChange={(checked) =>
                    updateSkillNames((current) =>
                      checked
                        ? [...new Set([...current, name])]
                        : current.filter((value) => value !== name),
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : !skillsLoading && !skillsError ? (
        <Empty className='border'>
          <EmptyDescription>{t('None configured.')}</EmptyDescription>
        </Empty>
      ) : null}
    </div>
  );
}
