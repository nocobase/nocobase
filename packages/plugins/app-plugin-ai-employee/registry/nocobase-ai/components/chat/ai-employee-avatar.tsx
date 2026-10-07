import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { getAIEmployeeAvatar, type AIEmployee } from '../../providers/index.js';
import type { CSSProperties } from 'react';

export function AIEmployeeAvatar({
  employee,
  flip = false,
  className,
  style,
}: {
  employee?: AIEmployee;
  flip?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  return (
    <span
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full bg-transparent',
        className,
      )}
      style={style}
    >
      <img
        src={getAIEmployeeAvatar(employee?.avatar, { flip })}
        alt={employee?.nickname ?? t('chat.aiEmployee', 'AI employee')}
        className='size-full object-cover'
      />
    </span>
  );
}
