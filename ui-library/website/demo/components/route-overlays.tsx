import { ChevronRight, FileBarChart, Plus } from 'lucide-react';
import type { ReactElement } from 'react';
import {
  BrowserRouter,
  Link,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { BackButton } from '../../../registry/components/back-button';
import { PageContainer } from '../../../registry/components/page-container';
import { PageHeader } from '../../../registry/components/page-header';
import { RouteChildPage } from '../../../registry/components/route-child-page';
import { RouteDialog } from '../../../registry/components/route-dialog';
import { RouteDrawer } from '../../../registry/components/route-drawer';
import { useRouteOverlay } from '../../../registry/components/use-route-overlay';

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly total: string;
  readonly status: string;
}

const orders: readonly Order[] = [
  { id: 'SO-1042', customer: 'Acme Corp', total: '$1,280.00', status: 'Paid' },
  {
    id: 'SO-1043',
    customer: 'Globex',
    total: '$342.50',
    status: 'Awaiting payment',
  },
  { id: 'SO-1044', customer: 'Initech', total: '$96.00', status: 'Shipped' },
];

/**
 * Every overlay is a child route of the orders page, so each state has a URL: `new` opens a dialog, an order id opens
 * a drawer, `edit` stacks a dialog on that drawer, and `report` covers the page with a child page.
 */
export function RouteOverlaysDemo(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<OrdersPage />} path='/demo/components/route-overlays'>
          <Route element={<NewOrderDialog />} path='new' />
          <Route element={<ReportChildPage />} path='report' />
          <Route element={<OrderDrawer />} path=':orderId'>
            <Route element={<EditOrderDialog />} path='edit' />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function OrdersPage(): ReactElement {
  const navigate = useNavigate();

  return (
    // The content area positions a covering child page, which is why the outlet sits beside the page's container.
    <main className='relative min-h-svh overflow-hidden bg-background text-foreground'>
      <PageContainer>
        <PageHeader
          actions={
            <>
              <Button
                onClick={() => void navigate('report')}
                type='button'
                variant='outline'
              >
                <FileBarChart data-icon='inline-start' />
                Report
              </Button>
              <Button onClick={() => void navigate('new')} type='button'>
                <Plus data-icon='inline-start' />
                New order
              </Button>
            </>
          }
          description='Open an order to see it in a drawer. Each dialog, drawer and child page has its own URL.'
          title='Orders'
        />
        <ul className='divide-y rounded-lg border'>
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                className='flex items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50'
                to={order.id}
              >
                <span className='w-20 font-medium'>{order.id}</span>
                <span className='min-w-0 flex-1 truncate'>
                  {order.customer}
                </span>
                <span className='hidden text-muted-foreground sm:inline'>
                  {order.status}
                </span>
                <span className='tabular-nums'>{order.total}</span>
                <ChevronRight
                  aria-hidden='true'
                  className='size-4 text-muted-foreground'
                />
              </Link>
            </li>
          ))}
        </ul>
      </PageContainer>
      <Outlet />
    </main>
  );
}

function CloseButton({ label }: { readonly label: string }): ReactElement {
  // Rendered in the overlay's footer, which is inside the overlay, so the hook finds it.
  const { close, isClosing } = useRouteOverlay();

  return (
    <Button
      disabled={isClosing}
      onClick={() => void close()}
      type='button'
      variant='outline'
    >
      {label}
    </Button>
  );
}

function NewOrderDialog(): ReactElement {
  return (
    <RouteDialog
      description='A child route of the list, opened at its own URL; closing it returns to the list.'
      footer={
        <>
          <CloseButton label='Cancel' />
          <CloseButton label='Create order' />
        </>
      }
      title='New order'
    >
      <div className='grid gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='customer'>Customer</Label>
          <Input id='customer' placeholder='Acme Corp' />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='total'>Total</Label>
          <Input id='total' inputMode='decimal' placeholder='0.00' />
        </div>
      </div>
    </RouteDialog>
  );
}

function OrderDrawer(): ReactElement {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const order = orders.find((candidate) => candidate.id === orderId);

  return (
    <RouteDrawer
      description={order ? order.customer : 'This order does not exist.'}
      footer={
        order ? (
          <>
            <CloseButton label='Close' />
            <Button onClick={() => void navigate('edit')} type='button'>
              Edit
            </Button>
          </>
        ) : undefined
      }
      title={orderId ?? 'Order'}
    >
      {order ? (
        <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm'>
          <dt className='text-muted-foreground'>Status</dt>
          <dd>{order.status}</dd>
          <dt className='text-muted-foreground'>Total</dt>
          <dd className='tabular-nums'>{order.total}</dd>
        </dl>
      ) : null}
      {/* A dialog opened from the drawer is its child route, rendered at the drawer's outlet. */}
      <Outlet />
    </RouteDrawer>
  );
}

function EditOrderDialog(): ReactElement {
  const { orderId } = useParams();
  const order = orders.find((candidate) => candidate.id === orderId);

  return (
    <RouteDialog
      description='Stacked on the drawer; closing it returns to the drawer.'
      footer={
        <>
          <CloseButton label='Cancel' />
          <CloseButton label='Save' />
        </>
      }
      title={`Edit ${orderId ?? 'order'}`}
    >
      <div className='grid gap-2'>
        <Label htmlFor='edit-customer'>Customer</Label>
        <Input defaultValue={order?.customer} id='edit-customer' />
      </div>
    </RouteDialog>
  );
}

function ReportChildPage(): ReactElement {
  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton />
        <PageHeader
          description='A covering child page keeps the list beneath it mounted, so returning restores its scroll position.'
          title='Quarterly report'
        />
        <p className='text-sm text-muted-foreground'>
          Unlike a dialog or a drawer it is not modal: the application around
          the content area stays reachable, and the back button above its
          heading or the browser's back button closes it.
        </p>
      </PageContainer>
    </RouteChildPage>
  );
}
