/**
 * The Docker activation backend for the NocoBase App Host (`external-service`, named `docker`). Start a Host with it
 * through the `app-host-docker` executable (`@nocobase/app-host-docker/cli`), or pass `createDockerBackend()` to
 * `createAppHost({ backends })` yourself.
 */
export {
  DOCKER_BACKEND_CAPABILITIES,
  DOCKER_BACKEND_NAME,
  DockerBackend,
  createDockerBackend,
  observedFromInspect,
  type DockerBackendOptions,
} from './backend.js';
export {
  DEFAULT_DOCKER_ENDPOINT,
  DOCKER_CONFIG_SCHEMA,
  DOCKER_DEFAULT_SETTINGS,
  DOCKER_SECRET_SCHEMA,
  DockerConfigError,
  detectDockerEndpoint,
  parseDockerSecret,
  parseEndpoint,
  type DockerEndpoint,
  type DockerEnvironmentSecret,
  type DockerSettings,
  type RegistryAuth,
} from './config.js';
export {
  createDockerApi,
  demuxLogs,
  wrapDockerode,
  type ContainerCreateBody,
  type ContainerInspect,
  type ContainerSummary,
  type DockerApi,
  type LogLine,
} from './docker-api.js';
export {
  DockerAppHandle,
  type ContainerEndpoint,
  type DockerAppHandleOptions,
} from './handle.js';
