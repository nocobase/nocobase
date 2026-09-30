import { Wrench } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { SkillToolBadges } from '../components/skill-tool-badges.js';
import { useT } from '../locales/index.js';
import { useCatalogDisplay } from '../catalog-display.js';
import { SettingsShell } from '../settings-shell.js';
import { type ManagedSkillSummary } from '../skills-management-service.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import { Empty, EmptyDescription } from '../components/ui/empty.js';

type SkillsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; skills: ManagedSkillSummary[] };

export default function SkillsSettingsPage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { skillTitle, skillDescription, toolTitle, compareTitles, locale } =
    useCatalogDisplay();
  const [state, setState] = useState<SkillsState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    void ai.listManagedSkills(controller.signal).then(
      (skills) => {
        if (!controller.signal.aborted) setState({ status: 'ready', skills });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      },
    );
    return () => controller.abort();
  }, [ai, attempt]);

  const keyword = query.trim().toLocaleLowerCase(locale);
  const skills =
    state.status === 'ready'
      ? state.skills
          .filter((skill) =>
            [
              skill.name,
              skillTitle(skill),
              skillDescription(skill),
              ...skill.tools.flatMap((tool) => [tool.name, toolTitle(tool)]),
            ].some((value) =>
              value.toLocaleLowerCase(locale).includes(keyword),
            ),
          )
          .sort((left, right) =>
            compareTitles(
              skillTitle(left),
              skillTitle(right),
              left.name,
              right.name,
            ),
          )
      : [];

  function openSkill(
    skill: ManagedSkillSummary,
    button: HTMLButtonElement | null,
  ): void {
    button?.focus();
    void navigate({
      pathname: encodeURIComponent(skill.name),
      search: location.search,
    });
  }

  return (
    <SettingsShell title='Skills' description='skills.pageDescription'>
      <section aria-label={t('Skills')} className='flex min-w-0 flex-col gap-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <Input
            type='search'
            aria-label={t('Search skills')}
            placeholder={t('Search skills')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className='w-full max-w-md'
          />
          {state.status === 'ready' ? (
            <p aria-live='polite' className='text-sm text-muted-foreground'>
              {t('skills.count', { count: skills.length })}
            </p>
          ) : null}
        </div>
        {state.status === 'loading' ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('Loading skills…')}
          </p>
        ) : state.status === 'error' ? (
          <Alert variant='destructive'>
            <AlertDescription className='flex flex-col items-start gap-3'>
              <p>{t('Unable to load skills.')}</p>
              <Button
                variant='outline'
                onClick={() => {
                  setState({ status: 'loading' });
                  setAttempt((value) => value + 1);
                }}
              >
                {t('Retry')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : !skills.length ? (
          <Empty role='status' className='border'>
            <EmptyDescription>
              {t(
                state.skills.length
                  ? 'No skills match your search.'
                  : 'No skills are available.',
              )}
            </EmptyDescription>
          </Empty>
        ) : (
          <ul
            aria-label={t('Skills')}
            className='grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
          >
            {skills.map((skill) => (
              <li key={skill.name} className='min-w-0'>
                <Card
                  className='h-64 min-w-0 cursor-pointer hover:ring-ring'
                  onClick={(event) =>
                    openSkill(
                      skill,
                      event.currentTarget.querySelector('button'),
                    )
                  }
                >
                  <CardHeader className='min-w-0 shrink-0'>
                    <CardTitle
                      role='heading'
                      aria-level={2}
                      className='min-w-0'
                    >
                      <Button
                        variant='link'
                        aria-haspopup='dialog'
                        className='h-11 min-w-0 max-w-full justify-start px-0 text-left hover:no-underline'
                        title={skillTitle(skill)}
                        onClick={(event) => {
                          event.stopPropagation();
                          openSkill(skill, event.currentTarget);
                        }}
                      >
                        <span className='truncate'>{skillTitle(skill)}</span>
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      <span
                        translate='no'
                        className='block truncate font-mono text-xs'
                        title={skill.name}
                      >
                        {skill.name}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='min-h-0 min-w-0 flex-1 overflow-hidden'>
                    <p
                      className='line-clamp-3 whitespace-pre-wrap [overflow-wrap:anywhere]'
                      title={skillDescription(skill)}
                    >
                      {skillDescription(skill)}
                    </p>
                  </CardContent>
                  <CardFooter
                    role='group'
                    aria-label={t('skills.tools')}
                    className='mt-auto h-14 min-w-0 shrink-0 flex-nowrap gap-2'
                  >
                    <Wrench
                      aria-hidden='true'
                      className='size-4 shrink-0 text-muted-foreground'
                    />
                    {skill.tools.length ? (
                      <SkillToolBadges tools={skill.tools} />
                    ) : (
                      <span className='text-muted-foreground'>
                        {t('skills.noTools')}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Outlet context={state.status === 'ready' ? state.skills : []} />
    </SettingsShell>
  );
}
