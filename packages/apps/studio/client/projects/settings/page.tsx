/**
 * A project's Settings tab, for those who may manage the project: a section navigation beside the chosen section's
 * cards, each saving on its own (T4.1, T4.2). The section and, for the sections about one repository, which repository
 * are in the URL (`?section=ci&repo=<resourceId>`, `model.ts`), so a link or a refresh lands where it was:
 *
 * - General (`general-section.tsx`): the project's name and description, and its commit attribution;
 * - Working directories (`directories-section.tsx`): the list, adding one and editing one;
 * - Deployment (`releases/ci-setup/ci-settings.tsx`) and Branch rules (`git/repo-section.tsx`, while the workspace has
 *   a Git connection), for one repository at a time, with a "Repository" switcher when the project has more than one;
 * - Agent run variables, the agents plugin's variables of the project and of every working directory in one table
 *   with a Scope column (scope `project` or `workdir`; a run merges them project < working directory < agent), adding
 *   one choosing its scope;
 * - Default skills, the agents plugin's section for every run in the project or in one of its working directories,
 *   with a scope switcher.
 */
import {
  DefaultSkillsSection,
  ScopedVariablesSection,
} from '@nocobase/app-plugin-agents/client/kit';
import { useProjectResources } from '@nocobase/app-plugin-projects/client/projects';
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from 'cn';

import { useGitStatus } from '../../git/api.js';
import { GitRepoSection } from '../../git/repo-section.js';
import { CiSettings } from '../../releases/ci-setup/ci-settings.js';
import { useProjectPage } from '../detail/context.js';
import { DirectoriesSection } from './directories-section.js';
import { GeneralSection } from './general-section.js';
import {
  isSettingsSection,
  REPOSITORY_SECTIONS,
  resourceName,
  sectionsOf,
  type SettingsSection,
} from './model.js';
import { SettingsCard } from './settings-card.js';

const SELECT_CONTENT =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';
const PROJECT_SCOPE = 'project';

