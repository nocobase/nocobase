import { useRef, useState } from 'react';
import { useApiClient, copyText } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Bot, Check, Copy, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '#components/ui/card';
import { Button } from '#components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import { Feedback } from './management-ui.js';
interface Configuration {
  variables: Record<string, string>;
  callbackUrl: string;
  discoveryUrl: string;
}
interface Application {
  id: string;
  name: string;
  url: string;
  kind: 'nocobase' | 'web';
}
export default function AgentSetup({ app }: { app: Application }) {
  const { t } = useTranslation();
  const api = useApiClient();
  const busyRef = useRef(false);
  const [configuration, setConfiguration] = useState<Configuration>();
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [error, setError] = useState<unknown>();
  function instructions(config: Configuration, masked: boolean) {
    const secret = masked
      ? '••••••••'
      : config.variables.PLATFORM_SSO_CLIENT_SECRET;
    const url = new URL(app.url);
    const parameters = {
      application: { id: app.id, name: app.name, url: app.url },
      callbackUrl: config.callbackUrl,
      discoveryUrl: config.discoveryUrl,
      ...(app.kind === 'nocobase'
        ? {
            serverEnvironment: {
              ...config.variables,
              PLATFORM_SSO_CLIENT_SECRET: secret,
              APP_PUBLIC_ORIGIN: url.origin,
              APP_BASE_PATH: url.pathname.replace(/\/$/u, '') || '/',
            },
          }
        : {
            oidc: {
              issuer: config.variables.PLATFORM_SSO_ISSUER,
              clientId: config.variables.PLATFORM_SSO_CLIENT_ID,
              clientSecret: secret,
              redirectUri: config.callbackUrl,
              scopes: 'openid profile email',
              responseType: 'code',
              tokenEndpointAuthMethod: 'client_secret_basic',
              pkce: 'S256',
            },
          }),
    };
    return [
      t('agentSetup.promptGoal'),
      t('agentSetup.promptInspect'),
      t(
        app.kind === 'nocobase'
          ? 'agentSetup.promptNocobase'
          : 'agentSetup.promptWeb',
      ),
      t('agentSetup.promptSecrets'),
      t('agentSetup.promptParameters'),
      '```json\n' + JSON.stringify(parameters, null, 2) + '\n```',
      t('agentSetup.promptVerify'),
      t('agentSetup.promptReport'),
    ].join('\n\n');
  }
  async function prepare(action: 'copy' | 'view' | 'refresh') {
    if (busyRef.current) return;
    busyRef.current = true;
    setPending(true);
    setError(undefined);
    setCopied(false);
    setRefreshed(false);
    setCopyFailed(false);
    try {
      const config =
        action !== 'refresh' && configuration
          ? configuration
          : (
              await api.request<{ data: Configuration }>({
                path: `multiApp/externalApps/${app.id}/configureIdentity`,
                method: 'POST',
              })
            ).data;
      setConfiguration(config);
      if (action === 'view') setExpanded(true);
      if (action === 'refresh') setRefreshed(true);
      if (action === 'copy') {
        if (!(await copyText(instructions(config, false)))) {
          setCopyFailed(true);
          return;
        }
        setCopied(true);
      }
    } catch (failure) {
      setError(failure);
    } finally {
      busyRef.current = false;
      setPending(false);
    }
  }
  return (
    <Card>
      <CardContent className='space-y-5'>
        <div className='space-y-2'>
          <h2 className='font-semibold'>{t('agentSetup.title')}</h2>
          <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
            {t('agentSetup.description')}
          </p>
        </div>
        <Collapsible
          open={expanded}
          onOpenChange={(next) => {
            if (next) prepare('view').catch(setError);
            else setExpanded(false);
          }}
          className='min-w-0 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5'
        >
          <div className='flex items-start gap-3'>
            <Bot
              className='mt-0.5 size-5 shrink-0 text-primary'
              aria-hidden='true'
            />
            <div className='min-w-0 space-y-1'>
              <h3 className='text-sm font-medium'>
                {t('agentSetup.instructions')}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {t('agentSetup.pasteHint')}
              </p>
              <CollapsibleTrigger
                disabled={pending}
                render={<Button variant='link' className='h-auto p-0' />}
              >
                {t(expanded ? 'agentSetup.hide' : 'agentSetup.view')}
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            {configuration && (
              <pre className='max-h-80 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border bg-background p-4 font-mono text-xs leading-6 [overflow-wrap:anywhere]'>
                {instructions(configuration, true)}
              </pre>
            )}
          </CollapsibleContent>
          <div className='flex flex-wrap items-center gap-3'>
            <Button
              disabled={pending}
              onClick={() => {
                prepare('copy').catch(setError);
              }}
            >
              {copied ? (
                <Check aria-hidden='true' />
              ) : (
                <Copy aria-hidden='true' />
              )}
              {t(
                pending
                  ? 'agentSetup.preparing'
                  : copied
                    ? 'external.copied'
                    : 'agentSetup.copy',
              )}
            </Button>
            {configuration && (
              <Button
                variant='ghost'
                disabled={pending}
                onClick={() => {
                  prepare('refresh').catch(setError);
                }}
              >
                <RefreshCw aria-hidden='true' />
                {t('agentSetup.refresh')}
              </Button>
            )}
          </div>
          {refreshed && (
            <p role='status' className='text-sm'>
              {t('agentSetup.refreshedHint')}
            </p>
          )}
          {copied && (
            <p role='status' className='text-sm'>
              {t('agentSetup.copiedHint')}
            </p>
          )}
          {copyFailed && (
            <p role='alert' className='text-sm text-destructive'>
              {t('agentSetup.copyFailed')}
            </p>
          )}
          {error ? <Feedback error={error} /> : null}
        </Collapsible>
        <div className='space-y-2 text-sm leading-6 text-muted-foreground'>
          <p>{t('agentSetup.secretHint')}</p>
          <p>{t('agentSetup.accessHint')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
