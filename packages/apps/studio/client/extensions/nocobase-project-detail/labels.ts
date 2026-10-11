/**
 * The words of the project-detail block, English by default. A consumer passes its own, from its locale resources;
 * `{name}`-style placeholders are filled in by the block.
 */
export interface ProjectDetailLabels {
  readonly header: {
    readonly lead: string;
    readonly noLead: string;
    /** Beside the name of a project only its members see. */
    readonly private: string;
    readonly workflow: string;
  };
  readonly deletion: {
    readonly more: string;
    readonly delete: string;
    /** `{name}` is the project's. */
    readonly title: string;
    readonly description: string;
    readonly cancel: string;
  };
  readonly overview: {
    readonly numbers: string;
    readonly distribution: string;
    readonly noIssues: string;
    readonly description: string;
    readonly noDescription: string;
    readonly descriptionHint: string;
    readonly editDescription: string;
    readonly descriptionPlaceholder: string;
    readonly save: string;
    readonly cancel: string;
    readonly members: string;
    readonly noMembers: string;
    /** `{count}`. */
    readonly memberCount: string;
    readonly manageMembers: string;
  };
  readonly resources: {
    readonly title: string;
    readonly description: string;
    readonly add: string;
    /** The empty state's title and what to do. */
    readonly empty: string;
    readonly emptyDescription: string;
    readonly primary: string;
    readonly gitRepo: string;
    readonly directory: string;
    /** `{name}`: the row menu's label. */
    readonly actions: string;
    /** The row menu's items. */
    readonly settings: string;
    readonly moveUp: string;
    readonly moveDown: string;
    readonly remove: string;
    /** `{name}`. */
    readonly removeTitle: string;
    readonly removeDescription: string;
    readonly cancel: string;
  };
  readonly resourceForm: {
    readonly newTitle: string;
    readonly newDescription: string;
    readonly editTitle: string;
    readonly editDirectoryTitle: string;
    readonly type: string;
    readonly url: string;
    readonly urlHint: string;
    readonly defaultRef: string;
    readonly defaultRefHint: string;
    readonly runner: string;
    readonly runnerHint: string;
    readonly runnerPlaceholder: string;
    readonly runnerIdPlaceholder: string;
    readonly noRunners: string;
    readonly loading: string;
    readonly path: string;
    readonly pathHint: string;
    /** A directory's display name; a repository has none. */
    readonly label: string;
    readonly initPrompt: string;
    readonly initPromptPlaceholder: string;
    readonly initPromptHint: string;
    readonly requestFailed: string;
    readonly cancel: string;
    readonly save: string;
    readonly saving: string;
    readonly add: string;
    readonly adding: string;
  };
  readonly members: {
    readonly title: string;
    readonly visibility: string;
    readonly everyone: string;
    readonly membersOnly: string;
    readonly everyoneHint: string;
    readonly membersOnlyHint: string;
    readonly empty: string;
    readonly lead: string;
    /** `{name}`: the row menu's label. */
    readonly actions: string;
    readonly setLead: string;
    readonly removeAction: string;
    /** `{name}`. */
    readonly removeTitle: string;
    /** `{name}`. */
    readonly removeDescription: string;
    readonly cancel: string;
    /** The search field's label and placeholder. */
    readonly choose: string;
    readonly noMatches: string;
  };
  readonly unreleased: {
    readonly title: string;
    readonly description: string;
    readonly empty: string;
    readonly staging: string;
    readonly loadFailed: string;
  };
  readonly previews: {
    readonly title: string;
    readonly description: string;
    readonly empty: string;
    readonly loadFailed: string;
    /** `{identifier}`. */
    readonly open: string;
  };
}

export const defaultProjectDetailLabels: ProjectDetailLabels = {
  header: {
    lead: 'Lead',
    noLead: 'No lead',
    private: 'Members only',
    workflow: 'Workflow',
  },
  deletion: {
    more: 'More actions',
    delete: 'Delete project',
    title: 'Delete {name}?',
    description: 'Its issues stay and leave the project.',
    cancel: 'Cancel',
  },
  overview: {
    numbers: 'Key numbers',
    distribution: 'Status distribution',
    noIssues: 'No issues in this project yet.',
    description: 'Description',
    noDescription: 'No description.',
    descriptionHint: 'Markdown is supported.',
    editDescription: 'Edit description',
    descriptionPlaceholder: 'What is this project for?',
    save: 'Save',
    cancel: 'Cancel',
    members: 'Members',
    noMembers: 'No members yet.',
    memberCount: '{count} members',
    manageMembers: 'Manage',
  },
  resources: {
    title: 'Working directories',
    description: 'The first is the primary one, where work starts.',
    add: 'Add',
    empty: 'No working directories yet',
    emptyDescription:
      'Add a repository or a directory on a runner, and issues work there.',
    primary: 'Primary',
    gitRepo: 'Git repository',
    directory: 'Directory on a runner',
    actions: 'Actions for {name}',
    settings: 'Settings',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove',
    removeTitle: 'Remove the working directory “{name}”?',
    removeDescription:
      'Issues stop working in it. The repository or directory itself is not touched.',
    cancel: 'Cancel',
  },
  resourceForm: {
    newTitle: 'Add a working directory',
    newDescription: 'A git repository, or a directory on a runner.',
    editTitle: 'Repository settings',
    editDirectoryTitle: 'Directory settings',
    type: 'Type',
    url: 'Repository URL',
    urlHint: 'https, ssh or git@host:owner/repo.',
    defaultRef: 'Default branch',
    defaultRefHint: "The repository's default branch when empty.",
    runner: 'Runner',
    runnerHint: 'The machine the directory is on.',
    runnerPlaceholder: 'Choose a runner',
    runnerIdPlaceholder: 'Runner ID',
    noRunners: 'No runners',
    loading: 'Loading…',
    path: 'Path',
    pathHint: 'An absolute path on the runner.',
    label: 'Display name',
    initPrompt: 'Initialization prompt',
    initPromptPlaceholder: 'Run pnpm install before starting.',
    initPromptHint: 'What an agent does first in a fresh checkout.',
    requestFailed: 'The request failed.',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    add: 'Add',
    adding: 'Adding…',
  },
  members: {
    title: 'Members',
    visibility: 'Visibility',
    everyone: 'Everyone',
    membersOnly: 'Members only',
    everyoneHint: 'Everyone in the workspace sees the project and its issues.',
    membersOnlyHint: 'Only members see the project and its issues.',
    empty: 'No members yet.',
    lead: 'Lead',
    actions: 'Actions for {name}',
    setLead: 'Set as lead',
    removeAction: 'Remove',
    removeTitle: 'Remove {name}?',
    removeDescription: '{name} will no longer be a member of this project.',
    cancel: 'Cancel',
    choose: 'Add a member: search by name',
    noMatches: 'No one matches.',
  },
  unreleased: {
    title: 'Merged, not released',
    description: 'Finished issues whose change is not in production yet.',
    empty: 'Everything finished is released.',
    staging: 'On staging',
    loadFailed: 'Could not load the unreleased changes.',
  },
  previews: {
    title: 'Previews',
    description: "The issues' preview Apps running now.",
    empty: 'No previews are running.',
    loadFailed: 'Could not load the previews.',
    open: 'Open the preview of {identifier}',
  },
};

/** `text` with each `{key}` replaced by its value; unknown keys stay. */
export function fill(
  text: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return text.replace(/\{(\w+)\}/gu, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}
