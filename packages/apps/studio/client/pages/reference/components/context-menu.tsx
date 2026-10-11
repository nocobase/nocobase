import { useTranslation } from '@nocobase/i18n/client';
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  TruckIcon,
  XCircleIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

import { ExamplePage, ExampleSection } from '../shared';

const TRIGGER_CLASS =
  'flex h-32 w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground';

type SortField = 'name' | 'date' | 'amount';

function isSortField(value: unknown): value is SortField {
  return value === 'name' || value === 'date' || value === 'amount';
}

export default function ContextMenuExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <ExamplePage
      title={t('components.contextMenu.title')}
      description={t('components.contextMenu.description')}
      docs='https://ui.shadcn.com/docs/components/context-menu'
    >
      <ExampleSection
        title={t('components.contextMenu.basic')}
        description={t('components.contextMenu.basicDescription')}
      >
        <ContextMenu>
          <ContextMenuTrigger className={TRIGGER_CLASS}>
            {t('components.contextMenu.rightClickHere')}
          </ContextMenuTrigger>
          <ContextMenuContent className='w-48'>
            <ContextMenuGroup>
              <ContextMenuItem>
                {t('reference.back')}
                <ContextMenuShortcut>⌘[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem disabled>
                {t('components.contextMenu.forward')}
                <ContextMenuShortcut>⌘]</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                {t('reference.refresh')}
                <ContextMenuShortcut>⌘R</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem>
                {t('components.contextMenu.saveAs')}
                <ContextMenuShortcut>⌘S</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                {t('components.contextMenu.print')}
                <ContextMenuShortcut>⌘P</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.contextMenu.submenu')}
        description={t('components.contextMenu.submenuDescription')}
      >
        <ContextMenu>
          <ContextMenuTrigger className={TRIGGER_CLASS}>
            {t('components.contextMenu.rightClickHere')}
          </ContextMenuTrigger>
          <ContextMenuContent className='w-48'>
            <ContextMenuGroup>
              <ContextMenuItem>{t('reference.open')}</ContextMenuItem>
              <ContextMenuItem>{t('reference.edit')}</ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  {t('reference.share')}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className='w-44'>
                  <ContextMenuGroup>
                    <ContextMenuItem>{t('reference.email')}</ContextMenuItem>
                    <ContextMenuItem>
                      {t('components.contextMenu.message')}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem>
                      {t('components.contextMenu.copyLink')}
                    </ContextMenuItem>
                  </ContextMenuGroup>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  {t('components.contextMenu.moveTo')}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className='w-44'>
                  <ContextMenuGroup>
                    <ContextMenuItem>
                      {t('components.contextMenu.folderProjects')}
                    </ContextMenuItem>
                    <ContextMenuItem>
                      {t('components.contextMenu.folderShared')}
                    </ContextMenuItem>
                    <ContextMenuItem>
                      {t('components.contextMenu.folderArchive')}
                    </ContextMenuItem>
                  </ContextMenuGroup>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.contextMenu.options')}
        description={t('components.contextMenu.optionsDescription')}
      >
        <ContextMenu>
          <ContextMenuTrigger className={TRIGGER_CLASS}>
            {t('components.contextMenu.rightClickHere')}
          </ContextMenuTrigger>
          <ContextMenuContent className='w-52'>
            <ContextMenuGroup>
              <ContextMenuLabel>
                {t('components.contextMenu.view')}
              </ContextMenuLabel>
              <ContextMenuCheckboxItem
                checked={showArchived}
                onCheckedChange={(checked) => setShowArchived(checked)}
              >
                {t('components.contextMenu.showArchived')}
              </ContextMenuCheckboxItem>
              <ContextMenuCheckboxItem
                checked={showCompleted}
                onCheckedChange={(checked) => setShowCompleted(checked)}
              >
                {t('components.contextMenu.showCompleted')}
              </ContextMenuCheckboxItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuLabel>
                {t('components.contextMenu.sortBy')}
              </ContextMenuLabel>
              <ContextMenuRadioGroup
                value={sortBy}
                onValueChange={(value: unknown) => {
                  if (isSortField(value)) setSortBy(value);
                }}
              >
                <ContextMenuRadioItem value='name'>
                  {t('reference.name')}
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value='date'>
                  {t('reference.date')}
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value='amount'>
                  {t('reference.amount')}
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
        <div className='flex flex-wrap gap-2 text-sm'>
          <Badge variant={showArchived ? 'secondary' : 'outline'}>
            {t('components.contextMenu.showArchived')}
          </Badge>
          <Badge variant={showCompleted ? 'secondary' : 'outline'}>
            {t('components.contextMenu.showCompleted')}
          </Badge>
          <Badge variant='outline'>
            {t('components.contextMenu.sortBy')}: {t(`reference.${sortBy}`)}
          </Badge>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.contextMenu.record')}
        description={t('components.contextMenu.recordDescription')}
      >
        <ContextMenu>
          <ContextMenuTrigger className='flex w-full max-w-sm items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3 text-sm'>
            <div className='flex flex-col gap-0.5'>
              <span className='font-mono text-xs text-muted-foreground'>
                ORD-1042
              </span>
              <span className='font-medium'>Ava Chen</span>
            </div>
            <div className='flex items-center gap-3'>
              <Badge variant='secondary'>
                {t('reference.statusProcessing')}
              </Badge>
              <span className='font-medium tabular-nums'>$1,240.00</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className='w-52'>
            <ContextMenuGroup>
              <ContextMenuLabel>ORD-1042</ContextMenuLabel>
              <ContextMenuItem
                onClick={() =>
                  setLastAction(t('components.contextMenu.viewDetails'))
                }
              >
                <EyeIcon />
                {t('components.contextMenu.viewDetails')}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setLastAction(t('reference.edit'))}
              >
                <PencilIcon />
                {t('reference.edit')}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  setLastAction(t('components.contextMenu.duplicate'))
                }
              >
                <CopyIcon />
                {t('components.contextMenu.duplicate')}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  setLastAction(t('components.contextMenu.markShipped'))
                }
              >
                <TruckIcon />
                {t('components.contextMenu.markShipped')}
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem
                variant='destructive'
                onClick={() =>
                  setLastAction(t('components.contextMenu.cancelOrder'))
                }
              >
                <XCircleIcon />
                {t('components.contextMenu.cancelOrder')}
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
        <span className='text-sm text-muted-foreground'>
          {lastAction
            ? t('components.contextMenu.lastAction', { action: lastAction })
            : t('components.contextMenu.noAction')}
        </span>
      </ExampleSection>
    </ExamplePage>
  );
}
