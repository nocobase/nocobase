import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import type { AIEmployeeTask } from '@/extensions/nocobase-ai';
import { AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL } from '@nocobase/app-plugin-ai-employee-example/client';

import type { SupportTicket } from './tickets';

export interface TicketTasks {
  analyze(ticket: SupportTicket): AIEmployeeTask;
  draftReply(ticket: SupportTicket): AIEmployeeTask;
  triage(): AIEmployeeTask;
}

// An AI employee task is a prepared request: a title the user picks, the user message, optional system
// instructions for this run only, and whether it is sent at once or left in the composer for the user to edit.
// `skillSettings.tools` narrows what the run may call to the tools it needs. The title and user message are shown
// to the user, so they are translated in the plugin's namespace; the system instructions are written for the model
// and stay in English.
export function useTicketTasks(): TicketTasks {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee-example');

  return useMemo(
    () => ({
      analyze: (ticket) => ({
        title: t('tasksPage.tasks.analyze.title'),
        message: {
          system: `Analyse the support ticket in the work context. Read its internal history with \`${AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL}\` first, then give the likely cause, the customer impact, and one recommended next action.`,
          user: t('tasksPage.tasks.analyze.message', { id: ticket.id }),
        },
        autoSend: true,
        skillSettings: { tools: [AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL] },
      }),
      draftReply: (ticket) => ({
        title: t('tasksPage.tasks.draftReply.title'),
        message: {
          system:
            'Draft a reply to the requester of the support ticket in the work context. Use its internal history, do not promise dates the history does not support, and keep it under 120 words.',
          user: t('tasksPage.tasks.draftReply.message', {
            id: ticket.id,
            requester: ticket.requester,
          }),
        },
        // Left in the composer: the user adds what they know before sending.
        autoSend: false,
        skillSettings: { tools: [AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL] },
      }),
      triage: () => ({
        title: t('tasksPage.tasks.triage.title'),
        message: {
          system:
            'The work context holds every open support ticket. Rank them by urgency, give one line of reasoning for each, and say which one to handle first.',
          user: t('tasksPage.tasks.triage.message'),
        },
        // Without skillSettings the run keeps the employee's own tools; ranking needs only the summaries it is given.
        autoSend: true,
      }),
    }),
    [t],
  );
}
