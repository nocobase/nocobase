import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useId,
  useRef,
  useState,
  type ReactElement,
  type FormEvent,
} from 'react';
import { Search, Plus, Bold } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { StatusBadge } from '#components/status-badge';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Label } from '#components/ui/label';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '#components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from '#components/ui/select';
import { RadioGroup, RadioGroupItem } from '#components/ui/radio-group';
import { Checkbox } from '#components/ui/checkbox';
import { Switch } from '#components/ui/switch';
import { Slider } from '#components/ui/slider';
import { Toggle } from '#components/ui/toggle';
import { GalleryPage, GallerySection } from './gallery-shared';

export default function ControlsGallery(): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [action, setAction] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [team, setTeam] = useState('product');
  const [priority, setPriority] = useState('normal');
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [bold, setBold] = useState(false);
  const [target, setTarget] = useState<number[]>([65]);
  const nameError = attempted && !name.trim();
  const emailError =
    attempted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setSaved(false);
    if (!name.trim())
      formRef.current?.querySelector<HTMLInputElement>('[name=name]')?.focus();
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      formRef.current?.querySelector<HTMLInputElement>('[name=email]')?.focus();
    else {
      setSaved(true);
      toaster.show({ type: 'success', title: t('gallery.saved') });
    }
  };
  return (
    <GalleryPage view='controls'>
      <GallerySection title='buttons' components='Button, Badge, StatusBadge'>
        <div className='flex flex-wrap gap-3'>
          {(
            [
              'default',
              'secondary',
              'outline',
              'ghost',
              'destructive',
              'link',
            ] as const
          ).map((variant) => (
            <Button
              key={variant}
              variant={variant}
              onClick={() => setAction(variant)}
            >
              {variant}
            </Button>
          ))}
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          {(['xs', 'sm', 'default', 'lg'] as const).map((size) => (
            <Button
              key={size}
              size={size}
              variant='outline'
              onClick={() => setAction(size)}
            >
              {size}
            </Button>
          ))}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size='icon'
                  aria-label={t('gallery.actions')}
                  onClick={() => setAction(t('gallery.actions'))}
                />
              }
            >
              <Plus />
            </TooltipTrigger>
            <TooltipContent>{t('gallery.actions')}</TooltipContent>
          </Tooltip>
          <Button disabled>{t('gallery.disabled')}</Button>
        </div>
        <div className='flex flex-wrap gap-3'>
          {(['default', 'secondary', 'outline', 'destructive'] as const).map(
            (variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ),
          )}
        </div>
        <div className='flex flex-wrap gap-3'>
          {(['neutral', 'info', 'warning', 'success'] as const).map((tone) => (
            <StatusBadge key={tone} tone={tone}>
              {tone}
            </StatusBadge>
          ))}
        </div>
        <p role='status' className='text-sm text-muted-foreground'>
          {t('gallery.selected')}: {action || t('gallery.none')}
        </p>
      </GallerySection>
      <GallerySection
        title='fields'
        components='Field, FieldGroup, Label, Input, Textarea, InputGroup'
      >
        <form
          ref={formRef}
          noValidate
          onSubmit={submit}
          className='flex flex-col gap-4'
        >
          <FieldGroup>
            <Field data-invalid={nameError || undefined}>
              <FieldLabel htmlFor={`${id}-name`}>
                {t('gallery.name')} *
              </FieldLabel>
              <Input
                id={`${id}-name`}
                name='name'
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                required
                aria-invalid={nameError}
                aria-describedby={nameError ? `${id}-name-error` : undefined}
              />
              {nameError && (
                <FieldError id={`${id}-name-error`}>
                  {t('gallery.required')}
                </FieldError>
              )}
            </Field>
            <Field data-invalid={emailError || undefined}>
              <FieldLabel htmlFor={`${id}-email`}>
                {t('gallery.email')} *
              </FieldLabel>
              <Input
                id={`${id}-email`}
                name='email'
                type='email'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSaved(false);
                }}
                required
                aria-invalid={emailError}
                aria-describedby={emailError ? `${id}-email-error` : undefined}
              />
              {emailError && (
                <FieldError id={`${id}-email-error`}>
                  {t('gallery.invalidEmail')}
                </FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-notes`}>
                {t('gallery.notes')}
              </FieldLabel>
              <Textarea
                id={`${id}-notes`}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setSaved(false);
                }}
              />
              <FieldDescription>{t('gallery.fieldHint')}</FieldDescription>
            </Field>
          </FieldGroup>
          <div className='flex flex-wrap gap-3'>
            <Button type='submit'>{t('gallery.save')}</Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setName('');
                setEmail('');
                setNotes('');
                setAttempted(false);
                setSaved(false);
              }}
            >
              {t('gallery.reset')}
            </Button>
          </div>
          {saved && (
            <p role='status' className='text-sm text-primary'>
              {t('gallery.saved')} {name.trim()} · {email.trim()}
            </p>
          )}
        </form>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t('gallery.search')}
            placeholder={t('gallery.search')}
          />
        </InputGroup>
        <div className='grid gap-3 sm:grid-cols-2'>
          <Input
            disabled
            placeholder={t('gallery.disabled')}
            aria-label={t('gallery.disabled')}
          />
          <Input
            readOnly
            value={t('gallery.readonly')}
            aria-label={t('gallery.readonly')}
          />
        </div>
      </GallerySection>
      <GallerySection
        title='choices'
        components='Select, RadioGroup, Checkbox, Switch, Slider, Toggle'
      >
        <div className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-team`}>{t('gallery.choice')}</Label>
          <Select value={team} onValueChange={(v) => setTeam(v ?? 'product')}>
            <SelectTrigger id={`${id}-team`} className='w-full'>
              <SelectValue>{t(`gallery.${team}`)}</SelectValue>
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                {['product', 'engineering', 'design'].map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`gallery.${v}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <RadioGroup
          aria-label={t('gallery.priority')}
          value={priority}
          onValueChange={setPriority}
        >
          {['normal', 'urgent'].map((v) => (
            <div key={v} className='flex items-center gap-3'>
              <RadioGroupItem value={v} id={`${id}-${v}`} />
              <Label htmlFor={`${id}-${v}`}>{t(`gallery.${v}`)}</Label>
            </div>
          ))}
        </RadioGroup>
        <div className='flex items-center gap-3'>
          <Checkbox
            id={`${id}-include`}
            checked={checked}
            onCheckedChange={setChecked}
          />
          <Label htmlFor={`${id}-include`}>{t('gallery.consent')}</Label>
        </div>
        <div className='flex items-center gap-3'>
          <Switch
            id={`${id}-notification`}
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <Label htmlFor={`${id}-notification`}>
            {t('gallery.notifications')}
          </Label>
        </div>
        <div className='flex items-center gap-3'>
          <Switch disabled aria-label={t('gallery.disabled')} />
          <Checkbox disabled aria-label={t('gallery.disabled')} />
          <Select disabled>
            <SelectTrigger aria-label={t('gallery.disabled')}>
              <SelectValue placeholder={t('gallery.disabled')} />
            </SelectTrigger>
          </Select>
        </div>
        <div className='flex flex-col gap-4'>
          <Label id={`${id}-target`}>
            {t('gallery.volume')} · {target[0]}%
          </Label>
          <Slider
            aria-labelledby={`${id}-target`}
            value={target}
            onValueChange={(v) => setTarget(Array.isArray(v) ? v : [v])}
            max={100}
            step={5}
          />
        </div>
        <Toggle
          pressed={bold}
          onPressedChange={setBold}
          aria-label={t('gallery.bold')}
          variant='outline'
        >
          <Bold />
          {t('gallery.bold')}
        </Toggle>
        <p
          role='status'
          className={`text-sm text-muted-foreground ${bold ? 'font-semibold' : ''}`}
        >
          {t('gallery.status')}: {t(`gallery.${team}`)} /{' '}
          {t(`gallery.${priority}`)} /{' '}
          {t(checked ? 'gallery.on' : 'gallery.off')} /{' '}
          {t(enabled ? 'gallery.on' : 'gallery.off')} / {target[0]}%
        </p>
      </GallerySection>
    </GalleryPage>
  );
}
