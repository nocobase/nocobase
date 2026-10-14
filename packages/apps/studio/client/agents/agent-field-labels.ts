import { useMemo } from 'react';

import type { AgentPickerLabels } from '@/components/agent-picker';
import { useAgentPickerLabels } from '@/extensions/nocobase-agent-chat/chat-i18n';

/** The agent picker's words for a form field labelled `field`, so its trigger reads "<field>: <agent>". */
export function useAgentFieldLabels(field: string): AgentPickerLabels {
  const labels = useAgentPickerLabels();
  return useMemo(
    () => ({ ...labels, field: `${field}: {name}` }),
    [labels, field],
  );
}
