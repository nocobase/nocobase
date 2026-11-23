/**
 * What an application or another plugin adds to, or replaces in, the agents' panel, conversation page and personal
 * page without copying them: `agents.toolRenderers`, `agents.slots`, `agents.components` and
 * `agents.preferenceSections` on the plugin's client entry. Each registration returns the function that removes it,
 * and the panel follows registrations made after it rendered.
 *
 * The registry is the module's own: the application registers once, at module load (its `client/plugins.ts`) or in a
 * client service provider's `boot`.
 */
import { useSyncExternalStore, type ComponentType } from 'react';

import type { AppUIMessage } from '../shared/online-agent.js';
import type { AIToolRendererProps } from './chat/tool-renderer.js';

type Listener = () => void;

/** A small observable map: registrations by key, a version that changes with every registration. */
class Store<V> {
  #entries = new Map<string, V>();
  #listeners = new Set<Listener>();
  #version = 0;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  readonly version = (): number => this.#version;

  set(key: string, value: V): () => void {
    this.#entries.set(key, value);
    this.#changed();
    return () => {
      if (this.#entries.get(key) !== value) return;
      this.#entries.delete(key);
      this.#changed();
    };
  }

  get(key: string): V | undefined {
    return this.#entries.get(key);
  }

  has(key: string): boolean {
    return this.#entries.has(key);
  }

  values(): readonly V[] {
    return [...this.#entries.values()];
  }

  #changed(): void {
    this.#version += 1;
    for (const listener of this.#listeners) listener();
  }
}

function nonEmpty(what: string, value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${what} must be a non-empty string.`);
  return value.trim();
}

function component(what: string, value: unknown): void {
  const exotic =
    typeof value === 'object' && value !== null && '$$typeof' in value;
  if (typeof value !== 'function' && !exotic)
    throw new Error(`${what} must be a React component.`);
}

// --- Tool renderers ---------------------------------------------------------------------------------------------

export interface AgentToolRendererRegistration {
  /** The SDK tool name the card renders (`tool-<name>` parts and dynamic tools of that name). */
  readonly name: string;
  readonly component: ComponentType<AIToolRendererProps>;
}

const toolRendererStore = new Store<ComponentType<AIToolRendererProps>>();

export interface AgentToolRenderers {
  /** Renders a tool's calls with `component`; a renderer given through `AIToolRendererProvider` still wins. */
  add(registration: AgentToolRendererRegistration): () => void;
}

const toolRenderers: AgentToolRenderers = {
  add({ name, component: renderer }) {
    const key = nonEmpty('A tool renderer name', name);
    component(`Tool renderer "${key}"`, renderer);
    return toolRendererStore.set(key, renderer);
  },
};

/** The renderer registered for a tool, following registrations (`agents.toolRenderers.add`). */
export function useRegisteredToolRenderer(
  toolName: string,
): ComponentType<AIToolRendererProps> | undefined {
  useSyncExternalStore(
    toolRendererStore.subscribe,
    toolRendererStore.version,
    toolRendererStore.version,
  );
  return toolRendererStore.get(toolName);
}

// --- Slots ------------------------------------------------------------------------------------------------------

/** What each slot's components are given. */
export interface AgentSlotProps {
  /** Beside the composer's attach button: the conversation, null before its first message. */
  readonly composerActions: {
    readonly conversationId: string | null;
    readonly agentId: string | null;
    /** Puts text into the composer, never sending it. */
    readonly insertText: (text: string) => void;
  };
  /** Among a message's actions (copy, edit, regenerate). */
  readonly messageActions: {
    readonly conversationId: string;
    readonly message: Readonly<AppUIMessage>;
  };
  /** Under the empty state of a new conversation, before its first message. */
  readonly emptyState: {
    readonly agentId: string | null;
    /** Puts text into the composer, never sending it. */
    readonly insertText: (text: string) => void;
  };
}

export type AgentSlotName = keyof AgentSlotProps;

export interface AgentSlotRegistration<S extends AgentSlotName> {
  /** Unique within the slot; registering the same key again replaces it. */
  readonly key: string;
  readonly component: ComponentType<AgentSlotProps[S]>;
  /** Lower first; defaults to 0, ties in registration order. */
  readonly order?: number;
}

export interface AgentSlot<S extends AgentSlotName> {
  add(registration: AgentSlotRegistration<S>): () => void;
}

export const AGENT_SLOT_NAMES: readonly AgentSlotName[] = [
  'composerActions',
  'messageActions',
  'emptyState',
];

type AnySlotRegistration = AgentSlotRegistration<AgentSlotName> & {
  readonly sequence: number;
};

const slotStores: Record<AgentSlotName, Store<AnySlotRegistration>> = {
  composerActions: new Store(),
  messageActions: new Store(),
  emptyState: new Store(),
};
let slotSequence = 0;

function slot<S extends AgentSlotName>(name: S): AgentSlot<S> {
  return {
    add(registration) {
      const key = nonEmpty(`A ${name} slot key`, registration.key);
      component(`Slot "${name}" component "${key}"`, registration.component);
      if (
        registration.order !== undefined &&
        !Number.isFinite(registration.order)
      )
        throw new Error(`Slot "${name}" order of "${key}" must be finite.`);
      slotSequence += 1;
      return slotStores[name].set(key, {
        ...(registration as unknown as AgentSlotRegistration<AgentSlotName>),
        key,
        sequence: slotSequence,
      });
    },
  };
}

export interface AgentSlots {
  readonly composerActions: AgentSlot<'composerActions'>;
  readonly messageActions: AgentSlot<'messageActions'>;
  readonly emptyState: AgentSlot<'emptyState'>;
}

const slots: AgentSlots = {
  composerActions: slot('composerActions'),
  messageActions: slot('messageActions'),
  emptyState: slot('emptyState'),
};

/** The components registered in a slot, in order, each with its key. */
export function useAgentSlot<S extends AgentSlotName>(
  name: S,
): readonly {
  readonly key: string;
  readonly component: ComponentType<AgentSlotProps[S]>;
}[] {
  const store = slotStores[name];
  useSyncExternalStore(store.subscribe, store.version, store.version);
  return store
    .values()
    .slice()
    .sort(
      (left, right) =>
        (left.order ?? 0) - (right.order ?? 0) ||
        left.sequence - right.sequence,
    )
    .map((entry) => ({
      key: entry.key,
      component: entry.component as unknown as ComponentType<AgentSlotProps[S]>,
    }));
}

// --- Component replacement --------------------------------------------------------------------------------------

/**
 * The parts of the panel and the conversation page an application may replace, each given the props the plugin's own
 * component takes (`AgentReplaceableProps`) and the plugin's component as `Default`, to wrap rather than rewrite it.
 */
export type AgentComponentName =
  | 'MessageItem'
  | 'Composer'
  | 'ConversationListItem'
  | 'PanelHeader'
  | 'ToolCard'
  | 'ConfirmationCard';

export const AGENT_COMPONENT_NAMES: readonly AgentComponentName[] = [
  'MessageItem',
  'Composer',
  'ConversationListItem',
  'PanelHeader',
  'ToolCard',
  'ConfirmationCard',
];

/** A replacement: the plugin's props, plus `Default`, the plugin's own component. */
export type AgentComponentReplacement<P = Record<string, unknown>> =
  ComponentType<P & { readonly Default: ComponentType<P> }>;

const componentStore = new Store<AgentComponentReplacement>();

export interface AgentComponents {
  /** Renders `Component` wherever the plugin renders `name`; it receives the original props and `Default`. */
  replace<P = Record<string, unknown>>(
    name: AgentComponentName,
    Component: AgentComponentReplacement<P>,
  ): () => void;
}

const components: AgentComponents = {
  replace(name, Component) {
    if (!(AGENT_COMPONENT_NAMES as readonly string[]).includes(name))
      throw new Error(
        `"${String(name)}" is not a replaceable agents component (${AGENT_COMPONENT_NAMES.join(', ')}).`,
      );
    component(`The replacement of "${name}"`, Component);
    return componentStore.set(
      name,
      Component as unknown as AgentComponentReplacement,
    );
  },
};

/** The replacement registered for `name`, or null for the plugin's own. */
export function useAgentComponentReplacement(
  name: AgentComponentName,
): AgentComponentReplacement | null {
  useSyncExternalStore(
    componentStore.subscribe,
    componentStore.version,
    componentStore.version,
  );
  return componentStore.get(name) ?? null;
}

// --- Personal preference sections -------------------------------------------------------------------------------

export interface AgentPreferenceSectionRegistration {
  /** Unique; registering the same key again replaces it. */
  readonly key: string;
  readonly component: ComponentType;
  /** Lower first; the plugin's own sections are at 0, 100, 200 and 300. Defaults to 1000. */
  readonly order?: number;
}

const sectionStore = new Store<
  AgentPreferenceSectionRegistration & { readonly sequence: number }
>();
let sectionSequence = 0;

export interface AgentPreferenceSections {
  /** Adds a section to Personal settings › Agent, such as a computer the person connected. */
  add(registration: AgentPreferenceSectionRegistration): () => void;
}

const preferenceSections: AgentPreferenceSections = {
  add(registration) {
    const key = nonEmpty('A preference section key', registration.key);
    component(`Preference section "${key}"`, registration.component);
    sectionSequence += 1;
    return sectionStore.set(key, {
      ...registration,
      key,
      sequence: sectionSequence,
    });
  },
};

/** The registered personal sections, in order. */
export function usePreferenceSections(): readonly AgentPreferenceSectionRegistration[] {
  useSyncExternalStore(
    sectionStore.subscribe,
    sectionStore.version,
    sectionStore.version,
  );
  return sectionStore
    .values()
    .slice()
    .sort(
      (left, right) =>
        (left.order ?? 1000) - (right.order ?? 1000) ||
        left.sequence - right.sequence,
    );
}

// --- The public surface -----------------------------------------------------------------------------------------

export interface AgentsUi {
  readonly toolRenderers: AgentToolRenderers;
  readonly slots: AgentSlots;
  readonly components: AgentComponents;
  readonly preferenceSections: AgentPreferenceSections;
}

export const agentsUi: AgentsUi = Object.freeze({
  toolRenderers,
  slots,
  components,
  preferenceSections,
});
