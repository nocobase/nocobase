import { useTranslation } from '@nocobase/i18n/client';
import { Link, Outlet, useLocation, useParams } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { useOrders } from './data';
import { OrderBadge } from './shared';
import { useOrderMoney } from './money';
function Footer({ exists }: { readonly exists: boolean }) {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  const location = useLocation();
  return (
    <>
      <Button
        variant='outline'
        disabled={isClosing}
        onClick={() => void close()}
      >
        {t('businessPreview.close')}
      </Button>
      {exists && (
        <Button
          nativeButton={false}
          render={<Link to={{ pathname: 'edit', search: location.search }} />}
        >
          {t('businessPreview.edit')}
        </Button>
      )}
    </>
  );
}
export default function OrderDetail() {
  const { orderId } = useParams();
  const row = useOrders().find((item) => item.id === orderId);
  const { t, i18n } = useTranslation();
  const money = useOrderMoney();
  const values = row
    ? ([
        ['customer', row.customer],
        ['email', row.email],
        ['product', row.product],
        ['quantity', new Intl.NumberFormat(i18n.language).format(row.quantity)],
        ['price', money(row.price)],
        ['total', money(row.price * row.quantity)],
        [
          'updated',
          new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
          }).format(new Date(row.updated)),
        ],
        ['note', row.note || '—'],
      ] as const)
    : [];
  return (
    <RouteDrawer
      title={row?.number ?? t('businessPreview.missing')}
      description={t('businessPreview.orderDetail')}
      footer={<Footer exists={Boolean(row)} />}
    >
      {row ? (
        <div className='flex flex-col gap-6'>
          <OrderBadge status={row.status} />
          <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-5 text-sm'>
            {values.map(([key, value]) => (
              <div key={key} className='contents'>
                <dt className='text-muted-foreground'>
                  {t(`businessPreview.${key}`)}
                </dt>
                <dd className='whitespace-pre-wrap break-words'>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('businessPreview.missingHint')}
        </p>
      )}
      <Outlet />
    </RouteDrawer>
  );
}
