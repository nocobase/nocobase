import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * The records of the five durable flows — processes that stop to wait for
 * the outside and are moved on by it — and the two tables of the sandbox
 * that plays that outside: the objects the simulated payment provider,
 * warehouse, vendor and carrier keep, and the webhook events they send. The
 * flows share the lifecycle log tables the first migration created.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610090001_lifecycle_example_create_durable_flows',

  async up({ builder }) {
    // An order paid on the provider's checkout, confirmed by its webhook.
    await builder.createCollection('lifecycleExampleOrders', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('title').notNull();
      table.string('customerId').notNull();
      table.bigInt('amountCents').notNull();
      // Each checkout is a new round with its own idempotency key.
      table.integer('paymentAttempt').notNull().defaultTo(0);
      table.string('paymentSessionId');
      table.string('checkoutUrl');
      table.string('paymentRef');
      table.string('refundRef');
      table.string('cancelReason');
      table.text('lastError');
      table.integer('failCheckouts').notNull().defaultTo(0);
      table.integer('failRefunds').notNull().defaultTo(0);
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
      table.index(['customerId', 'id']);
    });

    // An export a vendor produces without a webhook: polled until done.
    await builder.createCollection('lifecycleExampleExports', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('title').notNull();
      table.integer('durationSeconds').notNull();
      table.string('vendorOutcome').notNull();
      table.integer('jobAttempt').notNull().defaultTo(0);
      table.string('jobId');
      table.datetimeTz('deadlineAt');
      table.integer('pollCount').notNull().defaultTo(0);
      table.string('outputUrl');
      table.text('lastError');
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
    });

    // A purchase across two systems, undone step by step when one refuses.
    await builder.createCollection('lifecycleExamplePurchases', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('customerId').notNull();
      table.string('sku').notNull();
      table.integer('quantity').notNull();
      table.bigInt('amountCents').notNull();
      table.string('reservationId');
      table.string('paymentRef');
      table.string('cancelReason');
      table.text('lastError');
      table.boolean('declineCharge').notNull().defaultTo(false);
      table.integer('failReleases').notNull().defaultTo(0);
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
      table.index(['customerId', 'id']);
    });

    // A shipment that waits for two signals, then follows a carrier.
    await builder.createCollection('lifecycleExampleFulfilments', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('title').notNull();
      table.string('customerId').notNull();
      table.string('paymentRef');
      table.datetimeTz('paidAt');
      table.string('pickedBy');
      table.datetimeTz('pickedAt');
      table.string('trackingNumber');
      table.string('carrierStatus');
      table.string('carrierLocation');
      // When the newest carrier event applied happened, as the carrier says.
      table.datetimeTz('carrierEventAt');
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
      table.index(['customerId', 'id']);
    });

    // A subscription charged every period, with retries when a charge fails.
    await builder.createCollection('lifecycleExampleSubscriptions', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('customerId').notNull();
      table.string('plan').notNull();
      table.bigInt('priceCents').notNull();
      table.datetimeTz('currentPeriodEnd');
      table.integer('periodCount').notNull().defaultTo(0);
      table.integer('dunningCount').notNull().defaultTo(0);
      table.string('lastChargeRef');
      table.string('cancelReason');
      table.text('lastError');
      table.integer('cardDeclines').notNull().defaultTo(0);
      table.string('status').notNull();
      table.datetimeTz('statusChangedAt').notNull();
      table.integer('lifecycleVersion').notNull().defaultTo(0);
      table.datetimeTz('createdAt').notNull();
      table.index(['status', 'statusChangedAt']);
      // The renewal sweep's query: active subscriptions whose period ended.
      table.index(['status', 'currentPeriodEnd']);
      table.index(['customerId', 'id']);
    });

    // What the simulated outside systems keep: checkout sessions, charges,
    // refunds, stock and reservations, vendor jobs and shipments. A key is
    // the system's own id, derived from the idempotency key it was called
    // with, so a repeated call finds what the first one made.
    await builder.createCollection(
      'lifecycleExampleSandboxObjects',
      (table) => {
        table.bigInt('id').primary().autoIncrement().notNull();
        table.string('kind').notNull();
        table.string('key').notNull();
        table.string('status').notNull();
        table.json('data').notNull().defaultTo({});
        // Moved on by every update, which is conditioned on it.
        table.integer('version').notNull().defaultTo(0);
        table.datetimeTz('createdAt').notNull();
        table.datetimeTz('updatedAt').notNull();
        table.unique(['kind', 'key']);
      },
    );

    // The webhook events the simulated systems send, with how each delivery
    // was answered: the provider's side of the conversation, kept so a
    // person can hold an event, deliver it late, out of order or twice.
    await builder.createCollection('lifecycleExampleWebhookEvents', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('eventId').notNull();
      table.string('source').notNull();
      table.string('type').notNull();
      table.string('lifecycle').notNull();
      table.string('recordId').notNull();
      table.json('data').notNull().defaultTo({});
      table.datetimeTz('occurredAt').notNull();
      table.datetimeTz('createdAt').notNull();
      // `held` until it is delivered the first time, `delivered` after.
      table.string('status').notNull();
      table.integer('deliveries').notNull().defaultTo(0);
      table.datetimeTz('lastDeliveredAt');
      // How the last delivery was answered: applied, replayed, ignored or
      // retry; null while held.
      table.string('outcome');
      table.text('outcomeDetail');
      table.unique(['eventId']);
      table.index(['lifecycle', 'recordId', 'id']);
      table.index(['outcome', 'lastDeliveredAt']);
    });
  },

  async down({ builder }) {
    await builder.dropCollection('lifecycleExampleWebhookEvents');
    await builder.dropCollection('lifecycleExampleSandboxObjects');
    await builder.dropCollection('lifecycleExampleSubscriptions');
    await builder.dropCollection('lifecycleExampleFulfilments');
    await builder.dropCollection('lifecycleExamplePurchases');
    await builder.dropCollection('lifecycleExampleExports');
    await builder.dropCollection('lifecycleExampleOrders');
  },
});

export default migration;