function SectionNav({
  sections,
  current,
  hrefOf,
}: {
  readonly sections: readonly SettingsSection[];
  readonly current: SettingsSection;
  readonly hrefOf: (section: SettingsSection) => string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('projectPage.settings.nav')}
      className='md:sticky md:top-4 md:self-start'
    >
      <ul className='-mx-1 flex gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:overflow-visible md:px-0'>
        {sections.map((section) => (
          <li key={section} className='shrink-0'>
            <Link
              to={hrefOf(section)}
              replace
              aria-current={current === section ? 'page' : undefined}
              data-section-link={section}
              className={cn(
                'block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                current === section && 'bg-muted font-medium text-foreground',
              )}
            >
              {t(`projectPage.settings.sections.${section}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The section's title and description, with the repository or scope switcher at its end. */
function SectionHeader({
  section,
  switcher,
}: {
  readonly section: SettingsSection;
  readonly switcher?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div className='flex min-w-0 flex-col gap-1'>
        <h2 className='text-base font-medium'>
          {t(`projectPage.settings.sections.${section}`)}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {t(`projectPage.settings.descriptions.${section}`)}
        </p>
      </div>
      {switcher}
    </div>
  );
}

function Switcher({
  id,
  label,
  value,
  items,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly items: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}): ReactElement {
  return (
    <div className='flex items-center gap-2' data-settings-switcher={id}>
      <label htmlFor={id} className='text-sm text-muted-foreground'>
        {label}
      </label>
      <Select
        items={items}
        value={value}
        onValueChange={(next: string | null) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger id={id} className='w-full sm:w-56'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align='end' className={SELECT_CONTENT}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ProjectSettings(): ReactElement {
  const { project, canEdit } = useProjectPage();
  const { t } = useTranslation();
  const git = useGitStatus().data;
  const resources = useProjectResources(project.id, project.resources);
  const [search, setSearch] = useSearchParams();
  const sorted = resources.sorted;
  const repositories = sorted.filter((resource) => resource.type === 'gitRepo');
  const sections = sectionsOf(sorted, Boolean(git?.enabled));
  const asked = search.get('section');
  const section: SettingsSection =
    isSettingsSection(asked) && sections.includes(asked) ? asked : 'general';
  const repository: ProjectResource | undefined =
    repositories.find((item) => item.id === search.get('repo')) ??
    repositories[0];
  const scope =
    sorted.find((item) => item.id === search.get('scope'))?.id ?? null;

  /** The URL of a section, keeping the chosen repository and scope. */
  const hrefOf = (next: SettingsSection) => {
    const params = new URLSearchParams(search);
    params.set('section', next);
    params.delete('edit');
    return `?${params.toString()}`;
  };
  const choose = (key: string, value: string | null) => {
    const params = new URLSearchParams(search);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearch(params, { replace: true });
  };

  const repositorySwitcher =
    REPOSITORY_SECTIONS.includes(section) && repositories.length > 1 ? (
      <Switcher
        id='project-settings-repository'
        label={t('projectPage.settings.repository')}
        value={repository?.id ?? ''}
        items={repositories.map((item) => ({
          value: item.id,
          label: resourceName(item),
        }))}
        onChange={(id) => choose('repo', id)}
      />
    ) : null;
  const scopeSwitcher =
    section === 'skills' && sorted.length > 0 ? (
      <Switcher
        id='project-settings-scope'
        label={t('projectPage.settings.scope')}
        value={scope ?? PROJECT_SCOPE}
        items={[
          {
            value: PROJECT_SCOPE,
            label: t('projectPage.settings.wholeProject'),
          },
          ...sorted.map((item) => ({
            value: item.id,
            label: resourceName(item),
          })),
        ]}
        onChange={(id) => choose('scope', id === PROJECT_SCOPE ? null : id)}
      />
    ) : null;

  let body: ReactNode = null;
  if (section === 'general')
    body = <GeneralSection project={project} canEdit={canEdit} />;
  else if (section === 'directories')
    body = <DirectoriesSection project={project} canEdit={canEdit} />;
  else if (section === 'ci' && repository)
    body = <CiSettings key={repository.id} resource={repository} />;
  else if (section === 'git' && repository)
    body = <GitRepoSection key={repository.id} resource={repository} />;
  else if (section === 'variables')
    body = (
      <SettingsCard
        id='variables'
        label={t('projectPage.settings.sections.variables')}
        note={t('projectPage.settings.variablesNote')}
      >
        <ScopedVariablesSection
          scopes={[
            {
              scope: 'project',
              scopeId: project.id,
              label: t('projectPage.settings.wholeProject'),
            },
            ...sorted.map((item) => ({
              scope: 'workdir',
              scopeId: item.id,
              label: t('projectPage.settings.workdirScope', {
                name: resourceName(item),
              }),
            })),
          ]}
          canEdit={canEdit}
          description={t('projectPage.settings.variablesDescription')}
          note={
            sorted.length > 0
              ? t('projectPage.settings.variablesOverride')
              : undefined
          }
        />
      </SettingsCard>
    );
  else if (section === 'skills')
    body = (
      <SettingsCard
        id='skills'
        label={t('projectPage.settings.sections.skills')}
      >
        <DefaultSkillsSection
          key={scope ?? PROJECT_SCOPE}
          scope={scope ? 'workdir' : 'project'}
          scopeId={scope ?? project.id}
          canEdit={canEdit}
          description={t(
            scope
              ? 'studioAgents.scopeSections.workdirSkills'
              : 'studioAgents.scopeSections.projectSkills',
          )}
        />
      </SettingsCard>
    );

  return (
    <div
      className='grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)]'
      data-project-settings={section}
    >
      <SectionNav sections={sections} current={section} hrefOf={hrefOf} />
      <div
        className='flex max-w-3xl min-w-0 flex-col gap-6'
        data-settings-body={section}
      >
        <SectionHeader
          section={section}
          switcher={repositorySwitcher ?? scopeSwitcher}
        />
        {body}
      </div>
    </div>
  );
}
