import { useId, type ReactElement, type ReactNode } from 'react';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

export interface DefaultAccessChoice {
  readonly value: string;
  readonly label: string;
}
export interface DefaultAccessScopeControl {
  readonly id: string;
  readonly action: string;
  readonly scope: string;
  readonly value: string;
  readonly options: readonly DefaultAccessChoice[];
  readonly configuration?: ReactNode;
  readonly error?: string | undefined;
}
export interface DefaultAccessEditorProps {
  readonly ruleKey: string;
  readonly resource: string;
  readonly resources: readonly DefaultAccessChoice[];
  readonly scopes: readonly DefaultAccessScopeControl[];
  readonly existing?: boolean;
  readonly readOnly?: boolean;
  readonly keyError?: string | undefined;
  readonly resourceError?: string | undefined;
  readonly labels: {
    readonly key: string;
    readonly resource: string;
    readonly chooseResource: string;
    readonly action: string;
    readonly scope: string;
    readonly noScopes: string;
  };
  readonly onKeyChange: (value: string) => void;
  readonly onResourceChange: (value: string) => void;
  readonly onScopeChange: (id: string, value: string) => void;
}

/** Controlled fields only: the host owns API authorization, drafts, validation and writes. */
export function DefaultAccessEditor({
  ruleKey,
  resource,
  resources,
  scopes,
  existing = false,
  readOnly = false,
  keyError,
  resourceError,
  labels,
  onKeyChange,
  onResourceChange,
  onScopeChange,
}: DefaultAccessEditorProps): ReactElement {
  const id = useId();
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${id}-key`}>{labels.key} *</Label>
          <Input
            id={`${id}-key`}
            name='ruleKey'
            value={ruleKey}
            required
            disabled={existing || readOnly}
            aria-invalid={Boolean(keyError)}
            aria-describedby={keyError ? `${id}-key-error` : undefined}
            onChange={(event) => onKeyChange(event.target.value)}
          />
          {keyError && (
            <p id={`${id}-key-error`} className='text-sm text-destructive'>
              {keyError}
            </p>
          )}
        </div>
        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${id}-resource`}>{labels.resource} *</Label>
          <Select
            value={resource}
            items={resources}
            disabled={existing || readOnly}
            onValueChange={(value) => {
              if (value !== null) onResourceChange(value);
            }}
          >
            <SelectTrigger
              id={`${id}-resource`}
              className='w-full'
              aria-invalid={Boolean(resourceError)}
              aria-describedby={
                resourceError ? `${id}-resource-error` : undefined
              }
            >
              <SelectValue placeholder={labels.chooseResource} />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                {resources.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {resourceError && (
            <p id={`${id}-resource-error`} className='text-sm text-destructive'>
              {resourceError}
            </p>
          )}
        </div>
      </div>
      <div className='overflow-hidden rounded-lg border'>
        {scopes.length ? (
          scopes.map((scope) => (
            <div
              key={scope.id}
              className='grid min-w-0 gap-3 border-b p-4 last:border-b-0 sm:grid-cols-3'
            >
              <div className='min-w-0 break-words text-sm font-medium'>
                {scope.action}
              </div>
              <div className='flex min-w-0 flex-col gap-2 sm:col-span-2'>
                <Label htmlFor={`${id}-${scope.id}`}>
                  {scope.scope || labels.scope}
                </Label>
                <Select
                  value={scope.value}
                  items={scope.options}
                  disabled={readOnly}
                  onValueChange={(value) => {
                    if (value !== null) onScopeChange(scope.id, value);
                  }}
                >
                  <SelectTrigger
                    id={`${id}-${scope.id}`}
                    className='w-full'
                    aria-label={`${scope.action} · ${scope.scope || labels.scope}`}
                    aria-invalid={Boolean(scope.error)}
                    aria-describedby={
                      scope.error ? `${id}-${scope.id}-error` : undefined
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    <SelectGroup>
                      {scope.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {scope.error && (
                  <p
                    id={`${id}-${scope.id}-error`}
                    className='text-sm text-destructive'
                  >
                    {scope.error}
                  </p>
                )}
                {scope.configuration}
              </div>
            </div>
          ))
        ) : (
          <p className='p-4 text-sm text-muted-foreground'>{labels.noScopes}</p>
        )}
      </div>
    </div>
  );
}
