import {
  useContext,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { RefreshCw } from 'lucide-react';
import { Button as DefaultButton } from '../components/ui/button.js';
import * as cards from '../components/ui/card.js';
import {
  TabsList as DefaultTabsList,
  TabsTrigger as DefaultTabsTrigger,
} from '../components/ui/tabs.js';
import { DemoSettingsContext } from './context.js';

/** Localized page chrome; the plugin retains refresh permissions and draft guards. */
export interface DemoSettingsHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly badge?: ReactNode;
  readonly refreshLabel: string;
  readonly refreshDisabled: boolean;
  readonly refreshing: boolean;
  readonly activeTabLabel: string;
  readonly onRefresh: () => void;
}

type Primitives = typeof cards & {
  Button: typeof DefaultButton;
  TabsList: typeof DefaultTabsList;
  TabsTrigger: typeof DefaultTabsTrigger;
};
const defaults: Primitives = {
  Button: DefaultButton,
  ...cards,
  TabsList: DefaultTabsList,
  TabsTrigger: DefaultTabsTrigger,
};
/** Supply stable components that forward children, events, refs and accessibility props. */
export type DemoSettingsComponents = {
  readonly [K in keyof Primitives]?: ComponentType<
    ComponentProps<Primitives[K]>
  >;
} & { readonly Header?: ComponentType<DemoSettingsHeaderProps> };

export function Button(
  props: ComponentProps<Primitives['Button']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.Button ?? defaults.Button;
  return <Component {...props} />;
}

export function Card(props: ComponentProps<Primitives['Card']>): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.Card ?? defaults.Card;
  return <Component {...props} />;
}

export function CardHeader(
  props: ComponentProps<Primitives['CardHeader']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.CardHeader ?? defaults.CardHeader;
  return <Component {...props} />;
}

export function CardTitle(
  props: ComponentProps<Primitives['CardTitle']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.CardTitle ?? defaults.CardTitle;
  return <Component {...props} />;
}

export function CardDescription(
  props: ComponentProps<Primitives['CardDescription']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.CardDescription ?? defaults.CardDescription;
  return <Component {...props} />;
}

export function CardAction(
  props: ComponentProps<Primitives['CardAction']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.CardAction ?? defaults.CardAction;
  return <Component {...props} />;
}

export function CardContent(
  props: ComponentProps<Primitives['CardContent']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.CardContent ?? defaults.CardContent;
  return <Component {...props} />;
}

export function CardFooter(
  props: ComponentProps<Primitives['CardFooter']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.CardFooter ?? defaults.CardFooter;
  return <Component {...props} />;
}

export function TabsList(
  props: ComponentProps<Primitives['TabsList']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.TabsList ?? defaults.TabsList;
  return <Component {...props} />;
}

export function TabsTrigger(
  props: ComponentProps<Primitives['TabsTrigger']>,
): ReactElement {
  const { components } = useContext(DemoSettingsContext);
  const Component = components?.TabsTrigger ?? defaults.TabsTrigger;
  return <Component {...props} />;
}

export function DefaultHeader({
  title,
  description,
  badge,
  refreshLabel,
  refreshDisabled,
  onRefresh,
}: DemoSettingsHeaderProps): ReactElement {
  return (
    <header className='flex flex-wrap items-start justify-between gap-3'>
      <div className='min-w-0'>
        <h1 className='flex flex-wrap items-center gap-2 text-xl font-semibold'>
          {title}
          {badge}
        </h1>
        {description ? (
          <p className='mt-1 max-w-3xl text-sm text-muted-foreground'>
            {description}
          </p>
        ) : null}
      </div>
      <Button
        variant='outline'
        size='sm'
        disabled={refreshDisabled}
        onClick={onRefresh}
      >
        <RefreshCw />
        {refreshLabel}
      </Button>
    </header>
  );
}
