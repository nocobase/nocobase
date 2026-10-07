/**
 * What deleting an App takes with it beyond the plugin's own records, from the assembling application: the plugin
 * knows Apps and environments only, so an application that relates Apps to something of its own (a repository that
 * builds the App, say) may provide `ReleasesDeleteAppImpactContext` with a component the Delete App confirmation shows
 * under its description. The component loads and words what it needs, and renders nothing when nothing of the
 * application's uses the App. Without the context the confirmation shows the plugin's own text only.
 */
import { createContext, type ComponentType, type Context } from 'react';

export interface DeleteAppImpactProps {
  /** The App about to be deleted. */
  readonly appId: string;
}

export interface DeleteAppImpact {
  readonly Impact: ComponentType<DeleteAppImpactProps>;
}

export const ReleasesDeleteAppImpactContext: Context<DeleteAppImpact | null> =
  createContext<DeleteAppImpact | null>(null);
