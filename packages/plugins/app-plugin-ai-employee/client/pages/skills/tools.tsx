import { CircleAlert } from 'lucide-react';
import type { ReactElement } from 'react';
import { useOutletContext } from 'react-router';
import { useCatalogDisplay } from '../../catalog-display.js';
import { ToolListContent } from '../../components/tool-list-content.js';
import { TabsContent } from '../../components/ui/tabs.js';
import { useT } from '../../locales/index.js';
import type { ManagedSkillDetail } from '../../skills-management-service.js';
import { Empty, EmptyDescription } from '../../components/ui/empty.js';

export default function SkillToolsPage(): ReactElement {
  const skill = useOutletContext<ManagedSkillDetail>();
  const t = useT();
  const { toolTitle, toolAbout, compareTitles } = useCatalogDisplay();
  const tools = [...skill.tools].sort((left, right) =>
    compareTitles(toolTitle(left), toolTitle(right), left.name, right.name),
  );
  return (
    <TabsContent
      value='tools'
      className='min-w-0 py-6 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
    >
      <p className='mb-5 text-sm leading-6 text-muted-foreground'>
        {t('skills.toolsDescription')}
      </p>
      {tools.length ? (
        <ul className='flex min-w-0 flex-col divide-y rounded-lg border px-4'>
          {tools.map((tool) => (
            <li
              key={tool.name}
              className='flex min-h-32 min-w-0 items-center overflow-hidden py-4'
            >
              <ToolListContent
                name={tool.name}
                title={toolTitle(tool)}
                about={toolAbout(tool)}
                status={
                  !tool.available ? (
                    <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <CircleAlert aria-hidden='true' className='size-3.5' />
                      {t('skills.toolMissing')}
                    </span>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className='border'>
          <EmptyDescription>{t('skills.noTools')}</EmptyDescription>
        </Empty>
      )}
    </TabsContent>
  );
}
