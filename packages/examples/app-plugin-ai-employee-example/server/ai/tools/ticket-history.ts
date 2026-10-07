import { defineTools, type ToolsOptions } from '@nocobase/ai-employee';
import { z } from 'zod';

import { AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL } from '../../../shared/contracts.js';
import { TICKET_HISTORY } from '../ticket-history.js';

// SPECIFIED: only an employee that names the tool, or a task that enables it, can call it. It reads fixed example
// data and changes nothing, so it runs without asking.
const ticketHistoryTool: ToolsOptions = defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: 'Support ticket history',
    about:
      'Reads the internal activity log of an example support ticket by its id.',
  },
  definition: {
    name: AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
    description:
      'Return the internal activity log of a support ticket. Use it before analysing a ticket or drafting a reply.',
    schema: z.object({
      ticketId: z.string().describe('The ticket id, such as TK-1042.'),
    }),
  },
  invoke: (_ctx, args: { ticketId: string }) => {
    const history = TICKET_HISTORY[args.ticketId];
    return Promise.resolve(
      history
        ? {
            status: 'success',
            content: JSON.stringify({ ticketId: args.ticketId, history }),
          }
        : {
            status: 'error',
            content: `No support ticket with id ${args.ticketId}.`,
          },
    );
  },
});

export default ticketHistoryTool;
