import { ButtonEditor, SchemaSettings, useSchemaToolbar } from '@nocobase/client';

export const stepsFormSubmitActionSettings = new SchemaSettings({
  name: `actionSettings:stepsFormSubmit`,
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
