import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'customRequestsRoles',
  title: '{{t("Custom request")}}',
});
