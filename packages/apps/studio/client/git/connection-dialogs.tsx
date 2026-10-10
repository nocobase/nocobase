/**
 * The dialogs of Settings › Git. Connecting a code host whose provider creates apps from a manifest (GitHub) asks only
 * who owns the app (the person's account or an organization) and, folded away, a GitHub Enterprise Server's address;
 * "Create on GitHub" posts Studio's manifest from the browser, GitHub creates the app and sends the person on to install
 * it, and Studio lands them back here (`/oauth/git/manifest`, `/oauth/git/setup`). Entering an existing app by hand and
 * using a token stay at the bottom: each shows the provider's steps beside its form, and an app entered by hand ends
 * with the webhook and callback URLs to copy into its settings. The provider is chosen before the dialog opens ("Add
 * connection" lists them); each provider's dialog is registered in `ADD_CONNECTION_DIALOGS`, and one without manifests
 * asks how Studio connects (an app or a token). Wording about one host stays inside its forms (`studioGit.providers.<id>`). Another installation of an app takes only a name and the account
 * (the app's credentials stay on the server). Editing an installation changes its name and account; editing an app
 * changes its credentials and whether people may use personal tokens on every installation; editing a token changes
 * its name, host, token and that switch. Credentials are write-only: their fields start empty, say whether one is set,
 * and an empty field keeps it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  GithubIcon,
  KeyRoundIcon,
  ServerCogIcon,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactElement,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from 'cn';

import {
  webhooksReachable,
  type GitConnection,
  type GitConnectionKind,
  type GitProvider,
  type SaveGitConnectionRequest,
} from '../../shared/git.js';
import { useNotify } from '../access/notify.js';
import { gitKeys, useGitApi, useGitStatus } from './api.js';
import { absoluteUrl, hostOf } from './connections-model.js';
import { postForm } from './lib.js';
import { providerOf } from './providers.js';

/** What a dialog is open for. */
export type GitDialog =
  | { readonly type: 'add'; readonly provider: GitProvider }
  | { readonly type: 'install'; readonly app: GitConnection }
  | { readonly type: 'edit'; readonly connection: GitConnection }
  | {
      readonly type: 'editApp';
      readonly installations: readonly GitConnection[];
    }
  | { readonly type: 'finish'; readonly connection: GitConnection };

type FieldName =
  | 'name'
  | 'webUrl'
  | 'account'
  | 'appId'
  | 'installationId'
  | 'privateKey'
  | 'clientId'
  | 'clientSecret'
  | 'token'
  | 'webhookSecret';

/** The fields the connection itself shows; the others are credentials. */
type PlainField = Extract<
  FieldName,
  'name' | 'webUrl' | 'account' | 'appId' | 'installationId' | 'clientId'
>;

const SECRETS: readonly FieldName[] = [
  'privateKey',
  'clientSecret',
  'token',
  'webhookSecret',
];

const HAS: Partial<Record<FieldName, keyof GitConnection>> = {
  privateKey: 'hasPrivateKey',
  clientSecret: 'hasClientSecret',
  token: 'hasToken',
  webhookSecret: 'hasWebhookSecret',
};

/** The fields each form shows; which ones also show the personal tokens switch. */
const FORMS = {
  app: [
    'name',
    'webUrl',
    'appId',
    'privateKey',
    'account',
    'installationId',
    'clientId',
    'clientSecret',
    'webhookSecret',
  ],
  token: ['name', 'webUrl', 'token'],
  install: ['name', 'account', 'installationId'],
  editInstall: ['name', 'account', 'installationId'],
  editApp: ['appId', 'privateKey', 'clientId', 'clientSecret', 'webhookSecret'],
} as const satisfies Record<string, readonly FieldName[]>;

type FormKind = keyof typeof FORMS;

const PERSONAL_TOKENS_SWITCH: readonly FormKind[] = ['app', 'token', 'editApp'];

/** Hints the same for every provider; `webUrl`'s is the provider's. */
const HINTS: Partial<Record<FieldName, string>> = {
  account: 'accountHint',
  installationId: 'installationIdHint',
  clientId: 'clientHint',
  webhookSecret: 'webhookSecretHint',
};

