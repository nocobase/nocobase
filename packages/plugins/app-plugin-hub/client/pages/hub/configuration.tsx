import {
  Columns2,
  PanelLeft,
  PanelRight,
  Check,
  ChevronRight,
  ExternalLink,
  FileCode2,
  FileUp,
  Info,
  LoaderCircle,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge.js';
import { Alert, AlertDescription } from '../../components/ui/alert.js';
import { Button } from '../../components/ui/button.js';
import { useTranslation } from '@nocobase/i18n/client';
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { parse as parseYaml } from 'yaml';
import type {
  ConfigMode,
  AppDetail,
  ConfigChangeSummary,
  DiffLine,
  ReleaseRecord,
} from './types.js';
import { AppDialog } from './shared.js';
import { ErrorNotification } from './shared.js';
import { shortId, formatDate, readError } from './utils.js';

export const ConfigEditor: import('react').LazyExoticComponent<
  (typeof import('../../components/config-editor.js'))['ConfigEditor']
> = lazy(async () => {
  const module = await import('../../components/config-editor.js');
  return { default: module.ConfigEditor };
});

export const ConfigMergeEditor: import('react').LazyExoticComponent<
  (typeof import('../../components/config-editor.js'))['ConfigMergeEditor']
> = lazy(async () => {
  const module = await import('../../components/config-editor.js');
  return { default: module.ConfigMergeEditor };
});

export const ConfigUnifiedDiff: import('react').LazyExoticComponent<
  (typeof import('../../components/config-editor.js'))['ConfigUnifiedDiff']
> = lazy(async () => {
  const module = await import('../../components/config-editor.js');
  return { default: module.ConfigUnifiedDiff };
});

const CONFIG_MODES: readonly {
  readonly value: ConfigMode;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly icon: ReactNode;
  readonly disabled?: boolean;
}[] = [
  {
    value: 'file',
    titleKey: 'configuration.configFile',
    descriptionKey: 'configuration.configFileDescription',
    icon: <FileCode2 />,
  },
  {
    value: 'managed',
    titleKey: 'configuration.hubManaged',
    descriptionKey: 'configuration.hubManagedDescription',
    icon: <Sparkles />,
    disabled: true,
  },
  {
    value: 'external',
    titleKey: 'configuration.external',
    descriptionKey: 'configuration.externalDescription',
    icon: <ExternalLink />,
  },
];

function useConfigImport({
  content,
  initial,
  importContext,
  onContent,
  disabled,
}: {
  content: string;
  initial: string;
  importContext: string;
  onContent: (value: string) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const importInputRef = useRef<HTMLInputElement>(null);
  const importRequestRef = useRef(0);
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  type ImportState = {
    context: string;
    importing?: boolean;
    importError?: string;
    pendingImport?: { name: string; content: string };
    importedConfig?: { name: string; previous: string };
  };

  const [importState, setImportState] = useState<ImportState>({
    context: importContext,
  });
  const {
    importing = false,
    importError,
    pendingImport,
    importedConfig,
  } = importState.context === importContext ? importState : {};
  const updateImport = (patch: Partial<Omit<ImportState, 'context'>>): void => {
    setImportState((previous) => ({
      ...(previous.context === importContext
        ? previous
        : { context: importContext }),
      ...patch,
    }));
  };
  useEffect(() => {
    return () => {
      importRequestRef.current += 1;
    };
  }, [importContext]);
  const applyImport = (file: { name: string; content: string }): void => {
    updateImport({
      importedConfig: { name: file.name, previous: contentRef.current },
      pendingImport: undefined,
    });
    onContent(file.content);
  };
  const importFile = async (file: File): Promise<void> => {
    const request = ++importRequestRef.current;
    updateImport({
      importError: undefined,
      pendingImport: undefined,
      importing: true,
    });
    try {
      if (
        !/\.ya?ml$/i.test(file.name) ||
        file.size === 0 ||
        file.size > 1024 * 1024
      )
        throw new Error('invalid file');
      const value = new TextDecoder('utf-8', { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      if (!value.trim() || validateConfigDocument(value, t))
        throw new Error('invalid yaml');
      if (request !== importRequestRef.current) return;
      const next = { name: file.name, content: value };
      if (contentRef.current !== initial) updateImport({ pendingImport: next });
      else applyImport(next);
    } catch {
      if (request === importRequestRef.current)
        updateImport({
          importError: t('configuration.importError', {
            defaultValue:
              'Choose a non-empty UTF-8 .yml or .yaml file up to 1 MiB with a valid YAML object.',
          }),
        });
    } finally {
      if (request === importRequestRef.current)
        updateImport({ importing: false });
    }
  };
  return {
    importedConfig,
    blocked: importing || Boolean(pendingImport),
    reset: () => setImportState({ context: importContext }),
    controls: (
      <div className='flex flex-wrap items-center gap-1'>
        <input
          ref={importInputRef}
          type='file'
          tabIndex={-1}
          accept='.yml,.yaml'
          className='sr-only'
          aria-label={t('configuration.importConfig', {
            defaultValue: 'Import file',
          })}
          disabled={disabled || importing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void importFile(file);
          }}
        />
        <Button
          variant='ghost'
          size='sm'
          disabled={disabled || importing}
          onClick={() => importInputRef.current?.click()}
        >
          <FileUp className='size-3.5' />
          {t('configuration.importConfig', {
            defaultValue: 'Import file',
          })}
        </Button>
        {importedConfig && (
          <Button
            variant='ghost'
            size='sm'
            disabled={disabled || importing}
            onClick={() => {
              onContent(importedConfig.previous);
              updateImport({
                importedConfig: undefined,
                pendingImport: undefined,
                importError: undefined,
              });
            }}
          >
            {t('configuration.undoImport', {
              defaultValue: 'Undo import',
            })}
          </Button>
        )}
      </div>
    ),
    notices: (
      <>
        {importError && (
          <p role='alert' className='px-4 py-2 text-sm text-destructive'>
            {importError}
          </p>
        )}
        {pendingImport && (
          <div
            role='alert'
            className='flex flex-wrap items-center gap-2 border-b px-4 py-3 text-sm'
          >
            <p>
              {t('configuration.replaceDraft', {
                defaultValue: 'Importing replaces your edited draft. Continue?',
              })}
            </p>
            <Button
              size='sm'
              disabled={disabled}
              onClick={() => applyImport(pendingImport)}
            >
              {t('configuration.confirmImport', {
                defaultValue: 'Replace draft',
              })}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => updateImport({ pendingImport: undefined })}
            >
              {t('releases.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        )}
        {importedConfig && (
          <p className='border-b px-4 py-2 text-xs text-muted-foreground'>
            {t('configuration.importDraftNotice', {
              defaultValue:
                'Imported into the editor only. Review and submit to apply changes. Undo import also discards edits made after importing.',
            })}
          </p>
        )}
      </>
    ),
  };
}

export function Configuration({
  mode: serverMode,
  content: serverContent,
  busy,
  canUpdate,
  onSave,
}: {
  readonly mode: ConfigMode;
  readonly content: string;
  readonly busy: boolean;
  readonly canUpdate: boolean;
  readonly onSave: (content: string) => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const [baseline, setBaseline] = useState({
    mode: serverMode,
    content: serverContent,
  });
  const { mode, content } = baseline;
  const source = CONFIG_MODES.find((item) => item.value === mode);
  const [draft, setDraft] = useState(serverContent);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const serverChanged = serverMode !== mode || serverContent !== content;
  // Adjust pristine state before rendering children. Dirty drafts (including
  // imported files) remain attached to their original baseline until confirmed.
  if (
    serverChanged &&
    (draft === content || (serverMode === mode && draft === serverContent))
  ) {
    setBaseline({ mode: serverMode, content: serverContent });
    setDraft(serverContent);
    setConfirmReload(false);
  }
  const configImport = useConfigImport({
    content: draft,
    initial: content,
    importContext: `${mode}:${content}`,
    onContent: setDraft,
    disabled: busy || !canUpdate || reviewOpen,
  });
  const validationError = validateConfigDocument(draft, t);
  const changed = draft !== content;
  return (
    <div className='space-y-5'>
      {serverChanged && (
        <div
          role='alert'
          className='flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm'
        >
          <p>
            {t('configuration.serverChanged', {
              defaultValue:
                'Server configuration has changed. Your unsaved draft has been preserved.',
            })}
          </p>
          {confirmReload ? (
            <>
              <p>
                {t('configuration.discardDraftWarning', {
                  defaultValue:
                    'Reloading discards your unsaved changes. Continue?',
                })}
              </p>
              <Button
                size='sm'
                onClick={() => {
                  setBaseline({ mode: serverMode, content: serverContent });
                  setDraft(serverContent);
                  setConfirmReload(false);
                  setReviewOpen(false);
                  configImport.reset();
                }}
              >
                {t('configuration.discardAndReload', {
                  defaultValue: 'Discard draft and reload',
                })}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setConfirmReload(false)}
              >
                {t('releases.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </>
          ) : (
            <Button
              size='sm'
              variant='outline'
              onClick={() => setConfirmReload(true)}
            >
              {t('configuration.reloadServerConfig', {
                defaultValue: 'Reload server configuration',
              })}
            </Button>
          )}
        </div>
      )}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='font-semibold'>
            {t('configuration.title', { defaultValue: 'Configuration' })}
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('configuration.description', {
              defaultValue: 'Configuration source used by this application.',
            })}
          </p>
        </div>
        <Badge className='gap-1.5 bg-muted text-foreground [&_svg]:size-3.5'>
          {source?.icon}{' '}
          {source
            ? t(source.titleKey, {
                defaultValue:
                  mode === 'file'
                    ? 'Config file'
                    : mode === 'managed'
                      ? 'Hub managed'
                      : 'External',
              })
            : mode}
        </Badge>
      </div>
      {mode === 'file' ? (
        <div className='space-y-4'>
          <div className='overflow-hidden rounded-xl border'>
            <div className='flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3'>
              <span className='flex items-center gap-2 text-sm font-medium'>
                <FileCode2 className='size-4' />{' '}
                {t('configuration.fileName', { defaultValue: 'config.yml' })}
              </span>
              {canUpdate && configImport.controls}
            </div>
            {canUpdate && configImport.notices}
            {configImport.importedConfig && (
              <p className='border-b px-4 py-2 text-xs text-muted-foreground break-all'>
                {t('configuration.importedFrom', {
                  name: configImport.importedConfig.name,
                  defaultValue: `Imported from ${configImport.importedConfig.name} · Editable`,
                })}
              </p>
            )}
            <Suspense fallback={<ConfigEditorFallback />}>
              <ConfigEditor
                value={draft}
                readOnly={!canUpdate}
                onChange={canUpdate ? setDraft : undefined}
              />
            </Suspense>
          </div>
          <ConfigStatus
            error={validationError}
            summary={summarizeConfigChanges('file', 'file', content, draft)}
          />
          {canUpdate ? (
            <>
              <ConfigReloadNotice />
              <div className='flex justify-end'>
                <Button
                  disabled={
                    busy ||
                    serverChanged ||
                    configImport.blocked ||
                    !changed ||
                    validationError !== null
                  }
                  onClick={() => setReviewOpen(true)}
                >
                  {busy
                    ? t('configuration.publishing', {
                        defaultValue: 'Publishing…',
                      })
                    : t('configuration.saveAndPublish', {
                        defaultValue: 'Save and publish',
                      })}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      {mode === 'external' ? (
        <Alert className='bg-muted/20'>
          <ExternalLink />
          <AlertDescription>
            {t('configuration.externalNotice', {
              defaultValue:
                'Configuration and secrets are supplied by the runtime environment. Hub does not create, mount, or edit a configuration file for this deployment.',
            })}
          </AlertDescription>
        </Alert>
      ) : null}
      {reviewOpen && canUpdate ? (
        <AppDialog
          wide
          title={t('configuration.reviewTitle', {
            defaultValue: 'Review configuration changes',
          })}
          description={t('configuration.reviewDescription', {
            defaultValue:
              'Review the current and new configuration before publishing. This reloads configuration without restarting the application.',
          })}
          onClose={() => setReviewOpen(false)}
          footerClassName='justify-between'
          footer={
            <>
              <Button variant='outline' onClick={() => setReviewOpen(false)}>
                {t('configuration.back', { defaultValue: 'Back' })}
              </Button>
              <Button
                disabled={
                  busy ||
                  serverChanged ||
                  configImport.blocked ||
                  !changed ||
                  validationError !== null
                }
                onClick={() => {
                  setReviewOpen(false);
                  onSave(draft);
                }}
              >
                {t('configuration.saveAndPublish', {
                  defaultValue: 'Save and publish',
                })}
              </Button>
            </>
          }
        >
          <ConfigChangesReview
            current={content}
            value={draft}
            baselineMode={mode}
            validationError={validationError}
            expanded
          />
          <div className='mt-4'>
            <ConfigReloadNotice />
          </div>
        </AppDialog>
      ) : null}
    </div>
  );
}

export function ConfigReloadNotice(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  return (
    <Alert>
      <Info />
      <AlertDescription>
        {t('configuration.reloadNotice', {
          defaultValue:
            'Configuration reload does not restart the application. Services that support live updates apply changes immediately. Other changes take effect after the application restarts. Stopped applications load the configuration on next start.',
        })}
      </AlertDescription>
    </Alert>
  );
}

export function ConfigChangesReview({
  current,
  value,
  baselineMode,
  validationError,
  expanded = false,
}: {
  readonly current: string;
  readonly value: string;
  readonly baselineMode: ConfigMode;
  readonly validationError: string | null;
  readonly expanded?: boolean;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  return (
    <div className='space-y-4'>
      <ConfigStatus
        error={validationError}
        summary={summarizeConfigChanges(baselineMode, 'file', current, value)}
      />
      <details className='overflow-hidden rounded-lg border' open={expanded}>
        <summary className='cursor-pointer bg-muted/20 px-3 py-2 text-sm font-medium'>
          {t('configuration.reviewChanges', {
            defaultValue: 'Review configuration changes',
          })}
        </summary>
        <Suspense fallback={<ConfigEditorFallback />}>
          <ConfigUnifiedDiff
            current={baselineMode === 'file' ? current : ''}
            value={value}
          />
        </Suspense>
      </details>
    </div>
  );
}

export function DeploymentDialog({
  app,
  releaseId,
  mode,
  content,
  baselineContent,
  baselineMode,
  rollback,
  busy,
  onRelease,
  loadTemplate,
  onMode,
  onContent,
  onClose,
  onComplete,
}: {
  readonly app: AppDetail;
  readonly releaseId: string | undefined;
  readonly mode: ConfigMode;
  readonly content: string;
  readonly baselineContent: string;
  readonly baselineMode: ConfigMode;
  readonly rollback: boolean;
  readonly busy: boolean;
  readonly onRelease: (releaseId: string) => void;
  readonly loadTemplate: (
    appId: string,
    releaseId: string,
  ) => Promise<string | null>;
  readonly onMode: (mode: ConfigMode) => void;
  readonly onContent: (content: string) => void;
  readonly onClose: () => void;
  readonly onComplete: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-hub');
  const firstStep = rollback ? 1 : 0;
  const [step, setStep] = useState(firstStep);
  const [retry, setRetry] = useState(0);
  const [templateError, setTemplateError] = useState<string>();
  const [releaseTemplate, setReleaseTemplate] = useState('');
  const [loadedReleaseId, setLoadedReleaseId] = useState<string>();
  const configImport = useConfigImport({
    content,
    initial:
      app.app.currentDeploymentId && baselineMode === 'file'
        ? baselineContent
        : releaseTemplate,
    importContext: `${releaseId}:${mode}`,
    onContent: (value) => {
      onContent(value);
      setVisibleConfig('both');
    },
    disabled: busy || loadedReleaseId !== releaseId,
  });
  const { importedConfig } = configImport;
  const editingConfig = step > 0;
  const configReady = loadedReleaseId === releaseId && releaseId !== undefined;
  useEffect(() => {
    if (!editingConfig || !releaseId || loadedReleaseId === releaseId) return;
    let cancelled = false;
    void loadTemplate(app.app.id, releaseId)
      .then((template) => {
        if (cancelled) return;
        setReleaseTemplate(template ?? '');
        onContent(
          app.app.currentDeploymentId && baselineMode === 'file'
            ? baselineContent
            : (template ?? ''),
        );
        if (!rollback) onMode(template !== null ? 'file' : baselineMode);
        setLoadedReleaseId(releaseId);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setTemplateError(readError(reason).message);
      });
    return () => {
      cancelled = true;
    };
  }, [
    editingConfig,
    releaseId,
    loadedReleaseId,
    retry,
    loadTemplate,
    app.app.id,
    app.app.currentDeploymentId,
    baselineMode,
    baselineContent,
    rollback,
    onContent,
    onMode,
  ]);
  const [visibleConfig, setVisibleConfig] = useState<
    'both' | 'current' | 'new'
  >('both');
  const release = app.releases.find((item) => item.id === releaseId);
  // Releases may share a version string — a rebuilt beta uploaded twice looks identical apart from its checksum — so
  // the picker marks which one is running and which one is the newest upload.
  const currentReleaseId =
    app.deployment.observedReleaseId ?? app.deployment.desiredReleaseId;
  const latestReleaseId = app.releases[0]?.id;
  const releaseLabel = (item: ReleaseRecord | undefined): string =>
    item ? `v${item.version} · ${item.checksum.slice(0, 12)}` : '—';
  const validationError =
    mode === 'file' ? validateConfigDocument(content, t) : null;
  const summary = summarizeConfigChanges(
    baselineMode,
    mode,
    baselineContent,
    content,
  );
  return (
    <AppDialog
      title={
        rollback
          ? t('deployments.rollbackTitle', {
              defaultValue: 'Roll back application',
            })
          : t('deployments.deployTitle', {
              defaultValue: 'Deploy application',
            })
      }
      description={app.app.name}
      onClose={onClose}
      wide
      footerClassName='justify-between'
      footer={
        <>
          <Button
            onClick={step === firstStep ? onClose : () => setStep(step - 1)}
            variant='outline'
          >
            {step === firstStep
              ? t('releases.cancel', { defaultValue: 'Cancel' })
              : t('configuration.back', { defaultValue: 'Back' })}
          </Button>
          {step < 2 ? (
            <Button
              disabled={
                !release ||
                busy ||
                configImport.blocked ||
                (step === 1 &&
                  (!configReady ||
                    mode === 'managed' ||
                    validationError !== null))
              }
              onClick={() => {
                setTemplateError(undefined);
                setStep(step + 1);
              }}
            >
              {t('configuration.continue', { defaultValue: 'Continue' })}{' '}
              <ChevronRight />
            </Button>
          ) : (
            <Button
              disabled={
                busy ||
                configImport.blocked ||
                !release ||
                !configReady ||
                mode === 'managed' ||
                validationError !== null
              }
              onClick={onComplete}
            >
              {busy
                ? rollback
                  ? t('deployments.rollingBack', {
                      defaultValue: 'Rolling back…',
                    })
                  : t('deployments.deploying', { defaultValue: 'Deploying…' })
                : rollback
                  ? t('deployments.rollback', { defaultValue: 'Roll back' })
                  : t('deployments.deploy', { defaultValue: 'Deploy release' })}
            </Button>
          )}
        </>
      }
      subheader={
        <>
          <DeploymentSteps current={step} rollback={rollback} />
          {step === 1 ? (
            <div className='mt-5 space-y-5'>
              {rollback ? (
                <div className='flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3 text-sm'>
                  <span className='text-muted-foreground'>
                    {t('deployments.release', { defaultValue: 'Release' })}
                  </span>
                  <span className='font-medium'>{releaseLabel(release)}</span>
                </div>
              ) : null}
              {rollback ? (
                <div className='flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3 text-sm'>
                  <span className='text-muted-foreground'>
                    {t('configuration.source', {
                      defaultValue: 'Configuration source',
                    })}
                  </span>
                  <span className='font-medium'>
                    {localizedConfigModeLabel(mode, t)}
                  </span>
                </div>
              ) : (
                <ConfigModePicker
                  value={mode}
                  onChange={(nextMode) => {
                    if (nextMode !== mode) configImport.reset();
                    onMode(nextMode);
                  }}
                />
              )}
            </div>
          ) : null}
        </>
      }
    >
      <div>
        {step === 0 ? (
          <div className='max-h-[22rem] overflow-y-auto rounded-xl border'>
            {app.releases.map((item) => (
              <Button
                className={`grid h-auto w-full grid-cols-[minmax(0,1fr)_auto] justify-stretch rounded-none border-b px-4 py-3 text-left last:border-0 ${releaseId === item.id ? 'bg-primary/5' : ''}`}
                disabled={busy}
                key={item.id}
                onClick={() => {
                  if (item.id !== releaseId) {
                    configImport.reset();
                    setLoadedReleaseId(undefined);
                    setTemplateError(undefined);
                  }
                  onRelease(item.id);
                }}
                variant='ghost'
              >
                <span className='flex items-center gap-3'>
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-full border ${releaseId === item.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                  >
                    {releaseId === item.id ? (
                      <Check className='size-3' />
                    ) : null}
                  </span>
                  <span>
                    <span className='flex items-center gap-2 text-sm font-medium'>
                      v{item.version}
                      {item.id === currentReleaseId ? (
                        <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'>
                          {t('deployments.current', {
                            defaultValue: 'Current',
                          })}
                        </Badge>
                      ) : item.id === latestReleaseId ? (
                        <Badge className='bg-sky-500/10 text-sky-700 dark:text-sky-300'>
                          {t('releases.latest', { defaultValue: 'Latest' })}
                        </Badge>
                      ) : null}
                    </span>
                    <span className='font-mono text-[11px] text-muted-foreground'>
                      {item.checksum.slice(0, 12)}
                    </span>
                  </span>
                </span>
                <span className='text-xs text-muted-foreground'>
                  {formatDate(item.createdAt, i18n.language)}
                </span>
              </Button>
            ))}
          </div>
        ) : !configReady ? (
          <div className='min-h-80 py-6'>
            {templateError ? (
              <>
                <ErrorNotification
                  message={t('configuration.templateLoadFailed', {
                    error: templateError,
                    defaultValue: `Failed to load configuration template: ${templateError}`,
                  })}
                />
                <Button
                  variant='outline'
                  onClick={() => {
                    setTemplateError(undefined);
                    setRetry((value) => value + 1);
                  }}
                >
                  {t('configuration.retry', { defaultValue: 'Retry' })}
                </Button>
              </>
            ) : (
              <div
                role='status'
                className='flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground'
              >
                <LoaderCircle className='size-4 animate-spin' />
                {t('configuration.loadingTemplate', {
                  defaultValue: 'Loading configuration template…',
                })}
              </div>
            )}
          </div>
        ) : step === 1 ? (
          <div className='space-y-5'>
            {mode === 'file' ? (
              <div className='space-y-3'>
                {release?.hasConfigTemplate ? (
                  <Alert className='border-blue-500/25 bg-blue-500/5'>
                    <Info className='size-4 shrink-0 text-blue-600' />
                    <AlertDescription>
                      {t('configuration.templateWarning', {
                        defaultValue:
                          'The Release template contains example configuration. If you use it, replace example values, credentials, and secrets with deployment-ready values.',
                      })}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div>
                  <div className='overflow-hidden rounded-xl border'>
                    <div className='flex flex-wrap items-end justify-between gap-3 border-b bg-muted/20 px-4 pt-3'>
                      <div className='pb-3'>
                        <div className='flex items-center gap-2 text-sm font-medium'>
                          <FileCode2 className='size-4 text-primary' />
                          {t('configuration.deploymentConfiguration', {
                            defaultValue: 'Deployment configuration',
                          })}
                        </div>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {t(
                            'configuration.deploymentConfigurationDescription',
                            {
                              defaultValue:
                                'Apply template changes from left to right, or edit the draft. The active configuration remains unchanged until deployment.',
                            },
                          )}
                        </p>
                      </div>
                      <div className='pb-3'>
                        <div
                          role='group'
                          aria-label={t('configuration.layout', {
                            defaultValue: 'Configuration layout',
                          })}
                          className='inline-flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5'
                        >
                          {(
                            [
                              [
                                'current',
                                t('configuration.releaseTemplateOnly', {
                                  defaultValue: 'Release template only',
                                }),
                                PanelLeft,
                              ],
                              [
                                'both',
                                t('configuration.sideBySide', {
                                  defaultValue: 'Side by side',
                                }),
                                Columns2,
                              ],
                              [
                                'new',
                                t('configuration.deploymentDraftOnly', {
                                  defaultValue: 'Deployment draft only',
                                }),
                                PanelRight,
                              ],
                            ] as const
                          ).map(([value, label, Icon]) => (
                            <Button
                              key={value}
                              size='icon'
                              variant='ghost'
                              className={`size-7 rounded-md ${visibleConfig === value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                              aria-label={label}
                              aria-pressed={visibleConfig === value}
                              title={label}
                              onClick={() => setVisibleConfig(value)}
                            >
                              <Icon className='size-4' />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {configImport.notices}
                    {importedConfig && (
                      <p className='border-b px-4 py-2 text-xs text-muted-foreground'>
                        {t('configuration.importWarning', {
                          defaultValue:
                            'Check the target database before deployment: migrations may run. Database drivers must be included in the release; localhost, paths and environment variables refer to the deployment environment. Undo import also discards edits made after importing.',
                        })}
                      </p>
                    )}
                    <div className='[--config-merge-gutter:24px]'>
                      <div
                        className={`grid ${visibleConfig === 'both' ? 'grid-cols-[minmax(0,1fr)_var(--config-merge-gutter)_minmax(0,1fr)]' : 'grid-cols-1'} border-b bg-muted/20`}
                      >
                        <div
                          hidden={visibleConfig === 'new'}
                          className='px-4 py-2.5'
                        >
                          <p className='text-xs font-medium'>
                            {t('configuration.releaseTemplate', {
                              defaultValue: 'Release template',
                            })}
                          </p>
                          <p className='mt-0.5 text-xs text-muted-foreground'>
                            {release?.hasConfigTemplate
                              ? t('configuration.releaseTemplateReadOnly', {
                                  version: release.version,
                                  defaultValue: `Release v${release.version} · Read-only`,
                                })
                              : t('configuration.noReleaseTemplate', {
                                  defaultValue: 'No Release template',
                                })}
                          </p>
                        </div>
                        {visibleConfig === 'both' && (
                          <div aria-hidden='true' className='border-x' />
                        )}
                        <div
                          hidden={visibleConfig === 'current'}
                          className='px-4 py-2.5'
                        >
                          <div className='flex flex-wrap items-center justify-between gap-2'>
                            <p className='text-xs font-medium'>
                              {t('configuration.deploymentDraft', {
                                defaultValue: 'Deployment draft',
                              })}
                            </p>
                            {configImport.controls}
                          </div>
                          <p className='mt-0.5 break-all text-xs text-muted-foreground'>
                            {importedConfig
                              ? t('configuration.importedFrom', {
                                  name: importedConfig.name,
                                  defaultValue: `Imported from ${importedConfig.name} · Editable`,
                                })
                              : baselineMode === 'file' &&
                                  app.app.currentDeploymentId
                                ? t('configuration.fromCurrentDeployment', {
                                    id: shortId(app.app.currentDeploymentId),
                                    defaultValue: `From current deployment ${shortId(app.app.currentDeploymentId)} · Editable`,
                                  })
                                : release?.hasConfigTemplate
                                  ? t('configuration.fromReleaseTemplate', {
                                      defaultValue:
                                        'From Release template · Editable',
                                    })
                                  : t('configuration.emptyDraft', {
                                      defaultValue:
                                        'Empty configuration · Editable',
                                    })}
                          </p>
                        </div>
                      </div>
                      <Suspense fallback={<ConfigEditorFallback />}>
                        <ConfigMergeEditor
                          current={releaseTemplate}
                          onChange={onContent}
                          value={content}
                          visiblePane={visibleConfig}
                        />
                      </Suspense>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {mode === 'external' ? (
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='rounded-xl border bg-muted/20 px-4 py-3'>
                  <p className='text-xs text-muted-foreground'>
                    {t('configuration.currentConfiguration', {
                      defaultValue: 'Current configuration',
                    })}
                  </p>
                  <p className='mt-1 text-sm font-medium'>
                    {app.app.currentDeploymentId
                      ? localizedConfigModeLabel(baselineMode, t)
                      : t('configuration.noActiveConfiguration', {
                          defaultValue: 'No active configuration',
                        })}
                  </p>
                </div>
                <div className='rounded-xl border border-primary/30 bg-primary/5 px-4 py-3'>
                  <p className='text-xs text-muted-foreground'>
                    {t('configuration.newConfiguration', {
                      defaultValue: 'New configuration',
                    })}
                  </p>
                  <p className='mt-1 text-sm font-medium'>
                    {t('configuration.external', {
                      defaultValue: 'External',
                    })}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {t('configuration.externalRuntimeNotice', {
                      defaultValue:
                        'Runtime configuration and secrets are supplied outside Hub.',
                    })}
                  </p>
                </div>
              </div>
            ) : null}
            {mode === 'file' ? (
              <ConfigStatus error={validationError} summary={summary} />
            ) : null}
            {mode === 'file' ? (
              <Alert className='border-amber-500/30 bg-amber-500/5 text-amber-800'>
                <TriangleAlert className='size-4 shrink-0' />
                <AlertDescription className='text-amber-800'>
                  {t('configuration.secretWarning', {
                    defaultValue:
                      'config.yml may contain secrets. Hub stores the complete file for this application, and authorized administrators can view its contents.',
                  })}
                </AlertDescription>
              </Alert>
            ) : null}
            {mode === 'file' ? (
              <Alert className='border-blue-500/25 bg-blue-500/5'>
                <Info className='size-4 shrink-0 text-blue-600' />
                <AlertDescription>
                  {t('configuration.secretAutoGeneration', {
                    defaultValue:
                      'For Config file deployments, Hub automatically fills missing, blank or example secrets.keys, auth.secret and session.secret values, including omitted sections, with secure random secrets. Existing secrets are reused and custom values are preserved. External configuration is not modified.',
                  })}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : (
          <div className='overflow-hidden rounded-xl border'>
            <div className='grid grid-cols-[9rem_minmax(0,1fr)] gap-4 border-b px-4 py-3 text-sm'>
              <span className='text-muted-foreground'>
                {t('page.application', { defaultValue: 'Application' })}
              </span>
              <span className='font-medium'>{app.app.name}</span>
            </div>
            <div className='grid grid-cols-[9rem_minmax(0,1fr)] gap-4 border-b px-4 py-3 text-sm'>
              <span className='text-muted-foreground'>
                {t('deployments.release', { defaultValue: 'Release' })}
              </span>
              <span className='font-medium'>{releaseLabel(release)}</span>
            </div>
            <div className='grid grid-cols-[9rem_minmax(0,1fr)] gap-4 border-b px-4 py-3 text-sm'>
              <span className='text-muted-foreground'>
                {t('configuration.title', { defaultValue: 'Configuration' })}
              </span>
              <span className='font-medium'>
                {mode === 'file'
                  ? t('configuration.configFile', {
                      defaultValue: 'Config file',
                    })
                  : t('configuration.external', { defaultValue: 'External' })}
              </span>
            </div>
            {mode === 'file' ? (
              <div className='space-y-4 p-4'>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-lg border bg-muted/20 px-3 py-2.5'>
                    <p className='text-xs text-muted-foreground'>
                      {t('configuration.currentConfiguration', {
                        defaultValue: 'Current configuration',
                      })}
                    </p>
                    <p className='mt-1 text-sm font-medium'>
                      {app.app.currentDeploymentId
                        ? t('configuration.currentDeploymentSummary', {
                            mode: localizedConfigModeLabel(baselineMode, t),
                            id: shortId(app.app.currentDeploymentId),
                            defaultValue: `${localizedConfigModeLabel(baselineMode, t)} · Deployment ${shortId(app.app.currentDeploymentId)}`,
                          })
                        : t('configuration.noActiveConfiguration', {
                            defaultValue: 'No active configuration',
                          })}
                    </p>
                  </div>
                  <div className='rounded-lg border bg-primary/5 px-3 py-2.5'>
                    <p className='text-xs text-muted-foreground'>
                      {t('configuration.newConfiguration', {
                        defaultValue: 'New configuration',
                      })}
                    </p>
                    <p className='mt-1 text-sm font-medium'>
                      {t('configuration.configFileRelease', {
                        version: release?.version ?? '—',
                        defaultValue: `Config file · Release v${release?.version ?? '—'}`,
                      })}
                    </p>
                  </div>
                </div>
                <ConfigChangesReview
                  current={baselineContent}
                  value={content}
                  baselineMode={baselineMode}
                  validationError={validationError}
                />
              </div>
            ) : (
              <div className='p-4'>
                <div className='flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-700'>
                  <Check className='size-4 shrink-0' />
                  {summary.sourceChanged
                    ? t('configuration.sourceChangedToExternal', {
                        from: localizedConfigModeLabel(baselineMode, t),
                        defaultValue: `Configuration source changes from ${localizedConfigModeLabel(baselineMode, t)} to External`,
                      })
                    : t('configuration.noSourceChanges', {
                        defaultValue: 'No configuration source changes',
                      })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppDialog>
  );
}

function summarizeConfigChanges(
  beforeMode: ConfigMode,
  afterMode: ConfigMode,
  before: string,
  after: string,
): ConfigChangeSummary {
  const lines = diffLines(before, after);
  return {
    added: lines.filter((line) => line.kind === 'added').length,
    removed: lines.filter((line) => line.kind === 'removed').length,
    sourceChanged: beforeMode !== afterMode,
    unchanged: beforeMode === afterMode && before === after,
  };
}

export function ConfigStatus({
  error,
  summary,
}: {
  readonly error: string | null;
  readonly summary: ConfigChangeSummary;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  if (error) {
    return <ErrorNotification message={error} />;
  }
  return (
    <div className='flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-700'>
      <Check className='size-4 shrink-0' />
      <span>
        {summary.unchanged
          ? t('configuration.validNoChanges', {
              defaultValue: 'Valid YAML · No configuration changes',
            })
          : summary.sourceChanged
            ? t('configuration.validSourceChanged', {
                added: summary.added,
                removed: summary.removed,
                defaultValue: `Valid YAML · Configuration source changed · ${summary.added} added and ${summary.removed} removed lines`,
              })
            : t('configuration.validChanges', {
                added: summary.added,
                removed: summary.removed,
                defaultValue: `Valid YAML · ${summary.added} added and ${summary.removed} removed lines`,
              })}
      </span>
    </div>
  );
}

export function ConfigEditorFallback(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  return (
    <div
      className='h-[360px] animate-pulse bg-muted/30'
      aria-label={t('configuration.loadingEditor', {
        defaultValue: 'Loading editor',
      })}
    />
  );
}

function validateConfigDocument(
  content: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | null {
  try {
    const value: unknown = content.trim() === '' ? {} : parseYaml(content);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return t('configuration.invalidRoot', {
        defaultValue: 'The YAML root must be an object.',
      });
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return t('configuration.invalidDocument', {
      error: message,
      defaultValue: `Invalid config.yml: ${message}`,
    });
  }
}

function localizedConfigModeLabel(
  mode: ConfigMode,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const key =
    mode === 'file'
      ? 'configuration.configFile'
      : mode === 'external'
        ? 'configuration.external'
        : 'configuration.hubManaged';
  const fallback =
    mode === 'file'
      ? 'Config file'
      : mode === 'external'
        ? 'External'
        : 'Hub managed';
  return t(key, { defaultValue: fallback });
}

function diffLines(before: string, after: string): readonly DiffLine[] {
  const left = before.split('\n');
  const right = after.split('\n');
  if (left.length * right.length > 250_000) {
    return diffLinesByPosition(left, right);
  }
  const lengths = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      lengths[i][j] =
        left[i] === right[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      result.push({
        id: String(result.length),
        kind: 'unchanged',
        value: left[i],
      });
      i += 1;
      j += 1;
    } else if (
      j < right.length &&
      (i === left.length || lengths[i][j + 1] >= lengths[i + 1][j])
    ) {
      result.push({
        id: String(result.length),
        kind: 'added',
        value: right[j],
      });
      j += 1;
    } else {
      result.push({
        id: String(result.length),
        kind: 'removed',
        value: left[i],
      });
      i += 1;
    }
  }
  return result;
}

function diffLinesByPosition(
  left: readonly string[],
  right: readonly string[],
): readonly DiffLine[] {
  const result: DiffLine[] = [];
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] === right[index]) {
      result.push({
        id: String(result.length),
        kind: 'unchanged',
        value: left[index] ?? '',
      });
      continue;
    }
    if (left[index] !== undefined) {
      result.push({
        id: String(result.length),
        kind: 'removed',
        value: left[index],
      });
    }
    if (right[index] !== undefined) {
      result.push({
        id: String(result.length),
        kind: 'added',
        value: right[index],
      });
    }
  }
  return result;
}

export function ConfigModePicker({
  value,
  onChange,
}: {
  readonly value: ConfigMode;
  readonly onChange: (mode: ConfigMode) => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const selected = CONFIG_MODES.find((item) => item.value === value);
  return (
    <div>
      <div className='grid gap-2 sm:grid-cols-3'>
        {CONFIG_MODES.map((item) => (
          <Button
            className={`relative h-11 justify-start px-3 ${value === item.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
            disabled={item.disabled}
            key={item.value}
            onClick={() => onChange(item.value)}
            variant='outline'
          >
            <span className='text-muted-foreground [&_svg]:size-4'>
              {item.icon}
            </span>
            <span>
              {t(item.titleKey, {
                defaultValue:
                  item.value === 'file'
                    ? 'Config file'
                    : item.value === 'managed'
                      ? 'Hub managed'
                      : 'External',
              })}
            </span>
            {item.disabled ? (
              <Badge className='text-[9px]'>
                {t('configuration.soon', { defaultValue: 'Soon' })}
              </Badge>
            ) : null}
            {value === item.value ? (
              <Check className='absolute right-3 size-3.5 text-primary' />
            ) : null}
          </Button>
        ))}
      </div>
      <p className='mt-2 text-xs text-muted-foreground'>
        {selected
          ? t(selected.descriptionKey, {
              defaultValue:
                selected.value === 'file'
                  ? 'Maintain an editable config.yml with the application.'
                  : selected.value === 'managed'
                    ? 'Store structured configuration and secrets in Hub.'
                    : 'Supply configuration through external infrastructure.',
            })
          : null}
      </p>
    </div>
  );
}

export function DeploymentSteps({
  current,
  rollback,
}: {
  readonly current: number;
  readonly rollback: boolean;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const steps = rollback
    ? [
        {
          index: 1,
          label: t('configuration.title', { defaultValue: 'Configuration' }),
        },
        {
          index: 2,
          label: t('configuration.review', { defaultValue: 'Review' }),
        },
      ]
    : [
        {
          index: 0,
          label: t('deployments.release', { defaultValue: 'Release' }),
        },
        {
          index: 1,
          label: t('configuration.title', { defaultValue: 'Configuration' }),
        },
        {
          index: 2,
          label: t('configuration.review', { defaultValue: 'Review' }),
        },
      ];
  return (
    <ol
      className='mb-6 flex items-center'
      aria-label={t('configuration.progress', {
        defaultValue: 'Deployment progress',
      })}
    >
      {steps.map((item, position) => {
        const active = item.index === current;
        const complete = item.index < current;
        return (
          <li className='contents' key={item.label}>
            {position > 0 ? (
              <span
                className={`mx-3 h-px min-w-6 flex-1 ${complete || active ? 'bg-primary/50' : 'bg-border'}`}
              />
            ) : null}
            <span
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <span
                className={`grid size-6 place-items-center rounded-full border text-xs ${active ? 'border-primary bg-primary text-primary-foreground' : complete ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-background'}`}
              >
                {complete ? <Check className='size-3.5' /> : position + 1}
              </span>
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
