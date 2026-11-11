const messages = {
  notificationTemplates: {
    contributor: 'Notification examples',
    category: 'Tasks',
    assigned: {
      name: 'Task assigned',
      trigger: 'A task is created.',
      recipients:
        'The assignee, even when they assigned the task to themselves.',
    },
    updated: {
      name: 'Task updated',
      trigger: 'A task is changed, including when it is reassigned.',
      recipients:
        'The creator, the previous assignee and the new assignee, each once. The person who made the change is not notified.',
    },
    businessRule:
      'Sent whenever the task action happens. There is no separate switch to turn it off.',
    languagePolicy: "Always in English, whatever the recipient's language.",
    channel: 'Task inbox',
    variables: {
      title: 'Task title',
      description: 'Task description',
      status: 'Task status',
    },
  },
  navigation: {
    tasks: 'Notification examples',
    taskManagement: 'Tasks',
    taskDetail: 'Task details',
  },
  common: {
    close: 'Close',
    loading: 'Loading…',
    saving: 'Saving…',
  },
  fields: {
    title: 'Title',
    description: 'Description',
    status: 'Status',
    assignee: 'Assignee',
    creator: 'Creator',
    chooseAssignee: 'Choose a user',
  },
  status: {
    open: 'Open',
    'in-progress': 'In progress',
    done: 'Done',
  },
  tasks: {
    title: 'Tasks',
    description:
      'Assign a small task to another user. The assignee receives an in-app notification with the task summary and can edit the task from the detail page. Use the notification button in the top bar to open your message notifications.',
    listTitle: 'All tasks',
    listDescription: 'All tasks you created or were assigned to.',
    count: '{{count}} records',
    empty: 'No tasks yet.',
    assignee: 'Assigned to',
    columns: {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      creator: 'Creator',
      assignee: 'Assignee',
      updatedAt: 'Last updated',
      actions: 'Actions',
    },
    view: 'View details',
    retryRead: 'Retry',
    previous: 'Previous',
    next: 'Next',
    page: 'Page {{page}}',
    add: 'New task',
    drawerTitle: 'New task',
    drawerDescription:
      'Creating a task sends its basic information to the assignee.',
    create: 'Create task',
    cancel: 'Cancel',
  },
  taskDetail: {
    title: 'Task details',
    summary: 'Task details',
    createdAt: 'Created',
    updatedAt: 'Last updated',
    notificationHint:
      'After a task is saved, the related people other than the current editor are notified: the creator and current assignee. If the assignee changes, both the previous and new assignees are notified.',
    edit: 'Edit task',
    retryRead: 'Retry',
    save: 'Save changes',
    cancel: 'Cancel',
    back: 'Back to tasks',
  },
};

export default messages;
