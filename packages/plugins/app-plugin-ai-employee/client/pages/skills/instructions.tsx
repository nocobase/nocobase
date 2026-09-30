import type { ReactElement } from 'react';
import { useOutletContext } from 'react-router';
import { MarkdownMessage } from '../../components/markdown-message.js';
import { TabsContent } from '../../components/ui/tabs.js';
import { useT } from '../../locales/index.js';
import type { ManagedSkillDetail } from '../../skills-management-service.js';

export default function SkillInstructionsPage(): ReactElement {
  const skill = useOutletContext<ManagedSkillDetail>();
  const t = useT();
  return (
    <TabsContent
      value='instructions'
      className='min-w-0 py-6 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
    >
      <section
        aria-label={t('skills.content')}
        className='min-w-0 max-w-full [overflow-wrap:anywhere] [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h4]:text-sm [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:[overflow-wrap:normal] [&_table]:[overflow-wrap:normal]'
      >
        {skill.content.trim() ? (
          <MarkdownMessage>{skill.content}</MarkdownMessage>
        ) : (
          <p className='py-4 text-sm text-muted-foreground'>
            {t('skills.noContent')}
          </p>
        )}
      </section>
    </TabsContent>
  );
}
