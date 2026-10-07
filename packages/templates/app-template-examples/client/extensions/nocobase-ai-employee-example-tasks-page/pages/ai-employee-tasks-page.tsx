import { useTranslation } from '@nocobase/i18n/client';
import { ListOrdered, Send, TextCursorInput } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AIEmployeeShortcut,
  AIPageContextScope,
  useAI,
  useGlobalAIChatController,
} from '@/extensions/nocobase-ai';
import { AI_EMPLOYEE_EXAMPLE_EMPLOYEE } from '@nocobase/app-plugin-ai-employee-example/client';

import { useTicketTasks } from '../tasks';
import {
  SUPPORT_TICKETS,
  ticketWorkContext,
  type SupportTicket,
} from '../tickets';

const PRIORITY_VARIANT = {
  high: 'destructive',
  normal: 'secondary',
  low: 'outline',
} as const;

/**
 * Three ways to hand an AI employee a prepared task, all through the application's global AI entry:
 * `AIEmployeeShortcut` offers a record's tasks from the record itself, `AIPageContextScope` supplies that record as
 * work context, and `useGlobalAIChatController().triggerTask()` starts a task from any button.
 */
export default function AIEmployeeTasksPage(): ReactElement {
  // The texts live in the plugin's locale files, which the registered plugin loads.
  const { t, i18n } = useTranslation(
    '@nocobase/app-plugin-ai-employee-example',
  );
  const ai = useAI();
  const controller = useGlobalAIChatController();
  const tasks = useTicketTasks();
  const [selectedId, setSelectedId] = useState(SUPPORT_TICKETS[0].id);
  const ticket =
    SUPPORT_TICKETS.find((item) => item.id === selectedId) ??
    SUPPORT_TICKETS[0];
  const employee = ai.employees.find(
    (item) => item.username === AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
  );

  const triageQueue = (): void => {
    controller.triggerTask({
      aiEmployee: AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
      task: tasks.triage(),
      context: SUPPORT_TICKETS.map(ticketWorkContext),
      open: true,
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('tasksPage.title')}
        description={t('tasksPage.description')}
        actions={
          <Button disabled={!employee} onClick={triageQueue}>
            <ListOrdered />
            {t('tasksPage.triage')}
          </Button>
        }
      />

      {ai.configurationStatus === 'ready' && !employee ? (
        <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
          {t('tasksPage.employeeUnavailable', {
            employee: AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
          })}
        </p>
      ) : null}

      <div className='grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]'>
        <Card>
          <CardHeader>
            <CardTitle>{t('tasksPage.queue')}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-1'>
            {SUPPORT_TICKETS.map((item) => (
              <Button
                key={item.id}
                variant={item.id === ticket.id ? 'secondary' : 'ghost'}
                aria-pressed={item.id === ticket.id}
                className='h-auto w-full justify-start py-2 text-left whitespace-normal'
                onClick={() => setSelectedId(item.id)}
              >
                <span className='min-w-0'>
                  <span className='block font-mono text-xs text-muted-foreground'>
                    {item.id}
                  </span>
                  <span className='block'>{item.title}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Everything inside this scope hands the selected ticket to the AI employee as work context, so the
        shortcut below needs no context of its own. */}
        <AIPageContextScope context={ticketWorkContext(ticket)}>
          <TicketDetail
            ticket={ticket}
            locale={i18n.language}
            shortcut={
              employee ? (
                <AIEmployeeShortcut
                  aiEmployee={employee.username}
                  tasks={[tasks.analyze(ticket), tasks.draftReply(ticket)]}
                  label={t('tasksPage.ask', { name: employee.nickname })}
                  size={32}
                />
              ) : null
            }
          />
        </AIPageContextScope>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tasksPage.howTitle')}</CardTitle>
          <CardDescription>{t('tasksPage.howDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className='grid gap-3 text-sm md:grid-cols-3'>
            <TaskMode
              icon={<Send className='size-4' />}
              title={t('tasksPage.tasks.analyze.title')}
              description={t('tasksPage.modes.autoSend')}
            />
            <TaskMode
              icon={<TextCursorInput className='size-4' />}
              title={t('tasksPage.tasks.draftReply.title')}
              description={t('tasksPage.modes.fillComposer')}
            />
            <TaskMode
              icon={<ListOrdered className='size-4' />}
              title={t('tasksPage.tasks.triage.title')}
              description={t('tasksPage.modes.programmatic')}
            />
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function TicketDetail({
  ticket,
  locale,
  shortcut,
}: {
  readonly ticket: SupportTicket;
  readonly locale: string;
  readonly shortcut: ReactElement | null;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee-example');

  return (
    <Card>
      <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-4'>
        <div className='min-w-0 space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-mono text-xs text-muted-foreground'>
              {ticket.id}
            </span>
            <Badge variant='outline'>
              {t(`tasksPage.status.${ticket.status}`)}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
              {t(`tasksPage.priority.${ticket.priority}`)}
            </Badge>
          </div>
          <CardTitle className='text-lg'>{ticket.title}</CardTitle>
        </div>
        {shortcut}
      </CardHeader>
      <CardContent className='space-y-5'>
        <dl className='grid gap-4 text-sm sm:grid-cols-2'>
          <div>
            <dt className='text-muted-foreground'>
              {t('tasksPage.requester')}
            </dt>
            <dd className='mt-1 font-medium'>{ticket.requester}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>{t('tasksPage.created')}</dt>
            <dd className='mt-1 font-medium'>
              {new Date(ticket.createdAt).toLocaleString(locale)}
            </dd>
          </div>
        </dl>
        <p className='text-sm leading-6'>{ticket.description}</p>
      </CardContent>
    </Card>
  );
}

function TaskMode({
  icon,
  title,
  description,
}: {
  readonly icon: ReactElement;
  readonly title: string;
  readonly description: string;
}): ReactElement {
  return (
    <li className='space-y-1 rounded-lg border p-4'>
      <div className='flex items-center gap-2 font-medium'>
        {icon}
        {title}
      </div>
      <p className='leading-6 text-muted-foreground'>{description}</p>
    </li>
  );
}
