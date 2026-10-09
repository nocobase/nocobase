import { useContext } from 'react';

import { ApprovalUiContext, type ApprovalUi } from './approval-ui-context.js';

/** The options of the nearest `ApprovalUiProvider`, or the defaults. */
export function useApprovalUi(): ApprovalUi {
  return useContext(ApprovalUiContext);
}
