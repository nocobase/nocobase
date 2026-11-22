/* eslint-disable react-refresh/only-export-components -- the outlet and the replaceable wrapper are one small module */
/**
 * How the panel renders what applications registered (`ui-registry.ts`): a slot's components in order, and a part
 * replaced by name, given the plugin's own component as `Default`.
 */
import {
  createElement,
  Fragment,
  type ComponentType,
  type ReactElement,
} from 'react';

import {
  useAgentComponentReplacement,
  useAgentSlot,
  type AgentComponentName,
  type AgentSlotName,
  type AgentSlotProps,
} from './ui-registry.js';

/** Renders the components registered in `name` with `props`; nothing when there are none. */
export function AgentSlotOutlet<S extends AgentSlotName>({
  name,
  props,
}: {
  readonly name: S;
  readonly props: AgentSlotProps[S];
}): ReactElement | null {
  const entries = useAgentSlot(name);
  if (!entries.length) return null;
  return createElement(
    Fragment,
    null,
    ...entries.map(({ key, component }) =>
      createElement(component, { ...props, key }),
    ),
  );
}

/**
 * `Default` wrapped so that a replacement registered for `name` renders in its place, given the same props and
 * `Default`. Call once per module (the result is a stable component).
 */
export function replaceable<P extends object>(
  name: AgentComponentName,
  Default: ComponentType<P>,
): ComponentType<P> {
  function Replaceable(props: P): ReactElement {
    const Replacement = useAgentComponentReplacement(name) as ComponentType<
      P & { readonly Default: ComponentType<P> }
    > | null;
    return Replacement
      ? createElement(Replacement, { ...props, Default })
      : createElement(Default, props);
  }
  Replaceable.displayName = `Replaceable(${name})`;
  return Replaceable;
}
