import React from 'react';
import {
  Plugin,
  Action,
  CurrentAppInfoProvider,
  SchemaComponentOptions,
  CollectionManagerProviderV2,
  useCollectionManagerV2,
} from '@nocobase/client';
import { Kanban } from './Kanban';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner, kanbanCardInitializers } from './Kanban.Card.Designer';
import { KanbanCardDesignerTitleSwitch } from './Kanban.Card.Designer.TitleSwitch';
import { KanbanCardViewer } from './Kanban.CardViewer';
import { KanbanDesigner } from './Kanban.Designer';
import { kanbanActionInitializers } from './KanbanActionInitializers';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';
import { KanbanBlockInitializer } from './KanbanBlockInitializer';
import { kanbanSettings } from './Kanban.Settings';

Kanban.Card = KanbanCard;
Kanban.CardAdder = Action;
Kanban.CardViewer = KanbanCardViewer;
Kanban.Card.Designer = KanbanCardDesigner;
Kanban.Card.Designer.TitleSwitch = KanbanCardDesignerTitleSwitch;
Kanban.Designer = KanbanDesigner;

const KanbanV2 = Kanban;

const KanbanPluginProvider = React.memo((props) => {
  const collectionManager = useCollectionManagerV2();
  return (
    <CurrentAppInfoProvider>
      <SchemaComponentOptions
        components={{ Kanban, KanbanBlockProvider, KanbanV2, KanbanBlockInitializer }}
        scope={{ useKanbanBlockProps }}
      >
        <CollectionManagerProviderV2 collectionManager={collectionManager}>
          {props.children}
        </CollectionManagerProviderV2>
      </SchemaComponentOptions>
    </CurrentAppInfoProvider>
  );
});
KanbanPluginProvider.displayName = 'KanbanPluginProvider';

class KanbanPlugin extends Plugin {
  async load() {
    this.app.use(KanbanPluginProvider);
    this.app.schemaInitializerManager.add(kanbanCardInitializers);
    this.app.schemaInitializerManager.add(kanbanActionInitializers);
    this.app.schemaSettingsManager.add(kanbanSettings);

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('dataBlocks.kanban', {
      title: '{{t("Kanban")}}',
      Component: 'KanbanBlockInitializer',
    });
  }
}

export default KanbanPlugin;
