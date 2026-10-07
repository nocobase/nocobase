/**
 * Route `/skills`: the skill library, reusable SKILL.md instructions with supporting files that agents read when a
 * task matches, each named and described by its front matter, with whether it holds scripts (which online agents read
 * but never run) and its compatibility. A row opens `/skills/:skillId`, "New skill" opens `new`, "Import" takes a zip
 * in the Agent Skills layout.
 *
 * Mirrors NocoProject's skills page (`nocoproject/client/pages/np/skills/index.tsx`), with each skill's version.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, SparklesIcon, TerminalIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';

import { agentsKeys } from '../../api/keys.js';
import {
  AgEmpty,
  AgListSkeleton,
  AgLoadError,
} from '../../components/ag-states.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
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
import { ImportSkillButton } from './import-button.js';

export default function SkillsPage(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const navigate = useNavigate();
  const format = useFormatters();
  const canManage = useSetting('agents.agents', 'manage');
  const skills = useQuery({
    queryKey: agentsKeys.skills,
    queryFn: () => api.skills(),
  });

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
        icon={<SparklesIcon />}
        title={t('skills.emptyTitle')}
        description={
          canManage ? t('skills.emptyDescription') : t('skills.emptyReadOnly')
        }
        action={newButton()}
      />
    );
  else
    content = (
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('skills.columns.name')}</TableHead>
              <TableHead>{t('skills.columns.description')}</TableHead>
              <TableHead className='text-right'>
                {t('skills.columns.files')}
              </TableHead>
              <TableHead className='text-right'>
                {t('skills.columns.version')}
              </TableHead>
              <TableHead className='text-right'>
                {t('skills.columns.agents')}
              </TableHead>
              <TableHead>{t('skills.columns.updated')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.data.map((skill) => (
              <TableRow
                key={skill.id}
                data-testid={`skill-${skill.id}`}
                className='cursor-pointer'
                onClick={() => void navigate(encodeURIComponent(skill.id))}
              >
                <TableCell>
                  <div className='flex min-w-0 flex-col items-start gap-1'>
                    <Link
                      to={encodeURIComponent(skill.id)}
                      onClick={(event) => event.stopPropagation()}
                      className='block max-w-full truncate font-mono font-medium hover:underline'
                    >
                      {skill.name}
                    </Link>
                    {skill.scriptCount > 0 ? (
                      <Badge
                        variant='secondary'
                        data-testid={`skill-${skill.id}-scripts`}
                      >
                        <TerminalIcon data-icon='inline-start' />
                        {t('skills.scriptsNote')}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
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
                <TableCell className='text-right tabular-nums'>
                  {skill.agentCount}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {format.relative(skill.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
