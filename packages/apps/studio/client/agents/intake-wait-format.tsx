/** Studio joins the projects intake progress to the agents' localized wait descriptions. */
import { formatRunWait } from '@nocobase/app-plugin-agents/client/runs';
import {
  IntakeWaitFormatContext,
  type IntakeWaitFormat,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, type ReactElement, type ReactNode } from 'react';

export function AgentIntakeWaitFormat({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const format = useCallback<IntakeWaitFormat>(
    (wait) => formatRunWait(t, wait, { locale: i18n.language }),
    [t, i18n.language],
  );
  return (
    <IntakeWaitFormatContext.Provider value={format}>
      {children}
    </IntakeWaitFormatContext.Provider>
  );
}
