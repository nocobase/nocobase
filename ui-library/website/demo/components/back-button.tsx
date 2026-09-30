import { ChevronRight } from 'lucide-react';
import type { ReactElement } from 'react';
import {
  BrowserRouter,
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';

import { BackButton } from '../../../registry/components/back-button';
import { PageContainer } from '../../../registry/components/page-container';
import { PageHeader } from '../../../registry/components/page-header';
import { RouteChildPage } from '../../../registry/components/route-child-page';

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
 * An order's own page is a covering child page of the list, so `BackButton` above its heading returns to the list. The
 * links carry the query string down and the button carries it back, which is what keeps the preview's theme.
 */
export function BackButtonDemo(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<OrdersPage />} path='/demo/components/back-button'>
          <Route element={<OrderPage />} path=':orderId' />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function OrdersPage(): ReactElement {
  const location = useLocation();

  return (
    // The content area positions a covering child page, which is why the outlet sits beside the page's container.
    <main className='relative min-h-svh overflow-hidden bg-background text-foreground'>
      <PageContainer>
        <PageHeader
          description='Open an order: its page covers the list, and Back returns here.'
          title='Orders'
        />
        <ul className='divide-y rounded-lg border'>
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                className='flex items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50'
                to={{ pathname: order.id, search: location.search }}
              >
                <span className='w-20 font-medium'>{order.id}</span>
                <span className='min-w-0 flex-1 truncate'>
                  {order.customer}
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

function OrderPage(): ReactElement {
  const { orderId } = useParams();
  const order = orders.find((candidate) => candidate.id === orderId);

  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton />
        <PageHeader
          description={order ? order.customer : 'This order does not exist.'}
          title={orderId ?? 'Order'}
        />
        {order ? (
          <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm'>
            <dt className='text-muted-foreground'>Status</dt>
            <dd>{order.status}</dd>
            <dt className='text-muted-foreground'>Total</dt>
            <dd className='tabular-nums'>{order.total}</dd>
          </dl>
        ) : null}
      </PageContainer>
    </RouteChildPage>
  );
}
