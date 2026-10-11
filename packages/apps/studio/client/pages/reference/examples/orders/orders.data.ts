/** Mock data for the Orders example. Nothing here reaches a server. */

export type OrderStatus =
  'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';

export type OrderChannel = 'web' | 'store' | 'phone';

export interface OrderLine {
  readonly sku: string;
  readonly product: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface OrderCustomer {
  readonly name: string;
  readonly email: string;
  readonly initials: string;
}

export interface Order {
  readonly id: string;
  readonly number: string;
  readonly customer: OrderCustomer;
  readonly status: OrderStatus;
  readonly channel: OrderChannel;
  readonly placedAt: string;
  readonly lines: readonly OrderLine[];
}

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
];

export function orderTotal(order: Order): number {
  return order.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
}

function customer(name: string, email: string): OrderCustomer {
  const initials = name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return { name, email, initials };
}

export const ORDERS: readonly Order[] = [
  {
    id: 'ord_1001',
    number: 'SO-2026-1001',
    customer: customer('Ava Thompson', 'ava.thompson@northwind.io'),
    status: 'completed',
    channel: 'web',
    placedAt: '2026-09-02T09:14:00Z',
    lines: [
      {
        sku: 'DSK-STD-01',
        product: 'Standing desk',
        quantity: 1,
        unitPrice: 649,
      },
      {
        sku: 'CHR-ERG-02',
        product: 'Ergonomic chair',
        quantity: 1,
        unitPrice: 389,
      },
    ],
  },
  {
    id: 'ord_1002',
    number: 'SO-2026-1002',
    customer: customer('Liam Chen', 'liam.chen@fabrikam.com'),
    status: 'shipped',
    channel: 'store',
    placedAt: '2026-09-04T13:40:00Z',
    lines: [
      {
        sku: 'MON-27-4K',
        product: '27" 4K monitor',
        quantity: 2,
        unitPrice: 429,
      },
    ],
  },
  {
    id: 'ord_1003',
    number: 'SO-2026-1003',
    customer: customer('Sofia Rossi', 'sofia.rossi@contoso.com'),
    status: 'pending',
    channel: 'web',
    placedAt: '2026-09-06T08:05:00Z',
    lines: [
      {
        sku: 'KBD-MEC-01',
        product: 'Mechanical keyboard',
        quantity: 3,
        unitPrice: 129,
      },
      {
        sku: 'MSE-WL-03',
        product: 'Wireless mouse',
        quantity: 3,
        unitPrice: 59,
      },
    ],
  },
  {
    id: 'ord_1004',
    number: 'SO-2026-1004',
    customer: customer('Noah Patel', 'noah.patel@tailspin.co'),
    status: 'processing',
    channel: 'phone',
    placedAt: '2026-09-07T16:22:00Z',
    lines: [
      {
        sku: 'LMP-LED-05',
        product: 'LED desk lamp',
        quantity: 4,
        unitPrice: 79,
      },
    ],
  },
  {
    id: 'ord_1005',
    number: 'SO-2026-1005',
    customer: customer('Emma Fischer', 'emma.fischer@adatum.de'),
    status: 'cancelled',
    channel: 'web',
    placedAt: '2026-09-08T11:48:00Z',
    lines: [
      {
        sku: 'CHR-ERG-02',
        product: 'Ergonomic chair',
        quantity: 2,
        unitPrice: 389,
      },
    ],
  },
  {
    id: 'ord_1006',
    number: 'SO-2026-1006',
    customer: customer('Mateo García', 'mateo.garcia@alpineski.es'),
    status: 'completed',
    channel: 'store',
    placedAt: '2026-09-09T10:30:00Z',
    lines: [
      {
        sku: 'HDS-ANC-01',
        product: 'Noise-cancelling headset',
        quantity: 1,
        unitPrice: 249,
      },
      { sku: 'DOC-USB-C', product: 'USB-C dock', quantity: 1, unitPrice: 189 },
    ],
  },
  {
    id: 'ord_1007',
    number: 'SO-2026-1007',
    customer: customer('Yuki Tanaka', 'yuki.tanaka@woodgrove.jp'),
    status: 'refunded',
    channel: 'web',
    placedAt: '2026-09-10T07:15:00Z',
    lines: [
      {
        sku: 'MON-27-4K',
        product: '27" 4K monitor',
        quantity: 1,
        unitPrice: 429,
      },
    ],
  },
  {
    id: 'ord_1008',
    number: 'SO-2026-1008',
    customer: customer('Olivia Brown', 'olivia.brown@litware.com'),
    status: 'shipped',
    channel: 'web',
    placedAt: '2026-09-11T14:02:00Z',
    lines: [
      {
        sku: 'DSK-STD-01',
        product: 'Standing desk',
        quantity: 2,
        unitPrice: 649,
      },
    ],
  },
  {
    id: 'ord_1009',
    number: 'SO-2026-1009',
    customer: customer('Ahmed Hassan', 'ahmed.hassan@proseware.com'),
    status: 'pending',
    channel: 'phone',
    placedAt: '2026-09-12T09:55:00Z',
    lines: [
      {
        sku: 'KBD-MEC-01',
        product: 'Mechanical keyboard',
        quantity: 1,
        unitPrice: 129,
      },
    ],
  },
  {
    id: 'ord_1010',
    number: 'SO-2026-1010',
    customer: customer('Chloé Martin', 'chloe.martin@margiestravel.fr'),
    status: 'processing',
    channel: 'web',
    placedAt: '2026-09-13T12:10:00Z',
    lines: [
      {
        sku: 'LMP-LED-05',
        product: 'LED desk lamp',
        quantity: 2,
        unitPrice: 79,
      },
      {
        sku: 'MSE-WL-03',
        product: 'Wireless mouse',
        quantity: 2,
        unitPrice: 59,
      },
    ],
  },
  {
    id: 'ord_1011',
    number: 'SO-2026-1011',
    customer: customer('Daniel Kim', 'daniel.kim@wideworldimporters.kr'),
    status: 'completed',
    channel: 'store',
    placedAt: '2026-09-15T15:45:00Z',
    lines: [
      {
        sku: 'HDS-ANC-01',
        product: 'Noise-cancelling headset',
        quantity: 5,
        unitPrice: 249,
      },
    ],
  },
  {
    id: 'ord_1012',
    number: 'SO-2026-1012',
    customer: customer('Isabella Silva', 'isabella.silva@bellowscollege.br'),
    status: 'shipped',
    channel: 'web',
    placedAt: '2026-09-16T08:38:00Z',
    lines: [
      { sku: 'DOC-USB-C', product: 'USB-C dock', quantity: 3, unitPrice: 189 },
    ],
  },
  {
    id: 'ord_1013',
    number: 'SO-2026-1013',
    customer: customer('Lucas Müller', 'lucas.mueller@relecloud.at'),
    status: 'pending',
    channel: 'web',
    placedAt: '2026-09-18T17:20:00Z',
    lines: [
      {
        sku: 'CHR-ERG-02',
        product: 'Ergonomic chair',
        quantity: 1,
        unitPrice: 389,
      },
      {
        sku: 'LMP-LED-05',
        product: 'LED desk lamp',
        quantity: 1,
        unitPrice: 79,
      },
    ],
  },
  {
    id: 'ord_1014',
    number: 'SO-2026-1014',
    customer: customer('Mia Johansson', 'mia.johansson@lucernepublishing.se'),
    status: 'completed',
    channel: 'phone',
    placedAt: '2026-09-20T10:05:00Z',
    lines: [
      {
        sku: 'MON-27-4K',
        product: '27" 4K monitor',
        quantity: 1,
        unitPrice: 429,
      },
      {
        sku: 'KBD-MEC-01',
        product: 'Mechanical keyboard',
        quantity: 1,
        unitPrice: 129,
      },
      {
        sku: 'MSE-WL-03',
        product: 'Wireless mouse',
        quantity: 1,
        unitPrice: 59,
      },
    ],
  },
];
