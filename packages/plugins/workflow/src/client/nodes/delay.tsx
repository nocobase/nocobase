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
      default: 60000
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
        { label: '{{t("Succeed and continue")}}', value: 1 },
        { label: '{{t("Fail and exit")}}', value: -1 },
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
