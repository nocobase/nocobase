// The plugin's public client surface. The default export is the registration factory an application lists in
// its client/plugins.ts.
export { default } from './plugin.js';
export type { ReleasesClientOptions } from './plugin.js';
export { createReleasesRoutes, type ReleasesRouteOptions } from './routes.js';
export {
  ReleasesActorNameContext,
  type ActorNameProps,
  type ActorNames,
} from './lib/actor-names.js';
export {
  ReleasesPeoplePickerContext,
  type PeoplePicker,
  type PeoplePickerProps,
} from './lib/people-picker.js';
export { errorText, messageText } from './lib/errors.js';
export {
  createDriverFormRegistry,
  hostDriverForm,
  releasesDriverFormsToken,
  type DriverFormDescription,
  type DriverFormRegistry,
} from './driver-forms/index.js';
export {
  ReleasesAppOriginContext,
  type AppOrigin,
  type AppOriginProps,
  type AppOriginSummaryProps,
} from './lib/app-origin.js';
export {
  ReleasesDeleteAppImpactContext,
  type DeleteAppImpact,
  type DeleteAppImpactProps,
} from './lib/delete-app-impact.js';
export {
  ReleasesPathsContext,
  withReleasesPaths,
  type ReleasesPaths,
} from './lib/paths.js';
export {
  ReleasesSystemLabelsContext,
  type SystemLabels,
} from './lib/system-labels.js';
