import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import type { MCPRecord, MCPToolEntry } from '../mcp-service.js';
import { useT } from '../locales/index.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import { AgentPromptEmptyState } from '../components/agent-prompt-empty-state.js';
import { DelayedLoading } from '../components/delayed-loading.js';
import { Alert, AlertDescription } from '../components/ui/alert.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import { Switch } from '../components/ui/switch.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import {
  transportLabels,
  type MCPServicesContext,
} from './mcp-services/context.js';

// Transport categories use the host's theme-responsive chart series.
export default function MCPPage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const [servers, setServers] = useState<MCPRecord[]>([]);
  const [tools, setTools] = useState<Record<string, MCPToolEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [error, setError] = useState<string>();
  const pendingRef = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(undefined);
    void Promise.all([ai.listMCPServers(), ai.listMCPTools()])
      .then(([nextServers, nextTools]) => {
        if (!active) return;
        setServers(nextServers);
        setTools(nextTools);
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
  const toggleEnabled = async (
    server: MCPRecord,
    enabled: boolean,
  ): Promise<void> => {
    if (pendingRef.current.has(server.name)) return;
    pendingRef.current.add(server.name);
    setPending(new Set(pendingRef.current));
    setError(undefined);
    setServers((current) =>
      current.map((item) =>
        item.name === server.name ? { ...item, enabled } : item,
      ),
    );
    try {
      await ai.updateMCPServerEnabled(server.name, enabled);
    } catch (cause) {
      setServers((current) =>
        current.map((item) =>
          item.name === server.name
            ? { ...item, enabled: server.enabled }
            : item,
        ),
      );
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      pendingRef.current.delete(server.name);
      setPending(new Set(pendingRef.current));
    }
  };
  const context: MCPServicesContext = {
    ai,
    servers,
    tools,
    loading,
    loadError,
    onPermissionSaved: (serverName, toolName, permission) =>
      setTools((current) => ({
        ...current,
        [serverName]: (current[serverName] ?? []).map((tool) =>
          tool.name === toolName ? { ...tool, permission } : tool,
        ),
      })),
  };
  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {(loadError || error) && (
        <Alert variant='destructive'>
          <AlertDescription>{loadError || error}</AlertDescription>
        </Alert>
      )}
      {loading ? (
        <DelayedLoading label={t('Loading…')} />
      ) : !loadError && !servers.length ? (
        // Servers come from config.yml, so the empty state hands the work to a coding agent in the app directory.
        <AgentPromptEmptyState
          title={t('mcp.emptyTitle')}
          description={t('mcp.emptyDescription')}
          openStep={t('agentPrompt.stepOpen')}
          sendStep={t('mcp.emptyStepSend')}
          finishStep={t('mcp.emptyStepFinish')}
          prompt={t('mcp.agentPrompt')}
          note={t('mcp.emptyNote')}
        />
      ) : (
        <div className='overflow-hidden rounded-xl border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12 text-center'>#</TableHead>
                <TableHead>{t('UID')}</TableHead>
                <TableHead>{t('Title')}</TableHead>
                <TableHead>{t('Transport')}</TableHead>
                <TableHead>{t('Enabled')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loadError &&
                servers.map((server, index) => (
                  <TableRow key={server.name}>
                    <TableCell className='text-center text-muted-foreground'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {server.name}
                    </TableCell>
                    <TableCell>{server.title || '—'}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {t(transportLabels[server.transport])}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={server.enabled}
                        disabled={pending.has(server.name)}
                        onCheckedChange={(enabled) =>
                          void toggleEnabled(server, enabled)
                        }
                        aria-label={`${t('Enabled')}: ${server.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        onClick={() => {
                          void navigate({
                            pathname: `${encodeURIComponent(server.name)}/tools`,
                            search: location.search,
                          });
                        }}
                      >
                        {t('View')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Outlet context={context} />
    </div>
  );
}
