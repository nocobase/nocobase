export interface PushManifestOptions {
  name: string;
  shortName: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  icons?: readonly {
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }[];
}
export interface PushManifest {
  id: string;
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  scope: string;
  display: 'standalone';
  theme_color?: string;
  background_color?: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
}
/** Installation metadata only: the application supplies branding and serves its manifest link. */
export function pushManifest(
  base: string,
  options: PushManifestOptions,
): PushManifest {
  const scope = `${base.replace(/\/$/u, '')}/`;
  return {
    id: scope,
    name: options.name,
    short_name: options.shortName,
    description: options.description,
    start_url: scope,
    scope,
    display: 'standalone',
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    icons: (options.icons ?? []).map((icon) => ({
      ...icon,
      src: `${scope}${icon.src.replace(/^\//u, '')}`,
    })),
  };
}
