export const CustomRequestSchema = {
  type: 'item',
  title: '{{t("Custom request")}}',
  component: 'CustomizeActionInitializer',
  schema: {
    title: '{{ t("Custom request") }}',
    'x-component': 'Action',
    'x-action': 'customize:form:request',
    'x-designer': 'Action.Designer',
    'x-action-settings': {
      skipValidator: false,
      onSuccess: {
        manualClose: false,
        redirecting: false,
        successMessage: '{{t("Request success")}}',
      },
    },
    'x-component-props': {
      useProps: '{{ useCustomizeRequestActionProps }}',
    },
  },
};
