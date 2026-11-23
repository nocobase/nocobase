/**
 * Route `/skills`: the skill library, reusable SKILL.md instructions with supporting files that agents read when a
 * task matches, each named and described by its front matter, with its compatibility. A row opens `/skills/:skillId`, "New skill" opens `new`, "Import" takes a zip
 * in the Agent Skills layout.
 *
 * Mirrors NocoProject's skills page (`nocoproject/client/pages/np/skills/index.tsx`), with each skill's version.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, PuzzleIcon } from 'lucide-react';
import { useContext, useState, type ReactElement } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';

import type { Skill } from '../../../shared/skills.js';
import { agentsKeys } from '../../api/keys.js';
import {
  AgEmpty,
  AgListSkeleton,
  AgLoadError,
} from '../../components/ag-states.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { Button } from '../../components/ui/button.js';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { useSetting } from '../../hooks/use-access.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useFormatters } from '../../lib/format.js';
import {
  SkillSettingsContext,
  type SkillListExtension,
} from '../../lib/skill-settings-context.js';
import { ImportSkillButton } from './import-button.js';

const NO_LIST: SkillListExtension = {};

export default function SkillsPage(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const navigate = useNavigate();
  const format = useFormatters();
  const canManage = useSetting('agents.skills', 'manage');
  const skills = useQuery({
    queryKey: agentsKeys.skills,
    queryFn: () => api.skills(),
  });
  // The application's filters and column (`SkillSettings.useList`); the context does not change while mounted.
  const list = useContext(SkillSettingsContext)?.useList?.() ?? NO_LIST;
  const filters = list.filters ?? [];
  const [filterKey, setFilterKey] = useState<string | null>(null);
  const filter =
    filters.find((candidate) => candidate.key === filterKey) ?? filters[0];
  const shown = filter ? (skills.data ?? []).filter(filter.match) : skills.data;
  const Column = list.column;

  const newButton = () =>
    canManage ? (
      <>
        <ImportSkillButton
          onImported={(skill) => void navigate(encodeURIComponent(skill.id))}
        />
        <Button nativeButton={false} render={<Link to='new' />}>
          <PlusIcon data-icon='inline-start' />
          {t('skills.new')}
        </Button>
      </>
    ) : null;

  let content: ReactElement;
  if (skills.isError && !skills.data)
    content = (
      <AgLoadError
        title={t('skills.loadFailed')}
        error={skills.error}
        onRetry={() => void skills.refetch()}
      />
    );
  else if (!skills.data) content = <AgListSkeleton rows={2} />;
  else if (skills.data.length === 0)
    content = (
      <AgEmpty
        icon={<PuzzleIcon />}
        title={t('skills.emptyTitle')}
        description={
          canManage ? t('skills.emptyDescription') : t('skills.emptyReadOnly')
        }
        action={newButton()}
      />
    );
  else
    content = (
      <div className='flex flex-col gap-3'>
        {filters.length > 1 ? (
          <Tabs
            value={filter?.key ?? ''}
            onValueChange={(value) => setFilterKey(String(value))}
          >
            <TabsList>
              {filters.map((candidate) => (
                <TabsTrigger
                  key={candidate.key}
                  value={candidate.key}
                  data-testid={`skill-filter-${candidate.key}`}
                >
                  {candidate.label}
                  <span className='text-muted-foreground tabular-nums'>
                    {skills.data.filter(candidate.match).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('skills.columns.name')}</TableHead>
                {Column ? <TableHead>{Column.header}</TableHead> : null}
                <TableHead>{t('skills.columns.description')}</TableHead>
                <TableHead className='text-right'>
                  {t('skills.columns.files')}
                </TableHead>
                <TableHead className='text-right'>
                  {t('skills.columns.version')}
                </TableHead>
                <TableHead>{t('skills.columns.updated')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(shown ?? []).map((skill) => (
                <TableRow
                  key={skill.id}
                  data-testid={`skill-${skill.id}`}
                  className='cursor-pointer'
                  onClick={() => void navigate(encodeURIComponent(skill.id))}
                >
                  <TableCell>
                    <SkillName skill={skill} title={list.title?.(skill)} />
                  </TableCell>
                  {Column ? (
                    <TableCell>
                      <Column.Cell skill={skill} />
                    </TableCell>
                  ) : null}
                  <TableCell className='max-w-md'>
                    <span
                      className='line-clamp-2 whitespace-normal text-muted-foreground'
                      title={skill.description}
                    >
                      {skill.description || '—'}
                    </span>
                    {skill.compatibility ? (
                      <span
                        className='mt-1 block truncate text-xs text-muted-foreground'
                        title={skill.compatibility}
                      >
                        {t('skills.compatibility', {
                          value: skill.compatibility,
                        })}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {skill.fileCount}
                  </TableCell>
                  <TableCell className='text-right font-mono text-xs'>
                    v{skill.version}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {format.relative(skill.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );

  return (
    <PageContainer>
      <PageHeader
        title={t('skills.title')}
        description={t('skills.description')}
        actions={skills.data && skills.data.length > 0 ? newButton() : null}
      />
      {content}
      <Outlet />
    </PageContainer>
  );
}

/** A skill's name, under the title the application gives it when that says more than the name. */
function SkillName({
  skill,
  title,
}: {
  readonly skill: Skill;
  readonly title: string | undefined;
}): ReactElement {
  const shown = title && title !== skill.name ? title : undefined;
  return (
    <div className='flex min-w-0 flex-col items-start gap-0.5'>
      <Link
        to={encodeURIComponent(skill.id)}
        onClick={(event) => event.stopPropagation()}
        className={
          shown
            ? 'block max-w-full truncate font-medium hover:underline'
            : 'block max-w-full truncate font-mono font-medium hover:underline'
        }
      >
        {shown ?? skill.name}
      </Link>
      {shown ? (
        <span className='max-w-full truncate font-mono text-xs text-muted-foreground'>
          {skill.name}
        </span>
      ) : null}
    </div>
  );
}
