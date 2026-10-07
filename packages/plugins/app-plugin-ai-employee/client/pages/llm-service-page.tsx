import { Pencil } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router';
import {
  normalizeEnabledModels,
  type LLMService,
  type LLMProvider,
} from '../llm-service-service.js';
import { useT } from '../locales/index.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Switch } from '../components/ui/switch.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import { AgentPromptEmptyState } from '../components/agent-prompt-empty-state.js';
import { DelayedLoading } from '../components/delayed-loading.js';
import { ConfirmDialog } from '../components/confirm-dialog.js';
import { useHistoryGuard } from '../components/use-history-guard.js';
import { useCanManageAISettings } from '../settings-permissions.js';
import type {
  LLMServicesContext,
  ModelEditorLeaveState,
} from './llm-services/context.js';

export default function LLMServicePage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const canManage = useCanManageAISettings('llmServices');
  const [services, setServices] = useState<LLMService[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [error, setError] = useState<string>();
  const pendingRef = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  const [editorLeave, setEditorLeave] = useState<ModelEditorLeaveState>({
    dirty: false,
    pending: false,
  });
  // The model editor unmounts with its route, so this page holds back and forward for it.
  const historyGuard = useHistoryGuard(editorLeave);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(undefined);
    void Promise.all([ai.listLLMServices(), ai.listLLMProviders()])
      .then(([nextServices, nextProviders]) => {
        if (!active) return;
        setServices(nextServices);
        setProviders(nextProviders);
      })
      .catch((cause: unknown) => {
        if (active)
          setLoadError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ai]);
  const toggle = async (
    service: LLMService,
    enabled: boolean,
  ): Promise<void> => {
    if (pendingRef.current.has(service.name)) return;
    pendingRef.current.add(service.name);
    setPending(new Set(pendingRef.current));
    setError(undefined);
    setServices((items) =>
      items.map((item) =>
        item.name === service.name ? { ...item, enabled } : item,
      ),
    );
    try {
      await ai.updateLLMServiceEnabled(service.name, enabled);
    } catch (cause) {
      setServices((items) =>
        items.map((item) =>
          item.name === service.name
            ? { ...item, enabled: service.enabled }
            : item,
        ),
      );
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      pendingRef.current.delete(service.name);
      setPending(new Set(pendingRef.current));
    }
  };
  // Memoized so the outlet element stays the same between unrelated renders and can be held.
  const context = useMemo<LLMServicesContext>(
    () => ({
      ai,
      services,
      loading,
      loadError,
      onSaved: (next) =>
        setServices((items) =>
          items.map((item) =>
            item.name === next.name
              ? { ...item, enabledModels: next.enabledModels }
              : item,
          ),
        ),
      reportLeaveState: setEditorLeave,
    }),
    [ai, services, loading, loadError],
  );
  const outlet = useOutlet(context);
  // The element carries its own route context, so rendering the held one keeps the editor and its draft mounted.
  const [heldOutlet, setHeldOutlet] = useState(outlet);
  if (!historyGuard.holding && heldOutlet !== outlet) setHeldOutlet(outlet);
  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {(loadError || error) && (
        <Alert variant='destructive'>
          <AlertDescription>{loadError || error}</AlertDescription>
        </Alert>
      )}
      {loading ? (
        <DelayedLoading label={t('Loading…')} />
      ) : !loadError && !services.length ? (
        // Services come from config.yml, so the empty state hands the work to a coding agent in the app directory.
        <AgentPromptEmptyState
          title={t('llmServices.emptyTitle')}
          description={t('llmServices.emptyDescription')}
          openStep={t('agentPrompt.stepOpen')}
          sendStep={t('llmServices.emptyStepSend')}
          finishStep={t('llmServices.emptyStepFinish')}
          prompt={t('llmServices.agentPrompt')}
          note={t('llmServices.emptyNote')}
        />
      ) : (
        <div className='overflow-hidden rounded-xl border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12 text-center'>#</TableHead>
                <TableHead>{t('UID')}</TableHead>
                <TableHead>{t('Title')}</TableHead>
                <TableHead>{t('Provider')}</TableHead>
                <TableHead>{t('Models')}</TableHead>
                <TableHead>{t('Enabled')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loadError &&
                services.map((service, index) => (
                  <TableRow key={service.name}>
                    <TableCell className='text-center text-muted-foreground'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {service.name}
                    </TableCell>
                    <TableCell>{service.title}</TableCell>
                    <TableCell>
                      <ProviderCell
                        name={service.provider}
                        provider={providers.find(
                          (item) => item.name === service.provider,
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <ModelsCell
                        service={service}
                        canEdit={canManage}
                        onEdit={() => {
                          void navigate({
                            pathname: `${encodeURIComponent(service.name)}/models`,
                            search: location.search,
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={service.enabled}
                        disabled={!canManage || pending.has(service.name)}
                        aria-label={t('Enable {{name}}', {
                          name: service.name,
                        })}
                        onCheckedChange={(enabled) =>
                          void toggle(service, enabled)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
      {historyGuard.holding ? heldOutlet : outlet}
      <ConfirmDialog
        open={historyGuard.confirming}
        title={t('Discard unsaved changes?')}
        description={t('Your changes have not been saved.')}
        confirmLabel={t('Discard changes')}
        cancelLabel={t('Keep editing')}
        onConfirm={historyGuard.confirm}
        onOpenChange={(open) => {
          if (!open) historyGuard.cancel();
        }}
      />
    </div>
  );
}

function ProviderCell({
  name,
  provider,
}: {
  name: string;
  provider?: LLMProvider;
}): ReactElement {
  const t = useT();
  return (
    <div className='min-w-0'>
      <div className='truncate'>{provider?.title ?? name}</div>
      <div className='mt-1 flex flex-wrap gap-1'>
        {(provider?.supportedModel ?? ['LLM']).map((modelType) => (
          <Badge key={modelType} variant='secondary'>
            {modelType === 'EMBEDDING' ? t('Embedding') : t('LLM')}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ModelsCell({
  service,
  canEdit,
  onEdit,
}: {
  service: LLMService;
  canEdit: boolean;
  onEdit: () => void;
}): ReactElement {
  const t = useT();
  const { models } = normalizeEnabledModels(service.enabledModels);
  return (
    <div className='flex max-w-xl items-center gap-2'>
      {canEdit ? (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={t('Edit models for {{name}}', { name: service.name })}
          title={t('Edit models')}
          onClick={onEdit}
        >
          <Pencil className='size-4' />
        </Button>
      ) : null}
      <div className='flex min-w-0 flex-wrap gap-1'>
        {models.length ? (
          models.map((model) => (
            <Badge
              key={model.value}
              variant='secondary'
              title={model.value}
              className='max-w-48'
            >
              <span className='truncate'>{model.label}</span>
            </Badge>
          ))
        ) : (
          <span className='py-0.5 text-xs text-muted-foreground'>
            {t('No models')}
          </span>
        )}
      </div>
    </div>
  );
}
