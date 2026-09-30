import type { ReactElement } from 'react';
import { useCatalogDisplay } from '../../catalog-display.js';
import { EmployeeCatalogStatus } from '../../components/employee-catalog-status.js';
import { EmployeeToolPermission } from '../../components/employee-tool-permission.js';
import { ToolListContent } from '../../components/tool-list-content.js';
import { Switch } from '../../components/ui/switch.js';
import { TooltipProvider } from '../../components/ui/tooltip.js';
import { effectiveToolNames } from '../../employee-tool-selection.js';
import { useT } from '../../locales/index.js';
import { useEmployeeEditor } from './employee-context.js';
import { Empty, EmptyDescription } from '../../components/ui/empty.js';

export default function EmployeeToolsPage(): ReactElement {
  const {
    selected,
    draft,
    skills,
    skillsLoading,
    skillsError,
    tools,
    toolsLoading,
    toolsError,
    retrySkills,
    retryTools,
    toolEditsDisabled,
    updateToolNames,
    updateToolPermission,
  } = useEmployeeEditor();
  const t = useT();
  const { toolTitle, toolAbout, compareTitles } = useCatalogDisplay();
  const toolsByName = new Map(tools.map((item) => [item.name, item]));
  const configuredTools = draft.skillSettings.tools;
  const enabledTools = new Set(
    effectiveToolNames(draft.skillSettings, tools, skills),
  );
  const toolNames = [
    ...new Set([
      ...toolsByName.keys(),
      ...configuredTools.map((item) => item.name),
      ...(selected.skillSettings?.enabledTools ?? []),
      ...(draft.skillSettings.enabledTools ?? []),
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
          if (toolsError) retryTools();
          if (skillsError) retrySkills();
        }}
      />
      {toolNames.length ? (
        <TooltipProvider>
          <ul aria-label={t('Tools')} className='divide-y divide-border pr-4'>
            {toolNames.map((name) => {
              const item = toolsByName.get(name);
              const title = toolTitle(item ?? { name });
              const checked = enabledTools.has(name);
              return (
                <li
                  key={name}
                  className='flex min-h-32 min-w-0 items-center justify-between gap-4 overflow-hidden py-4'
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
                    <Switch
                      aria-label={t('employeeTools.use', { name: title })}
                      checked={checked}
                      disabled={toolEditsDisabled}
                      onCheckedChange={(value) => updateToolNames(name, value)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      ) : !toolsLoading && !toolsError && !skillsLoading && !skillsError ? (
        <Empty className='border'>
          <EmptyDescription>{t('None configured.')}</EmptyDescription>
        </Empty>
      ) : null}
    </div>
  );
}
