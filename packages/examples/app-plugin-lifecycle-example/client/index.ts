// The plugin's public client surface. The default export is the registration factory an application lists in
// its client/plugins.ts.
export { default } from './plugin.js';

export { ParameterEditor } from './components/parameter-editor.js';
export { boundParameterGroups } from './components/parameter-binding-editor.js';
export { parameterApi, type ParameterApi } from './lib/parameter-api.js';
export type {
  ParameterGroupView,
  ParameterHistoryView,
  ReviewerReferencePage,
  ReviewerReferenceType,
} from '../shared/parameter-configuration.js';

export { ProcessDiagram } from './components/process-diagram-lazy.js';
export { useParameterBindingEditor } from './components/parameter-binding-editor.js';
export { IdentitySelect } from './components/identity.js';

export { default as lifecycleRoutes } from './routes.js';
export { default as lifecycleLocales } from './locales/index.js';
