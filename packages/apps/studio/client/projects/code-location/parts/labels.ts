/**
 * The words of the new-project-form block, English by default, and the shapes it shows. A consumer passes its own
 * words, from its locale resources; `{name}`-style placeholders are filled in by the block.
 */

/** Where a new project's working directory is. */
export type NewProjectCodeLocation =
  'newRepo' | 'existingRepo' | 'runnerDirectory' | 'none';

/**
 * How a new repository gets its first code: a NocoBase application scaffolded by an agent (the default template of
 * `create-app`), generated from a template repository, or made by an agent from an optional prompt.
 */
export type NewProjectInitMethod = 'nocobase' | 'template' | 'prompt';

/** The ways a new repository gets its first code, in the order offered; the first is the default. */
export const INIT_METHODS: readonly NewProjectInitMethod[] = [
  'nocobase',
  'template',
  'prompt',
];

/** A template repository a new repository may be generated from. */
export interface NewProjectTemplateRepo {
  /** `owner/name`. */
  readonly fullName: string;
  readonly description: string | null;
  readonly private: boolean;
}

/** One of a template repository's workflows. */
export interface NewProjectWorkflow {
  readonly id: string;
  readonly name: string;
  /** `.github/workflows/<file>`. */
  readonly path: string;
}

/** What still keeps the form from being complete, said beside the button that creates. */
export type NewProjectMissing =
  | 'name'
  | 'repoName'
  | 'templateRepo'
  | 'prompt'
  | 'repository'
  | 'cloneUrl'
  | 'runner'
  | 'path'
  | 'initAgent';

export interface NewProjectFormLabels {
  readonly locations: Readonly<
    Record<
      NewProjectCodeLocation,
      {
        readonly title: string;
        /** What the chosen location means, under the row of choices. */
        readonly description: string;
      }
    >
  >;
  readonly initMethods: Readonly<
    Record<
      NewProjectInitMethod,
      { readonly title: string; readonly description: string }
    >
  >;
  readonly templateRepos: {
    readonly label: string;
    /** The search field, which also takes any template's `owner/repo`. */
    readonly search: string;
    /** The connection's own list held none: `owner/repo` may be typed. */
    readonly empty: string;
    /** The search matched none of the connection's: `owner/repo` may be typed. */
    readonly noMatch: string;
    readonly more: string;
    readonly private: string;
    /** On a template repository without a description of its own. */
    readonly noDescription: string;
    /** The list could not be read: `{reason}`. */
    readonly loadFailed: string;
    readonly retry: string;
    /** Back from the chosen repository to the list. */
    readonly change: string;
    /** The typed `owner/repo`, offered to use: `{name}`. */
    readonly useTyped: string;
    readonly checking: string;
    /** Why the typed one cannot be used: `{name}`. */
    readonly notTemplate: string;
    readonly notFound: string;
    readonly checkFailed: string;
    /** While the first page, or a further one, is read. */
    readonly loading: string;
    readonly loadingMore: string;
  };
  /** A NocoBase application's panel: what it needs and what comes with it. */
  readonly nocobase: {
    /** The runner the init agent works on: Node.js 24, pnpm 11, the NocoBase registry. */
    readonly runnerNeeded: string;
    readonly runtimesLink: string;
    /** No runner is online: the project is still created, its initialization waits. */
    readonly noRunnerOnline: string;
    /** Studio connects the preview CI with it. */
    readonly ci: string;
  };
  readonly workflow: {
    readonly label: string;
    readonly none: string;
    /** Under the select when a workflow is chosen: `{name}`. */
    readonly chosenHint: string;
    /** Under the select when none is chosen. */
    readonly noneHint: string;
    readonly empty: string;
    /** While the template's workflows are read. */
    readonly loading: string;
  };
  /** The initialization prompt: the first commit of a new repository, or what is done first in one that exists; optional. */
  readonly prompt: {
    readonly label: string;
    readonly hint: string;
    readonly optionalLabel: string;
    readonly optionalHint: string;
    readonly optionalPlaceholder: string;
  };
  readonly cancel: string;
  readonly create: string;
  /** Why the button that creates is disabled. */
  readonly incomplete: Readonly<Record<NewProjectMissing, string>>;
}

