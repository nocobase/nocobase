import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  navigation: {
    tasks: 'AI employee tasks',
  },
  fallback: {
    title: 'AI employee tasks',
    description:
      'This page is the plugin’s fallback. The task page itself is application-owned source: install the Registry items below and the application renders them in place of this page.',
    stepsTitle: 'Install the application-owned UI',
    chatStep:
      'Install the AI Employee plugin’s nocobase-ai item into client/extensions/nocobase-ai and mount the global AI entry in the application layout.',
    pageStep:
      'Install this plugin’s tasks-page item into client/extensions/nocobase-ai-employee-example-tasks-page. Its extension.ts replaces this page.',
    employeeTitle: 'Registered by this plugin',
    employee:
      'The server registers the AI employee “{{employee}}” and the read-only tool “{{tool}}”, which the task page uses.',
  },
  tasksPage: {
    title: 'AI employee tasks',
    description:
      'Prepared requests an AI employee runs on the record in front of you. Open a ticket’s tasks from the employee beside its title, or start the queue triage from the button.',
    triage: 'Triage the queue',
    queue: 'Ticket queue',
    ask: 'Ask {{name}}',
    employeeUnavailable:
      'The AI employee “{{employee}}” is not available to you. Check that the example plugin is registered on the server and the employee is enabled under Settings › AI.',
    requester: 'Requester',
    created: 'Created',
    status: {
      open: 'Open',
      pending: 'Pending',
    },
    priority: {
      high: 'High',
      normal: 'Normal',
      low: 'Low',
    },
    howTitle: 'How the tasks run',
    howDescription:
      'Each task carries its user message, instructions for that run, and the tools it may call. The global AI entry opens with the task’s employee and the ticket as work context.',
    modes: {
      autoSend:
        'Sent as soon as you pick it. The employee reads the ticket’s internal history with the plugin’s tool before answering.',
      fillComposer:
        'Placed in the composer instead of sent, so you can add what you know before sending.',
      programmatic:
        'Started from a page button through the global chat controller, with every ticket in the queue as work context.',
    },
    tasks: {
      analyze: {
        title: 'Analyze this ticket',
        message: 'Analyze ticket {{id}} and recommend the next action.',
      },
      draftReply: {
        title: 'Draft a reply',
        message: 'Draft a reply to {{requester}} about ticket {{id}}.',
      },
      triage: {
        title: 'Triage the queue',
        message:
          'Rank the open tickets by urgency and tell me which to handle first.',
      },
    },
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AiEmployeeExampleResource = LocaleResource<typeof enUS>;

export default enUS;
