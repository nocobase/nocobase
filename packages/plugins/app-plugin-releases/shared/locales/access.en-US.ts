/**
 * The titles this plugin registers with the authorization plugin (`{ key, ns }` descriptors under `access.*`) and the
 * driver titles. The server and the client locales both spread them.
 */
const accessEnUS = {
  access: {
    section: 'Releases',
    pages: {
      'rel-apps': 'Apps',
    },
    businessSection: 'Releases',
    businesses: {
      apps: {
        title: 'Apps',
        description: 'Apps, their releases, deployments and runtime.',
        actions: {
          view: {
            title: 'View Apps',
            description:
              'See Apps, their releases, deployments and runtime status',
            related: 'View Apps (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'View Apps (all)',
          },
          readLogs: {
            title: 'Read logs',
            description: 'Read App and deployment logs',
            related: 'Read logs (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'Read logs (all)',
          },
          create: {
            title: 'Create Apps',
            description: 'Create Apps in an environment',
            all: 'Create Apps',
          },
          configure: {
            title: 'Configure Apps',
            description:
              'Read and change an App’s configuration, which may hold secrets',
            related: 'Configure Apps (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'Configure Apps (all)',
          },
          upload: {
            title: 'Upload releases',
            description: 'Upload and promote releases',
            related: 'Upload releases (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'Upload releases (all)',
          },
          deploy: {
            title: 'Deploy',
            description:
              'Deploy and roll back on unprotected environments, request deployments to protected ones',
            related: 'Deploy (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'Deploy (all)',
          },
          deployProtected: {
            title: 'Approve protected deployments',
            description:
              'Approve deployments to protected environments that name no approvers; people only',
            related: 'Approve protected deployments (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'Approve protected deployments (all)',
          },
          operate: {
            title: 'Start and stop',
            description: 'Start, stop and restart Apps',
            related: 'Start and stop (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'Start and stop (all)',
          },
          delete: {
            title: 'Delete Apps',
            description: 'Delete an App with its data',
            related: 'Delete Apps (ones related to them)',
            relatedLabel: 'Ones I created',
            relatedHint:
              'Apps I created, and any the application relates to me',
            all: 'Delete Apps (all)',
          },
        },
      },
    },
    recordAccess: { owned: 'Apps they created' },
    settings: {
      rel: { environments: 'Deploy environments' },
    },
    keyScopes: {
      apps: {
        title: 'Apps and deployments',
        description:
          'Read: see apps, releases, deployments and logs. Read and write: also upload releases. Admin: also deploy and start or stop apps.',
        objects: 'Apps',
      },
      environments: {
        title: 'Deploy environments',
        description: 'Read: list environments. Read and write: manage them.',
      },
      presets: {
        ciDeploy: {
          title: 'CI deploy',
          description:
            'Upload releases to the chosen apps and deploy them, for 90 days.',
        },
        ciUpload: {
          title: 'CI upload',
          description:
            'Upload releases to the chosen apps without deploying them, for 90 days.',
        },
      },
    },
    actions: {
      read: 'View',
      manage: 'Manage',
      view: 'View',
      'read-logs': 'Read logs',
      create: 'Create',
      configure: 'Configure',
      upload: 'Upload releases',
      deploy: 'Deploy',
      'deploy-protected': 'Approve protected deployments',
      operate: 'Start and stop',
      delete: 'Delete',
    },
  },
  drivers: {
    host: 'This server',
  },
};

export default accessEnUS;
