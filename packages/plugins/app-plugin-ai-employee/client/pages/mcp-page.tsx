import { Server, X } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactElement } from 'react';

import {
  type MCPRecord,
  type MCPToolEntry,
  type MCPTransport,
} from '../mcp-service.js';
import { useT } from '../locales/index.js';
import { useCatalogDisplay } from '../catalog-display.js';
import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../registry/nocobase-ai/shared/ui/table.js';
import { Switch } from '../../registry/nocobase-ai/shared/ui/switch.js';
import {
  useAIEmployeeClient,
  type AIEmployeeClient,
} from '../ai-employee-client.js';

const transportLabels: Record<MCPTransport, string> = {
  stdio: 'Stdio',
  http: 'mcp.transportHttp',
  sse: 'mcp.transportSse',
};

/**
 * Transport is a category rather than a status, so the three tones come from the
 * theme's chart series: those are the tokens a preset defines to be told apart
 * from one another, and unlike fixed palette colours they follow the theme.
 */
const transportTones: Record<MCPTransport, string> = {
  stdio: 'bg-chart-1/20',
  http: 'bg-chart-2/20',
  sse: 'bg-chart-3/20',
};

export default function MCPPage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const [servers, setServers] = useState<MCPRecord[]>([]);
  const [tools, setTools] = useState<Record<string, MCPToolEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<MCPRecord>();
  const [updatingName, setUpdatingName] = useState<string>();

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    try {
      const [nextServers, nextTools] = await Promise.all([
        ai.listMCPServers(),
        ai.listMCPTools(),
      ]);
      setServers(nextServers);
      setTools(nextTools);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, [ai]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleEnabled = async (server: MCPRecord): Promise<void> => {
    const enabled = !server.enabled;
    setUpdatingName(server.name);
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
      setUpdatingName(undefined);
    }
  };

  const openDrawer = (server: MCPRecord): void => {
    setSelected(server);
  };

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {error ? (
        <div
          className='rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'
          role='alert'
        >
          {error}
        </div>
      ) : null}
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
            {loading ? (
              <TableRow>
                <TableCell
                  className='h-32 text-center text-muted-foreground'
                  colSpan={6}
                >
                  {t('Loading…')}
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && !servers.length ? (
              <TableRow>
                <TableCell
                  className='h-32 text-center text-muted-foreground'
                  colSpan={6}
                >
                  {t('No MCP servers configured.')}
                </TableCell>
              </TableRow>
            ) : null}
            {!loading
              ? servers.map((server, index) => (
                  <TableRow key={server.name}>
                    <TableCell className='text-center text-muted-foreground'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {server.name}
                    </TableCell>
                    <TableCell>{server.title || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-foreground ${transportTones[server.transport]}`}
                      >
                        {t(transportLabels[server.transport])}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={server.enabled}
                        disabled={updatingName === server.name}
                        onCheckedChange={() => void toggleEnabled(server)}
                        aria-label={`${t('Enabled')}: ${server.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        onClick={() => openDrawer(server)}
                      >
                        {t('View')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>
      {selected ? (
        <MCPDrawer
          ai={ai}
          record={selected}
          tools={tools[selected.name] ?? []}
          onClose={() => {
            setSelected(undefined);
          }}
        />
      ) : null}
    </div>
  );
}

function MCPDrawer({
  ai,
  record,
  tools,
  onClose,
}: {
  ai: AIEmployeeClient;
  record: MCPRecord;
  tools: MCPToolEntry[];
  onClose: () => void;
}): ReactElement {
  const t = useT();
  return (
    <div
      className='fixed inset-0 z-50 bg-black/40'
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className='absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l bg-popover shadow-xl'
        role='dialog'
        aria-modal='true'
        aria-label={t('mcp.toolsTitle')}
      >
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <div className='flex items-center gap-2 font-semibold'>
            <Server className='h-4 w-4' />
            {t('mcp.toolsTitle')}
          </div>
          <button
            type='button'
            className='rounded p-1 hover:bg-accent'
            aria-label={t('Close')}
            onClick={onClose}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='flex-1 overflow-y-auto p-4'>
          <div className='mb-5 rounded-md bg-muted/50 p-3 text-sm'>
            <div className='font-medium'>{record.title || record.name}</div>
            <div className='mt-1 font-mono text-xs text-muted-foreground'>
              {record.name} · {t(transportLabels[record.transport])}
            </div>
            {record.url ? (
              <div className='mt-1 break-all text-xs text-muted-foreground'>
                {record.url}
              </div>
            ) : null}
          </div>
          <ToolsPanel ai={ai} tools={tools} t={t} />
        </div>
      </aside>
    </div>
  );
}

function ToolsPanel({
  ai,
  tools,
  t,
}: {
  ai: AIEmployeeClient;
  tools: MCPToolEntry[];
  t: (key: string) => string;
}): ReactElement {
  const { toolTitle, compareTitles } = useCatalogDisplay();
  const pageSize = 8;
  const [page, setPage] = useState(1);
  const [updatingTool, setUpdatingTool] = useState<string>();
  const pageCount = Math.ceil(tools.length / pageSize);
  const visibleTools = [...tools]
    .sort((left, right) =>
      compareTitles(toolTitle(left), toolTitle(right), left.name, right.name),
    )
    .slice((page - 1) * pageSize, page * pageSize);
  const updatePermission = async (
    tool: MCPToolEntry,
    permission: 'ASK' | 'ALLOW',
  ): Promise<void> => {
    setUpdatingTool(tool.name);
    try {
      await ai.updateMCPToolPermission(tool.name, permission);
      tool.permission = permission;
    } finally {
      setUpdatingTool(undefined);
    }
  };
  if (!tools.length)
    return (
      <div className='rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground'>
        {t('mcp.toolsEmpty')}
      </div>
    );
  return (
    <div>
      <div className='mb-2 text-sm font-medium'>
        {t('Tools')}{' '}
        <span className='font-normal text-muted-foreground'>
          ({tools.length})
        </span>
      </div>
      <ul className='divide-y rounded-md border'>
        {visibleTools.map((tool) => (
          <li key={tool.name} className='p-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='font-medium'>{toolTitle(tool)}</div>
              <div className='flex shrink-0 items-center gap-1 text-xs text-muted-foreground'>
                <span>{t('Permission')}</span>
                <Button
                  size='xs'
                  variant={tool.permission === 'ASK' ? 'secondary' : 'outline'}
                  disabled={updatingTool === tool.name}
                  onClick={() => void updatePermission(tool, 'ASK')}
                >
                  {t('Ask')}
                </Button>
                <Button
                  size='xs'
                  variant={
                    tool.permission === 'ALLOW' ? 'secondary' : 'outline'
                  }
                  disabled={updatingTool === tool.name}
                  onClick={() => void updatePermission(tool, 'ALLOW')}
                >
                  {t('Allow')}
                </Button>
              </div>
            </div>
            <div className='mt-1 font-mono text-xs text-muted-foreground'>
              {tool.name}
            </div>
            {tool.description ? (
              <div className='mt-2 text-sm text-muted-foreground'>
                {tool.description}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className='flex items-center justify-end gap-2 pt-4 text-sm text-muted-foreground'>
        <span>
          {t('Total')} {tools.length} {t('items')}
        </span>
        <Button
          size='sm'
          variant='ghost'
          disabled={page === 1}
          onClick={() => setPage((current) => current - 1)}
          aria-label={t('Previous page')}
        >
          ‹
        </Button>
        <span className='min-w-6 text-center text-primary'>{page}</span>
        <Button
          size='sm'
          variant='ghost'
          disabled={page === pageCount}
          onClick={() => setPage((current) => current + 1)}
          aria-label={t('Next page')}
        >
          ›
        </Button>
      </div>
    </div>
  );
}
