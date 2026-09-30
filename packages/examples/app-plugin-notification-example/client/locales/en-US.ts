const messages = {
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
    refresh: 'Refresh',
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
    refresh: 'Refresh',
    save: 'Save changes',
    cancel: 'Cancel',
    back: 'Back to tasks',
  },
};

export default messages;
