import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  errors: {
    authenticationRequired: 'Sign in to use agent sessions.',
    computerNotFound: 'No computer with this id is connected to your account.',
    sessionNotFound: 'No session with this id is yours.',
    computerOffline:
      'The computer is offline. Start the bridge on it, then try again.',
    agentUnavailable: 'The computer cannot run this agent.',
    directoryNotAllowed:
      'Sessions on this computer work only under the directories its bridge allows.',
    sessionArchived: 'The session is archived. Restore it first.',
    permissionRequestNotFound:
      'This permission request has already been answered or is no longer waiting.',
    choiceNotFound: 'The agent does not offer this choice or value.',
    linkNotFound:
      'Nothing of this kind with this id is tied to the session, or its work cannot start from here.',
    invalidPageToken: 'The page token was not issued by this list.',
    upgradeRequired:
      'The bridge speaks another protocol version. Update the command line on this computer.',
    computerNotAnswering:
      'The computer did not answer in time. Check that its connection is running, then try again.',
    folderUnavailable: 'The folder cannot be opened on the computer.',
    projectNotFound: 'There is no such project, or you cannot see it.',
    referenceNotFound:
      'Something mentioned does not exist, or you cannot see it.',
  },
};

export type AgentSessionsResource = LocaleResource<typeof enUS>;

export default enUS;
