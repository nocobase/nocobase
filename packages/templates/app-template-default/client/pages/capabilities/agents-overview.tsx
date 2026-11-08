import { useTranslation } from '@nocobase/i18n/client';
import { Bot, BookOpen, Cpu, Monitor, ChartNoAxesCombined } from 'lucide-react';
import packageMetadata from '../../../package.json' with { type: 'json' };
import {
  CurrentApplication,
  InterfaceItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

const steps = {
  business: ['entry', 'models', 'chat', 'verify'],
  skills: ['prepare', 'import', 'select', 'verify'],
  runner: ['prepare', 'connect', 'enable', 'verify'],
} as const;

export default function AgentsOverview() {
  const { t } = useTranslation(packageMetadata.name);
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication>
        {(
          [
            ['agentInterfaces', 'agents', Bot],
            ['agentModels', 'models', Cpu],
            ['agentSkills', 'skills', BookOpen],
            ['agentMachines', 'runtimes', Monitor],
            ['agentUsage', 'usage', ChartNoAxesCombined],
          ] as const
        ).map(([key, name, icon]) => (
          <InterfaceItem
            key={key}
            title={t(`featureOverview.layout.${key}`)}
            names={[name]}
            icon={icon}
          />
        ))}
      </CurrentApplication>
      <ConfigurationActions>
        {(['business', 'skills', 'runner'] as const).map((goal) => (
          <ConfigurationAction
            key={goal}
            title={t(`agentsOverview.${goal}.title`)}
            description={t(`agentsOverview.${goal}.description`)}
            prompt={t(`agentsOverview.${goal}.prompt`)}
            steps={steps[goal].map((step) =>
              t(`agentsOverview.${goal}.steps.${step}`),
            )}
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
