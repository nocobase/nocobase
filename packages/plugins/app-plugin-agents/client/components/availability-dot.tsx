/** Whether an agent can answer a chat now, as a dot beside its name (the profile's default chat agent). */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import type { ChatAvailability } from '../../shared/conversations.js';
import { cn } from 'cn';

/** A green or grey dot with its meaning for screen readers. */
export function AvailabilityDot({
  availability,
  className,
}: {
  readonly availability: ChatAvailability;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const label = availability.online
    ? t('chat.availability.online')
    : t(`chat.availability.${availability.reason ?? 'noRunner'}`);
  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      data-online={availability.online ? 'true' : 'false'}
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        availability.online
          ? 'bg-[oklch(0.65_0.16_150)]'
          : 'bg-muted-foreground/40',
        className,
      )}
    />
  );
}