/** A provider's icon (its descriptor's `icon`). */
export function ProviderIcon({
  provider,
  className,
}: {
  readonly provider: string;
  readonly className?: string;
}): ReactElement {
  const props = {
    'aria-hidden': true,
    'data-git-provider': provider,
    className: cn('size-4 shrink-0 text-muted-foreground', className),
  } as const;
  switch (providerOf(provider).icon) {
    case 'github':
      return <GithubIcon {...props} />;
  }
}

/** A URL to paste somewhere else, with a copy button. */
export function CopyValue({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): ReactElement {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <div className='space-y-1'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <div className='flex items-center gap-2 rounded-md border bg-muted/40 py-1 pr-1 pl-2'>
        <code className='min-w-0 flex-1 font-mono text-xs break-all'>
          {value}
        </code>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={`${copied ? t('studioGit.connections.copied') : t('studioGit.connections.copy')}: ${label}`}
          onClick={() => {
            void navigator.clipboard?.writeText(value).then(
              () => setCopied(true),
              () => undefined,
            );
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
    </div>
  );
}

export function GitConnectionDialog({
  dialog,
  onClose,
  onFinish,
}: {
  readonly dialog: GitDialog | null;
  readonly onClose: () => void;
  /** An app was added: show what to copy into its settings. */
  readonly onFinish: (connection: GitConnection) => void;
}): ReactElement {
  const { t } = useTranslation();
  // A new body for every dialog, so its fields start from what it opens.
  const key =
    dialog === null
      ? 'closed'
      : dialog.type === 'edit' || dialog.type === 'finish'
        ? `${dialog.type}:${dialog.connection.id}`
        : dialog.type === 'install'
          ? `install:${dialog.app.id}`
          : dialog.type === 'add'
            ? `add:${dialog.provider}`
            : dialog.type;
  let title = '';
  let description: string | null = null;
  if (dialog?.type === 'add')
    title = t('studioGit.connections.dialog.addTitle', {
      provider: providerOf(dialog.provider).label,
    });
  else if (dialog?.type === 'install') {
    title = t('studioGit.connections.dialog.installTitle', {
      name: dialog.app.name,
    });
    description = t('studioGit.connections.dialog.installDescription');
  } else if (dialog?.type === 'edit')
    title = t('studioGit.connections.dialog.editTitle', {
      name: dialog.connection.name,
    });
  else if (dialog?.type === 'editApp') {
    title = t('studioGit.connections.dialog.editAppTitle');
    description = t('studioGit.connections.dialog.editAppDescription', {
      count: dialog.installations.length,
    });
  } else if (dialog?.type === 'finish') {
    title = t('studioGit.connections.dialog.finishTitle');
    description = t('studioGit.connections.dialog.finishDescription');
  }
  return (
    <Dialog
      open={dialog !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {dialog?.type === 'add' ? (
          <AddDialogBody
            key={key}
            provider={dialog.provider}
            onClose={onClose}
            onFinish={onFinish}
          />
        ) : dialog?.type === 'install' ? (
          <>
            {dialog.app.installUrl ? (
              <a
                href={dialog.app.installUrl}
                className='inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline'
              >
                {t('studioGit.connections.dialog.installOnHost', {
                  provider: providerOf(dialog.app.provider).label,
                })}
                <ExternalLinkIcon className='size-3' aria-hidden='true' />
              </a>
            ) : null}
            <ConnectionForm
              key={key}
              form='install'
              connection={null}
              sameAppAs={dialog.app}
              onClose={onClose}
            />
          </>
        ) : dialog?.type === 'edit' ? (
          <ConnectionForm
            key={key}
            form={dialog.connection.kind === 'app' ? 'editInstall' : 'token'}
            connection={dialog.connection}
            onClose={onClose}
          />
        ) : dialog?.type === 'editApp' ? (
          <ConnectionForm
            key={key}
            form='editApp'
            connection={dialog.installations[0] ?? null}
            installations={dialog.installations}
            onClose={onClose}
          />
        ) : dialog?.type === 'finish' ? (
          <Finish key={key} connection={dialog.connection} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** What a provider's add dialog receives. */
export interface AddConnectionProps {
  readonly provider: GitProvider;
  readonly onClose: () => void;
  /** An app was added: show what to copy into its settings. */
  readonly onFinish: (connection: GitConnection) => void;
}

/** A provider's own way to add a connection: adding a provider registers its dialog here. */
const ADD_CONNECTION_DIALOGS: Readonly<
  Record<GitProvider, ComponentType<AddConnectionProps>>
> = {
  github: AddConnection,
};

function AddDialogBody(props: AddConnectionProps): ReactElement {
  const Body = ADD_CONNECTION_DIALOGS[props.provider];
  return <Body {...props} />;
}

/** Driven by the descriptor: an app from a manifest when the provider offers one, otherwise an app or a token. */
function AddConnection({
  provider,
  onClose,
  onFinish,
}: AddConnectionProps): ReactElement {
  const { t } = useTranslation();
  const kinds = providerOf(provider).connectionKinds;
  const manifest = providerOf(provider).appManifest;
  const [kind, setKind] = useState<GitConnectionKind>(kinds[0] ?? 'app');
  const [step, setStep] = useState<'create' | 'kind' | 'form'>(
    manifest ? 'create' : 'kind',
  );
  if (step === 'create')
    return (
      <CreateApp
        provider={provider}
        onClose={onClose}
        onEnter={(chosen) => {
          setKind(chosen);
          setStep('form');
        }}
      />
    );
  if (step === 'form')
    return (
      <div className='space-y-4'>
        <Steps provider={provider} kind={kind} />
        <ConnectionForm
          form={kind}
          provider={provider}
          connection={null}
          onClose={onClose}
          onBack={() => setStep(manifest ? 'create' : 'kind')}
          onCreated={kind === 'app' ? onFinish : undefined}
        />
      </div>
    );
  const footer = (
    <DialogFooter>
      <Button type='button' variant='outline' onClick={onClose}>
        {t('studioGit.connections.cancel')}
      </Button>
      <Button type='button' onClick={() => setStep('form')}>
        {t('studioGit.connections.next')}
      </Button>
    </DialogFooter>
  );
  return (
    <div className='space-y-4'>
      <p className='text-sm font-medium' id='git-connection-type'>
        {t('studioGit.connections.dialog.chooseType')}
      </p>
      <RadioGroup
        value={kind}
        onValueChange={(value) => setKind(value as GitConnectionKind)}
        aria-labelledby='git-connection-type'
      >
        {kinds.map((value) => {
          const Icon = value === 'app' ? ServerCogIcon : KeyRoundIcon;
          const id = `git-connection-kind-${value}`;
          return (
            <FieldLabel key={value} htmlFor={id}>
              <Field orientation='horizontal'>
                <Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                <FieldContent>
                  <FieldTitle>
                    {t(`studioGit.providers.${provider}.kind.${value}`)}
                  </FieldTitle>
                  <FieldDescription className='text-xs'>
                    {t(`studioGit.providers.${provider}.kindHint.${value}`)}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem id={id} value={value} data-kind={value} />
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>
      {footer}
    </div>
  );
}

/**
 * An app created on the host from Studio's manifest: who owns it and, folded away, a self-hosted server's address. The
 * other ways in (an app entered by hand, a token) wait at the bottom.
 */
function CreateApp({
  provider,
  onClose,
  onEnter,
}: {
  readonly provider: GitProvider;
  readonly onClose: () => void;
  /** Enter an existing app, or a token, by hand. */
  readonly onEnter: (kind: GitConnectionKind) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const ui = providerOf(provider);
  const key = `studioGit.providers.${provider}`;
  const publicOrigin = useGitStatus().data?.publicOrigin ?? null;
  const [owner, setOwner] = useState<'personal' | 'organization'>('personal');
  const [organization, setOrganization] = useState('');
  const [name, setName] = useState('');
  const [webUrl, setWebUrl] = useState(ui.defaultWebUrl);
  const [missing, setMissing] = useState(false);
  const host = webUrl.trim() || ui.defaultWebUrl;
  const reachable = webhooksReachable(publicOrigin, host, ui.defaultWebUrl);
  const start = useMutation({
    mutationFn: (input: {
      organization: string | null;
      webUrl: string;
      name?: string;
    }) => api.startAppManifest({ provider, ...input }),
    // The browser leaves for the host, which creates the app and sends it back.
    onSuccess: (form) => postForm(form.action, { manifest: form.manifest }),
    onError: (error) => notify.error(error),
  });
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const org = organization.trim();
    if (owner === 'organization' && !org) {
      setMissing(true);
      return;
    }
    start.mutate({
      organization: owner === 'organization' ? org : null,
      webUrl: host,
      name: name.trim() || undefined,
    });
  };
  return (
    <form onSubmit={submit} noValidate className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        {t(`${key}.create.intro`)}
      </p>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='git-app-name'>
            {t(`${key}.create.name`)}
          </FieldLabel>
          <Input
            id='git-app-name'
            autoComplete='off'
            maxLength={34}
            placeholder={t(`${key}.create.namePlaceholder`)}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldDescription>{t(`${key}.create.nameHint`)}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel id='git-app-owner'>{t(`${key}.create.owner`)}</FieldLabel>
          <RadioGroup
            value={owner}
            onValueChange={(value) =>
              setOwner(value as 'personal' | 'organization')
            }
            aria-labelledby='git-app-owner'
            className='flex flex-wrap gap-4'
          >
            {(['personal', 'organization'] as const).map((value) => (
              <Field key={value} orientation='horizontal' className='w-auto'>
                <RadioGroupItem
                  id={`git-app-owner-${value}`}
                  value={value}
                  data-owner={value}
                />
                <FieldLabel
                  htmlFor={`git-app-owner-${value}`}
                  className='font-normal'
                >
                  {t(`${key}.create.ownerKind.${value}`)}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </Field>
        {owner === 'organization' ? (
          <Field data-invalid={missing || undefined}>
            <FieldLabel htmlFor='git-app-organization'>
              {t(`${key}.create.organization`)}
            </FieldLabel>
            <Input
              id='git-app-organization'
              autoComplete='off'
              aria-invalid={missing || undefined}
              value={organization}
              onChange={(event) => {
                setOrganization(event.target.value);
                setMissing(false);
              }}
            />
            {missing ? (
              <FieldError>{t(`${key}.create.organizationRequired`)}</FieldError>
            ) : (
              <FieldDescription>
                {t(`${key}.create.organizationHint`)}
              </FieldDescription>
            )}
          </Field>
        ) : null}
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger
            render={
              <Button
                type='button'
                variant='link'
                className='group/enterprise h-auto px-0 text-muted-foreground'
              />
            }
          >
            {t(`${key}.create.enterprise`)}
            <ChevronDownIcon
              data-icon='inline-end'
              className='transition-transform group-data-[panel-open]/enterprise:rotate-180'
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Field className='pt-2'>
              <FieldLabel htmlFor='git-app-webUrl'>
                {t('studioGit.connections.fields.webUrl')}
              </FieldLabel>
              <Input
                id='git-app-webUrl'
                autoComplete='off'
                value={webUrl}
                onChange={(event) => setWebUrl(event.target.value)}
              />
              <FieldDescription>{t(`${key}.webUrlHint`)}</FieldDescription>
            </Field>
          </CollapsibleContent>
        </Collapsible>
      </FieldGroup>
      <p
        className='text-xs text-muted-foreground'
        data-webhook-active={reachable}
      >
        {reachable
          ? t(`${key}.create.webhookOn`)
          : t(`${key}.create.webhookOff`)}
      </p>
      <div className='flex flex-col items-start border-t pt-2'>
        <Button
          type='button'
          variant='link'
          className='h-auto px-0'
          onClick={() => onEnter('app')}
        >
          {t(`${key}.create.manual`)}
        </Button>
        {ui.connectionKinds.includes('token') ? (
          <Button
            type='button'
            variant='link'
            className='h-auto px-0'
            onClick={() => onEnter('token')}
          >
            {t(`${key}.create.token`)}
          </Button>
        ) : null}
      </div>
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          disabled={start.isPending}
          onClick={onClose}
        >
          {t('studioGit.connections.cancel')}
        </Button>
        <Button type='submit' disabled={start.isPending}>
          {start.isPending ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <ExternalLinkIcon data-icon='inline-start' />
          )}
          {t(`${key}.create.submit`)}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** What to do on the host before filling the form. */
function Steps({
  provider,
  kind,
}: {
  readonly provider: GitProvider;
  readonly kind: GitConnectionKind;
}): ReactElement {
  const { t } = useTranslation();
  const ui = providerOf(provider);
  const key = `studioGit.providers.${provider}`;
  const steps =
    kind === 'app'
      ? [
          {
            text: t(`${key}.appSteps.create`),
            link: {
              href: ui.newAppUrl(ui.defaultWebUrl),
              label: t(`${key}.appSteps.createLink`),
            },
          },
          { text: t(`${key}.appSteps.install`) },
          { text: t(`${key}.appSteps.fill`) },
        ]
      : [
          {
            text: t(`${key}.tokenSteps.create`),
            link: {
              href: ui.newTokenUrl(ui.defaultWebUrl),
              label: t(`${key}.tokenSteps.createLink`),
            },
          },
          { text: t(`${key}.tokenSteps.fill`) },
        ];
  return (
    <ol className='space-y-2 rounded-lg border bg-muted/30 p-3 text-sm'>
      {steps.map((step, index) => (
        <li key={step.text} className='flex gap-2'>
          <span className='flex size-5 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums'>
            {index + 1}
          </span>
          <span className='space-y-1'>
            <span className='block'>{step.text}</span>
            {step.link ? (
              <a
                href={step.link.href}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline'
              >
                {step.link.label}
                <ExternalLinkIcon className='size-3' aria-hidden='true' />
              </a>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ConnectionForm({
  form,
  provider: chosenProvider,
  connection,
  sameAppAs,
  installations,
  onClose,
  onBack,
  onCreated,
}: {
  readonly form: FormKind;
  /** The provider of a new connection; an existing one keeps its own. */
  readonly provider?: GitProvider;
  /** The connection edited; null when adding. */
  readonly connection: GitConnection | null;
  /** Adding another installation of this app. */
  readonly sameAppAs?: GitConnection;
  /** Editing the app: every installation it has. */
  readonly installations?: readonly GitConnection[];
  readonly onClose: () => void;
  readonly onBack?: () => void;
  readonly onCreated?: (connection: GitConnection) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Partial<Record<FieldName, string>>>({});
  const provider =
    connection?.provider ?? sameAppAs?.provider ?? chosenProvider ?? 'github';
  const [allowTokens, setAllowTokens] = useState<boolean>(
    connection?.allowPersonalTokens ?? true,
  );
  const tokensSwitch = PERSONAL_TOKENS_SWITCH.includes(form);
  const fields: readonly FieldName[] = FORMS[form];
  // The first credential the form asks for says that credentials are write-only.
  const firstSecret = fields.find((field) => SECRETS.includes(field));
  const valueOf = (field: FieldName): string =>
    values[field] ??
    (connection && !SECRETS.includes(field)
      ? (connection[field as PlainField] ?? '')
      : field === 'webUrl'
        ? providerOf(provider).defaultWebUrl
        : '');
  const save = useMutation({
    mutationFn: async (input: SaveGitConnectionRequest) => {
      if (installations) {
        // The app's credentials live on each installation: change them on all.
        let last: GitConnection | null = null;
        for (const installation of installations)
          last = await api.saveConnection(installation.id, input);
        return last;
      }
      return api.saveConnection(connection?.id ?? null, input);
    },
    onSuccess: (saved) => {
      notify.success(t('studioGit.connections.saved'));
      if (saved && !connection && onCreated) onCreated(saved);
      else onClose();
    },
    onError: (error) => notify.error(error),
    onSettled: () => queryClient.invalidateQueries({ queryKey: gitKeys.all }),
  });
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const input: Record<string, string | boolean> = {};
    for (const field of fields) {
      const value = valueOf(field).trim();
      // A secret left empty stays as it is; a plain field is sent as shown, and an empty one only to clear it.
      if (SECRETS.includes(field) && !value) continue;
      if (value || connection) input[field] = value;
    }
    if (tokensSwitch) input.allowPersonalTokens = allowTokens;
    if (sameAppAs)
      save.mutate({ kind: 'app', sameAppAs: sameAppAs.id, ...input });
    else if (connection) save.mutate(input);
    else
      save.mutate({
        provider,
        kind: form === 'token' ? 'token' : 'app',
        ...input,
      });
  };
  return (
    <form onSubmit={submit} noValidate className='space-y-4'>
      <FieldGroup>
        {fields.map((field) => {
          const secret = SECRETS.includes(field);
          const has = HAS[field];
          const isSet = secret && connection && has ? connection[has] : false;
          const id = `git-connection-${field}`;
          const hint =
            field === 'webUrl'
              ? `studioGit.providers.${provider}.webUrlHint`
              : HINTS[field]
                ? `studioGit.connections.fields.${HINTS[field]}`
                : null;
          return (
            <Field key={field}>
              <FieldLabel htmlFor={id}>
                {t(`studioGit.connections.fields.${field}`)}
              </FieldLabel>
              {field === 'privateKey' ? (
                <Textarea
                  id={id}
                  rows={3}
                  className='font-mono text-xs'
                  autoComplete='off'
                  placeholder='-----BEGIN RSA PRIVATE KEY-----'
                  value={valueOf(field)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              ) : (
                <Input
                  id={id}
                  type={secret ? 'password' : 'text'}
                  autoComplete={secret ? 'new-password' : 'off'}
                  value={valueOf(field)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              )}
              {secret && connection ? (
                <FieldDescription>
                  {isSet
                    ? t('studioGit.connections.fields.isSet')
                    : t('studioGit.connections.fields.notSet')}
                </FieldDescription>
              ) : hint ? (
                <FieldDescription>{t(hint)}</FieldDescription>
              ) : null}
              {field === firstSecret ? (
                <FieldDescription data-git-credentials-note>
                  {t('studioGit.connections.credentialsNote')}
                </FieldDescription>
              ) : null}
            </Field>
          );
        })}
        {tokensSwitch ? (
          <Field orientation='horizontal'>
            <FieldContent>
              <FieldLabel htmlFor='git-connection-allowPersonalTokens'>
                {t('studioGit.connections.fields.allowPersonalTokens')}
              </FieldLabel>
              <FieldDescription>
                {t('studioGit.connections.fields.allowPersonalTokensHint')}
              </FieldDescription>
            </FieldContent>
            <Switch
              id='git-connection-allowPersonalTokens'
              checked={allowTokens}
              onCheckedChange={setAllowTokens}
            />
          </Field>
        ) : null}
      </FieldGroup>
      <DialogFooter>
        {onBack ? (
          <Button
            type='button'
            variant='ghost'
            className='sm:mr-auto'
            disabled={save.isPending}
            onClick={onBack}
          >
            {t('studioGit.connections.back')}
          </Button>
        ) : null}
        <Button
          type='button'
          variant='outline'
          disabled={save.isPending}
          onClick={onClose}
        >
          {t('studioGit.connections.cancel')}
        </Button>
        <Button type='submit' disabled={save.isPending}>
          {save.isPending ? <Spinner data-icon='inline-start' /> : null}
          {t('studioGit.connections.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** After adding an app: the URLs to copy into its settings on GitHub. */
function Finish({
  connection,
  onClose,
}: {
  readonly connection: GitConnection;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        {hostOf(connection.webUrl)}
      </p>
      {connection.webhookUrl ? (
        <CopyValue
          label={t('studioGit.connections.webhookUrl')}
          value={absoluteUrl(connection.webhookUrl)}
        />
      ) : null}
      {connection.callbackUrl ? (
        <CopyValue
          label={t('studioGit.connections.callbackUrl')}
          value={absoluteUrl(connection.callbackUrl)}
        />
      ) : null}
      <DialogFooter>
        <Button type='button' onClick={onClose}>
          {t('studioGit.connections.done')}
        </Button>
      </DialogFooter>
    </div>
  );
}
