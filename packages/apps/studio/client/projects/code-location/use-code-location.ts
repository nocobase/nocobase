/**
 * The state of a working directory being chosen (`code-location-fields.tsx`), the same for a new project and for one
 * added to a project in its settings: where it is, how a new repository gets its first code (a NocoBase application by
 * default, a template repository, or a prompt), the optional prompt of a working directory that exists, the
 * initialization agent whenever an agent initializes, and its label. It loads the template repositories page by page
 * as they are needed (`TEMPLATE_PAGES` at most per search) and checks an `owner/repo` typed instead, loads the chosen
 * one's workflows, says what is still missing, and builds the request (`CodeLocationRequest`). Nothing is created
 * here: a new repository is created by the server when the form is submitted.
 */
import {
  useAgentOptions,
  useRunnerOptions,
} from '@nocobase/app-plugin-agents/client/kit';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useState } from 'react';

import type {
  NewProjectCodeLocation,
  NewProjectInitMethod,
  NewProjectMissing,
} from './parts/labels.js';

import {
  connectionsByAge,
  preferredConnection,
  preselectedInitWorkflow,
  type GitConnectionChoice,
} from '../../../shared/git.js';
import type {
  CodeLocationRequest,
  NocobaseAppTemplate,
} from '../../../shared/project-init.js';
import { gitKeys, useGitApi, useGitStatus } from '../../git/api.js';
import {
  readLastConnection,
  writeLastConnection,
} from '../../git/last-connection.js';
import type { PickedRepository } from '../../git/repo-picker.js';

/** The pages of the host's repositories one search reads at most, a hundred each, before asking for more by hand. */
export const TEMPLATE_PAGES = 10;
/** Read further pages while fewer template repositories than this are shown. */
const TEMPLATE_FILL = 8;
/** An `owner/repo` typed in the template search. */
const FULL_NAME = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/u;

/** The `create-app` template a NocoBase application starts from; the only one offered for now. */
const APP_TEMPLATE: NocobaseAppTemplate = 'default';

/** Where the working directory form is: the New project wizard, or a project's settings. */
export type CodeLocationHost = 'newProject' | 'project';

/** The locations offered, in order; a project's settings add a working directory, so "none" is the wizard's alone. */
export function codeLocationsFor(
  host: CodeLocationHost,
): readonly NewProjectCodeLocation[] {
  return host === 'newProject'
    ? ['newRepo', 'existingRepo', 'runnerDirectory', 'none']
    : ['newRepo', 'existingRepo', 'runnerDirectory'];
}

/**
 * The location chosen until the person picks one: the first that is available now. A new repository needs a Git
 * connection, so without one the choice starts on an existing repository.
 */
export function defaultCodeLocation(
  locations: readonly NewProjectCodeLocation[],
  connected: boolean,
): NewProjectCodeLocation {
  return (
    locations.find((location) => location !== 'newRepo' || connected) ??
    locations[0] ??
    'none'
  );
}

/** The locations a prompt may initialize, each with its own prompt. */
type PromptLocation = Exclude<NewProjectCodeLocation, 'none'>;

/** What the form still lacks, the wizard's words plus a clone URL typed without a connection. */
export type CodeLocationMissing = NewProjectMissing;

