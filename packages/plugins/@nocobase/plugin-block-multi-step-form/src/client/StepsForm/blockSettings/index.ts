import {
  SchemaSettings,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsLinkageRules,
  useSchemaToolbar,
  useCollection,
  SchemaSettingsTemplate,
  useBlockTemplateContext,
} from '@nocobase/client';
import { StepsFormName, ComponentType } from '../../constants';

export const blockSettings = new SchemaSettings({
  name: `blockSettings:${StepsFormName}`,
  items: [
    {
      name: 'StepsForm',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'StepsFormHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'StepsFormLink',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    // {
    //   name: 'StepsFormTemplate',
    //   Component: SchemaSettingsTemplate,
    //   useComponentProps() {
    //     const { name } = useCollection();
    //     const { componentNamePrefix } = useBlockTemplateContext();
    //     return {
    //       componentName: `${componentNamePrefix}${ComponentType}`,
    //       collectionName: name,
    //     };
    //   },
    // },
    // {
    //   name: 'divider2',
    //   type: 'divider',
    // },
    {
      type: 'remove',
      name: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
