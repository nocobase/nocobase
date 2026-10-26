import type { ReactElement, ReactNode } from 'react';

import { Button, buttonVariants } from '#components/ui/button';
import { FieldSeparator } from '#components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { cn } from 'cn';

export interface AuthMethod {
  readonly id: string;
  readonly label: ReactNode;
  /** The method's form, rendered while its tab is selected. */
  readonly content: ReactNode;
}

export interface AuthSsoProvider {
  readonly id: string;
  /** The provider's name. It labels the button, and names it when the group shows icons only. */
  readonly label: string;
  readonly icon?: ReactNode;
  /** Renders a link instead of a button. */
  readonly href?: string;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
}

export interface AuthMethodsLabels {
  /** Names the method tabs for assistive technology. */
  readonly methods: string;
  /** Separates the methods from the SSO providers. */
  readonly separator: string;
  /** The text of a provider's button; `{provider}` is replaced by its label. */
  readonly continueWith: string;
}

const defaultAuthMethodsLabels: AuthMethodsLabels = {
  methods: 'Sign-in methods',
  separator: 'Or continue with',
  continueWith: 'Continue with {provider}',
};

export interface AuthMethodsProps {
  /** The sign-in methods. Tabs appear only when there is more than one. */
  readonly methods?: readonly AuthMethod[];
  /** Single sign-on providers, below the methods. */
  readonly providers?: readonly AuthSsoProvider[];
  /** The method selected at first; defaults to the first one. */
  readonly defaultMethodId?: string;
  readonly labels?: Partial<AuthMethodsLabels>;
  readonly className?: string;
}

/** Every way to sign in on one page: method tabs, the selected method's form, and the SSO providers. */
export function AuthMethods({
  className,
  defaultMethodId,
  labels: labelOverrides,
  methods = [],
  providers = [],
}: AuthMethodsProps): ReactElement {
  const labels = { ...defaultAuthMethodsLabels, ...labelOverrides };
  return (
    <div className={cn('grid gap-6', className)}>
      {methods.length > 1 ? (
        <Tabs
          className='gap-6'
          defaultValue={defaultMethodId ?? methods[0]?.id}
        >
          <TabsList aria-label={labels.methods} className='w-full'>
            {methods.map((method) => (
              <TabsTrigger key={method.id} value={method.id}>
                {method.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {methods.map((method) => (
            <TabsContent key={method.id} value={method.id}>
              {method.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        methods[0]?.content
      )}
      {providers.length > 0 ? (
        <>
          {methods.length > 0 ? (
            <FieldSeparator>{labels.separator}</FieldSeparator>
          ) : null}
          <AuthSsoButtons
            continueWith={labels.continueWith}
            providers={providers}
          />
        </>
      ) : null}
    </div>
  );
}

export interface AuthSsoButtonsProps {
  readonly providers: readonly AuthSsoProvider[];
  /** The text of a provider's button; `{provider}` is replaced by its label. */
  readonly continueWith?: string;
}

/**
 * One full-width outline button per provider. From three providers on, the group becomes a grid of icon buttons, each
 * named by its provider; a provider without an icon keeps its text.
 */
export function AuthSsoButtons({
  continueWith = defaultAuthMethodsLabels.continueWith,
  providers,
}: AuthSsoButtonsProps): ReactElement {
  const compact = providers.length >= 3;
  return (
    <div
      className={cn(
        'grid gap-3',
        compact && 'grid-cols-[repeat(auto-fit,minmax(3rem,1fr))]',
      )}
    >
      {providers.map((provider) => {
        const text = continueWith.replace('{provider}', provider.label);
        const iconOnly = compact && Boolean(provider.icon);
        const content = (
          <>
            {provider.icon ? (
              <span aria-hidden='true' className='contents'>
                {provider.icon}
              </span>
            ) : null}
            {iconOnly ? null : <span className='truncate'>{text}</span>}
          </>
        );
        const name = iconOnly ? text : undefined;
        // A provider that signs in by navigation is a link, styled as the button it sits beside.
        if (provider.href && !provider.disabled) {
          return (
            <a
              aria-label={name}
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'w-full',
              )}
              href={provider.href}
              key={provider.id}
              title={name}
            >
              {content}
            </a>
          );
        }
        return (
          <Button
            aria-label={name}
            className='w-full'
            disabled={provider.disabled}
            key={provider.id}
            onClick={provider.onClick}
            size='lg'
            title={name}
            type='button'
            variant='outline'
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
}
