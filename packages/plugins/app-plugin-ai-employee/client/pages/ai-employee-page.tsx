import {
  Check,
  ChevronDown,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  Undo2,
  X,
} from 'lucide-react';
import { useToaster } from '@nocobase/app-client';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import { Input } from '../../registry/nocobase-ai/shared/ui/input.js';
import { Textarea } from '../../registry/nocobase-ai/shared/ui/textarea.js';
import { Switch as SkillSwitch } from '../../registry/nocobase-ai/shared/ui/switch.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../registry/nocobase-ai/shared/ui/collapsible.js';
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
import { EmployeeCatalogStatus } from '../components/employee-catalog-status.js';
import { EmployeeToolPermission } from '../components/employee-tool-permission.js';
import { ToolListContent } from '../components/tool-list-content.js';
import { TooltipProvider } from '../../registry/nocobase-ai/shared/ui/tooltip.js';
import {
  effectiveSkillNames,
  effectiveToolNames,
} from '../employee-tool-selection.js';
import { useT } from '../locales/index.js';
import { useCatalogDisplay } from '../catalog-display.js';
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

function ReadonlyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: unknown;
  multiline?: boolean;
}): ReactElement {
  const text =
    typeof value === 'string' ? value : value == null ? '' : String(value);
  return (
    <label className='grid gap-1.5 text-sm'>
      <span className='font-medium'>{label}</span>
      {multiline ? (
        <Textarea
          className='min-h-24 text-muted-foreground'
          value={text}
          disabled
          readOnly
        />
      ) : (
        <Input
          className='h-10 text-muted-foreground'
          value={text}
          disabled
          readOnly
        />
      )}
    </label>
  );
}

function EmptyList({ label }: { label: string }): ReactElement {
  return (
    <p className='rounded-md border border-dashed p-5 text-sm text-muted-foreground'>
      {label}
    </p>
  );
}

function Switch({
  checked,
  disabled = false,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}): ReactElement {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-input'}`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function KnowledgeBaseMultiSelect({
  disabled,
  emptyLabel,
  label,
  onChange,
  options,
  placeholder,
  removeLabel,
  value,
}: {
  disabled: boolean;
  emptyLabel: string;
  label: string;
  onChange: (value: string[]) => void;
  options: KnowledgeBaseOption[];
  placeholder: string;
  removeLabel: string;
  value: string[];
}): ReactElement {
  const selectedOptions = value.map((key) => ({
    key,
    name: options.find((option) => option.key === key)?.name ?? key,
  }));
  return (
    <details
      className='group relative'
      data-disabled={disabled || undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.removeAttribute('open');
        }
      }}
    >
      <summary
        aria-label={label}
        className={`flex min-h-10 list-none items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm marker:content-none ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      >
        <span className='flex min-w-0 flex-1 flex-wrap gap-1'>
          {selectedOptions.length ? (
            selectedOptions.map((option) => (
              <span
                key={option.key}
                className='inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5'
              >
                {option.name}
                <button
                  type='button'
                  aria-label={`${removeLabel} ${option.name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange(value.filter((key) => key !== option.key));
                  }}
                  className='rounded-sm text-muted-foreground hover:text-foreground'
                >
                  <X className='h-3 w-3' />
                </button>
              </span>
            ))
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
        </span>
        <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180' />
      </summary>
      <div className='absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md'>
        {options.length ? (
          options.map((option) => {
            const selected = value.includes(option.key);
            return (
              <button
                type='button'
                key={option.key}
                onClick={() =>
                  onChange(
                    selected
                      ? value.filter((key) => key !== option.key)
                      : [...value, option.key],
                  )
                }
                className='flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground'
              >
                {option.name}
              </button>
            );
          })
        ) : (
          <p className='px-2 py-3 text-sm text-muted-foreground'>
            {emptyLabel}
          </p>
        )}
      </div>
    </details>
  );
}

