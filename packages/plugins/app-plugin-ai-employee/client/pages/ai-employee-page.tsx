import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  Undo2,
} from 'lucide-react';
import { useToaster } from '@nocobase/app-client';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Outlet, useNavigate } from 'react-router';

import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Button } from '../components/ui/button.js';
import { Empty, EmptyDescription } from '../components/ui/empty.js';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '../components/ui/item.js';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.js';
import { Switch } from '../components/ui/switch.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible.js';
import {
  buildEditableValues,
  hasKnowledgeBaseDataPlaceholder,
  type AIEmployeeEditableValues,
  type AIEmployeeRecord,
  type AIMetadataItem,
  type EnabledModelOption,
  type KnowledgeBaseOption,
} from '../ai-employee-service.js';
import { AIEmployeeAvatar } from '../avatar.js';
import { ConfirmDialog } from '../components/confirm-dialog.js';
import { useHistoryGuard } from '../components/use-history-guard.js';
import { useLeaveGuard } from '../components/use-leave-guard.js';
import { useCanManageAISettings } from '../settings-permissions.js';
import {
  effectiveSkillNames,
  effectiveToolNames,
} from '../employee-tool-selection.js';
import { useT } from '../locales/index.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';

type DetailTab =
  'profile' | 'role' | 'models' | 'skills' | 'tools' | 'knowledge';

const detailTabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'role', label: 'Role settings' },
  { key: 'models', label: 'Model settings' },
  { key: 'skills', label: 'Skills' },
  { key: 'tools', label: 'Tools' },
  { key: 'knowledge', label: 'Knowledge Base' },
];

const stable = (value: unknown): string => JSON.stringify(value);

const employeeRoutePattern =
  /^\/settings\/ai\/employees\/([^/]+)(?:\/([^/]+))?/;

