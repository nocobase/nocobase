/**
 * Labels the assembling application adds and reads itself (an issue's preview carries `acme=preview`, `issue`, …).
 * They are opaque to the plugin, so the application may provide `ReleasesSystemLabelsContext` with a function that
 * explains such a label ("added by the preview"); the pages then show it read-only, with the explanation on hover, and
 * keep it when someone edits the other labels. Without it, every label is the user's own.
 */
import { createContext, useContext, type Context } from 'react';

export interface SystemLabels {
  /** Why the label is there, in the reader's language; null for a label people may edit. */
  explain(key: string, value: string): string | null;
}

export const ReleasesSystemLabelsContext: Context<SystemLabels | null> =
  createContext<SystemLabels | null>(null);

/** The labels of `labels` the assembling application added, which people may not edit. */
export function useSystemLabels(): (
  labels: Readonly<Record<string, string>>,
) => Record<string, string> {
  const system = useContext(ReleasesSystemLabelsContext);
  return (labels) =>
    Object.fromEntries(
      Object.entries(labels).filter(
        ([key, value]) => system?.explain(key, value) != null,
      ),
    );
}
