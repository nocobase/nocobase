/**
 * Markdown as compact prose for descriptions, comments and documents: GitHub-flavoured Markdown, mention links
 * (`[@Name](mention://<kind>/<id>)`, as `RichTextEditor` writes them) shown as chips, and fenced code a consumer may
 * draw itself (`renderCodeBlock`, for diagrams). Raw HTML is never rendered, and every other URL keeps
 * react-markdown's sanitisation unless the consumer passes a stricter `transformUrl`.
 *
 * A link to `#anchor` moves within the page; every other web link opens in a new tab, same-origin ones included.
 * Business features build on two extension points: `components` replaces the rendering of single elements (each
 * receives react-markdown's `node`, with its source `position`), and `remarkPlugins` adds syntax after the base ones.
 */
/* eslint-disable react-refresh/only-export-components -- wrappers reuse the link rules, URL policy and base elements beside the view */
import { UserIcon } from 'lucide-react';
import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type JSX,
  type ReactElement,
  type ReactNode,
} from 'react';
import Markdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
  type Options,
} from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from 'cn';

import { remarkCjkAutolink } from './remark-cjk-autolink.js';

/** remark plugins, as react-markdown takes them. */
export type MarkdownRemarkPlugins = NonNullable<Options['remarkPlugins']>;

const MENTION_HREF = /^mention:\/\/([a-z][a-z0-9_]{1,31})\//u;
/** Links the browser hands to another application rather than to a web page. */
const SYSTEM_HREF = /^(?:mailto|tel|sms):/iu;

/** react-markdown's URL sanitisation, keeping mention links for the chips. */
export function markdownUrlTransform(url: string): string {
  return MENTION_HREF.test(url) ? url : defaultUrlTransform(url);
}

/**
 * Where a link opens: a `#anchor` stays on the page, mail and phone links are left to the browser, and every
 * other link opens in a new tab without access to this page.
 */
export function markdownLinkTarget(
  href: string,
): Pick<ComponentProps<'a'>, 'target' | 'rel'> {
  if (href.startsWith('#') || SYSTEM_HREF.test(href)) return {};
  return { target: '_blank', rel: 'noopener noreferrer' };
}

