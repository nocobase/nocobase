import type { ReactElement } from 'react';

import type { DistributedStatusBlockProps } from '../../client/index.js';

/** A block an external plugin shows on the status page from the data its server side added. */
export default function InstancesBlock({
  status,
}: DistributedStatusBlockProps): ReactElement {
  const data = status.extensions.fixture as { instances: string[] } | undefined;
  return <p>Running instances: {data?.instances.join(', ')}</p>;
}
