import auditLabels from '../../locales/en-US.js';
const messages = {
  resourceTitle: 'Sharing Rules',
};

const enUS: typeof messages & typeof auditLabels = {
  ...auditLabels,
  ...messages,
};

export default enUS;
