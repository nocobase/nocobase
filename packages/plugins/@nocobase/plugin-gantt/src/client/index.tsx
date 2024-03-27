import { ActionBar, CurrentAppInfoProvider, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { GanttDesigner } from './Gantt.Designer';
import { ganttSettings, oldGanttSettings } from './Gantt.Settings';
import { GanttActionInitializers_deprecated, ganttActionInitializers } from './GanttActionInitializers';
import { GanttBlockInitializer } from './GanttBlockInitializer';
import { GanttBlockProvider, useGanttBlockProps } from './GanttBlockProvider';
import { Event } from './components/gantt/Event';
import { Gantt } from './components/gantt/gantt';
import { ViewMode } from './types/public-types';

Gantt.ActionBar = ActionBar;
Gantt.ViewMode = ViewMode;
Gantt.Designer = GanttDesigner;
Gantt.Event = Event;
export { Gantt };

const GanttProvider = React.memo((props) => {
  return (
    <CurrentAppInfoProvider>
      <SchemaComponentOptions
        components={{ Gantt, GanttBlockInitializer, GanttBlockProvider }}
        scope={{ useGanttBlockProps }}
      >
        {props.children}
      </SchemaComponentOptions>
    </CurrentAppInfoProvider>
  );
});

GanttProvider.displayName = 'GanttProvider';
export class GanttPlugin extends Plugin {
  async load() {
    this.app.use(GanttProvider);
    this.app.schemaSettingsManager.add(oldGanttSettings);
    this.app.schemaSettingsManager.add(ganttSettings);
    this.app.schemaInitializerManager.add(GanttActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(ganttActionInitializers);
    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('dataBlocks.gantt', {
      title: "{{t('Gantt')}}",
      Component: 'GanttBlockInitializer',
    });

    this.app.addScopes({
      useGanttBlockProps,
    });
  }
}

export default GanttPlugin;
