import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '#components/ui/accordion';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '#components/ui/collapsible';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '#components/ui/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '#components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '#components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '#components/ui/context-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
} from '#components/ui/popover';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { GalleryPage, GallerySection } from './gallery-shared';

export default function NavigationGallery(): ReactElement {
  const { t } = useTranslation();
  const [action, setAction] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [clear, setClear] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.min(3, Number(params.get('page')) || 1));
  const go = (next: number) => {
    setParams({ page: String(next) });
  };
  return (
    <GalleryPage view='navigation'>
      <GallerySection title='tabs' components='Tabs, Accordion, Collapsible'>
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList className='w-full'>
            <TabsTrigger value='overview'>{t('gallery.overview')}</TabsTrigger>
            <TabsTrigger value='activity'>{t('gallery.activity')}</TabsTrigger>
            <TabsTrigger value='disabled' disabled>
              {t('gallery.disabled')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview'>
            <p className='rounded-lg border bg-muted/40 p-4 text-sm'>
              {t('gallery.overviewText')}
            </p>
          </TabsContent>
          <TabsContent value='activity'>
            <p className='rounded-lg border bg-muted/40 p-4 text-sm'>
              {t('gallery.activityText')}
            </p>
          </TabsContent>
        </Tabs>
        <Accordion defaultValue={['overview']}>
          <AccordionItem value='overview'>
            <AccordionTrigger>{t('gallery.overview')}</AccordionTrigger>
            <AccordionContent>{t('gallery.overviewText')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value='activity'>
            <AccordionTrigger>{t('gallery.activity')}</AccordionTrigger>
            <AccordionContent>{t('gallery.activityText')}</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Collapsible>
          <CollapsibleTrigger render={<Button variant='outline' />}>
            {t('gallery.details')}
          </CollapsibleTrigger>
          <CollapsibleContent className='pt-3 text-sm text-muted-foreground'>
            {t('gallery.detailsText')}
          </CollapsibleContent>
        </Collapsible>
      </GallerySection>
      <GallerySection
        title='menus'
        components='Breadcrumb, DropdownMenu, ContextMenu, Pagination'
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to='/theme-lab/dashboard' />}>
                {t('themeLab.dashboard')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('gallery.navigation')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='outline' />}>
            {t('gallery.actions')}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('gallery.actions')}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setAction(t('gallery.copy'));
                  setClear(false);
                }}
              >
                {t('gallery.copy')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                {t('gallery.disabled')}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {t('gallery.choice')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {['product', 'engineering', 'design'].map((v) => (
                    <DropdownMenuItem
                      key={v}
                      onClick={() => {
                        setAction(t(`gallery.${v}`));
                        setClear(false);
                      }}
                    >
                      {t(`gallery.${v}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={enabled}
              onCheckedChange={setEnabled}
            >
              {t('gallery.notifications')}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ContextMenu>
          <ContextMenuTrigger
            className='flex min-h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground'
            tabIndex={0}
          >
            {t('gallery.menuHint')}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setAction(t('gallery.archive'));
                setClear(false);
              }}
            >
              {t('gallery.archive')}
            </ContextMenuItem>
            <ContextMenuItem disabled>{t('gallery.disabled')}</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <p
          role='status'
          aria-label={t('gallery.selected')}
          className='text-sm text-muted-foreground'
        >
          {clear
            ? t('gallery.cleared')
            : `${t('gallery.selected')}: ${action || t('gallery.none')} · ${t('gallery.notifications')}: ${t(enabled ? 'gallery.on' : 'gallery.off')}`}
        </p>
        <div className='rounded-lg border bg-muted/30 p-4 text-sm'>
          {t(
            `gallery.${['overviewText', 'activityText', 'detailsText'][page - 1]}`,
          )}
        </div>
        <Pagination aria-label={t('gallery.page')}>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text={t('gallery.previous')}
                aria-label={t('gallery.previous')}
                href={`?page=${Math.max(1, page - 1)}`}
                aria-disabled={page === 1}
                tabIndex={page === 1 ? -1 : 0}
                className={
                  page === 1 ? 'pointer-events-none opacity-50' : undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) go(page - 1);
                }}
              />
            </PaginationItem>
            {[1, 2, 3].map((n) => (
              <PaginationItem key={n}>
                <PaginationLink
                  href={`?page=${n}`}
                  isActive={page === n}
                  onClick={(e) => {
                    e.preventDefault();
                    go(n);
                  }}
                >
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                text={t('gallery.next')}
                aria-label={t('gallery.next')}
                href={`?page=${Math.min(3, page + 1)}`}
                aria-disabled={page === 3}
                tabIndex={page === 3 ? -1 : 0}
                className={
                  page === 3 ? 'pointer-events-none opacity-50' : undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  if (page < 3) go(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </GallerySection>
      <GallerySection
        title='overlays'
        components='Tooltip, Popover, Dialog, Sheet, AlertDialog'
      >
        <div className='flex flex-wrap gap-3'>
          <Tooltip>
            <TooltipTrigger render={<Button variant='outline' />}>
              {t('gallery.tooltip')}
            </TooltipTrigger>
            <TooltipContent>{t('gallery.tooltipText')}</TooltipContent>
          </Tooltip>
          <Popover>
            <PopoverTrigger render={<Button variant='outline' />}>
              {t('gallery.popover')}
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>{t('gallery.overview')}</PopoverTitle>
              <PopoverDescription>
                {t('gallery.overviewText')}
              </PopoverDescription>
            </PopoverContent>
          </Popover>
          <Button
            nativeButton={false}
            render={<Link to={`dialog?${params}`} />}
          >
            {t('gallery.dialog')}
          </Button>
          <Button
            nativeButton={false}
            variant='outline'
            render={<Link to={`sheet?${params}`} />}
          >
            {t('gallery.sheet')}
          </Button>
        </div>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger render={<Button variant='destructive' />}>
            {t('gallery.confirm')}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className='text-destructive bg-destructive/10'>
                <RotateCcw aria-hidden='true' />
              </AlertDialogMedia>
              <AlertDialogTitle>{t('gallery.confirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('gallery.confirmText')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('gallery.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                onClick={() => {
                  setAction('');
                  setClear(true);
                  setConfirmOpen(false);
                }}
              >
                {t('gallery.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GallerySection>
    </GalleryPage>
  );
}
