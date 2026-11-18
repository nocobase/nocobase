import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { Button } from '../../client/components/ui/button';
import { Input } from '../../client/components/ui/input';
import { Spinner } from '../../client/components/ui/spinner';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../client/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../client/components/ui/alert-dialog';
import { RouteDialog } from '../../client/components/route-dialog';
import { RouteDrawer } from '../../client/components/route-drawer';
import enUS from '../../client/locales/en-US';
import '../../client/styles.css';

// Exercise installed primitives, portals, links and route footers with the real
// application stylesheet. No backend or authentication is needed for this fixture.
const params = new URLSearchParams(location.search);
const kind = params.get('kind') ?? 'dialog';
const chinese = params.has('chinese');
const long = params.has('long');
const pending = params.has('pending');
const horizontal = params.has('horizontal');
document.documentElement.dataset.theme = params.get('preset') ?? 'default';
document.documentElement.classList.toggle('dark', params.has('dark'));
const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/app-template-default', resources: enUS },
});
const cancel = chinese ? '取消并返回实例列表' : 'Cancel';
const submit = chinese
  ? '确认创建这个具有较长中文名称的应用实例并继续配置'
  : long
    ? 'Create this application instance and continue configuring its workspace'
    : 'Create instance';
const title = chinese ? '创建应用实例' : 'Create application instance';
const description = chinese
  ? '输入实例名称，然后创建实例。'
  : 'Enter a name to create an application instance.';

function Editor() {
  return (
    <form
      id='instance-form'
      onSubmit={(event) => {
        event.preventDefault();
        void router.navigate('/instances?created=1');
      }}
    >
      <label htmlFor='instance-name'>
        {chinese ? '实例名称' : 'Instance name'}
      </label>
      <Input id='instance-name' required defaultValue='Customer portal' />
      {long && !kind.startsWith('alert') && (
        <div className='h-[900px]' aria-hidden='true' />
      )}
    </form>
  );
}

function Actions() {
  return (
    <>
      {kind === 'dialog-close' ? (
        <DialogClose
          disabled={pending}
          data-testid='cancel'
          render={<Button variant='outline' />}
        >
          {cancel}
        </DialogClose>
      ) : (
        <Button
          variant='outline'
          nativeButton={false}
          disabled={pending}
          data-testid='cancel'
          render={<Link to='/instances?filter=recent' />}
        >
          {cancel}
        </Button>
      )}
      <Button
        type='submit'
        form='instance-form'
        disabled={pending}
        aria-busy={pending}
        data-testid='submit'
      >
        {pending && <Spinner data-icon='inline-start' />}
        {pending ? 'Creating instance…' : submit}
      </Button>
    </>
  );
}

export default function Overlay() {
  const [open, setOpen] = useState(true);
  if (kind === 'route' || kind === 'drawer') {
    const Component = kind === 'drawer' ? RouteDrawer : RouteDialog;
    return (
      <Component
        title={title}
        description={description}
        footer={<Actions />}
        beforeClose={() => !pending}
      >
        <Editor />
      </Component>
    );
  }
  if (kind === 'alert' || kind === 'alert-small') {
    return (
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <AlertDialogContent size={kind === 'alert-small' ? 'sm' : 'default'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <Editor />
          <AlertDialogFooter
            className={horizontal ? 'flex-row items-center' : undefined}
          >
            <AlertDialogCancel disabled={pending} data-testid='cancel'>
              {cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              type='submit'
              form='instance-form'
              disabled={pending}
              aria-busy={pending}
              data-testid='submit'
            >
              {pending && <Spinner data-icon='inline-start' />}
              {pending ? 'Creating instance…' : submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      <DialogContent className='flex flex-col overflow-hidden'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='min-h-0 overflow-y-auto'>
          <Editor />
        </div>
        <DialogFooter
          className={horizontal ? 'flex-row items-center' : undefined}
        >
          <Actions />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const router = createMemoryRouter(
  [
    {
      path: '/instances',
      element: (
        <main className='p-6'>
          <h1>Application instances</h1>
          <p data-testid='location'>Instance list</p>
          <Outlet />
        </main>
      ),
      children: [{ path: 'new', element: <Overlay /> }],
    },
  ],
  { initialEntries: ['/instances/new?filter=recent'] },
);
router.subscribe((state) => {
  const output = document.querySelector('[data-testid=location]');
  if (output)
    output.textContent = state.location.pathname + state.location.search;
});
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <RouterProvider router={router} />
  </TestI18nProvider>,
);
