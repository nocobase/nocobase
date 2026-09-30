import { useEffect, useState, type ReactElement } from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useResolvedPath,
} from 'react-router';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import { useCatalogDisplay } from '../catalog-display.js';
import { useT } from '../locales/index.js';
import type {
  ManagedSkillDetail,
  ManagedSkillSummary,
} from '../skills-management-service.js';
import { RouteDrawer } from './route-drawer.js';
import { Alert, AlertDescription } from './ui/alert.js';
import { Button } from './ui/button.js';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs.js';

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; skill: ManagedSkillDetail };

function SkillDetailSkeleton(): ReactElement {
  const t = useT();
  return (
    <div role='status' className='flex flex-col gap-6 py-6'>
      <span className='sr-only'>{t('skills.detailsLoading')}</span>
      <div aria-hidden='true' className='flex flex-col gap-4'>
        <div className='h-6 w-2/5 rounded-md bg-muted' />
        <div className='flex flex-col gap-3'>
          <div className='h-3 w-full rounded-md bg-muted' />
          <div className='h-3 w-full rounded-md bg-muted' />
          <div className='h-3 w-3/4 rounded-md bg-muted' />
        </div>
        <div className='mt-2 h-28 w-full rounded-lg bg-muted' />
      </div>
    </div>
  );
}

export interface SkillDetailsDrawerProps {
  readonly skillName: string;
  readonly summary?: ManagedSkillSummary;
}

/** Mount at the :skillName route, with instructions and tools child outlets. */
export function SkillDetailsDrawer({
  skillName,
  summary,
}: SkillDetailsDrawerProps): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { skillTitle, skillDescription } = useCatalogDisplay();
  const location = useLocation();
  const navigate = useNavigate();
  const parentPath = useResolvedPath('.');
  const instructionsPath = useResolvedPath('instructions');
  const toolsPath = useResolvedPath('tools');
  // Match through the router so encoded catalog names use its pathname decoding.
  const isParentEntry = useMatch({ path: parentPath.pathname, end: true });
  const isToolsTab = useMatch({ path: toolsPath.pathname, end: true });
  const isInstructionsTab = useMatch({
    path: instructionsPath.pathname,
    end: true,
  });
  const activeTab = isToolsTab
    ? 'tools'
    : isInstructionsTab
      ? 'instructions'
      : null;
  const [state, setState] = useState<DetailState>({
    status: skillName ? 'loading' : 'not-found',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!skillName) return;
    const controller = new AbortController();
    void ai.getManagedSkillDetails(skillName, controller.signal).then(
      (skill) => {
        if (!controller.signal.aborted) setState({ status: 'ready', skill });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status:
              typeof error === 'object' &&
              error !== null &&
              'status' in error &&
              error.status === 404
                ? 'not-found'
                : 'error',
          });
        }
      },
    );
    return () => controller.abort();
  }, [ai, skillName, attempt]);

  const skill = state.status === 'ready' ? state.skill : summary;
  return (
    <RouteDrawer
      title={t('skills.details')}
      description={
        skill
          ? skillDescription(skill) || t('skills.detailsDescription')
          : t('skills.detailsDescription')
      }
      className='sm:max-w-2xl motion-reduce:animate-none motion-reduce:transition-none'
    >
      {isParentEntry ? (
        <Navigate
          to={{ pathname: 'instructions', search: location.search }}
          replace
        />
      ) : null}
      <Tabs
        value={activeTab}
        onValueChange={(value: unknown) => {
          if (value === 'instructions' || value === 'tools') {
            void navigate({ pathname: value, search: location.search });
          }
        }}
        className='min-w-0 flex-col gap-0'
      >
        <div className='flex min-w-0 flex-col gap-2 pb-6 pt-3'>
          <h3 className='font-heading text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]'>
            {skill ? skillTitle(skill) : skillName}
          </h3>
          <p
            translate='no'
            className='break-all font-mono text-xs text-muted-foreground'
          >
            {skillName}
          </p>
        </div>
        <div className='sticky top-0 z-10 flex border-b bg-popover'>
          <TabsList
            activateOnFocus
            variant='line'
            aria-label={t('skills.details')}
          >
            <TabsTrigger value='instructions'>
              {t('skills.instructions')}
            </TabsTrigger>
            <TabsTrigger value='tools'>
              {t('skills.tools')}
              {skill ? (
                <>
                  {' '}
                  <span className='tabular-nums'>({skill.tools.length})</span>
                </>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </div>
        {state.status === 'loading' ? (
          <SkillDetailSkeleton />
        ) : state.status === 'not-found' ? (
          <p role='status' className='py-6 text-sm text-muted-foreground'>
            {t('skills.detailsNotFound')}
          </p>
        ) : state.status === 'error' ? (
          <Alert variant='destructive' className='my-6'>
            <AlertDescription className='flex flex-col items-start gap-3'>
              <p>{t('skills.detailsError')}</p>
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
        ) : (
          <Outlet context={state.skill} />
        )}
      </Tabs>
    </RouteDrawer>
  );
}
