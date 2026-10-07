import { CogIcon, ShapesIcon, UserIcon } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';

import { SYSTEM_KIND, USER_KIND } from '../../shared/kinds.js';

/** A kind's icon (`lib/kinds.ts`): a person, the system's cog, or one shape for every other registered kind. */
export function PmKindIcon({
  kind,
  ...props
}: { readonly kind: string } & ComponentProps<typeof UserIcon>): ReactElement {
  if (kind === USER_KIND) return <UserIcon {...props} />;
  if (kind === SYSTEM_KIND) return <CogIcon {...props} />;
  return <ShapesIcon {...props} />;
}
