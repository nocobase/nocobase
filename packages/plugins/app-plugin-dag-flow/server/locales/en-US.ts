import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: { automation: 'Automation' },
  authorization: { title: 'Workflow', manage: 'Manage' },
  errors: {
    forbidden: 'Workflow management permission is required.',
    notConfigured: 'Workflow service is not configured.',
    workflowNotFound: 'The requested workflow was not found.',
    sourceNotFound: 'The requested workflow source was not found.',
    runNotFound: 'The requested workflow run was not found.',
    nodeRunNotFound: 'The requested node run was not found.',
    invalidWorkflowId:
      'A workflow is identified by a positive integer id or a 64-character Artifact hash.',
    invalidParameterValues: 'The workflow parameter values are invalid.',
    workflowDisabled: 'The workflow is disabled.',
    invalidInput: 'The workflow input is invalid.',
    parentRunNotFound: 'The parent workflow run was not found.',
    stackLimitExceeded: 'The workflow stack limit was exceeded.',
    inputTooLarge: 'The workflow input is too large.',
  },
};

export type WorkflowServerResource = LocaleResource<typeof enUS>;
export default enUS;