function routeEmployee(pathname: string): string | undefined {
  const segment = employeeRoutePattern.exec(pathname)?.[1];
  if (!segment) return undefined;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export default function AIEmployeePage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const toaster = useToaster();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<AIEmployeeRecord[]>([]);
  const [employeeListExpanded, setEmployeeListExpanded] = useState<boolean>();
  const employeeListOpen = employeeListExpanded ?? employees.length > 1;
  const employeeListId = useId();
  const employeeDividerRef = useRef<HTMLDivElement>(null);
  const alignEmployeeToggle = useCallback((header: HTMLElement | null) => {
    const divider = employeeDividerRef.current;
    if (!header || !divider) return;

    const measure = (): void => {
      const bounds = header.getBoundingClientRect();
      if (!bounds.height) return;
      // Include the detail padding, but not the height of the editor or sidebar.
      divider.style.setProperty(
        '--employee-header-midpoint',
        `${bounds.top + bounds.height / 2 - divider.getBoundingClientRect().top}px`,
      );
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(header, { box: 'border-box' });
    observer?.observe(divider, { box: 'border-box' });
    const section = header.closest('section');
    if (section) observer?.observe(section);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      divider.style.removeProperty('--employee-header-midpoint');
    };
  }, []);
  const [selectedUsername, setSelectedUsername] = useState<string>();
  const selectedUsernameRef = useRef(selectedUsername);
  useLayoutEffect(() => {
    selectedUsernameRef.current = selectedUsername;
  }, [selectedUsername]);
  const [selected, setSelected] = useState<AIEmployeeRecord>();
  const [draft, setDraft] = useState<AIEmployeeEditableValues>();
  const [customRoleMode, setCustomRoleMode] = useState<boolean>();
  const [models, setModels] = useState<EnabledModelOption[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseOption[]>(
    [],
  );
  const [skills, setSkills] = useState<AIMetadataItem[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState(false);
  const [skillsRequest, setSkillsRequest] = useState(0);
  const [tools, setTools] = useState<AIMetadataItem[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [toolsError, setToolsError] = useState(false);
  const [toolsRequest, setToolsRequest] = useState(0);
  const [tab, setTab] = useState<DetailTab>('profile');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const canManage = useCanManageAISettings('employees');

  const dirty =
    !!selected &&
    !!draft &&
    stable(draft) !== stable(buildEditableValues(selected));

  const guard = useLeaveGuard({ dirty, pending: saving });
  // Tabs of the same employee share one draft, so only history entries for another employee ask first.
  const historyGuard = useHistoryGuard({
    dirty,
    pending: saving,
    allows: (next) =>
      selectedUsername !== undefined &&
      routeEmployee(next.pathname) === selectedUsername,
  });
  // While a traversal is held, keep rendering the employee being left rather than the URL.
  const location = historyGuard.location;
  const routeUsername = routeEmployee(location.pathname);
  const routeTab = employeeRoutePattern.exec(location.pathname)?.[2] as
    DetailTab | undefined;
  const routeTabActive = Boolean(
    routeUsername &&
    routeTab &&
    detailTabs.some((item) => item.key === routeTab),
  );
  const load = useCallback(async (): Promise<void> => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    try {
      const [employeeRows, modelRows, knowledgeRows] = await Promise.all([
        ai.listAIEmployees(controller.signal),
        ai.listEnabledModels(controller.signal),
        // The knowledge base plugin is optional; without it there is nothing to choose from.
        ai.listEnabledKnowledgeBases(controller.signal).catch(() => []),
      ]);
      setEmployees(employeeRows);
      setModels(modelRows);
      setKnowledgeBases(knowledgeRows);
      setSelectedUsername((current) =>
        current && employeeRows.some((item) => item.username === current)
          ? current
          : employeeRows[0]?.username,
      );
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [ai]);

  useEffect(() => {
    if (loading || !employees.length) return;
    // Keep the selected employee, and its draft, when the bare settings URL is opened again.
    const username =
      routeUsername ?? selectedUsernameRef.current ?? employees[0]?.username;
    if (!username) return;
    if (!routeUsername) {
      navigate(
        {
          pathname: `/settings/ai/employees/${encodeURIComponent(username)}/profile`,
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
    }
    setSelectedUsername(username);
    if (routeTab && detailTabs.some((item) => item.key === routeTab))
      setTab(routeTab);
  }, [
    employees,
    loading,
    location.hash,
    location.search,
    navigate,
    routeTab,
    routeUsername,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    setSkillsLoading(true);
    setSkillsError(false);
    void ai
      .listAISkills(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setSkills(items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSkillsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSkillsLoading(false);
      });
    return () => controller.abort();
  }, [ai, skillsRequest]);

  useEffect(() => {
    const controller = new AbortController();
    setToolsLoading(true);
    setToolsError(false);
    void ai
      .listAITools(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setTools(items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setToolsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setToolsLoading(false);
      });
    return () => controller.abort();
  }, [ai, toolsRequest]);

  useEffect(() => {
    if (!selectedUsername) {
      setSelected(undefined);
      setDraft(undefined);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setSaveError('');
    void ai
      .getAIEmployee(selectedUsername, controller.signal)
      .then((employee) => {
        if (controller.signal.aborted) return;
        setSelected(employee);
        setDraft(buildEditableValues(employee));
        setCustomRoleMode(undefined);
        setEmployees((current) =>
          current.map((item) =>
            item.username === employee.username
              ? { ...item, ...employee }
              : item,
          ),
        );
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setSaveError(cause instanceof Error ? cause.message : String(cause));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [ai, selectedUsername]);

  const applyEmployeeSelection = (username: string): void => {
    if (selected) {
      setDraft(buildEditableValues(selected));
      setCustomRoleMode(undefined);
    }
    setTab('profile');
    setSelectedUsername(username);
    void navigate({
      pathname: `/settings/ai/employees/${encodeURIComponent(username)}/profile`,
      search: location.search,
      hash: location.hash,
    });
  };

  const selectEmployee = (username: string): void => {
    if (username === selectedUsername) return;
    if (!dirty) {
      applyEmployeeSelection(username);
      return;
    }
    void guard.confirmLeave().then((allowed) => {
      if (allowed) applyEmployeeSelection(username);
    });
  };

  const patchDraft = (patch: Partial<AIEmployeeEditableValues>): void => {
    if (!canManage) return;
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const updateSkillNames = (update: (skills: string[]) => string[]): void => {
    if (!canManage || skillsLoading || skillsError || saving) return;
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        skillSettings: {
          ...current.skillSettings,
          enabledSkills: update(
            effectiveSkillNames(current.skillSettings, skills),
          ),
        },
      };
    });
  };

  const toolEditsDisabled =
    !canManage ||
    toolsLoading ||
    toolsError ||
    skillsLoading ||
    skillsError ||
    saving;

  const updateToolNames = (name: string, checked: boolean): void => {
    if (toolEditsDisabled) return;
    setDraft((current) => {
      if (!current) return current;
      const names = effectiveToolNames(current.skillSettings, tools, skills);
      return {
        ...current,
        skillSettings: {
          ...current.skillSettings,
          enabledTools: checked
            ? [...new Set([...names, name])]
            : names.filter((value) => value !== name),
        },
      };
    });
  };

  const updateToolPermission = (name: string, autoCall: boolean): void => {
    if (toolEditsDisabled) return;
    setDraft((current) => {
      if (
        !current ||
        !effectiveToolNames(current.skillSettings, tools, skills).includes(name)
      )
        return current;
      const settings = current.skillSettings.tools;
      return {
        ...current,
        skillSettings: {
          ...current.skillSettings,
          tools: settings.some((tool) => tool.name === name)
            ? settings.map((tool) =>
                tool.name === name ? { ...tool, autoCall } : tool,
              )
            : [...settings, { name, autoCall }],
        },
      };
    });
  };

  const save = async (): Promise<void> => {
    if (!canManage || !selected || !draft || !dirty) return;
    if (
      draft.enableKnowledgeBase &&
      !hasKnowledgeBaseDataPlaceholder(draft.knowledgeBasePrompt)
    ) {
      setTab('knowledge');
      setSaveError(
        t('Knowledge Base Prompt must include {knowledgeBaseData}.'),
      );
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await ai.updateAIEmployee(selected, draft);
      setSelected(updated);
      setDraft(buildEditableValues(updated));
      setCustomRoleMode(undefined);
      setEmployees((current) =>
        current.map((item) =>
          item.username === updated.username ? { ...item, ...updated } : item,
        ),
      );
      toaster.show({
        type: 'success',
        title: t('AI employee saved'),
        description: t('Your changes have been saved successfully.'),
      });
    } catch (cause) {
      toaster.show({
        type: 'error',
        title: t('Unable to save changes.'),
        description: cause instanceof Error ? cause.message : String(cause),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p role='status' className='text-sm text-muted-foreground'>
        {t('Loading AI employees…')}
      </p>
    );
  }
  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription className='flex flex-col items-start gap-3'>
          <p>{error}</p>
          <Button variant='outline' onClick={() => void load()}>
            <RefreshCw data-icon='inline-start' aria-hidden='true' />
            {t('Retry')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!employees.length) {
    return (
      <Empty className='border'>
        <EmptyDescription>
          {t('No AI employees are available.')}
        </EmptyDescription>
      </Empty>
    );
  }
  if (
    routeUsername &&
    !employees.some((employee) => employee.username === routeUsername)
  ) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {t('AI employee not found.')}
      </p>
    );
  }

  return (
    <Collapsible
      open={employeeListOpen}
      onOpenChange={setEmployeeListExpanded}
      render={<div />}
      className={`grid h-[clamp(52rem,85dvh,68rem)] min-h-0 grid-cols-[44px_minmax(0,1fr)] overflow-hidden lg:h-auto lg:flex-1 ${employeeListOpen ? 'grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[19rem_32px_minmax(0,1fr)] lg:pointer-coarse:grid-cols-[19rem_44px_minmax(0,1fr)]' : 'grid-rows-[minmax(0,1fr)] lg:grid-cols-[32px_minmax(0,1fr)] lg:pointer-coarse:grid-cols-[44px_minmax(0,1fr)]'} lg:grid-rows-[minmax(0,1fr)]`}
    >
      <CollapsibleContent
        keepMounted
        id={employeeListId}
        render={<aside aria-label={t('AI Employees')} />}
        className='col-span-2 min-h-0 min-w-0 overflow-hidden border-b p-4 lg:col-span-1 lg:border-b-0'
      >
        <div className='max-h-40 space-y-2 overflow-y-auto pr-1 lg:h-full lg:max-h-none'>
          {employees.map((employee) => {
            const active = employee.username === selectedUsername;
            const enabled = employee.enabled !== false;
            return (
              <Item
                key={employee.username}
                variant='outline'
                render={<button type='button' />}
                aria-current={active ? 'true' : undefined}
                onClick={() => selectEmployee(employee.username)}
                className={`flex-nowrap items-start gap-3 rounded-xl p-3 text-left ${active ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/50'}`}
              >
                <ItemMedia>
                  <AIEmployeeAvatar
                    src={employee.avatar}
                    name={employee.nickname}
                  />
                </ItemMedia>
                <ItemContent className='min-w-0'>
                  <ItemTitle className='w-full justify-between'>
                    <span className='truncate'>
                      {employee.nickname ?? employee.username}
                    </span>
                    <span
                      aria-hidden='true'
                      className={`size-2 shrink-0 rounded-full ${enabled ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                    />
                    <span className='sr-only'>
                      {enabled ? t('Enabled') : t('Disabled')}
                    </span>
                  </ItemTitle>
                  <ItemDescription className='truncate text-xs'>
                    @{employee.username}
                  </ItemDescription>
                  {employee.position ? (
                    <ItemDescription className='truncate text-xs'>
                      {employee.position}
                    </ItemDescription>
                  ) : null}
                </ItemContent>
              </Item>
            );
          })}
        </div>
      </CollapsibleContent>

      {/* Reserve the pointer target's width so the divider never covers either panel. The toggle and its column are
          fixed pixels on purpose: 44px is the coarse-pointer minimum target, which a smaller spacing theme must not
          shrink. */}
      <div ref={employeeDividerRef} className='relative min-h-11 self-stretch'>
        <div
          aria-hidden='true'
          className='absolute inset-y-0 left-1/2 border-l'
        />
        <CollapsibleTrigger
          render={<Button variant='outline' size='icon' />}
          aria-controls={employeeListId}
          aria-label={
            employeeListOpen
              ? t('Collapse employee list')
              : t('Expand employee list')
          }
          title={
            employeeListOpen
              ? t('Collapse employee list')
              : t('Expand employee list')
          }
          style={{ top: 'var(--employee-header-midpoint, 3rem)' }}
          className='absolute left-1/2 size-[44px] -translate-x-1/2 -translate-y-1/2 text-muted-foreground transition-colors active:not-aria-[haspopup]:-translate-y-1/2 lg:size-[32px] lg:pointer-coarse:size-[44px]'
        >
          {employeeListOpen ? (
            <ChevronLeft className='size-4' aria-hidden='true' />
          ) : (
            <ChevronRight className='size-4' aria-hidden='true' />
          )}
        </CollapsibleTrigger>
      </div>

      <section className='min-h-0 min-w-0 overflow-hidden p-4 sm:p-6 lg:p-8'>
        {detailLoading || !selected || !draft ? (
          <p
            ref={alignEmployeeToggle}
            className='text-sm text-muted-foreground'
          >
            {t('Loading employee details…')}
          </p>
        ) : (
          <div className='relative flex h-full min-h-0 flex-col gap-6 pb-16'>
            <header
              ref={alignEmployeeToggle}
              className='flex shrink-0 flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center'
            >
              <AIEmployeeAvatar
                src={selected.avatar}
                name={selected.nickname}
                className='h-16 w-16'
              />
              <div className='min-w-0 flex-1'>
                <h2 className='truncate text-xl font-semibold'>
                  {selected.nickname ?? selected.username}
                </h2>
                <p className='text-sm text-muted-foreground'>
                  @{selected.username}
                  {selected.position ? ` · ${selected.position}` : ''}
                </p>
              </div>
              <Switch
                checked={draft.enabled}
                disabled={!canManage}
                aria-label={t('Enabled')}
                onCheckedChange={(enabled) => patchDraft({ enabled })}
              />
            </header>

            {/* Each Tab is a child route: activation navigates, so focus moves with the arrow keys and
                Enter or Space opens a Tab without adding a history entry per key press. */}
            <Tabs
              value={routeTab ?? tab}
              onValueChange={(value: unknown) => {
                if (
                  !selectedUsername ||
                  !detailTabs.some((item) => item.key === value)
                )
                  return;
                void navigate({
                  pathname: `/settings/ai/employees/${encodeURIComponent(selectedUsername)}/${String(value)}`,
                  search: location.search,
                  hash: location.hash,
                });
              }}
              className='shrink-0 gap-0'
            >
              <div className='flex overflow-x-auto border-b'>
                <TabsList variant='line' aria-label={t('Employee settings')}>
                  {detailTabs.map((item) => (
                    <TabsTrigger key={item.key} value={item.key}>
                      {t(item.label)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>

            <div className='min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-6'>
              {routeUsername &&
              !employees.some(
                (employee) => employee.username === routeUsername,
              ) ? (
                <p role='alert' className='text-sm text-destructive'>
                  {t('AI employee not found.')}
                </p>
              ) : routeUsername && !routeTabActive ? (
                <p role='alert' className='text-sm text-destructive'>
                  {t('Employee settings tab not found.')}
                </p>
              ) : (
                // Without `manage` the tabs show the employee read-only: every control inside is disabled.
                <fieldset disabled={!canManage} className='contents'>
                  <Outlet
                    context={{
                      selected,
                      draft,
                      saving,
                      customRoleMode,
                      setCustomRoleMode,
                      patchDraft,
                      models,
                      knowledgeBases,
                      skills,
                      skillsLoading,
                      skillsError,
                      retrySkills: () =>
                        setSkillsRequest((current) => current + 1),
                      tools,
                      toolsLoading,
                      toolsError,
                      retryTools: () =>
                        setToolsRequest((current) => current + 1),
                      updateSkillNames,
                      toolEditsDisabled,
                      updateToolNames,
                      updateToolPermission,
                    }}
                  />
                </fieldset>
              )}
            </div>
            {saveError ? (
              <Alert variant='destructive'>
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            ) : null}
            {dirty && canManage ? (
              <footer className='absolute inset-x-0 bottom-0 border-t bg-background'>
                <div className='flex w-full justify-end gap-2 py-2'>
                  <Button
                    variant='outline'
                    disabled={saving}
                    onClick={() => {
                      setDraft(buildEditableValues(selected));
                      setCustomRoleMode(undefined);
                      setSaveError('');
                    }}
                  >
                    <Undo2 data-icon='inline-start' aria-hidden='true' />
                    {t('Cancel')}
                  </Button>
                  <Button disabled={saving} onClick={() => void save()}>
                    <Save data-icon='inline-start' aria-hidden='true' />
                    {saving ? t('Saving…') : t('Save')}
                  </Button>
                </div>
              </footer>
            ) : null}
          </div>
        )}
      </section>
      <ConfirmDialog
        open={guard.confirming || historyGuard.confirming}
        title={t('Discard unsaved changes?')}
        description={t(
          'Your changes to this AI employee will be lost if you continue.',
        )}
        cancelLabel={t('Keep editing')}
        confirmLabel={t('Discard changes')}
        onOpenChange={(open) => {
          if (open) return;
          guard.cancel();
          historyGuard.cancel();
        }}
        onConfirm={() => {
          if (historyGuard.confirming) historyGuard.confirm();
          else guard.confirm();
        }}
      />
    </Collapsible>
  );
}
