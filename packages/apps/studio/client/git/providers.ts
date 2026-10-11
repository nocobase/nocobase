/**
 * What the settings pages know of each code host provider beside its descriptor (`GIT_PROVIDER_DESCRIPTORS`): the pages
 * on the host its forms link to. Its icon is `ProviderIcon` (`connection-dialogs.tsx`); wording specific to a provider
 * lives under `studioGit.providers.<id>`.
 */
import {
  GIT_PROVIDER_DESCRIPTORS,
  type GitProvider,
  type GitProviderDescriptor,
} from '../../shared/git.js';

interface ProviderUi {
  /** Where an administrator creates an app on the host. */
  readonly newAppUrl: (webUrl: string) => string;
  /** Where someone creates a personal access token on the host. */
  readonly newTokenUrl: (webUrl: string) => string;
}

const UI: Readonly<Record<GitProvider, ProviderUi>> = {
  github: {
    newAppUrl: (webUrl) => `${webUrl.replace(/\/+$/u, '')}/settings/apps/new`,
    newTokenUrl: (webUrl) =>
      `${webUrl.replace(/\/+$/u, '')}/settings/personal-access-tokens/new`,
  },
};

/** The descriptor and the client's own of a provider; GitHub's for one the client does not know. */
export function providerOf(id: string): GitProviderDescriptor & ProviderUi {
  const known = (Object.keys(UI) as GitProvider[]).find((key) => key === id);
  const provider = known ?? 'github';
  return { ...GIT_PROVIDER_DESCRIPTORS[provider], ...UI[provider] };
}

/** The providers a connection may be added for, in order. */
export const GIT_PROVIDER_CHOICES: readonly GitProvider[] = Object.keys(
  GIT_PROVIDER_DESCRIPTORS,
) as GitProvider[];
