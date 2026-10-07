import {
  AppWindow,
  Blocks,
  Bot,
  BotMessageSquare,
  Check,
  ClipboardList,
  Columns3,
  Settings,
  Columns2,
  Copy,
  Heading,
  KeyRound,
  Layers,
  LayoutTemplate,
  Monitor,
  MonitorSmartphone,
  Moon,
  PanelRight,
  RefreshCw,
  Rows3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sun,
  SquareCheck,
  Table2,
  Tablet,
  ToggleRight,
  History,
  Inbox,
  BellDot,
  PenLine,
  FileText,
  FolderKanban,
  MessageSquareText,
  UserRoundSearch,
  MessagesSquare,
  Paperclip,
  PanelsTopLeft,
  type LucideIcon,
} from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from './components/ui/sidebar';
import { Separator } from './components/ui/separator';
import { TooltipProvider } from './components/ui/tooltip';
import { AgentChatDemo } from './demo/agents/agent-chat';
import { AgentComposerDemo } from './demo/agents/agent-composer';
import { AgentPickerDemo } from './demo/agents/agent-picker';
import { AgentQueueDemo } from './demo/agents/agent-queue';
import { IssueCardDemo } from './demo/projects/issue-card';
import { PlanCardDemo } from './demo/projects/plan-card';
import { IssueTableDemo } from './demo/projects/issue-table';
import { KanbanDemo } from './demo/components/kanban';
import { AuthenticationDemo } from './demo/auth';
import { DeviceApprovalDemo } from './demo/auth/device-approval';
import { PageContainerDemo } from './demo/components/page-container';
import { PageHeaderDemo } from './demo/components/page-header';
import { PermissionEditorDemo } from './demo/authorization/permission-editor';
import { RouteOverlaysDemo } from './demo/components/route-overlays';
import { IssueDetailDemo } from './demo/projects/issue-detail';
import { AttachmentListDemo } from './demo/components/attachment-list';
import { CommentThreadDemo } from './demo/components/comment-thread';
import { MarkdownViewDemo } from './demo/components/markdown-view';
import { RichTextEditorDemo } from './demo/components/rich-text-editor';
import { AgentRunHistoryDemo } from './demo/agents/agent-run-history';
import { PropertyFieldsDemo } from './demo/components/property-fields';
import { SettingsDialogDemo } from './demo/components/settings-dialog';
import { ProjectDetailDemo } from './demo/projects/project-detail';
import { InboxButtonPreview, InboxDemo } from './demo/inbox';

interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  type?: string;
  meta?: {
    group?: string;
    iframeHeight?: number;
  };
}

const fallbackItem: RegistryItem = {
  name: 'auth-centered-layout',
  title: 'Auth Centered Layout',
  description:
    'The page around an authentication form: the brand above a card in the middle of a muted page. Use it for sign-in, sign-up, password and device pages without a brand panel; the templates use auth-split-layout instead.',
  meta: {
    group: 'Authentication',
    iframeHeight: 720,
  },
  type: 'registry:component',
};

interface ItemPreview {
  /** The demo route rendered in the item's preview frame. */
  readonly path: string;
  readonly icon: LucideIcon;
}

