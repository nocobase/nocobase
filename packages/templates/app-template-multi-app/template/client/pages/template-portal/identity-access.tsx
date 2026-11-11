import { useApiClient } from '@nocobase/app-client';
import { IdentityAccess } from '@nocobase/app-plugin-identity-provider/client';
export default function ApplicationIdentityAccess({
  appId,
}: {
  appId: string;
}) {
  const api = useApiClient();
  return (
    <IdentityAccess
      appId={appId}
      enroll={async () => {
        await api.request({
          path: `identityEnrollment/${appId}/enroll`,
          method: 'POST',
          json: {},
        });
      }}
    />
  );
}
