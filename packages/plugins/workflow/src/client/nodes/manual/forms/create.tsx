import { useCollectionManager } from '@nocobase/client';

import { NAMESPACE } from '../../../locale';
import { findSchema, ManualFormType } from '../SchemaConfig';
import { FormBlockInitializer } from '../FormBlockInitializer';

export default {
  title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer() {
      const { collections } = useCollectionManager();
      return {
        key: 'createRecordForm',
        type: 'subMenu',
        title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
        children: collections
          .filter((item) => !item.hidden)
          .map((item) => ({
            key: `createForm-${item.name}`,
            type: 'item',
            title: item.title,
            schema: {
              collection: item.name,
              title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
              formType: 'create',
            },
            component: FormBlockInitializer,
          })),
      };
    },
    initializers: {
      // AddCustomFormField
    },
    components: {},
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(
        root,
        (item) => item['x-decorator'] === 'FormBlockProvider' && item['x-decorator-props'].formType === 'create',
      );
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        forms[formKey] = {
          type: 'create',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, (item) => item['x-component'] === 'Action').map(
            (item) => item['x-decorator-props'].value,
          ),
          collection: formBlock['x-decorator-props'].collection,
        };
      });
      return forms;
    },
  },
  block: {
    scope: {
      // useFormBlockProps
    },
    components: {},
  },
} as ManualFormType;
