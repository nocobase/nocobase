/**
 * Rspress plugin: rewrite absolute links to the legacy `docs.nocobase.com` host in markdown content to `siteOrigin`.
 *
 * The markdown sources keep their `https://docs.nocobase.com/...` links; this remark plugin rewrites the URL of
 * links, link definitions and images, and the `href` / `src` attributes of raw HTML and MDX JSX elements, keeping the
 * path, query and hash. A bare URL used as its own link text is rewritten with it. Links stay absolute because many
 * legacy paths only resolve through CDN redirects and would fail the dead-link check as relative paths. Other text and
 * code are left untouched.
 */
import type { RspressPlugin } from '@rspress/core';
import { rewriteLegacyDocsUrl } from '../shared/site';

interface MarkdownNode {
  type: string;
  url?: string;
  value?: string;
  attributes?: Array<{ type: string; name?: string; value?: unknown }>;
  children?: MarkdownNode[];
}

const URL_ATTRIBUTES = new Set(['href', 'src']);
const HTML_URL_ATTRIBUTE_REGEX =
  /(\b(?:href|src)\s*=\s*["'])(https?:\/\/docs\.nocobase\.com(?=[/?#"'])[^"']*)/gi;

function rewriteNode(node: MarkdownNode): void {
  if (
    (node.type === 'link' ||
      node.type === 'definition' ||
      node.type === 'image') &&
    typeof node.url === 'string'
  ) {
    const url = node.url;
    node.url = rewriteLegacyDocsUrl(url);
    // Bare URLs (`<https://...>` or GFM autolinks) also show the URL as the link text.
    for (const child of node.children ?? []) {
      if (child.type === 'text' && child.value === url) {
        child.value = node.url;
      }
    }
  } else if (node.type === 'html' && typeof node.value === 'string') {
    node.value = node.value.replace(
      HTML_URL_ATTRIBUTE_REGEX,
      (_match, prefix: string, url: string) =>
        `${prefix}${rewriteLegacyDocsUrl(url)}`,
    );
  } else if (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    node.attributes
  ) {
    for (const attribute of node.attributes) {
      if (
        attribute.type === 'mdxJsxAttribute' &&
        attribute.name &&
        URL_ATTRIBUTES.has(attribute.name) &&
        typeof attribute.value === 'string'
      ) {
        attribute.value = rewriteLegacyDocsUrl(attribute.value);
      }
    }
  }

  node.children?.forEach(rewriteNode);
}

export function remarkSiteOriginLinks() {
  return (tree: MarkdownNode) => {
    rewriteNode(tree);
  };
}

export function pluginSiteOriginLinks(): RspressPlugin {
  return {
    name: '@nocobase/site-origin-links',
    markdown: {
      remarkPlugins: [remarkSiteOriginLinks],
    },
  };
}
