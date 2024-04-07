import { Plugin, useCollection_deprecated } from '@nocobase/client';
import { DuplicateAction } from './DuplicateAction';
import { deprecatedDuplicateActionSettings, duplicateActionSettings } from './DuplicateAction.Settings';
import { DuplicateActionInitializer } from './DuplicateActionInitializer';
import { DuplicatePluginProvider } from './DuplicatePluginProvider';

export class PluginActionDuplicateClient extends Plugin {
  async load() {
    this.app.use(DuplicatePluginProvider);
    this.app.addComponents({
      DuplicateActionInitializer,
      DuplicateAction,
    });
    this.app.schemaSettingsManager.add(deprecatedDuplicateActionSettings);
    this.app.schemaSettingsManager.add(duplicateActionSettings);

    const initializerData = {
      title: '{{t("Duplicate")}}',
      Component: 'DuplicateActionInitializer',
      schema: {
        'x-component': 'Action',
        'x-action': 'duplicate',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-settings': 'actionSettings:duplicate',
        'x-decorator': 'ACLActionProvider',
        'x-component-props': {
          type: 'primary',
        },
      },
      useVisible() {
        const collection = useCollection_deprecated();
        return (
          (collection.template !== 'view' || collection?.writableView) &&
          collection.template !== 'file' &&
          collection.template !== 'sql'
        );
      },
    };

    const initializerTableData = {
      title: '{{t("Duplicate")}}',
      Component: 'DuplicateActionInitializer',
      schema: {
        'x-component': 'Action.Link',
        'x-action': 'duplicate',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-settings': 'actionSettings:duplicate',
        'x-decorator': 'ACLActionProvider',
        'x-component-props': {
          type: 'primary',
        },
      },
      useVisible() {
        const collection = useCollection_deprecated();
        return (
          (collection.template !== 'view' || collection?.writableView) &&
          collection.template !== 'file' &&
          collection.template !== 'sql'
        );
      },
    };

    this.app.schemaInitializerManager.addItem('table:configureItemActions', 'actions.duplicate', initializerTableData);
  }
}

export default PluginActionDuplicateClient;
export * from './DuplicateAction';
