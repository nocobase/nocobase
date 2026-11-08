import { FEATURE_OVERVIEWS } from './feature-overview-catalog.js';

// Keep the content and UI behind the selected detail route.
export const featureOverviewLoaders = Object.fromEntries(
  Object.keys(FEATURE_OVERVIEWS).map((id) => [
    id,
    () => import('./feature-overview.js'),
  ]),
);