// Items are not discovered: each one is wired here, and routed to its demo in `AppContent`.
const itemPreviews: Record<string, ItemPreview> = {
  'auth-centered-layout': {
    path: '/demo/auth/auth-centered-layout',
    icon: ShieldCheck,
  },
  'auth-split-layout': { path: '/demo/auth/auth-split-layout', icon: Columns2 },
  'auth-forms': { path: '/demo/auth/auth-forms/login', icon: KeyRound },
  'auth-methods': { path: '/demo/auth/auth-methods', icon: Rows3 },
  'device-approval': {
    path: '/demo/auth/device-approval',
    icon: MonitorSmartphone,
  },
  'page-container': {
    path: '/demo/components/page-container',
    icon: LayoutTemplate,
  },
  'page-header': { path: '/demo/components/page-header', icon: Heading },
  // The three route overlays share one demo; each preview opens the route that presents its component.
  'route-dialog': {
    path: '/demo/components/route-overlays/new',
    icon: AppWindow,
  },
  'route-drawer': {
    path: '/demo/components/route-overlays/SO-1043',
    icon: PanelRight,
  },
  'route-child-page': {
    path: '/demo/components/route-overlays/report',
    icon: Layers,
  },
  'permission-editor': {
    path: '/demo/authorization/permission-editor',
    icon: ToggleRight,
  },
  kanban: { path: '/demo/components/kanban', icon: Columns3 },
  'issue-table': { path: '/demo/projects/issue-table', icon: Table2 },
  'issue-card': { path: '/demo/projects/issue-card', icon: SquareCheck },
  'plan-card': { path: '/demo/projects/plan-card', icon: ClipboardList },
  'agent-run-history': {
    path: '/demo/agents/agent-run-history',
    icon: History,
  },
  'rich-text-editor': {
    path: '/demo/components/rich-text-editor',
    icon: PenLine,
  },
  'markdown-view': { path: '/demo/components/markdown-view', icon: FileText },
  'comment-thread': {
    path: '/demo/components/comment-thread',
    icon: MessagesSquare,
  },
  'attachment-list': {
    path: '/demo/components/attachment-list',
    icon: Paperclip,
  },
  'property-fields': {
    path: '/demo/components/property-fields',
    icon: SlidersHorizontal,
  },
  'settings-dialog': {
    path: '/demo/components/settings-dialog',
    icon: Settings,
  },
  'issue-detail': { path: '/demo/projects/issue-detail', icon: PanelsTopLeft },
  'project-detail': {
    path: '/demo/projects/project-detail',
    icon: FolderKanban,
  },
  'agent-queue': { path: '/demo/agents/agent-queue', icon: Bot },
  'agent-composer': {
    path: '/demo/agents/agent-composer',
    icon: MessageSquareText,
  },
  'agent-picker': { path: '/demo/agents/agent-picker', icon: UserRoundSearch },
  'agent-chat': { path: '/demo/agents/agent-chat', icon: BotMessageSquare },
  inbox: { path: '/demo/inbox/inbox', icon: Inbox },
  'inbox-button': { path: '/demo/inbox/inbox-button', icon: BellDot },
};

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function App(): ReactElement {
  const [preference, setPreference] =
    useState<ThemePreference>(readThemePreference);
  const previewTheme = readPreviewTheme();
  const prefersDark = useSyncExternalStore(
    subscribeToColorScheme,
    readPrefersDark,
  );
  const resolved = previewTheme ?? resolveTheme(preference, prefersDark);

  useEffect(() => {
    // index.html sets both on first load; the inline color-scheme outranks the stylesheet's, so it has to follow too.
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
    if (!previewTheme) {
      localStorage.setItem('nocobase-ui-library-theme', preference);
    }
  }, [preference, previewTheme, resolved]);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      <AppContent />
    </ThemeContext.Provider>
  );
}

