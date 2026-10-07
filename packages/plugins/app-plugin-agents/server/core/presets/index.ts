/**
 * Agent presets: roles a new agent can start from, registered by the application (`register`). A preset fills the new
 * agent's description, instructions and business actions; the agent is then like any other. The instructions are
 * prompt text and stay in English; the name and description people see are translated through the texts the
 * application gives.
 */
import type { AgentPreset } from '../../../shared/presets.js';

/** What registering a preset takes: the preset as the API lists it, its actions before they are narrowed. */
export type AgentPresetDefinition = AgentPreset;

export interface PresetRegistry {
  /** Returns what removes the preset. A key is registered once. */
  register(preset: AgentPresetDefinition): () => void;
  /** Every preset, in the order registered, its actions narrowed to those the application offers now. */
  list(): AgentPreset[];
  get(key: string): AgentPreset | undefined;
}

/** `offered` lists the keys of the business actions an agent may be configured with now. */
export function createPresetRegistry(
  offered: () => readonly string[],
): PresetRegistry {
  const presets = new Map<string, AgentPresetDefinition>();
  const narrow = (preset: AgentPresetDefinition): AgentPreset => {
    const available = new Set(offered());
    return {
      ...preset,
      actions: preset.actions.filter((action) => available.has(action)),
    };
  };
  return {
    register(preset) {
      if (presets.has(preset.key))
        throw new Error(`Agent preset already registered: ${preset.key}`);
      presets.set(preset.key, preset);
      return () => {
        if (presets.get(preset.key) === preset) presets.delete(preset.key);
      };
    },
    list: () => [...presets.values()].map(narrow),
    get(key) {
      const preset = presets.get(key);
      return preset ? narrow(preset) : undefined;
    },
  };
}
