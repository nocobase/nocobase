import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { RouteDrawer } from '../../components/route-drawer.js';
import { ToolPermissionMenu } from '../../components/tool-permission-menu.js';
import { Button } from '../../components/ui/button.js';
import { Empty, EmptyDescription } from '../../components/ui/empty.js';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '../../components/ui/item.js';
import { useCatalogDisplay } from '../../catalog-display.js';
import { useT } from '../../locales/index.js';
import type { MCPToolEntry } from '../../mcp-service.js';
import { transportLabels, type MCPServicesContext } from './context.js';

export default function ToolsPage(): ReactElement {
  const context = useOutletContext<MCPServicesContext>();
  const { serverName } = useParams();
  const t = useT();
  const record = context.servers.find((item) => item.name === serverName);
  return (
    <RouteDrawer title={t('mcp.toolsTitle')}>
      {context.loading ? (
        <p role='status'>{t('Loading…')}</p>
      ) : context.loadError || !record ? (
        <p role='alert' className='text-sm text-destructive'>
          {context.loadError ?? t('MCP server not found.')}
        </p>
      ) : (
        <>
          <Item variant='muted' className='mb-5'>
            <ItemContent className='min-w-0'>
              <ItemTitle>{record.title || record.name}</ItemTitle>
              <ItemDescription className='font-mono text-xs'>
                {record.name} · {t(transportLabels[record.transport])}
              </ItemDescription>
              {record.url && (
                <ItemDescription className='line-clamp-none break-all text-xs'>
                  {record.url}
                </ItemDescription>
              )}
            </ItemContent>
          </Item>
          <ToolsPanel
            key={record.name}
            context={context}
            serverName={record.name}
            tools={context.tools[record.name] ?? []}
          />
        </>
      )}
    </RouteDrawer>
  );
}

function ToolsPanel({
  context,
  serverName,
  tools,
}: {
  context: MCPServicesContext;
  serverName: string;
  tools: MCPToolEntry[];
}): ReactElement {
  const t = useT();
  const { toolTitle, compareTitles } = useCatalogDisplay();
  const pageSize = 8;
  const [page, setPage] = useState(1);
  const pendingRef = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string>();
  const pageCount = Math.max(1, Math.ceil(tools.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleTools = [...tools]
    .sort((left, right) =>
      compareTitles(toolTitle(left), toolTitle(right), left.name, right.name),
    )
    .slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const updatePermission = async (
    tool: MCPToolEntry,
    permission: 'ASK' | 'ALLOW',
  ): Promise<void> => {
    if (pendingRef.current.has(tool.name) || permission === tool.permission)
      return;
    pendingRef.current.add(tool.name);
    setPending(new Set(pendingRef.current));
    setError(undefined);
    try {
      await context.ai.updateMCPToolPermission(tool.name, permission);
      context.onPermissionSaved(serverName, tool.name, permission);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      pendingRef.current.delete(tool.name);
      setPending(new Set(pendingRef.current));
    }
  };
  if (!tools.length)
    return (
      <Empty className='border'>
        <EmptyDescription>{t('mcp.toolsEmpty')}</EmptyDescription>
      </Empty>
    );
  return (
    <div>
      {error && (
        <p role='alert' className='mb-3 text-sm text-destructive'>
          {t('Failed to update tool permission.')} {error}
        </p>
      )}
      <div className='mb-2 text-sm font-medium'>
        {t('Tools')}{' '}
        <span className='font-normal text-muted-foreground'>
          ({tools.length})
        </span>
      </div>
      <ul className='divide-y rounded-md border'>
        {visibleTools.map((tool) => (
          <li key={tool.name} className='p-3'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='font-medium'>{toolTitle(tool)}</div>
              <ToolPermissionMenu
                value={tool.permission}
                accessibleLabel={`${t('Permission')}: ${toolTitle(tool)}`}
                disabled={pending.has(tool.name)}
                onChange={(permission) =>
                  void updatePermission(tool, permission)
                }
              />
            </div>
            <div className='mt-1 font-mono text-xs text-muted-foreground'>
              {tool.name}
            </div>
            {tool.description && (
              <div className='mt-2 text-sm text-muted-foreground'>
                {tool.description}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className='flex items-center justify-end gap-2 pt-4 text-sm text-muted-foreground'>
        <span>{t('mcp.toolsTotal', { count: tools.length })}</span>
        <Button
          size='icon-sm'
          variant='ghost'
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          aria-label={t('Previous page')}
        >
          <ChevronLeft aria-hidden='true' />
        </Button>
        <span className='min-w-6 text-center tabular-nums text-foreground'>
          {currentPage}
        </span>
        <Button
          size='icon-sm'
          variant='ghost'
          disabled={currentPage === pageCount}
          onClick={() => setPage(currentPage + 1)}
          aria-label={t('Next page')}
        >
          <ChevronRight aria-hidden='true' />
        </Button>
      </div>
    </div>
  );
}