function ModelMultiSelect({
  disabled,
  models,
  value,
  onChange,
  placeholder,
  removeLabel,
}: {
  disabled: boolean;
  models: EnabledModelOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  removeLabel: string;
}): ReactElement {
  const labels = new Map(
    models.map((item) => [`${item.llmService}::${item.model}`, item.label]),
  );
  const groupedModels: Array<{
    serviceTitle: string;
    models: EnabledModelOption[];
  }> = [];
  for (const model of models) {
    const group = groupedModels.find(
      (item) => item.serviceTitle === model.serviceTitle,
    );
    if (group) {
      group.models.push(model);
    } else {
      groupedModels.push({
        serviceTitle: model.serviceTitle,
        models: [model],
      });
    }
  }
  return (
    <details
      className='group relative'
      data-disabled={disabled || undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.open = false;
        }
      }}
    >
      <summary
        className={`flex min-h-10 list-none items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm marker:content-none ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      >
        <span className='flex min-w-0 flex-1 flex-wrap gap-1'>
          {value.length ? (
            value.map((modelValue) => (
              <span
                key={modelValue}
                className='inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5'
              >
                {labels.get(modelValue) ?? modelValue}
                <button
                  type='button'
                  aria-label={`${removeLabel} ${labels.get(modelValue) ?? modelValue}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange(value.filter((item) => item !== modelValue));
                  }}
                  className='rounded-sm text-muted-foreground hover:text-foreground'
                >
                  <X className='h-3 w-3' />
                </button>
              </span>
            ))
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
        </span>
        <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180' />
      </summary>
      <div className='absolute z-20 mt-1 max-h-[400px] w-full min-w-56 overflow-y-auto rounded-lg bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10'>
        {groupedModels.map((group, groupIndex) => (
          <div
            key={group.serviceTitle}
            className={groupIndex ? 'border-t py-1' : 'py-1'}
          >
            <div className='px-3 py-1.5 text-xs font-medium text-muted-foreground'>
              {group.serviceTitle}
            </div>
            {group.models.map((model) => {
              const modelValue = `${model.llmService}::${model.model}`;
              const checked = value.includes(modelValue);
              return (
                <button
                  type='button'
                  key={modelValue}
                  onClick={() =>
                    onChange(
                      checked
                        ? value.filter((item) => item !== modelValue)
                        : [...value, modelValue],
                    )
                  }
                  className={`flex w-full items-center gap-2 rounded-md py-1.5 pr-3 pl-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground ${checked ? 'bg-accent text-accent-foreground' : ''}`}
                >
                  <span className='flex h-4 w-4 shrink-0 items-center justify-center'>
                    {checked ? <Check className='h-4 w-4' /> : null}
                  </span>
                  <span className='block min-w-0 truncate' title={model.label}>
                    {model.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </details>
  );
}

export default function AIEmployeePage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { skillTitle, skillDescription, toolTitle, toolAbout, compareTitles } =
    useCatalogDisplay();
  const toaster = useToaster();
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
  const [pendingEmployeeUsername, setPendingEmployeeUsername] =
    useState<string>();

  const dirty =
    !!selected &&
    !!draft &&
    stable(draft) !== stable(buildEditableValues(selected));

  const load = useCallback(async (): Promise<void> => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    try {
      const [employeeRows, modelRows, knowledgeRows] = await Promise.all([
        ai.listAIEmployees(controller.signal),
        ai.listEnabledModels(controller.signal),
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
    setPendingEmployeeUsername(undefined);
    setTab('profile');
    setSelectedUsername(username);
  };

  const selectEmployee = (username: string): void => {
    if (username === selectedUsername) return;
    if (dirty) {
      setPendingEmployeeUsername(username);
      return;
    }
    applyEmployeeSelection(username);
  };

  const patchDraft = (patch: Partial<AIEmployeeEditableValues>): void => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const updateSkillNames = (update: (skills: string[]) => string[]): void => {
    if (skillsLoading || skillsError || saving) return;
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
    toolsLoading || toolsError || skillsLoading || skillsError || saving;

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
    if (!selected || !draft || !dirty) return;
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
      <main className='p-8 text-sm text-muted-foreground'>
        {t('Loading AI employees…')}
      </main>
    );
  }
  if (error) {
    return (
      <main className='p-8'>
        <div className='rounded-lg border border-destructive/40 p-5'>
          <p className='text-sm text-destructive'>{error}</p>
          <button
            className='mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm'
            onClick={() => void load()}
          >
            <RefreshCw className='h-4 w-4' /> {t('Retry')}
          </button>
        </div>
      </main>
    );
  }
  if (!employees.length) {
    return (
      <main className='p-8 text-center text-sm text-muted-foreground'>
        {t('No AI employees are available.')}
      </main>
    );
  }

  const useCustomRole = customRoleMode ?? draft?.about != null;
  const selectedModels = draft?.modelSettings.models ?? [];
  const selectedModelValues = new Set(
    selectedModels.map((item) => `${item.llmService}::${item.model}`),
  );
  const selectedKnowledgeBaseKeys =
    draft?.knowledgeBase.knowledgeBaseKeys ?? [];
  const knowledgeBasePromptValid =
    !draft?.enableKnowledgeBase ||
    hasKnowledgeBaseDataPlaceholder(draft.knowledgeBasePrompt);
  const configuredSkills = draft?.skillSettings.skills ?? [];
  const configuredTools = draft?.skillSettings.tools ?? [];
  const skillsByName = new Map(skills.map((item) => [item.name, item]));
  const toolsByName = new Map(tools.map((item) => [item.name, item]));
  const enabledSkills = new Set(
    effectiveSkillNames(draft?.skillSettings, skills),
  );
  const skillNames = [
    ...new Set([
      ...skillsByName.keys(),
      ...configuredSkills,
      ...(selected?.skillSettings?.enabledSkills ?? []),
      ...(draft?.skillSettings.enabledSkills ?? []),
    ]),
  ].sort((left, right) =>
    compareTitles(
      skillTitle(skillsByName.get(left) ?? { name: left }),
      skillTitle(skillsByName.get(right) ?? { name: right }),
      left,
      right,
    ),
  );
  const enabledTools = new Set(
    effectiveToolNames(draft?.skillSettings, tools, skills),
  );
  const toolNames = [
    ...new Set([
      ...toolsByName.keys(),
      ...configuredTools.map((item) => item.name),
      ...(selected?.skillSettings?.enabledTools ?? []),
      ...(draft?.skillSettings.enabledTools ?? []),
      ...enabledTools,
    ]),
  ].sort((left, right) =>
    compareTitles(
      toolTitle(toolsByName.get(left) ?? { name: left }),
      toolTitle(toolsByName.get(right) ?? { name: right }),
      left,
      right,
    ),
  );

  return (
    <Collapsible
      open={employeeListOpen}
      onOpenChange={setEmployeeListExpanded}
      render={<main />}
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
            return (
              <button
                type='button'
                key={employee.username}
                onClick={() => selectEmployee(employee.username)}
                className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/50'}`}
              >
                <div className='flex gap-3'>
                  <AIEmployeeAvatar
                    src={employee.avatar}
                    name={employee.nickname}
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <p className='truncate font-medium'>
                        {employee.nickname ?? employee.username}
                      </p>
                      <span
                        className={`mt-1 h-2 w-2 rounded-full ${employee.enabled === false ? 'bg-muted-foreground/40' : 'bg-emerald-500'}`}
                      />
                    </div>
                    <p className='truncate text-xs text-muted-foreground'>
                      @{employee.username}
                    </p>
                    {employee.position ? (
                      <p className='mt-1 truncate text-xs text-muted-foreground'>
                        {employee.position}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
          {!employees.length ? (
            <p className='p-6 text-center text-sm text-muted-foreground'>
              {t('No AI employees are available.')}
            </p>
          ) : null}
        </div>
      </CollapsibleContent>

      {/* Reserve the pointer target's width so the divider never covers either panel. */}
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
                label={t('Enabled')}
                onCheckedChange={(enabled) => patchDraft({ enabled })}
              />
            </header>

            <div
              className='flex shrink-0 gap-1 overflow-x-auto border-b'
              role='tablist'
            >
              {detailTabs.map((item) => (
                <button
                  type='button'
                  role='tab'
                  aria-selected={tab === item.key}
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === item.key ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'}`}
                >
                  {t(item.label)}
                </button>
              ))}
            </div>

            <div
              className={`min-h-0 min-w-0 flex-1 overflow-y-auto pb-6 ${tab === 'skills' || tab === 'tools' ? 'overflow-x-hidden' : ''}`}
            >
              {tab === 'profile' ? (
                <div className='grid gap-4'>
                  <ReadonlyField
                    label={t('Username')}
                    value={selected.username}
                  />
                  <ReadonlyField
                    label={t('Nickname')}
                    value={selected.nickname}
                  />
                  <ReadonlyField
                    label={t('Position')}
                    value={selected.position}
                  />
                  <ReadonlyField
                    label={t('Bio')}
                    value={selected.bio}
                    multiline
                  />
                  <ReadonlyField
                    label={t('Greeting')}
                    value={selected.greeting}
                    multiline
                  />
                </div>
              ) : null}

              {tab === 'role' ? (
                <div className='flex h-full min-h-80 flex-col gap-4'>
                  <div className='flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground'>
                    <CircleAlert
                      className='mt-0.5 h-4 w-4 shrink-0'
                      aria-hidden='true'
                    />
                    <span>{t('Role setting description')}</span>
                  </div>
                  {selected.builtIn ? (
                    <fieldset className='flex min-h-0 min-w-0 flex-1 flex-col gap-3 text-sm'>
                      <legend className='font-medium'>
                        {t('Role settings')}
                      </legend>
                      <div className='flex items-center gap-6'>
                        <label className='inline-flex items-center gap-2'>
                          <input
                            type='radio'
                            name='role-setting-mode'
                            checked={!useCustomRole}
                            onChange={() => {
                              setCustomRoleMode(false);
                              patchDraft({ about: null });
                            }}
                          />
                          <span>{t('System default')}</span>
                        </label>
                        <label className='inline-flex items-center gap-2'>
                          <input
                            type='radio'
                            name='role-setting-mode'
                            checked={useCustomRole}
                            onChange={() => {
                              setCustomRoleMode(true);
                              patchDraft({
                                about:
                                  draft.about ??
                                  buildEditableValues(selected).about,
                              });
                            }}
                          />
                          <span>{t('Custom')}</span>
                        </label>
                      </div>
                      {!useCustomRole ? (
                        <pre className='min-h-0 w-full flex-1 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm'>
                          {selected.defaultPrompt ?? ''}
                        </pre>
                      ) : (
                        <textarea
                          aria-label={t('Role settings')}
                          placeholder={t('employees.rolePlaceholder')}
                          value={draft.about ?? ''}
                          onChange={(event) =>
                            patchDraft({
                              about:
                                event.target.value === '' &&
                                buildEditableValues(selected).about === null
                                  ? null
                                  : event.target.value,
                            })
                          }
                          className='min-h-0 w-full flex-1 resize-none overflow-auto rounded-md border bg-transparent p-3'
                        />
                      )}
                    </fieldset>
                  ) : (
                    <label className='flex min-h-0 flex-1 flex-col gap-2 text-sm'>
                      <span className='font-medium'>{t('Role settings')}</span>
                      <textarea
                        value={draft.about ?? ''}
                        onChange={(event) =>
                          patchDraft({ about: event.target.value })
                        }
                        className='min-h-0 w-full flex-1 resize-none overflow-auto rounded-md border bg-transparent p-3'
                        placeholder={t('employees.rolePlaceholder')}
                      />
                    </label>
                  )}
                </div>
              ) : null}

              {tab === 'models' ? (
                <div className='space-y-5'>
                  <div className='flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground'>
                    <CircleAlert
                      className='mt-0.5 h-4 w-4 shrink-0'
                      aria-hidden='true'
                    />
                    <span>
                      {t('Restrict this AI employee to the selected models.')}
                    </span>
                  </div>
                  <div className='grid gap-2 text-sm'>
                    <span className='font-medium'>
                      {t('Enable dedicated model configuration')}
                    </span>
                    <Switch
                      checked={draft.modelSettings.enabled === true}
                      label={t('Enable dedicated model configuration')}
                      onCheckedChange={(enabled) =>
                        patchDraft({
                          modelSettings: {
                            ...draft.modelSettings,
                            enabled,
                          },
                        })
                      }
                    />
                  </div>
                  <label className='grid gap-2 text-sm'>
                    <span className='font-medium'>{t('Models')}</span>
                    <ModelMultiSelect
                      disabled={draft.modelSettings.enabled !== true}
                      models={models}
                      value={[...selectedModelValues]}
                      placeholder={t('Select models')}
                      removeLabel={t('Remove')}
                      onChange={(values) => {
                        const next = models
                          .filter((model) =>
                            values.includes(
                              `${model.llmService}::${model.model}`,
                            ),
                          )
                          .map(({ llmService, model }) => ({
                            llmService,
                            model,
                          }));
                        patchDraft({
                          modelSettings: {
                            ...draft.modelSettings,
                            llmService: undefined,
                            model: undefined,
                            models: next,
                          },
                        });
                      }}
                    />
                  </label>
                </div>
              ) : null}

              {tab === 'skills' ? (
                <div className='space-y-4' aria-busy={skillsLoading}>
                  <EmployeeCatalogStatus
                    loading={skillsLoading}
                    error={skillsError}
                    loadingLabel={t('employeeSkills.loading')}
                    errorLabel={t('employeeSkills.error')}
                    onRetry={() => setSkillsRequest((current) => current + 1)}
                  />
                  {skillNames.length ? (
                    <ul
                      aria-label={t('Skills')}
                      className='divide-y divide-border'
                    >
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
                                <div className='text-sm text-muted-foreground'>
                                  {name}
                                </div>
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
                            <SkillSwitch
                              className='mt-1'
                              aria-label={t('employeeSkills.use', {
                                name: title,
                              })}
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
                    <EmptyList label={t('None configured.')} />
                  ) : null}
                </div>
              ) : null}

              {tab === 'tools' ? (
                <div
                  className='flex flex-col gap-4'
                  aria-busy={toolsLoading || skillsLoading}
                >
                  <p className='text-sm text-muted-foreground'>
                    {t('employeeTools.description')}
                  </p>
                  <EmployeeCatalogStatus
                    loading={toolsLoading || skillsLoading}
                    error={toolsError || skillsError}
                    loadingLabel={t('employeeTools.loading')}
                    errorLabel={t('employeeTools.error')}
                    onRetry={() => {
                      if (toolsError) setToolsRequest((current) => current + 1);
                      if (skillsError)
                        setSkillsRequest((current) => current + 1);
                    }}
                  />
                  {toolNames.length ? (
                    <TooltipProvider>
                      <ul
                        aria-label={t('Tools')}
                        className='divide-y divide-border pr-4'
                      >
                        {toolNames.map((name) => {
                          const item = toolsByName.get(name);
                          const title = toolTitle(item ?? { name });
                          const checked = enabledTools.has(name);
                          return (
                            <li
                              key={name}
                              className='flex h-32 min-w-0 items-center justify-between gap-4 overflow-hidden py-4'
                            >
                              <ToolListContent
                                name={name}
                                title={title}
                                about={item ? toolAbout(item) : undefined}
                                status={
                                  !item && !toolsLoading && !toolsError ? (
                                    <span className='text-xs text-muted-foreground'>
                                      {t('employeeTools.unavailable')}
                                    </span>
                                  ) : null
                                }
                              />
                              <div className='flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center sm:gap-5'>
                                <EmployeeToolPermission
                                  item={item}
                                  setting={configuredTools.find(
                                    (setting) => setting.name === name,
                                  )}
                                  title={title}
                                  enabled={checked}
                                  disabled={toolEditsDisabled}
                                  onChange={(autoCall) =>
                                    updateToolPermission(name, autoCall)
                                  }
                                />
                                <SkillSwitch
                                  aria-label={t('employeeTools.use', {
                                    name: title,
                                  })}
                                  checked={checked}
                                  disabled={toolEditsDisabled}
                                  onCheckedChange={(value) =>
                                    updateToolNames(name, value)
                                  }
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </TooltipProvider>
                  ) : !toolsLoading &&
                    !toolsError &&
                    !skillsLoading &&
                    !skillsError ? (
                    <EmptyList label={t('None configured.')} />
                  ) : null}
                </div>
              ) : null}

              {tab === 'knowledge' ? (
                <div className='space-y-5'>
                  <div className='grid justify-items-start gap-2 text-sm font-medium'>
                    <span>{t('Enable Knowledge Base')}</span>
                    <Switch
                      checked={draft.enableKnowledgeBase}
                      label={t('Enable Knowledge Base')}
                      onCheckedChange={(enableKnowledgeBase) =>
                        patchDraft({ enableKnowledgeBase })
                      }
                    />
                  </div>
                  {selected.missingKnowledgeBaseKeys?.length ? (
                    <div className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300'>
                      {t('Missing Knowledge Bases')}:{' '}
                      {selected.missingKnowledgeBaseKeys.join(', ')}
                    </div>
                  ) : null}
                  <label className='grid gap-2 text-sm'>
                    <span className='font-medium'>{t('Knowledge Base')}</span>
                    <KnowledgeBaseMultiSelect
                      disabled={!draft.enableKnowledgeBase}
                      emptyLabel={t('No enabled knowledge bases.')}
                      label={t('Knowledge Base')}
                      options={knowledgeBases}
                      placeholder={t(
                        'Leave blank to retrieve from all knowledge bases',
                      )}
                      removeLabel={t('Remove')}
                      value={selectedKnowledgeBaseKeys}
                      onChange={(knowledgeBaseKeys) =>
                        patchDraft({
                          knowledgeBase: {
                            ...draft.knowledgeBase,
                            knowledgeBaseKeys,
                          },
                        })
                      }
                    />
                    <span className='text-sm text-muted-foreground'>
                      {t(
                        'Actual retrieval is limited to knowledge bases accessible to the roles of the user using this AI employee. Inaccessible knowledge bases are excluded.',
                      )}
                    </span>
                  </label>
                  <fieldset className='grid gap-3 text-sm'>
                    <legend className='mb-3 font-medium'>
                      {t('Retrieval strategy')}
                    </legend>
                    <label className='flex items-start gap-2'>
                      <input
                        className='mt-0.5 shrink-0'
                        type='radio'
                        name='retrieval-strategy'
                        value='onDemand'
                        checked={
                          draft.knowledgeBase.retrievalStrategy === 'onDemand'
                        }
                        disabled={!draft.enableKnowledgeBase}
                        onChange={() =>
                          patchDraft({
                            knowledgeBase: {
                              ...draft.knowledgeBase,
                              retrievalStrategy: 'onDemand',
                            },
                          })
                        }
                      />
                      <span>
                        <span className='block'>{t('Retrieve on demand')}</span>
                        <span className='text-muted-foreground'>
                          {t(
                            'The AI employee retrieves knowledge-base content only when it determines that it is needed.',
                          )}
                        </span>
                      </span>
                    </label>
                    <label className='flex items-start gap-2'>
                      <input
                        className='mt-0.5 shrink-0'
                        type='radio'
                        name='retrieval-strategy'
                        value='always'
                        checked={
                          draft.knowledgeBase.retrievalStrategy === 'always'
                        }
                        disabled={!draft.enableKnowledgeBase}
                        onChange={() =>
                          patchDraft({
                            knowledgeBase: {
                              ...draft.knowledgeBase,
                              retrievalStrategy: 'always',
                            },
                          })
                        }
                      />
                      <span>
                        <span className='block'>
                          {t('Automatically retrieve for every question')}
                        </span>
                        <span className='text-muted-foreground'>
                          {t(
                            'Retrieve before every user question, then answer with the retrieved content.',
                          )}
                        </span>
                      </span>
                    </label>
                  </fieldset>
                  <label className='grid gap-2 text-sm'>
                    <span className='font-medium'>
                      {t('Knowledge Base Prompt')}
                    </span>
                    <textarea
                      disabled={!draft.enableKnowledgeBase}
                      value={draft.knowledgeBasePrompt}
                      onChange={(event) =>
                        patchDraft({ knowledgeBasePrompt: event.target.value })
                      }
                      aria-invalid={!knowledgeBasePromptValid}
                      className={`min-h-28 rounded-lg border bg-transparent p-3 disabled:opacity-50 ${knowledgeBasePromptValid ? '' : 'border-destructive'}`}
                    />
                    {!knowledgeBasePromptValid ? (
                      <span className='text-sm text-destructive'>
                        {t(
                          'Knowledge Base Prompt must include {knowledgeBaseData}.',
                        )}
                      </span>
                    ) : null}
                  </label>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <label className='grid gap-2 text-sm'>
                      <span className='font-medium'>Top K</span>
                      <input
                        type='number'
                        min={1}
                        disabled={!draft.enableKnowledgeBase}
                        value={draft.knowledgeBase.topK ?? 5}
                        onChange={(event) =>
                          patchDraft({
                            knowledgeBase: {
                              ...draft.knowledgeBase,
                              topK: Number(event.target.value),
                            },
                          })
                        }
                        className='h-10 rounded-md border bg-transparent px-3 disabled:opacity-50'
                      />
                      <span className='text-muted-foreground'>
                        {t(
                          'Maximum number of knowledge-base entries returned for each retrieval.',
                        )}
                      </span>
                    </label>
                    <label className='grid gap-2 text-sm'>
                      <span className='font-medium'>{t('Score')}</span>
                      <input
                        type='number'
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={!draft.enableKnowledgeBase}
                        value={draft.knowledgeBase.score ?? 0.5}
                        onChange={(event) =>
                          patchDraft({
                            knowledgeBase: {
                              ...draft.knowledgeBase,
                              score: Number(event.target.value),
                            },
                          })
                        }
                        className='h-10 rounded-md border bg-transparent px-3 disabled:opacity-50'
                      />
                      <span className='text-muted-foreground'>
                        {t(
                          'Minimum similarity score for knowledge-base content to be included in retrieval results.',
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            {saveError ? (
              <p className='rounded-md border border-destructive/40 p-3 text-sm text-destructive'>
                {saveError}
              </p>
            ) : null}
            {dirty ? (
              <footer className='absolute inset-x-0 bottom-0 border-t bg-background'>
                <div className='flex w-full justify-end gap-2 py-2'>
                  <button
                    type='button'
                    className='inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm'
                    onClick={() => {
                      setDraft(buildEditableValues(selected));
                      setCustomRoleMode(undefined);
                      setSaveError('');
                    }}
                  >
                    <Undo2 className='h-4 w-4' /> {t('Cancel')}
                  </button>
                  <button
                    type='button'
                    disabled={saving}
                    className='inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50'
                    onClick={() => void save()}
                  >
                    <Save className='h-4 w-4' />{' '}
                    {saving ? t('Saving…') : t('Save')}
                  </button>
                </div>
              </footer>
            ) : null}
          </div>
        )}
      </section>
      <ConfirmDialog
        open={pendingEmployeeUsername !== undefined}
        title={t('Discard unsaved changes?')}
        description={t(
          'Your changes to this AI employee will be lost if you continue.',
        )}
        cancelLabel={t('Keep editing')}
        confirmLabel={t('Discard changes')}
        onOpenChange={(open) => {
          if (!open) setPendingEmployeeUsername(undefined);
        }}
        onConfirm={() => {
          if (pendingEmployeeUsername) {
            applyEmployeeSelection(pendingEmployeeUsername);
          }
        }}
      />
    </Collapsible>
  );
}
