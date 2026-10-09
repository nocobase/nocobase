import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import type { ReactElement } from 'react';

export function Collapsible(
  props: CollapsiblePrimitive.Root.Props,
): ReactElement {
  return <CollapsiblePrimitive.Root data-slot='collapsible' {...props} />;
}

export function CollapsibleTrigger(
  props: CollapsiblePrimitive.Trigger.Props,
): ReactElement {
  return (
    <CollapsiblePrimitive.Trigger data-slot='collapsible-trigger' {...props} />
  );
}

export function CollapsibleContent(
  props: CollapsiblePrimitive.Panel.Props,
): ReactElement {
  return (
    <CollapsiblePrimitive.Panel data-slot='collapsible-content' {...props} />
  );
}
