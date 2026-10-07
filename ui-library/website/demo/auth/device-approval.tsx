import { MonitorSmartphone } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { AuthCenteredLayout } from '@/extensions/nocobase-auth-centered-layout/auth-centered-layout';
import { DeviceApproval } from '@/extensions/nocobase-device-approval/device-approval';

/**
 * The device-approval block as an application's `/device` page renders it, inside an authentication layout. The code
 * lives in the demo's state rather than the address and starts as a sample code, or as `?user_code=` when given; "Enter
 * another code" shows the empty form.
 */
export function DeviceApprovalDemo(): ReactElement {
  const [code, setCode] = useState(
    () =>
      new URLSearchParams(window.location.search).get('user_code') ??
      'WDJB-MJHT',
  );
  return (
    <AuthCenteredLayout
      description='A command line or another device asked to sign in as you. Approve it only if you started the sign-in yourself.'
      logo={<MonitorSmartphone aria-hidden='true' />}
      name='NocoBase'
      title='Authorize a device'
    >
      <DeviceApproval onUserCodeChange={setCode} userCode={code} />
    </AuthCenteredLayout>
  );
}
