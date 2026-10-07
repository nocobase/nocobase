import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../shared/ui/tooltip.js';
import { Maximize2, PanelRight, X } from 'lucide-react';

export function ChatSurfaceActions({
  expanded,
  onExpandedChange,
  onClose,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const resizeLabel = expanded
    ? t('surface.collapse', 'Collapse to side panel')
    : t('surface.expand', 'Expand panel');
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={resizeLabel}
              onClick={() => onExpandedChange(!expanded)}
            />
          }
        >
          {expanded ? <PanelRight /> : <Maximize2 />}
        </TooltipTrigger>
        <TooltipContent>{resizeLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('surface.closeChat', 'Close AI chat')}
              onClick={onClose}
            />
          }
        >
          <X />
        </TooltipTrigger>
        <TooltipContent>{t('actions.close', 'Close')}</TooltipContent>
      </Tooltip>
    </>
  );
}
