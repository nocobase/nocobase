import { Plugin } from '@nocobase/client';
import { GraphCollectionPane } from './GraphCollectionShortcut';
import { NAMESPACE } from './locale';
export class GraphCollectionPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(`data-source-manager/main.graph`, {
      title: `{{t("Graphical interface", { ns: "${NAMESPACE}" })}}`,
      Component: GraphCollectionPane,
      topLevelName: `data-source-manager/main`,
      pluginKey: NAMESPACE,
      aclSnippet: 'pm.data-source-manager.graph',
    });
  }
}

export default GraphCollectionPlugin;