function AppContent(): ReactElement {
  const { pathname } = window.location;
  if (pathname.startsWith('/demo/auth/device-approval')) {
    return <DeviceApprovalDemo />;
  }
  if (pathname.startsWith('/demo/auth/')) {
    return <AuthenticationDemo />;
  }
  if (pathname.startsWith('/demo/components/page-container')) {
    return <PageContainerDemo />;
  }
  if (pathname.startsWith('/demo/components/page-header')) {
    return <PageHeaderDemo />;
  }
  if (pathname.startsWith('/demo/authorization/permission-editor')) {
    return <PermissionEditorDemo />;
  }
  if (pathname.startsWith('/demo/components/route-overlays')) {
    return <RouteOverlaysDemo />;
  }
  if (pathname.startsWith('/demo/components/kanban')) {
    return <KanbanDemo />;
  }
  if (pathname.startsWith('/demo/projects/issue-card')) {
    return <IssueCardDemo />;
  }
  if (pathname.startsWith('/demo/projects/plan-card')) {
    return <PlanCardDemo />;
  }
  if (pathname.startsWith('/demo/projects/issue-table')) {
    return <IssueTableDemo />;
  }
  if (pathname.startsWith('/demo/agents/agent-run-history')) {
    return <AgentRunHistoryDemo />;
  }
  if (pathname.startsWith('/demo/components/rich-text-editor')) {
    return <RichTextEditorDemo />;
  }
  if (pathname.startsWith('/demo/components/markdown-view')) {
    return <MarkdownViewDemo />;
  }
  if (pathname.startsWith('/demo/components/comment-thread')) {
    return <CommentThreadDemo />;
  }
  if (pathname.startsWith('/demo/components/attachment-list')) {
    return <AttachmentListDemo />;
  }
  if (pathname.startsWith('/demo/components/property-fields')) {
    return <PropertyFieldsDemo />;
  }
  if (pathname.startsWith('/demo/components/settings-dialog')) {
    return <SettingsDialogDemo />;
  }
  if (pathname.startsWith('/demo/projects/issue-detail')) {
    return <IssueDetailDemo />;
  }
  if (pathname.startsWith('/demo/projects/project-detail')) {
    return <ProjectDetailDemo />;
  }
  if (pathname.startsWith('/demo/agents/agent-queue')) {
    return <AgentQueueDemo />;
  }
  if (pathname.startsWith('/demo/agents/agent-composer')) {
    return <AgentComposerDemo />;
  }
  if (pathname.startsWith('/demo/agents/agent-picker')) {
    return <AgentPickerDemo />;
  }
  if (pathname.startsWith('/demo/agents/agent-chat')) {
    return <AgentChatDemo />;
  }
  if (pathname.startsWith('/demo/inbox/inbox-button')) {
    return <InboxButtonPreview />;
  }
  if (pathname.startsWith('/demo/inbox/inbox')) {
    return <InboxDemo />;
  }

  return <RegistryDocs />;
}

