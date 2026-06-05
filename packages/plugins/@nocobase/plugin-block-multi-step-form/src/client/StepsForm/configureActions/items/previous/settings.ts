import { ButtonEditor, SchemaSettings, useSchemaToolbar } from '@nocobase/client';

export const stepsFormPreviousActionSettings = new SchemaSettings({
  name: `actionSettings:stepsFormPrevious`,
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});
