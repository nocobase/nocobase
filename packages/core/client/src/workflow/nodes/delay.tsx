import Duration from "../components/Duration";

export default {
  title: '{{t("Delay")}}',
  type: 'delay',
  group: 'control',
  fieldset: {
    'config.duration': {
      type: 'number',
      name: 'config.duration',
      title: '{{t("Duration")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Duration',
    },
    'config.endStatus': {
      type: 'number',
      name: 'config.endStatus',
      title: '{{t("End Status")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        placeholder: '{{t("Select status")}}',
      },
      enum: [
        { label: '{{t("As success")}}', value: 1 },
        { label: '{{t("As failure")}}', value: -1 },
      ]
    }
  },
  view: {

  },
  scope: {
  },
  components: {
    Duration
  }
};
