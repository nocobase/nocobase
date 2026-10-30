import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  errors: {
    retryUnavailable:
      'Send waiting inputs in order. Only the latest interrupted input or the next withdrawn input can be resent.',
    stopTargetChanged:
      'This turn is no longer current. Refresh before stopping.',
    promptNotFound: 'No message with this identity exists in the session.',
    promptStarted:
      'The message has started processing and cannot be withdrawn.',
    withdrawalUnsupported:
      'This older message cannot be safely withdrawn. Update the command line and restart the computer connection.',
    bridgeReplaced:
      'Another bridge has registered this computer. Restart this connection.',
    submissionConflict:
      'This submission ID is already used for another request.',
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
    discoveryFailed:
      'Could not load agent settings. Check the agent on this computer and retry.',
    projectNotFound: 'There is no such project, or you cannot see it.',
    referenceNotFound:
      'Something mentioned does not exist, or you cannot see it.',
    imageNotFound: 'No image with this name was sent in the session.',
    computerKeyInvalid:
      'This computer is no longer connected: it was removed, or connected again from elsewhere. Run `acp start` on it to connect it again.',
  },
};

export type AgentSessionsResource = LocaleResource<typeof enUS>;

export default enUS;
