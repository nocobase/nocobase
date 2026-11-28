import auditLabels from '../../locales/en-US.js';
// The title the plugin's server registers with the authorization catalog resolves in this namespace.
const messages = {
  resourceTitle: 'Sharing Rules',
};

const enUS: typeof messages & typeof auditLabels = {
  ...auditLabels,
  ...messages,
};

export default enUS;
