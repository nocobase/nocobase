import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import { useAIChatBase } from '../../providers/index.js';
import { ArrowUpRight, Send, TextCursorInput } from 'lucide-react';
import { AIEmployeeAvatar } from './ai-employee-avatar.js';
import { withStableKeys } from '../../shared/keys.js';

export function ChatEmptyState() {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const { currentEmployee, availableTasks, runTask } = useAIChatBase();

  return (
    <div className='flex min-h-full items-center justify-center px-6 py-12'>
      <div className='w-full max-w-sm text-center'>
        <AIEmployeeAvatar
          employee={currentEmployee}
          className='mx-auto size-12'
        />
        <p className='mx-auto mt-4 max-w-xs text-sm leading-6 text-muted-foreground'>
          {currentEmployee.greeting ??
            t('chat.defaultGreeting', 'Hi, I’m {{name}}. How can I help?', {
              name: currentEmployee.nickname,
            })}
        </p>
        {availableTasks.length ? (
          <div className='mt-6 grid gap-2 text-left'>
            {withStableKeys(
              availableTasks,
              (task) => task.title ?? task.message?.user ?? 'task',
            ).map(({ key, item: task }, index) => {
              const Icon = task.autoSend ? Send : TextCursorInput;
              return (
                <Button
                  key={key}
                  variant='outline'
                  className='h-auto justify-start gap-3 whitespace-normal px-3 py-3 text-left font-normal'
                  onClick={() => runTask(task)}
                >
                  <Icon className='size-4 text-muted-foreground' />
                  <span className='min-w-0 flex-1'>
                    <span className='block'>
                      {task.title ??
                        task.message?.user ??
                        t('chat.task.fallback', 'Task {{number}}', {
                          number: index + 1,
                        })}
                    </span>
                    <span className='mt-0.5 block text-[11px] text-muted-foreground'>
                      {task.autoSend
                        ? t('chat.task.automatic', 'Send automatically')
                        : t(
                            'chat.task.fillComposer',
                            'Fill the composer before sending',
                          )}
                    </span>
                  </span>
                  <ArrowUpRight className='size-3.5 text-muted-foreground' />
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
