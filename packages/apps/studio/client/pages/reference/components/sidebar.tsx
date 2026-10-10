import { useTranslation } from '@nocobase/i18n/client';
import {
  Building2Icon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  FolderIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  MoreHorizontalIcon,
  PackageIcon,
  PlusIcon,
  SettingsIcon,
  ShoppingCartIcon,
  UsersIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import { ExamplePage, ExampleSection } from '../shared';

const projects = ['Website relaunch', 'Warehouse migration', 'Q4 campaign'];
const skeletonRows = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];

/**
 * Every menu button below renders a plain `<button>`. In an application pass
 * the router link through `render`, e.g. `render={<Link to='/orders' />}`.
 */
export default function SidebarExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.sidebar.title')}
      description={t('components.sidebar.description')}
      docs='https://ui.shadcn.com/docs/components/sidebar'
    >
      <ExampleSection
        title={t('components.sidebar.composition')}
        description={t('components.sidebar.compositionDescription')}
        contentClassName='h-128 items-stretch gap-0 overflow-hidden p-0'
      >
        <SidebarProvider className='h-full min-h-0'>
          <Sidebar collapsible='none' className='border-r'>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size='lg'>
                    <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                      <Building2Icon />
                    </div>
                    <div className='grid flex-1 text-left leading-tight'>
                      <span className='truncate font-medium'>Acme Inc.</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {t('components.sidebar.enterprisePlan')}
                      </span>
                    </div>
                    <ChevronsUpDownIcon className='ml-auto' />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>
                  {t('components.sidebar.platform')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive>
                        <LayoutDashboardIcon />
                        <span>{t('components.sidebar.dashboard')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <ShoppingCartIcon />
                        <span>{t('components.sidebar.orders')}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>12</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <UsersIcon />
                        <span>{t('components.sidebar.customers')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <PackageIcon />
                        <span>{t('components.sidebar.products')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>
                  {t('components.sidebar.projects')}
                </SidebarGroupLabel>
                <SidebarGroupAction title={t('components.sidebar.addProject')}>
                  <PlusIcon />
                  <span className='sr-only'>
                    {t('components.sidebar.addProject')}
                  </span>
                </SidebarGroupAction>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projects.map((project) => (
                      <SidebarMenuItem key={project}>
                        <SidebarMenuButton>
                          <FolderIcon />
                          <span>{project}</span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<SidebarMenuAction showOnHover />}
                          >
                            <MoreHorizontalIcon />
                            <span className='sr-only'>
                              {t('reference.more')}
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side='right' align='start'>
                            <DropdownMenuItem>
                              {t('reference.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {t('reference.share')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant='destructive'>
                              {t('reference.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size='lg'>
                    <Avatar>
                      <AvatarFallback>OC</AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left leading-tight'>
                      <span className='truncate font-medium'>Olivia Chen</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        olivia.chen@acme.example
                      </span>
                    </div>
                    <ChevronsUpDownIcon className='ml-auto' />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className='min-h-0'>
            <header className='flex h-12 shrink-0 items-center border-b px-4'>
              <span className='text-sm font-medium'>
                {t('components.sidebar.dashboard')}
              </span>
            </header>
            <div className='flex min-h-0 flex-1 flex-col gap-4 p-4'>
              <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
                <div className='aspect-video rounded-xl bg-muted/50' />
                <div className='aspect-video rounded-xl bg-muted/50' />
                <div className='aspect-video rounded-xl bg-muted/50' />
              </div>
              <div className='min-h-0 flex-1 rounded-xl bg-muted/50' />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ExampleSection>

      <ExampleSection
        title={t('components.sidebar.collapsible')}
        description={t('components.sidebar.collapsibleDescription')}
        contentClassName='relative h-128 items-stretch gap-0 overflow-hidden p-0'
      >
        <SidebarProvider className='h-full min-h-0'>
          {/*
            A collapsible sidebar is fixed to the viewport by default. The
            `absolute h-full` override keeps this preview inside its surface;
            an application layout omits it.
          */}
          <Sidebar collapsible='icon' className='absolute h-full'>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size='lg'>
                    <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                      <Building2Icon />
                    </div>
                    <div className='grid flex-1 text-left leading-tight'>
                      <span className='truncate font-medium'>Acme Inc.</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {t('components.sidebar.enterprisePlan')}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>
                  {t('components.sidebar.platform')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip={t('components.sidebar.dashboard')}
                        isActive
                      >
                        <LayoutDashboardIcon />
                        <span>{t('components.sidebar.dashboard')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <Collapsible
                      defaultOpen
                      className='group/collapsible'
                      render={<SidebarMenuItem />}
                    >
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton
                            tooltip={t('components.sidebar.orders')}
                          />
                        }
                      >
                        <ShoppingCartIcon />
                        <span>{t('components.sidebar.orders')}</span>
                        <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              render={<button type='button' />}
                              isActive
                            >
                              <span>{t('components.sidebar.allOrders')}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              render={<button type='button' />}
                            >
                              <span>{t('components.sidebar.returns')}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              render={<button type='button' />}
                            >
                              <span>{t('components.sidebar.drafts')}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip={t('components.sidebar.customers')}
                      >
                        <UsersIcon />
                        <span>{t('components.sidebar.customers')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip={t('components.sidebar.products')}
                      >
                        <PackageIcon />
                        <span>{t('components.sidebar.products')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup className='mt-auto'>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        size='sm'
                        tooltip={t('reference.settings')}
                      >
                        <SettingsIcon />
                        <span>{t('reference.settings')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        size='sm'
                        tooltip={t('components.sidebar.support')}
                      >
                        <LifeBuoyIcon />
                        <span>{t('components.sidebar.support')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size='lg'>
                    <Avatar>
                      <AvatarFallback>OC</AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left leading-tight'>
                      <span className='truncate font-medium'>Olivia Chen</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        olivia.chen@acme.example
                      </span>
                    </div>
                    <ChevronsUpDownIcon className='ml-auto' />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset className='min-h-0'>
            <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4'>
              <SidebarTrigger className='-ml-1' />
              <Separator
                orientation='vertical'
                className='mr-2 data-vertical:h-4'
              />
              <span className='text-sm text-muted-foreground'>
                {t('components.sidebar.orders')}
              </span>
              <ChevronRightIcon className='size-3.5 text-muted-foreground' />
              <span className='text-sm font-medium'>
                {t('components.sidebar.allOrders')}
              </span>
            </header>
            <div className='flex min-h-0 flex-1 flex-col gap-4 p-4'>
              <p className='text-sm text-muted-foreground'>
                {t('components.sidebar.collapsibleHint')}
              </p>
              <div className='min-h-0 flex-1 rounded-xl bg-muted/50' />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ExampleSection>

      <ExampleSection
        title={t('components.sidebar.loading')}
        description={t('components.sidebar.loadingDescription')}
        contentClassName='h-80 items-stretch gap-0 overflow-hidden p-0'
      >
        <SidebarProvider className='h-full min-h-0'>
          <Sidebar collapsible='none' className='border-r'>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>
                  {t('components.sidebar.platform')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {skeletonRows.map((row) => (
                      <SidebarMenuItem key={row}>
                        <SidebarMenuSkeleton showIcon />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className='min-h-0 gap-4 p-4'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='min-h-0 flex-1 rounded-xl' />
          </SidebarInset>
        </SidebarProvider>
      </ExampleSection>
    </ExamplePage>
  );
}