export const defaultNewProjectFormLabels: NewProjectFormLabels = {
  locations: {
    newRepo: {
      title: 'New GitHub repository',
      description:
        'Created through a connection and initialized as the project’s first issue; its default branch is protected once ready.',
    },
    existingRepo: {
      title: 'Existing repository',
      description:
        'A repository you already have; issues work on its branches, with pull requests and previews.',
    },
    runnerDirectory: {
      title: 'Directory on a runner',
      description:
        'Every issue runs on the chosen runner, in that directory, without Git: no branches, pull requests or previews.',
    },
    none: {
      title: 'No code',
      description:
        'A blank project; a working directory can be added later in its settings.',
    },
  },
  initMethods: {
    nocobase: {
      title: 'NocoBase 3 app (default template)',
      description:
        'An agent on a runner creates the application with create-app’s default template and pushes it as the first commit.',
    },
    template: {
      title: 'From a template repository',
      description:
        'Generated from a template; a workflow may finish the setup.',
    },
    prompt: {
      title: 'Empty repository, optional prompt',
      description:
        'An agent makes the first commit from your prompt; without one, the repository starts with an initial commit.',
    },
  },
  templateRepos: {
    label: 'Template repository',
    search: 'Search, or type owner/repo',
    empty:
      'This connection has no template repositories; type an owner/repo instead.',
    noMatch:
      'No template repository of this connection matches; type an owner/repo instead.',
    more: 'Show more',
    private: 'Private',
    noDescription: 'No description',
    loadFailed: 'Could not load the template repositories: {reason}',
    retry: 'Retry',
    change: 'Choose another',
    useTyped: 'Use {name}',
    checking: 'Checking {name}…',
    notTemplate: '{name} is not a template repository.',
    notFound: 'The connection cannot read {name}.',
    checkFailed: 'Could not check {name}.',
    loading: 'Loading template repositories…',
    loadingMore: 'Loading more…',
  },
  nocobase: {
    runnerNeeded:
      'Needs a runner with Node.js 24 and pnpm 11, where the initialization agent runs.',
    runtimesLink: 'Runtimes',
    noRunnerOnline:
      'No runner is online: the project is created now, and its initialization waits for one.',
    ci: 'Studio also connects its preview CI: each pull request is deployed to Preview.',
  },
  workflow: {
    label: 'Initialization workflow',
    none: 'None: ready at once',
    chosenHint:
      'The project is ready once {name} succeeds on the new repository.',
    noneHint: 'The project is ready as soon as the repository is generated.',
    empty: 'The template has no workflows.',
    loading: 'Loading the template’s workflows…',
  },
  prompt: {
    label: 'What the agent should create (optional)',
    hint: 'If filled, the initialization agent makes and pushes the first commit on the default branch. Leave it empty for a repository with just an initial commit and no initialization issue.',
    optionalLabel: 'Initialization prompt (optional)',
    optionalHint:
      'If filled, an agent does this first in an "Initialize project" issue, which the project’s other issues wait for.',
    optionalPlaceholder: 'Read the code and add an AGENTS.md.',
  },
  cancel: 'Cancel',
  create: 'Create project',
  incomplete: {
    name: 'Enter a project name',
    repoName: 'Enter a repository name',
    templateRepo: 'Choose a template repository',
    prompt: 'Describe what the agent should create',
    repository: 'Choose a repository',
    cloneUrl: 'Enter the clone URL',
    runner: 'Choose a runner',
    path: 'Enter the path on the runner',
    initAgent: 'Choose an initialization agent',
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
