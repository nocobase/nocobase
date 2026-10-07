import type { ReactElement } from 'react';
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';

function Collapsible({
  ...props
}: CollapsiblePrimitive.Root.Props): ReactElement {
  return <CollapsiblePrimitive.Root data-slot='collapsible' {...props} />;
}

function CollapsibleTrigger({
  ...props
}: CollapsiblePrimitive.Trigger.Props): ReactElement {
  return (
    <CollapsiblePrimitive.Trigger data-slot='collapsible-trigger' {...props} />
  );
}

function CollapsibleContent({
  ...props
}: CollapsiblePrimitive.Panel.Props): ReactElement {
  return (
    <CollapsiblePrimitive.Panel data-slot='collapsible-content' {...props} />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
