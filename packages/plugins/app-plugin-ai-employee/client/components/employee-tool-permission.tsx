import { LockKeyhole, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';
import { ToolPermissionMenu } from './tool-permission-menu.js';
import { Badge } from './ui/badge.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';
import type {
  AIEmployeeToolSetting,
  AIMetadataItem,
} from '../ai-employee-service.js';
import { useT } from '../locales/index.js';

export function EmployeeToolPermission({
  item,
  setting,
  title,
  enabled,
  disabled,
  onChange,
}: {
  item: AIMetadataItem | undefined;
  setting: AIEmployeeToolSetting | undefined;
  title: string;
  enabled: boolean;
  disabled: boolean;
  onChange: (autoCall: boolean) => void;
}): ReactElement {
  const t = useT();
  const custom = item?.scope === 'CUSTOM';
  const permission =
    custom || !item
      ? setting
        ? setting.autoCall
          ? 'ALLOW'
          : 'ASK'
        : item?.defaultPermission
      : item.defaultPermission;
  const label =
    permission === 'ALLOW'
      ? t('Allow')
      : permission === 'ASK'
        ? t('Ask')
        : t('employeeTools.permissionUnavailable');
  const Icon = permission === 'ALLOW' ? ShieldCheck : MessageCircleQuestion;
  const accessibleLabel = t('employeeTools.permission', {
    name: title,
    permission: label,
  });
  const hint = !item
    ? t('employeeTools.unavailable')
    : custom
      ? !enabled
        ? t('employeeTools.enableToEdit')
        : permission === 'ALLOW'
          ? t('employeeTools.allowHint')
          : t('employeeTools.askHint')
      : t('employeeTools.registeredPermission');
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={custom && enabled && !disabled ? -1 : 0} />}
        className='inline-flex'
        aria-label={
          custom && enabled && !disabled ? undefined : accessibleLabel
        }
      >
        {custom ? (
          <ToolPermissionMenu
            value={permission === 'ALLOW' ? 'ALLOW' : 'ASK'}
            label={
              permission === 'ALLOW' || permission === 'ASK' ? undefined : label
            }
            accessibleLabel={accessibleLabel}
            disabled={disabled || !enabled}
            onChange={(next) => onChange(next === 'ALLOW')}
          />
        ) : (
          <Badge variant='secondary' className='min-w-28 justify-between'>
            <Icon aria-hidden='true' />
            {label}
            <LockKeyhole aria-hidden='true' />
          </Badge>
        )}
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
