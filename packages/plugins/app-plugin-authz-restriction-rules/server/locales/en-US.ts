import auditLabels from '../../locales/en-US.js';
const messages = {
  resourceTitle: 'Restriction Rules',
};

const enUS: typeof messages & typeof auditLabels = {
  ...auditLabels,
  ...messages,
};

export default enUS;
