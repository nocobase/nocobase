import { useTranslation } from '@nocobase/i18n/client';
import {
  DownloadIcon,
  PrinterIcon,
  RefreshCwIcon,
  SaveIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ExamplePage, ExampleSection } from '../shared';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

export default function TooltipExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <ExamplePage
        title={t('components.tooltip.title')}
        description={t('components.tooltip.description')}
        docs='https://ui.shadcn.com/docs/components/tooltip'
      >
        <ExampleSection
          title={t('components.tooltip.basic')}
          description={t('components.tooltip.basicDescription')}
        >
          <Tooltip>
            <TooltipTrigger render={<Button variant='outline' />}>
              {t('reference.export')}
            </TooltipTrigger>
            <TooltipContent>
              {t('components.tooltip.exportHint')}
            </TooltipContent>
          </Tooltip>
        </ExampleSection>

        <ExampleSection
          title={t('components.tooltip.sides')}
          description={t('components.tooltip.sidesDescription')}
        >
          {SIDES.map((side) => (
            <Tooltip key={side}>
              <TooltipTrigger render={<Button variant='outline' />}>
                {t(`components.tooltip.side.${side}`)}
              </TooltipTrigger>
              <TooltipContent side={side}>
                {t('components.tooltip.lastSynced', { time: '09:14' })}
              </TooltipContent>
            </Tooltip>
          ))}
        </ExampleSection>

        <ExampleSection
          title={t('components.tooltip.shortcut')}
          description={t('components.tooltip.shortcutDescription')}
        >
          <Tooltip>
            <TooltipTrigger render={<Button variant='outline' />}>
              <SaveIcon data-icon='inline-start' />
              {t('reference.save')}
            </TooltipTrigger>
            <TooltipContent>
              {t('components.tooltip.saveHint')}
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>S</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant='outline' />}>
              <RefreshCwIcon data-icon='inline-start' />
              {t('reference.refresh')}
            </TooltipTrigger>
            <TooltipContent>
              {t('components.tooltip.refreshHint')}
              <Kbd>R</Kbd>
            </TooltipContent>
          </Tooltip>
        </ExampleSection>

        <ExampleSection
          title={t('components.tooltip.iconButtons')}
          description={t('components.tooltip.iconButtonsDescription')}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label={t('components.tooltip.printInvoice')}
                />
              }
            >
              <PrinterIcon />
            </TooltipTrigger>
            <TooltipContent>
              {t('components.tooltip.printInvoice')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label={t('reference.download')}
                />
              }
            >
              <DownloadIcon />
            </TooltipTrigger>
            <TooltipContent>
              {t('components.tooltip.downloadPdf')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label={t('reference.share')}
                />
              }
            >
              <Share2Icon />
            </TooltipTrigger>
            <TooltipContent>
              {t('components.tooltip.shareInvoice')}
            </TooltipContent>
          </Tooltip>
        </ExampleSection>

        <ExampleSection
          title={t('components.tooltip.disabled')}
          description={t('components.tooltip.disabledDescription')}
        >
          <Tooltip>
            <TooltipTrigger render={<span className='inline-block w-fit' />}>
              <Button variant='outline' disabled>
                <Trash2Icon data-icon='inline-start' />
                {t('components.tooltip.deleteInvoice')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('components.tooltip.deleteBlocked')}
            </TooltipContent>
          </Tooltip>
        </ExampleSection>
      </ExamplePage>
    </TooltipProvider>
  );
}
