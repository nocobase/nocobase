import type {
  FoundationCapability,
  FoundationOverview,
  FoundationProviderInventory,
} from './foundation.js';

const CORE_RUNTIME = new Set([
  'dataModeling',
  'interface',
  'operations',
  'workflows',
]);

/** Show recognized installed capabilities as well as current runtime capabilities; installation never proves use. */
export function availableCapabilities(
  observations: readonly FoundationCapability[],
  inventory: FoundationProviderInventory,
): readonly FoundationCapability[] {
  const known = observations.flatMap((capability) => {
    const providers = inventory.entries.filter((entry) =>
      entry.categories.includes(capability.key),
    );
    const registered = providers.some(
      (entry) =>
        entry.registration === 'observed' &&
        (!inventory.serverRegistrationsComplete ||
          capability.key === 'interface' ||
          entry.evidence.some(
            (source) =>
              source !== 'manifest' && source !== 'clientContribution',
          )),
    );
    if (registered) return [capability];
    if (CORE_RUNTIME.has(capability.key) && capability.status !== 'unused')
      return [capability];
    // Older runtimes expose only partial registration evidence; preserve capabilities whose use the collector proved.
    if (
      !inventory.serverRegistrationsComplete &&
      (capability.status === 'active' || capability.status === 'needsSetup')
    )
      return [capability];
    if (!providers.some((entry) => entry.installed)) return [];
    // Keep installed-only capabilities visible, but stale tables and a manifest cannot establish current use.
    // Preserve unreadable observations as unknown rather than turning collection failures into an unused state.
    if (capability.status === null) return [capability];
    return [
      {
        ...capability,
        status: 'unused' as const,
        reason: 'installedNotUsed',
        facts: [],
        parts: [],
      },
    ];
  });
  const extensions = inventory.entries
    .filter(
      (entry) =>
        entry.kind === 'plugin' &&
        entry.registration === 'observed' &&
        entry.categories.length === 0,
    )
    .map((entry): FoundationCapability => ({
      key: `extension:${entry.name}`,
      title: entry.displayName ?? entry.name,
      ...(entry.description ? { description: entry.description } : {}),
      status: null,
      reason: 'unrecognizedExtension',
      facts: [{ code: 'registeredExtension' }],
      metrics: [],
      parts: [],
      packages: [{ name: entry.name, version: entry.version }],
      completeness: 'complete',
      issues: [],
    }));
  return [...known, ...extensions];
}

/** Client-only registrations are added to the same model without changing server usage evidence. */
export function withAvailableCapabilities(
  overview: FoundationOverview,
  inventory: FoundationProviderInventory,
): FoundationOverview {
  return {
    ...overview,
    inventory,
    availableCapabilities: availableCapabilities(
      overview.capabilities,
      inventory,
    ),
  };
}
