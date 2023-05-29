import Duration from '../components/Duration';
import { JOB_STATUS } from '../constants';
import { NAMESPACE } from '../locale';

export default {
  title: `{{t("Delay", { ns: "${NAMESPACE}" })}}`,
  type: 'delay',
  group: 'control',
  description: `{{t("Delay a period of time and then continue or exit the process. Can be used to set wait or timeout times in parallel branches.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    duration: {
      type: 'number',
      title: `{{t("Duration", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Duration',
      default: 60000,
      required: true,
    },
    endStatus: {
      type: 'number',
      title: `{{t("End Status", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: `{{t("Succeed and continue", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.RESOLVED },
        { label: `{{t("Fail and exit", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.FAILED },
      ],
      required: true,
      default: JOB_STATUS.RESOLVED,
    },
  },
  view: {},
  scope: {},
  components: {
    Duration,
  },
};
