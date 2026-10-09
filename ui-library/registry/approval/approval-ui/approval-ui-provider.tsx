import { useMemo, type ReactElement, type ReactNode } from 'react';

import {
  APPROVAL_UI_DEFAULTS,
  ApprovalUiContext,
  type ApprovalUi,
  type ApprovalUiOptions,
} from './approval-ui-context.js';

export interface ApprovalUiProviderProps extends ApprovalUiOptions {
  readonly children: ReactNode;
}

/** Tells the approval components below it how the application names and shows people. */
export function ApprovalUiProvider({
  personName,
  renderAvatar,
  formatDateTime,
  children,
}: ApprovalUiProviderProps): ReactElement {
  const value = useMemo<ApprovalUi>(
    () => ({
      personName: personName ?? APPROVAL_UI_DEFAULTS.personName,
      renderAvatar: renderAvatar ?? APPROVAL_UI_DEFAULTS.renderAvatar,
      formatDateTime: formatDateTime ?? APPROVAL_UI_DEFAULTS.formatDateTime,
    }),
    [personName, renderAvatar, formatDateTime],
  );
  return (
    <ApprovalUiContext.Provider value={value}>
      {children}
    </ApprovalUiContext.Provider>
  );
}
