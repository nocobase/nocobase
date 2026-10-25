import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';
import { sharingRules } from '@nocobase/app-plugin-authz-sharing-rules/server';
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import { type AuthorizationConfig } from '@nocobase/app-plugin-authorization/server';

// Permission sets, database, pages, settings, composites and workspace placement are built in.
const authorization: AppConfigFactory<AuthorizationConfig> = defineAppConfig(
  (_runtime) => ({
    permissionSets: { rootSet: 'root', defaultSet: 'member' },
    plugins: [defaultAccess(), sharingRules(), restrictionRules()],
  }),
);

export default authorization;
