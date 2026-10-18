// The plugin's public client surface. The default export is the registration factory an application lists in
// its client/plugins.ts.
export { default } from './plugin.js';

export { default as officeLocales } from './locales/index.js';

export type {
  OfficeWorkflowParameters,
  OfficeWorkflowValues,
  DispatchRules,
} from '../shared/workflow-parameters.js';
export { officeParameterFields } from '../shared/workflow-parameters.js';
export { PEOPLE as officePeople } from '../shared/people.js';
