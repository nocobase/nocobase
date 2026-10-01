// The Hub publishing client, for code that talks to a Hub without going through the command line, such as the Hub's
// own end-to-end tests. The commands an application runs are in `./cli`.
export {
  buildArguments,
  describeTarget,
  readArchiveTarget,
  sameTarget,
} from './build.ts';
export { credentialsPath } from './credentials.ts';
export { HubCliError } from './errors.ts';
export type { DeploymentStatus, HubCliErrorDetails } from './errors.ts';
export { HubClient } from './hub-client.ts';
export type {
  AppInfo,
  BuildTarget,
  DeploymentInfo,
  HubClientOptions,
  ReleaseInfo,
  StartedDeployment,
  UploadedRelease,
} from './hub-client.ts';
export { DEFAULT_ARTIFACT, MAX_ARTIFACT_SIZE, publish } from './publish.ts';
export type {
  DeployResult,
  Published,
  PublishOptions,
  UploadResult,
} from './publish.ts';
export { parseRemoteUrl, REMOTES_FILE } from './remotes.ts';
export type { Remote, RemoteTarget, RemotesFile } from './remotes.ts';
