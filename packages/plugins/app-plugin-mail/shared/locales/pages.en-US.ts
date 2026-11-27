import type { LocaleResource } from '@nocobase/i18n';

/**
 * The plugin's own pages, their navigation and the permissions it registers (`shared/access.ts`), spread into the
 * client locales; `access` is also spread into the server locales, which the permission workspace reads its titles
 * from.
 */
const pagesEnUS = {
  navigation: {
    mail: 'Mail',
    mailTeam: 'Team mail',
    mailAccounts: 'Mail accounts',
    mailAccountsDescription:
      'Connect your mailboxes and manage signatures, templates and labels.',
    mailSettings: 'Mailbox connections',
    mailSettingsDescription:
      'Mail Providers, every account’s status, sync and send logs.',
  },
  access: {
    section: 'Mail',
    team: {
      title: 'Team mail',
      description: "Members' synchronized mail, read only.",
      actions: {
        view: 'View',
        process: 'Process (mark read, star, archive)',
      },
    },
    settings: {
      title: 'Mailbox connections',
      actions: {
        read: 'View',
        manage: "Manage (retry and cancel members' syncs and sends)",
      },
    },
  },
  pages: {
    loading: 'Loading…',
    empty: 'Nothing to show.',
    member: 'Member',
    allMembers: 'All members',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} must be reconnected: it does not synchronize or send until then.',
      reauthorize: 'Reconnect in Mail accounts',
      needsReauthorization: 'needs reauthorization',
    },
    accounts: {
      title: 'Mail accounts',
      description:
        'Connect your mailboxes to send and receive in Mail. Only you can see your mail; people with Team mail access can read it without changing it.',
      reauthorizationNotice:
        'The authorization of {{addresses}} is no longer accepted: it does not synchronize or send until you connect it again with the same Provider.',
      reauthorize: 'Reconnect',
      tabs: {
        accounts: 'Accounts',
        signatures: 'Signatures',
        templates: 'Templates',
        labels: 'Labels',
        activity: 'Activity',
      },
    },
    activity: {
      sends: 'Sends',
      syncs: 'Synchronizations',
    },
    logs: {
      started: 'Started',
      time: 'Time',
      account: 'Account',
      accountMember: 'Account · member',
      mode: 'Mode',
      initial: 'First sync',
      incremental: 'Incremental',
      result: 'Result',
      allResults: 'All results',
      detail: 'Detail',
      reason: 'Reason',
      processed: '{{count}} messages',
      subject: 'Subject',
      recipients: 'Recipients',
      recipientCount: 'Recipients',
      bulk: 'Bulk send',
      bulkCount: '{{count}} (bulk)',
      showRecipients: 'Show recipients',
      hideRecipients: 'Hide recipients',
      scheduled: 'Scheduled',
      retry: 'Retry',
      cancel: 'Cancel',
      window: 'Time',
      windows: {
        day: 'Last 24 hours',
        week: 'Last 7 days',
        month: 'Last 30 days',
        all: 'All time',
      },
    },
    team: {
      title: 'Team mail',
      description:
        'Read the mail members have synchronized, for handovers and compliance checks. Opening a message does not mark it read and you cannot reply.',
      account: 'Account',
      allAccounts: 'All accounts',
      participant: 'Address or @domain',
      keyword: 'Subject keyword',
      memberAccount: 'Member · account',
      counterpart: 'With',
      view: 'View',
      selectAll: 'Select all on this page',
      empty: 'No synchronized mail matches.',
      readOnly: 'Read only. Opening it does not mark it read.',
      applied: '{{succeeded}} updated, {{failed}} failed.',
      actions: {
        markRead: 'Mark read',
        star: 'Star',
        archive: 'Archive',
      },
    },
    settings: {
      title: 'Mailbox connections',
      description:
        'The mail Providers members can connect, and the connection, synchronization and sending status of every account. No message content is shown here. System notification emails are configured in Notifications.',
      tabs: {
        providers: 'Providers',
        accounts: 'Accounts',
        syncRuns: 'Sync logs',
        submissions: 'Send logs',
        runtime: 'Runtime configuration',
      },
      sources: {
        environment: 'Environment variable',
        config: 'config.yml',
        default: 'Default',
        code: 'Code',
        unknown: 'Unknown',
      },
      providers: {
        name: 'Name',
        type: 'Type',
        capabilities: 'Capabilities',
        accounts: 'Accounts',
        source: 'Source',
        attention: '{{count}} need reauthorization',
        howTo: 'How to add a Provider',
        howToDescription:
          'Add an entry under mail.providers in the application configuration and keep secrets in environment variables. Restart the application to apply it.',
        callbackHint:
          'Register this OAuth redirect URL with Google or Microsoft:',
      },
      accounts: {
        filter: {
          all: 'All',
          attention: 'Needs reauthorization',
          suspended: 'Deactivated',
        },
        provider: 'Provider',
        allProviders: 'All Providers',
        search: 'Member or address',
        lastSynced: 'Last synchronized',
        status: 'Status',
        showRuns: 'Sync runs',
        note: 'Administrators cannot authorize or remove members’ accounts. A member reconnects their own account in Personal settings › Mail accounts.',
      },
      runtime: {
        setting: 'Setting',
        value: 'Current value',
        effect: 'What it affects',
        automaticSyncInterval: 'Automatic sync interval',
        automaticSyncIntervalEffect:
          'How often accounts without push notifications are checked for new mail.',
        syncBatchSize: 'Messages per sync batch',
        syncBatchSizeEffect:
          'Larger batches finish a first sync sooner but reach Provider rate limits more easily.',
        oauthCallbackUrl: 'OAuth redirect URL',
        oauthCallbackUrlEffect:
          'Register it in the Google or Microsoft developer console.',
        oauthReturnUrl: 'Page after authorization',
        oauthReturnUrlEffect:
          'Where a person returns after connecting an OAuth account.',
        pushWebhook: 'Push webhook',
        pushWebhookEffect:
          'Without it, Gmail and Microsoft 365 are also checked at the sync interval.',
        jobs: 'Background jobs',
        jobsEffect: 'Deployments with several instances need a shared queue.',
        logRetention: 'Log retention',
        logRetentionEffect:
          'Finished sync runs and sends older than this are deleted automatically.',
        credentialVault: 'Credential storage',
        credentialVaultEffect:
          'Where OAuth tokens and passwords of connected accounts are kept.',
        minutes: '{{count}} minutes',
        days: '{{count}} days',
        keepForever: 'Kept forever',
        notConfigured: 'Not configured',
        secretConfigured: 'Secret configured',
        secretMissing: 'No secret configured',
        jobsDefault: 'Follows jobs.default',
        vaultBuiltin: 'Built in, in the application database',
        vaultApplication: 'Registered by the application',
        copy: 'Copy',
        copied: 'Copied',
        readOnly:
          'Read only: these settings come from config.yml and MAIL_* environment variables and apply after a restart.',
      },
    },
  },
};

export type MailPagesResource = LocaleResource<typeof pagesEnUS>;

export default pagesEnUS;
