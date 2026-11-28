import auditLabels from '../../locales/en-US.js';
const messages = {
  resourceTitle: 'Default Data Scope',
};

const enUS: typeof messages & typeof auditLabels = {
  ...auditLabels,
  ...messages,
};

export default enUS;
