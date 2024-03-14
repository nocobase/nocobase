import { Action, CurrentAppInfoProvider, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { Kanban } from './Kanban';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner, kanbanCardInitializers, kanbanCardInitializers_deprecated } from './Kanban.Card.Designer';
import { KanbanCardViewer } from './Kanban.CardViewer';
import { KanbanDesigner } from './Kanban.Designer';
import { kanbanSettings } from './Kanban.Settings';
import { kanbanActionInitializers, kanbanActionInitializers_deprecated } from './KanbanActionInitializers';
import { KanbanBlockInitializer } from './KanbanBlockInitializer';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';

Kanban.Card = KanbanCard;
Kanban.CardAdder = Action;
Kanban.CardViewer = KanbanCardViewer;
Kanban.Card.Designer = KanbanCardDesigner;
Kanban.Designer = KanbanDesigner;

const KanbanV2 = Kanban;

const KanbanPluginProvider = React.memo((props) => {
  return (
    <CurrentAppInfoProvider>
      <SchemaComponentOptions
        components={{ Kanban, KanbanBlockProvider, KanbanV2, KanbanBlockInitializer }}
        scope={{ useKanbanBlockProps }}
      >
        {props.children}
      </SchemaComponentOptions>
    </CurrentAppInfoProvider>
  );
});
KanbanPluginProvider.displayName = 'KanbanPluginProvider';

class KanbanPlugin extends Plugin {
  async load() {
    this.app.use(KanbanPluginProvider);
    this.app.schemaInitializerManager.add(kanbanCardInitializers_deprecated);
    this.app.schemaInitializerManager.add(kanbanCardInitializers);
    this.app.schemaInitializerManager.add(kanbanActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(kanbanActionInitializers);
    this.app.schemaSettingsManager.add(kanbanSettings);

    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('dataBlocks.kanban', {
      title: '{{t("Kanban")}}',
      Component: 'KanbanBlockInitializer',
    });
  }
}

export default KanbanPlugin;
