import type { AppClientPluginFactory } from '@nocobase/app-client/plugins';
import type { LocaleLoaders } from '@nocobase/i18n';

/** Load resources through the installed plugin's public registration, never through another repository's source. */
export async function pluginEnglish(
  factory: AppClientPluginFactory,
): Promise<object> {
  const contribution = factory().locales;
  if (!contribution)
    throw new Error('The installed plugin must declare locale resources.');
  const resolved =
    typeof contribution === 'function' ? await contribution() : contribution;
  const loaders = (
    'default' in resolved ? resolved.default : resolved
  ) as LocaleLoaders;
  const resource = await loaders['en-US']();
  return 'default' in resource ? resource.default : resource;
}