interface HastNode {
  readonly type?: string;
  readonly tagName?: string;
  readonly value?: string;
  readonly properties?: { readonly className?: unknown };
  readonly children?: readonly HastNode[];
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

/** A fenced code block: its language (`null` when unmarked) and its source. */
export interface MarkdownCodeBlock {
  readonly language: string | null;
  readonly source: string;
}

/** A fenced block's language and source, from the `pre` element react-markdown renders it as. */
function codeOf(node: HastNode | undefined): MarkdownCodeBlock | null {
  const code = node?.children?.find((child) => child.tagName === 'code');
  if (!code) return null;
  const classes = code.properties?.className;
  const language = Array.isArray(classes)
    ? ((classes as unknown[])
        .map(String)
        .find((name) => name.startsWith('language-'))
        ?.slice('language-'.length) ?? null)
    : null;
  return { language, source: textOf(code).replace(/\n$/u, '') };
}

export interface MarkdownViewProps {
  readonly content: string;
  readonly className?: string;
  /** Ids for the rendered `h1`/`h2`/`h3`, in document order, so a page can scroll to them. */
  readonly headingIds?: readonly string[];
  /** Draws a fenced code block itself (a `mermaid` diagram, say); `block` is the plain rendering. */
  readonly renderCodeBlock?: (
    code: MarkdownCodeBlock,
    block: ReactElement,
  ) => ReactNode;
  /** Replaces a sanitised link; `props` already carry the target the link rules chose, and `fallback` is the default. */
  readonly renderLink?: (
    props: ComponentProps<'a'>,
    fallback: ReactElement,
  ) => ReactNode;
  /** The icon of a mention chip by its kind; a person by default. */
  readonly mentionIcon?: (kind: string) => ReactNode;
  /** Sanitises every link and image URL; `markdownUrlTransform` by default. Return `''` to drop a URL. */
  readonly transformUrl?: (url: string) => string;
  /**
   * Replaces the rendering of single elements, merged over `markdownViewComponents` by tag. Pass components defined
   * once (at module level), not new functions on every render, or React remounts what they render on each update.
   */
  readonly components?: Components;
  /** remark plugins run after remark-gfm, `remarkCjkAutolink` and the heading ids. */
  readonly remarkPlugins?: MarkdownRemarkPlugins;
}

const MarkdownOptionsContext = createContext<
  Pick<MarkdownViewProps, 'renderCodeBlock' | 'renderLink' | 'mentionIcon'>
>({});

type ElementProps<Tag extends keyof JSX.IntrinsicElements> =
  ComponentProps<Tag> & ExtraProps;
type DefaultTag =
  | 'a'
  | 'p'
  | 'ul'
  | 'ol'
  | 'blockquote'
  | 'code'
  | 'pre'
  | 'img'
  | 'table'
  | 'th'
  | 'td'
  | 'hr'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

/** The base rendering of each element; a `components` entry may render one of these with its own props. */
export type MarkdownViewComponents = {
  readonly [Tag in DefaultTag]: (props: ElementProps<Tag>) => ReactNode;
};

function MarkdownLink({
  href,
  children,
  node: _node,
  ...props
}: ElementProps<'a'>): ReactNode {
  const { mentionIcon, renderLink } = useContext(MarkdownOptionsContext);
  const mention = href ? MENTION_HREF.exec(href) : null;
  if (mention)
    return (
      <span
        data-mention={mention[1]}
        className='inline-flex items-center gap-0.5 rounded-md bg-secondary px-1 py-px align-baseline font-medium text-secondary-foreground [&_svg]:size-3'
      >
        {mentionIcon?.(mention[1] ?? '') ?? <UserIcon aria-hidden='true' />}
        {children}
      </span>
    );
  // A URL the sanitiser dropped leaves its text and nothing to follow.
  const linkProps: ComponentProps<'a'> = {
    ...props,
    ...(href ? { href, ...markdownLinkTarget(href) } : {}),
    className: cn(
      'font-medium text-primary underline underline-offset-4',
      props.className,
    ),
  };
  const link = <a {...linkProps}>{children}</a>;
  return renderLink ? (
    <>{renderLink({ ...linkProps, children }, link)}</>
  ) : (
    link
  );
}

function MarkdownPre({ node, className, ...props }: ElementProps<'pre'>) {
  const { renderCodeBlock } = useContext(MarkdownOptionsContext);
  const block = (
    <pre
      {...props}
      className={cn(
        'my-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs [&>code]:bg-transparent [&>code]:p-0',
        className,
      )}
    />
  );
  const code = renderCodeBlock ? codeOf(node) : null;
  return code && renderCodeBlock ? <>{renderCodeBlock(code, block)}</> : block;
}

/** Each element with its base classes, merged with any `className` a wrapper passes. */
function styled<Tag extends DefaultTag>(
  Tag: Tag,
  base: string,
): (props: ElementProps<Tag>) => ReactNode {
  return function MarkdownElement({ node: _node, className, ...props }) {
    const Element = Tag as 'div';
    return (
      <Element
        {...(props as ComponentProps<'div'>)}
        className={cn(base, className)}
      />
    );
  };
}

// Component types stay stable even when consumers supply new callbacks on a refresh.
export const markdownViewComponents: MarkdownViewComponents = {
  a: MarkdownLink,
  p: styled('p', 'leading-6 not-first:mt-2'),
  ul: styled('ul', 'my-2 ml-5 list-disc space-y-1'),
  ol: styled('ol', 'my-2 ml-5 list-decimal space-y-1'),
  blockquote: styled(
    'blockquote',
    'my-2 border-l-2 pl-3 text-muted-foreground',
  ),
  code: styled('code', 'rounded bg-muted px-1 py-0.5 font-mono text-xs'),
  pre: MarkdownPre,
  img: function MarkdownImage({ node: _node, src, alt, className, ...props }) {
    // An image whose URL the sanitiser dropped shows its description instead.
    if (typeof src !== 'string' || !src) return alt ? <span>{alt}</span> : null;
    return (
      <img
        {...props}
        src={src}
        alt={alt ?? ''}
        loading='lazy'
        className={cn(
          'my-2 inline-block h-auto max-h-96 max-w-full rounded-md object-contain',
          className,
        )}
      />
    );
  },
  // The table's props and className go to the wrapper that scrolls it sideways.
  table: function MarkdownTable({
    node: _node,
    className,
    children,
    ...props
  }) {
    return (
      <div {...props} className={cn('my-2 w-full overflow-x-auto', className)}>
        <table className='w-full text-sm'>{children}</table>
      </div>
    );
  },
  th: styled(
    'th',
    'border px-2 py-1 text-left align-top font-medium wrap-break-word',
  ),
  // Cells break long words only when they must, so short ones keep the column wide and the table scrolls instead.
  td: styled('td', 'border px-2 py-1 align-top wrap-break-word'),
  hr: styled('hr', 'my-3'),
  h1: styled('h1', 'mt-4 mb-2 text-lg font-semibold first:mt-0'),
  h2: styled('h2', 'mt-4 mb-2 text-base font-semibold first:mt-0'),
  h3: styled('h3', 'mt-3 mb-1.5 text-sm font-semibold first:mt-0'),
  h4: styled('h4', 'mt-3 mb-1.5 text-sm font-semibold first:mt-0'),
  h5: styled('h5', 'mt-3 mb-1 text-sm font-medium first:mt-0'),
  h6: styled(
    'h6',
    'mt-3 mb-1 text-sm font-medium text-muted-foreground first:mt-0',
  ),
};

interface HeadingNode {
  type: string;
  depth?: number;
  children?: HeadingNode[];
  data?: { hProperties?: Record<string, unknown> };
}

/** Assign ids in document order while parsing, independently of React's render order. */
function remarkHeadingIds(ids: readonly string[]) {
  return (tree: HeadingNode): void => {
    let heading = 0;
    const visit = (node: HeadingNode): void => {
      if (node.type === 'heading' && node.depth && node.depth <= 3) {
        const id = ids[heading++];
        if (id !== undefined) {
          node.data ??= {};
          node.data.hProperties = { ...node.data.hProperties, id };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function MarkdownView({
  content,
  className,
  headingIds,
  renderCodeBlock,
  renderLink,
  mentionIcon,
  transformUrl = markdownUrlTransform,
  components,
  remarkPlugins,
}: MarkdownViewProps): ReactElement {
  const plugins = useMemo<MarkdownRemarkPlugins>(
    () => [
      remarkGfm,
      remarkCjkAutolink,
      [remarkHeadingIds, headingIds ?? []],
      ...(remarkPlugins ?? []),
    ],
    [headingIds, remarkPlugins],
  );
  // The merged map is new when the overrides object is, but its entries keep their identities, so React keeps the
  // rendered elements.
  const merged = useMemo<Components>(
    () =>
      components
        ? { ...markdownViewComponents, ...components }
        : markdownViewComponents,
    [components],
  );
  return (
    <MarkdownOptionsContext
      value={{ renderCodeBlock, renderLink, mentionIcon }}
    >
      <div
        className={cn('min-w-0 text-sm wrap-anywhere', className)}
        data-slot='markdown-view'
      >
        <Markdown
          remarkPlugins={plugins}
          urlTransform={transformUrl}
          components={merged}
        >
          {content}
        </Markdown>
      </div>
    </MarkdownOptionsContext>
  );
}