export function useCodeLocation(host: CodeLocationHost) {
  const status = useGitStatus().data;
  // Without a connection (`git.enabled` false), nothing is created on a host and a repository is given by its URL.
  const connections: readonly GitConnectionChoice[] = status?.enabled
    ? connectionsByAge(status.connections)
    : [];
  const agents = useAgentOptions({ type: 'runner' });
  const runners = useRunnerOptions();
  const gitApi = useGitApi();
  const locations = codeLocationsFor(host);

  // The person's choice; until they make one, the first available location, following the connections as they load.
  const [chosen, setChosen] = useState<NewProjectCodeLocation | null>(null);
  const location =
    chosen ?? defaultCodeLocation(locations, connections.length > 0);
  const [initAgentId, setInitAgentId] = useState('');
  // The connection last chosen in this browser, while it still exists; else the oldest.
  const [connectionId, setConnectionId] = useState(() => readLastConnection());
  const [owner, setOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [privateRepo, setPrivateRepo] = useState(true);
  const [method, setMethod] = useState<NewProjectInitMethod>('nocobase');
  const [templateRepo, setTemplateRepo] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const templateQuery = useDeferredValue(templateSearch.trim());
  // The person's choice of initialization workflow; until they make one, the convention's is preselected.
  const [workflowChoice, setWorkflowChoice] = useState<{
    readonly id: string | null;
  } | null>(null);
  const [prompts, setPrompts] = useState<Record<PromptLocation, string>>({
    newRepo: '',
    existingRepo: '',
    runnerDirectory: '',
  });
  const [picked, setPicked] = useState<PickedRepository | null>(null);
  const [cloneUrl, setCloneUrl] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [runnerId, setRunnerId] = useState('');
  const [path, setPath] = useState('');
  const [label, setLabel] = useState('');

  const prompt = location === 'none' ? '' : prompts[location];
  const setPrompt = (value: string) => {
    if (location !== 'none')
      setPrompts((current) => ({ ...current, [location]: value }));
  };

  // Typed as present: everything reading it is shown or enabled only with a connection.
  const connection =
    preferredConnection(connections, connectionId) ?? connections[0];
  const wantsTemplates =
    location === 'newRepo' && method === 'template' && Boolean(connection);
  // A typed `owner/repo` is a name to check, not a search of the connection's list.
  const typedRepo = FULL_NAME.test(templateQuery) ? templateQuery : null;
  const listQuery = typedRepo ? '' : templateQuery;
  const templates = useInfiniteQuery({
    queryKey: gitKeys.templateRepos(connection?.id ?? '', listQuery),
    queryFn: ({ pageParam, signal }) =>
      gitApi.templateRepos(connection.id, pageParam, listQuery, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
    enabled: wantsTemplates,
  });
  const templateRepos = (templates.data?.pages ?? []).flatMap(
    (page) => page.items,
  );
  const templatePages = templates.data?.pages.length ?? 0;
  // A page of the host's may hold no template: read on, a bounded number of pages, while too few are shown.
  const { hasNextPage, isFetching, isError, fetchNextPage } = templates;
  useEffect(() => {
    if (
      hasNextPage &&
      !isFetching &&
      !isError &&
      templatePages < TEMPLATE_PAGES &&
      templateRepos.length < TEMPLATE_FILL
    )
      void fetchNextPage();
  }, [
    hasNextPage,
    isFetching,
    isError,
    fetchNextPage,
    templatePages,
    templateRepos.length,
  ]);
  const listedTemplate = (fullName: string | null) =>
    fullName !== null &&
    templateRepos.some(
      (repo) => repo.fullName.toLowerCase() === fullName.toLowerCase(),
    );
  // A typed repository, or a chosen one the list does not hold, is checked on the host.
  const checkedName =
    templateRepo !== null && !listedTemplate(templateRepo)
      ? templateRepo
      : typedRepo !== null && !listedTemplate(typedRepo)
        ? typedRepo
        : null;
  const templateCheck = useQuery({
    queryKey: gitKeys.templateRepo(connection?.id ?? '', checkedName ?? ''),
    queryFn: ({ signal }) =>
      gitApi.templateRepo(connection.id, checkedName!, signal),
    enabled: wantsTemplates && checkedName !== null,
    retry: false,
    staleTime: 60_000,
  });
  // The chosen template, once known to be one: from the connection's list, or checked.
  const templateReady =
    templateRepo !== null &&
    (listedTemplate(templateRepo) ||
      (checkedName === templateRepo && templateCheck.isSuccess));
  const repoWorkflows = useQuery({
    queryKey: gitKeys.workflows(connection?.id ?? '', templateRepo ?? ''),
    queryFn: ({ signal }) =>
      gitApi.workflows(connection.id, templateRepo!, signal),
    enabled: wantsTemplates && templateReady,
  });
  const initWorkflowId = workflowChoice
    ? workflowChoice.id
    : (preselectedInitWorkflow(repoWorkflows.data ?? [])?.id ?? null);
  const initWorkflow =
    repoWorkflows.data?.find((item) => item.id === initWorkflowId) ?? null;

  // Picked through a connection, or typed when there is none.
  const manualRepo = connections.length === 0;
  const existingUrl = manualRepo ? cloneUrl.trim() : (picked?.url ?? '');
  const branch = defaultBranch.trim() || picked?.defaultRef || '';

  // A prompt initializes when one is given; a new repository without one starts with an initial commit.
  const promptInit =
    location === 'newRepo'
      ? method === 'prompt' && Boolean(prompt.trim())
      : location !== 'none' && Boolean(prompt.trim());
  // A NocoBase application is scaffolded by the init agent on a runner, with its preview CI connected by Studio.
  const nocobaseInit =
    location === 'newRepo' && method === 'nocobase' && Boolean(connection);
  /** An agent initializes: the init agent is asked for. */
  const agentInit = promptInit || nocobaseInit;
  // What still keeps the form from being complete, the first one in the form's order.
  const missing: CodeLocationMissing | null =
    location === 'newRepo' && !connection
      ? 'repository'
      : location === 'newRepo' && !repoName.trim()
        ? 'repoName'
        : location === 'newRepo' &&
            method === 'template' &&
            (!templateReady || !repoWorkflows.isSuccess)
          ? 'templateRepo'
          : location === 'existingRepo' && !existingUrl
            ? manualRepo
              ? 'cloneUrl'
              : 'repository'
            : location === 'runnerDirectory' && !runnerId
              ? 'runner'
              : location === 'runnerDirectory' && !path.trim()
                ? 'path'
                : agentInit && !initAgentId
                  ? 'initAgent'
                  : null;

  /** The repository's name, for the Apps named after it; null for no repository. */
  const repositoryName =
    location === 'newRepo'
      ? repoName.trim() || null
      : location === 'existingRepo'
        ? (picked?.binding.fullName.split('/').pop() ??
          (existingUrl
            .replace(/\/+$/u, '')
            .split(/[/:]/u)
            .pop()
            ?.replace(/\.git$/u, '') ||
            null))
        : null;

  const request = (): CodeLocationRequest => ({
    codeLocation: location,
    ...(agentInit ? { initAgentId } : {}),
    ...(location !== 'none' && label.trim() ? { label: label.trim() } : {}),
    ...(location === 'newRepo' && connection
      ? {
          newRepo: {
            connectionId: connection.id,
            name: repoName.trim(),
            private: privateRepo,
            // An app's installation decides the owner; a token may create in another account it belongs to.
            ...(connection.kind === 'token' && owner.trim()
              ? { owner: owner.trim() }
              : {}),
            init:
              method === 'nocobase'
                ? { method: 'nocobase' as const, template: APP_TEMPLATE }
                : method === 'template'
                  ? {
                      method: 'template' as const,
                      templateRepo: templateRepo ?? '',
                      workflow: initWorkflow
                        ? {
                            id: initWorkflow.id,
                            path: initWorkflow.path,
                            name: initWorkflow.name,
                          }
                        : null,
                    }
                  : { method: 'prompt' as const, prompt: prompt.trim() },
          },
        }
      : {}),
    ...(location === 'existingRepo' && existingUrl
      ? {
          existingRepo: {
            ...(picked && !manualRepo
              ? {
                  connectionId: picked.binding.connectionId,
                  repoId: picked.binding.repoId,
                  fullName: picked.binding.fullName,
                }
              : {}),
            cloneUrl: existingUrl,
            defaultBranch: branch || 'main',
            ...(promptInit ? { initPrompt: prompt.trim() } : {}),
          },
        }
      : {}),
    ...(location === 'runnerDirectory'
      ? {
          runnerDirectory: {
            runnerId,
            path: path.trim(),
            ...(promptInit ? { initPrompt: prompt.trim() } : {}),
          },
        }
      : {}),
  });

  return {
    host,
    locations,
    connections,
    connection,
    manualRepo,
    agents,
    runners,
    location,
    setLocation: setChosen,
    initAgentId,
    setInitAgentId,
    /** One connection for a new repository, its template and an existing repository alike. */
    setConnectionId: (id: string) => {
      setConnectionId(id);
      writeLastConnection(id);
      setOwner('');
      setTemplateRepo(null);
      setTemplateSearch('');
      setWorkflowChoice(null);
      setPicked(null);
      setDefaultBranch('');
    },
    owner,
    setOwner,
    repoName,
    setRepoName,
    privateRepo,
    setPrivateRepo,
    method,
    setMethod,
    templates,
    templateRepos,
    /** More of the host's pages may be read: on scrolling to the end of the list, or by hand. */
    templatesMore: Boolean(templates.hasNextPage),
    templateSearch,
    setTemplateSearch,
    /** A typed `owner/repo` the connection's list does not hold, to use once checked. */
    typedTemplate:
      typedRepo !== null && !listedTemplate(typedRepo) ? typedRepo : null,
    templateCheck,
    checkedTemplate: checkedName,
    templateRepo,
    templateReady,
    setTemplateRepo: (fullName: string | null) => {
      setTemplateRepo(fullName);
      setWorkflowChoice(null);
    },
    repoWorkflows,
    initWorkflowId,
    setInitWorkflowId: (id: string | null) => setWorkflowChoice({ id }),
    prompt,
    setPrompt,
    picked,
    setPicked: (repo: PickedRepository | null) => {
      setPicked(repo);
      setDefaultBranch(repo?.defaultRef ?? '');
    },
    cloneUrl,
    setCloneUrl,
    defaultBranch,
    setDefaultBranch,
    runnerId,
    setRunnerId,
    path,
    setPath,
    label,
    setLabel,
    promptInit,
    nocobaseInit,
    agentInit,
    missing,
    /** A repository is chosen, which may be deployed and previewed. */
    repository: location === 'newRepo' || location === 'existingRepo',
    /** The repository is reached through a connection, which Studio's CI setup needs. */
    connected:
      (location === 'newRepo' && Boolean(connection)) ||
      (location === 'existingRepo' && picked !== null && !manualRepo),
    repositoryName,
    request,
  };
}

export type CodeLocationState = ReturnType<typeof useCodeLocation>;