function RegistryDocs(): ReactElement {
  const [items, setItems] = useState<RegistryItem[]>([fallbackItem]);
  const [query, setQuery] = useState('');
  const [activeName, setActiveName] = useState<string>(fallbackItem.name);
  // The section the address named on load (`#name` from the sidebar, or `/registry/<name>`), read before anything
  // rewrites the hash.
  const initialSlugRef = useRef(
    decodeURIComponent(window.location.hash.slice(1)) ||
      window.location.pathname.match(/^\/registry\/([^/]+)/)?.[1],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch('/r/registry.json', { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { items?: RegistryItem[] }) => {
        // Example items (`<item>-demo`) are the demos below, published for `shadcn view` and the MCP server.
        const installable = (data.items ?? []).filter(
          (item) => item.type !== 'registry:example',
        );
        const nextItems = installable.length ? installable : [fallbackItem];
        const slug = initialSlugRef.current;
        setItems(nextItems);
        const linked =
          slug && nextItems.some((item) => item.name === slug) ? slug : null;
        const first = groupItems(nextItems)[0]?.items[0]?.name;
        if (linked ?? first) setActiveName(linked ?? first ?? '');
        // Go to the linked section, or back to the top: a demo that focuses a field on mount (the sign-in form's
        // autoFocus) has scrolled the page to itself.
        window.requestAnimationFrame(() => {
          if (linked)
            document.getElementById(linked)?.scrollIntoView({ block: 'start' });
          else window.scrollTo({ top: 0 });
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems([fallbackItem]);
      });
    return () => controller.abort();
  }, []);

  // In the sidebar's order (groups alphabetically), so the page reads like the menu.
  const visibleItems = groupItems(
    items.filter((item) => {
      const text = `${item.name} ${item.title ?? ''} ${item.description ?? ''}`;
      return text.toLowerCase().includes(query.trim().toLowerCase());
    }),
  ).flatMap((group) => group.items);

  useEffect(() => {
    const sections = visibleItems
      .map((item) => document.getElementById(item.name))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    // Not until the registry has loaded, or the placeholder section would overwrite the address.
    if (items.length <= 1) return;

    // The section under the top fifth of the viewport, or the first one at the very top of the page.
    const update = () => {
      const line = window.innerHeight * 0.2;
      const current =
        window.scrollY < 1
          ? sections[0]
          : sections.findLast(
              (section) => section.getBoundingClientRect().top <= line,
            );
      if (!current) return;
      setActiveName(current.id);
      // Keep the address on the section in view, so a reload comes back to it; none at the top of the page.
      const hash = window.scrollY < 1 ? '' : `#${current.id}`;
      if (window.location.hash !== hash)
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${hash}`,
        );
    };
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [visibleItems, items.length]);

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        style={
          {
            '--sidebar-width-icon': '4rem',
          } as CSSProperties
        }
      >
        <RegistrySidebar
          activeName={activeName}
          items={visibleItems}
          onQueryChange={setQuery}
          onSelect={setActiveName}
          query={query}
        />
        <SidebarInset>
          <RegistryTopNav />
          <div className='mx-auto min-w-0 w-full max-w-[1800px] flex-1 px-3 py-4 sm:px-6'>
            {visibleItems.length ? (
              <div className='space-y-8'>
                {visibleItems.map((item) => (
                  <RegistryPreviewSection item={item} key={item.name} />
                ))}
              </div>
            ) : (
              <EmptyRegistryState query={query} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function RegistryTopNav(): ReactElement {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <header className='sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-3 backdrop-blur-xl sm:px-4'>
      <div className='flex min-w-0 items-center gap-3'>
        <SidebarTrigger
          aria-label='Toggle navigation'
          className='size-9 rounded-xl border-0 bg-transparent text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground focus-visible:border-transparent focus-visible:ring-0'
        />
        <Separator className='h-5 w-px bg-border' orientation='vertical' />
        <p className='truncate text-sm font-medium text-muted-foreground'>
          NocoBase UI Library
        </p>
      </div>
      <Button
        aria-label={`Theme: ${preference}`}
        className='text-foreground'
        onClick={() => setPreference(nextThemePreference(preference))}
        title={`Theme: ${preference}`}
        type='button'
        variant='outline'
        size='icon'
      >
        {preference === 'system' ? (
          <Monitor aria-hidden='true' />
        ) : resolved === 'dark' ? (
          <Sun aria-hidden='true' />
        ) : (
          <Moon aria-hidden='true' />
        )}
      </Button>
    </header>
  );
}

function RegistrySidebar({
  activeName,
  items,
  onQueryChange,
  onSelect,
  query,
}: {
  activeName?: string;
  items: RegistryItem[];
  onQueryChange: (value: string) => void;
  onSelect: (name: string) => void;
  query: string;
}): ReactElement {
  const groups = groupItems(items);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='h-14 shrink-0 justify-center border-b border-sidebar-border/70 p-0 px-5 group-data-[collapsible=icon]:px-0'>
        <a
          aria-label='NocoBase home'
          className='flex h-9 min-w-0 items-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center'
          href='/'
        >
          <span className='group-data-[collapsible=icon]:hidden'>
            <img
              alt='NocoBase'
              className='h-7 w-auto object-contain dark:hidden'
              src='/assets/logo.png'
            />
            <img
              alt='NocoBase'
              className='hidden h-7 w-auto object-contain dark:block'
              src='/assets/logo-dark.png'
            />
          </span>
          <span className='hidden group-data-[collapsible=icon]:block'>
            <img
              alt='NocoBase'
              className='size-7 object-contain dark:hidden'
              src='/assets/logo-mark.png'
            />
            <img
              alt='NocoBase'
              className='hidden size-7 object-contain dark:block'
              src='/assets/logo-mark-dark.png'
            />
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <div className='relative px-3 py-3 group-data-[collapsible=icon]:hidden'>
          <Search className='pointer-events-none absolute top-1/2 left-6 z-10 size-4 -translate-y-1/2 text-muted-foreground' />
          <SidebarInput
            aria-label='Search registry'
            className='pl-9'
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder='Search registry...'
            value={query}
          />
        </div>
        {groups.map((group) => (
          <SidebarGroup
            className='px-3 py-3 group-data-[collapsible=icon]:px-2'
            key={group.label}
          >
            <SidebarGroupLabel className='px-3 group-data-[collapsible=icon]:hidden'>
              {formatGroupLabel(group.label)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <RegistrySidebarItem
                    activeName={activeName}
                    item={item}
                    key={item.name}
                    onSelect={onSelect}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function RegistrySidebarItem({
  activeName,
  item,
  onSelect,
}: {
  activeName?: string;
  item: RegistryItem;
  onSelect: (name: string) => void;
}): ReactElement {
  const { setOpenMobile } = useSidebar();
  const label = item.title ?? item.name;
  const Icon = itemPreviews[item.name]?.icon ?? Blocks;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className='group-data-[collapsible=icon]:w-12! group-data-[collapsible=icon]:justify-center!'
        isActive={item.name === activeName}
        render={
          <a
            aria-current={item.name === activeName ? 'page' : undefined}
            href={`#${item.name}`}
            onClick={() => {
              onSelect(item.name);
              setOpenMobile(false);
            }}
          />
        }
        tooltip={label}
      >
        <Icon aria-hidden='true' />
        <span className='group-data-[collapsible=icon]:hidden'>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function RegistryPreviewSection({
  item,
}: {
  item: RegistryItem;
}): ReactElement {
  const previewPath = itemPreviews[item.name]?.path;

  return (
    <section className='scroll-mt-4' data-registry-item='true' id={item.name}>
      {previewPath ? (
        <RegistryPreview item={item} previewPath={previewPath} />
      ) : (
        <Card>
          <CardContent className='p-8 text-sm text-muted-foreground'>
            Preview is not available for this registry item.
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function RegistryPreview({
  item,
  previewPath,
}: {
  item: RegistryItem;
  previewPath: string;
}): ReactElement {
  const { resolved } = useTheme();
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const previewHeight = item.meta?.iframeHeight ?? 720;
  const installCommand = `npx shadcn@latest add @nocobase/${item.name}`;

  const copyInstallCommand = async (): Promise<void> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(installCommand);
      } else {
        const input = document.createElement('textarea');
        input.value = installCommand;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.append(input);
        try {
          input.select();
          if (!document.execCommand('copy')) {
            throw new Error('Clipboard is unavailable.');
          }
        } finally {
          input.remove();
        }
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <LazyPreview>
      <Card className='gap-0 py-0'>
        <CardHeader className='flex h-14 flex-row items-center gap-3 border-b px-3 py-0 !pb-0'>
          <CardTitle className='min-w-0 flex-1 truncate text-sm leading-5 font-medium'>
            {item.title ?? item.name}
          </CardTitle>
          <Button
            aria-label='Copy install command'
            className='hidden min-w-0 max-w-[22rem] justify-start overflow-hidden font-mono text-xs sm:inline-flex'
            onClick={() => void copyInstallCommand()}
            size='sm'
            title={copied ? 'Copied' : installCommand}
            type='button'
            variant='outline'
          >
            {copied ? (
              <Check aria-hidden='true' />
            ) : (
              <Copy aria-hidden='true' />
            )}
            <span className='truncate'>{installCommand}</span>
          </Button>
          <Button
            aria-label='Copy install command'
            className='sm:hidden'
            onClick={() => void copyInstallCommand()}
            size='icon-sm'
            title={copied ? 'Copied' : installCommand}
            type='button'
            variant='outline'
          >
            {copied ? (
              <Check aria-hidden='true' />
            ) : (
              <Copy aria-hidden='true' />
            )}
          </Button>
          <div className='flex items-center gap-1 rounded-lg border border-border bg-background p-1'>
            <Button
              aria-label='Desktop preview'
              aria-pressed={viewport === 'desktop'}
              className={
                viewport === 'desktop'
                  ? 'bg-muted text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }
              onClick={() => setViewport('desktop')}
              size='icon-sm'
              type='button'
              variant='ghost'
            >
              <Monitor aria-hidden='true' className='size-4' />
            </Button>
            <Button
              aria-label='Tablet preview'
              aria-pressed={viewport === 'tablet'}
              className={
                viewport === 'tablet'
                  ? 'bg-muted text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }
              onClick={() => setViewport('tablet')}
              size='icon-sm'
              type='button'
              variant='ghost'
            >
              <Tablet aria-hidden='true' className='size-4' />
            </Button>
            <Button
              aria-label='Mobile preview'
              aria-pressed={viewport === 'mobile'}
              className={
                viewport === 'mobile'
                  ? 'bg-muted text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }
              onClick={() => setViewport('mobile')}
              size='icon-sm'
              type='button'
              variant='ghost'
            >
              <Smartphone aria-hidden='true' className='size-4' />
            </Button>
            <Button
              aria-label='Refresh preview'
              onClick={() => setRefreshKey((key) => key + 1)}
              size='icon-sm'
              type='button'
              variant='ghost'
            >
              <RefreshCw aria-hidden='true' className='size-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <PreviewCanvas
            height={previewHeight}
            key={`${refreshKey}-${resolved}`}
            path={previewPath}
            reloadKey={refreshKey}
            theme={resolved}
            title={`${item.title ?? item.name} preview`}
            viewport={viewport}
          />
        </CardContent>
      </Card>
    </LazyPreview>
  );
}

type PreviewViewport = 'desktop' | 'mobile' | 'tablet';

function LazyPreview({ children }: { children: ReactNode }): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px', threshold: 0 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [loaded]);

  return (
    <div ref={containerRef}>
      {loaded ? (
        children
      ) : (
        <div className='flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-muted/20 text-sm text-muted-foreground'>
          Preview loads when it enters the viewport.
        </div>
      )}
    </div>
  );
}

function PreviewCanvas({
  height,
  path,
  reloadKey,
  theme,
  title,
  viewport,
}: {
  height: number;
  path: string;
  reloadKey: number;
  theme: ResolvedTheme;
  title: string;
  viewport: PreviewViewport;
}): ReactElement {
  const viewportStyle: CSSProperties =
    viewport === 'mobile'
      ? { maxWidth: 390, width: '100%' }
      : viewport === 'tablet'
        ? { maxWidth: 720, width: '76%' }
        : { width: '100%' };

  return (
    <div
      className='flex justify-center overflow-auto bg-muted/20 p-2 sm:p-5'
      style={{
        backgroundImage:
          'radial-gradient(circle, color-mix(in oklch, var(--muted-foreground) 18%, transparent) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      <iframe
        className='block shrink-0 rounded-lg border border-border bg-background shadow-sm transition-[width] duration-300'
        loading='lazy'
        onLoad={(event) => {
          const documentElement =
            event.currentTarget.contentDocument?.documentElement;
          documentElement?.classList.toggle('dark', theme === 'dark');
          if (documentElement) {
            documentElement.style.colorScheme = theme;
          }
        }}
        src={`${path}?theme=${theme}&preview=${theme}-${reloadKey}`}
        style={{ ...viewportStyle, height }}
        title={title}
      />
    </div>
  );
}

function EmptyRegistryState({ query }: { query: string }): ReactElement {
  return (
    <Card className='flex min-h-[70svh] items-center justify-center'>
      <CardContent className='p-8 text-sm text-muted-foreground'>
        {query ? `No item matches “${query}”.` : 'The registry is empty.'}
      </CardContent>
    </Card>
  );
}

function groupItems(items: RegistryItem[]): {
  label: string;
  items: RegistryItem[];
}[] {
  const groups = new Map<string, RegistryItem[]>();
  for (const item of items) {
    const label =
      item.meta?.group ??
      (item.type === 'registry:block'
        ? 'Authentication'
        : (item.type?.replace(/^registry:/, '') ?? 'Items'));
    const group = groups.get(label) ?? [];
    group.push(item);
    groups.set(label, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, groupItems]) => ({ label, items: groupItems }));
}

function formatGroupLabel(label: string): string {
  return label;
}

function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeContext');
  }
  return value;
}

function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('nocobase-ui-library-theme');
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return prefersDark ? 'dark' : 'light';
}

const colorSchemeQuery = '(prefers-color-scheme: dark)';

function subscribeToColorScheme(onChange: () => void): () => void {
  const media = window.matchMedia(colorSchemeQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function readPrefersDark(): boolean {
  return window.matchMedia(colorSchemeQuery).matches;
}

function readPreviewTheme(): ResolvedTheme | undefined {
  if (typeof window === 'undefined') return undefined;
  const theme = new URLSearchParams(window.location.search).get('theme');
  return theme === 'dark' || theme === 'light' ? theme : undefined;
}

function nextThemePreference(preference: ThemePreference): ThemePreference {
  if (preference === 'light') return 'dark';
  if (preference === 'dark') return 'system';
  return 'light';
}
