/**
 * The titles this plugin registers with the authorization plugin (`{ key, ns }` descriptors under `access.*`) and the
 * built-in roles' titles (`roles.*`). The server and the client locales both spread them: the server translates them
 * for its own messages, and the permission pages translate them in the browser.
 */
const accessEnUS = {
  roles: { owner: 'Owner', admin: 'Admin', member: 'Member' },
  access: {
    sections: {
      projects: 'Projects',
      issues: 'Issues',
      settings: 'Project settings',
      members: 'Members and roles',
    },
    businesses: {
      projects: {
        title: 'Projects',
        description: 'Projects, their members, repositories and progress.',
        actions: {
          view: {
            title: 'View projects',
            description: 'See projects, their overview and progress',
            related: 'View projects (ones they can see)',
            relatedLabel: 'Ones I can see',
            relatedHint: 'Public projects, and private ones I lead or joined',
            all: 'View projects (all)',
          },
          create: {
            title: 'Create projects',
            description: 'Start a new project and lead it',
            all: 'Create projects',
          },
          manage: {
            title: 'Manage projects',
            description:
              'Rename, change status, dates and lead, manage members and repositories',
            related: 'Manage projects (ones they lead)',
            relatedLabel: 'Ones I lead',
            relatedHint: 'Projects I am the lead of',
            all: 'Manage projects (all)',
          },
          delete: {
            title: 'Delete projects',
            description: 'Delete projects and restore deleted ones',
            all: 'Delete projects',
          },
        },
      },
      issues: {
        title: 'Issues',
        description: 'Issues and their comments, in a project or on their own.',
        actions: {
          view: {
            title: 'View issues',
            description: 'See issues in lists, boards and their details',
            related: 'View issues (ones they can see)',
            relatedLabel: 'In projects I can see',
            relatedHint:
              'Issues without a project, and issues in projects I can see',
            all: 'View issues (all)',
          },
          create: {
            title: 'Create issues',
            description: 'Create issues, in a project or on their own',
            related: 'Create issues (in projects they can see)',
            relatedLabel: 'In projects I can see',
            relatedHint: 'Issues without a project, or in projects I can see',
            all: 'Create issues (all)',
          },
          edit: {
            title: 'Edit issues',
            description:
              'Title, description, priority, dates, labels, executors and open statuses',
            related: 'Edit issues (ones they can see)',
            relatedLabel: 'In projects I can see',
            relatedHint:
              'Issues without a project, and issues in projects I can see',
            all: 'Edit issues (all)',
          },
          comment: {
            title: 'Comment on issues',
            description:
              'Comment, reply and resolve threads; edit and delete their own comments',
            related: 'Comment on issues (ones they can see)',
            relatedLabel: 'In projects I can see',
            relatedHint:
              'Issues without a project, and issues in projects I can see',
            all: 'Comment on issues (all)',
          },
          moderateComments: {
            title: 'Moderate comments',
            description: "Delete other people's comments",
            related:
              'Moderate comments (on issues they own or whose project they lead)',
            relatedLabel: 'On issues I own or in projects I lead',
            relatedHint:
              'Comments on issues I own, and on issues in projects I lead',
            all: 'Moderate comments (all)',
          },
          close: {
            title: 'Close issues',
            description: 'Mark an issue done or cancelled',
            related: 'Close issues (ones they own or whose project they lead)',
            relatedLabel: 'Ones I own or in projects I lead',
            relatedHint: 'Issues I own, and issues in projects I lead',
            all: 'Close issues (all)',
          },
          changeOwner: {
            title: 'Change the owner',
            description:
              'Hand an issue over to someone else to be accountable for it',
            related:
              'Change the owner (ones they own or whose project they lead)',
            relatedLabel: 'Ones I own or in projects I lead',
            relatedHint: 'Issues I own, and issues in projects I lead',
            all: 'Change the owner (all)',
          },
          delete: {
            title: 'Delete and restore issues',
            description: 'Delete issues and restore deleted ones',
            all: 'Delete and restore issues',
          },
        },
      },
      attachments: {
        title: 'Attachments',
        description: 'Files attached to issues and comments.',
        actions: {
          upload: {
            title: 'Upload attachments',
            description:
              'Attach files to issues they can edit and to their comments',
            related: 'Upload attachments (on issues they can see)',
            relatedLabel: 'On issues in projects I can see',
            relatedHint:
              'Files on issues without a project, and on issues in projects I can see',
            all: 'Upload attachments (all)',
          },
        },
      },
    },
    collections: { pmProjects: 'Projects', pmIssues: 'Issues' },
    recordAccess: {
      visible: 'Projects and issues they can see',
      managed: 'Projects they lead and issues they own',
    },
    settings: {
      pm: {
        general: 'General',
        labels: 'Labels',
        workflows: 'Workflow templates',
        members: 'Members',
      },
    },
    keyScopes: {
      projects: {
        title: 'Projects',
        description: 'See projects; manage them; create and delete them.',
        objects: 'Projects',
      },
      issues: {
        title: 'Issues',
        description:
          'See issues; create, edit, comment on, close and reassign them; moderate comments and delete issues.',
      },
      settings: {
        title: 'Project settings',
        description: 'General settings, labels and workflow templates.',
      },
    },
    actions: {
      view: 'View',
      create: 'Create',
      manage: 'Manage',
      edit: 'Edit',
      close: 'Close',
      comment: 'Comment',
      moderateComments: 'Moderate comments',
      changeOwner: 'Change owner',
      delete: 'Delete',
      upload: 'Upload',
      read: 'View',
      update: 'Edit',
      invite: 'Invite',
      assign: 'Assign roles',
      'define-roles': 'Define roles',
    },
  },
};

type Shape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]>;
};

export type AccessLocale = Shape<typeof accessEnUS>;

export default accessEnUS;
