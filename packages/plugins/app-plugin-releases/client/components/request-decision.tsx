/** A deployment request's commit. */
import type { ReactElement } from 'react';

import type { DeploymentRequestView } from '../../shared/releases.js';

/** The commit the request's release was built from, shortened; a dash when the build did not say. */
export function RequestCommit({
  request,
}: {
  readonly request: DeploymentRequestView;
}): ReactElement {
  const commit = request.release?.sourceCommit;
  return commit ? (
    <span className='font-mono text-xs' title={commit}>
      {commit.slice(0, 7)}
    </span>
  ) : (
    <span className='text-muted-foreground'>—</span>
  );
}
