import Duration from "../components/Duration";
import { NAMESPACE } from "../locale";

export default {
  title: `{{t("Delay", { ns: "${NAMESPACE}" })}}`,
  type: 'delay',
  group: 'control',
  fieldset: {
    'config.duration': {
      type: 'number',
      name: 'config.duration',
      title: `{{t("Duration", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Duration',
      default: 60000
    },
    'config.endStatus': {
      type: 'number',
      name: 'config.endStatus',
      title: `{{t("End Status", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        placeholder: `{{t("Select status", { ns: "${NAMESPACE}" })}}`,
      },
      enum: [
        { label: `{{t("Succeed and continue", { ns: "${NAMESPACE}" })}}`, value: 1 },
        { label: `{{t("Fail and exit", { ns: "${NAMESPACE}" })}}`, value: -1 },
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
