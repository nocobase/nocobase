import type { LocaleResource } from '@nocobase/i18n';
const enUS = {
  closeDialog: 'Close',
  sortTitle: 'Sort examples',
  sortIntro:
    'Run read-only sorting examples using the Repository HTTP client. Builder snippets accompany the actual serialized requests; tables preserve server response order. Queries return at most 10 roots and reuse the existing CRM and relationship seeds.',
  sortLimits:
    'Use logical field names. To-many paths require aggregates; to-one includes do not accept local sort. Cursor requires non-nullable direct scalar axes and a unique tie-break; distinct accepts only direct scalar sorting with a unique tie-break. Text and JSON cannot be sorted.',
  sortRequest: 'Actual request · JSON AST',
  sortResultHint:
    'Rows retain the server order. Relation values are selected explicitly; record previews may be shorter than aggregate counts.',
  sortExpectedError: 'Expected validation error',
  sortUnexpectedSuccess: 'This invalid query unexpectedly succeeded.',
  sort_default_title: 'Default primary-key order',
  sort_default_description:
    'Omit sort: customers are returned by primary key ascending.',
  sort_asc_title: 'Product price ascending',
  sort_asc_description:
    'Return a single ascending expression for unitPriceCents; prices are integer cents.',
  sort_desc_title: 'Product price descending',
  sort_desc_description:
    'Return a single descending expression for unitPriceCents; prices are integer cents.',
  sort_multi_title: 'Multiple fields and automatic tie-breaks',
  sort_multi_description:
    'Quantity descending, then snapshot price ascending. Equal pairs use appended ID ascending order; demo-item-3 and demo-item-7 demonstrate the tie.',
  'sort_nulls-first_title': 'NULL values first',
  'sort_nulls-first_description':
    'Nullable assigneeId ascending with NULLs first. Unassigned tasks remain visible and ID breaks ties.',
  'sort_nulls-last_title': 'NULL values last',
  'sort_nulls-last_description':
    'Nullable assigneeId ascending with NULLs last. Explicit placement avoids database-specific NULL defaults.',
  'sort_to-one_title': 'Sort through a to-one relation',
  'sort_to-one_description':
    'Assignee name descending, missing assignees last. A separate include returns the name used for sorting.',
  sort_count_title: 'Relation count and filtered selection',
  sort_count_description:
    'Rank by all orders, including count 0. paidCount selects paid orders only; its filter does not affect the root sort.',
  sort_include_title: 'Independent include order',
  sort_include_description:
    'Customers ascend by ID while each customer’s orders descend by number. The two-record limit applies per customer.',
  sort_duplicate_title: 'Rejected: duplicate sort target',
  sort_duplicate_description:
    'The same field cannot appear twice, even with different directions. Run to inspect INVALID_SORT.',
  'sort_to-many_title': 'Rejected: direct to-many field path',
  'sort_to-many_description':
    'items.quantity has multiple values per product. Use an explicit relation aggregate instead.',
  sort_sum_title: 'Relation SUM ranking',
  sort_sum_description:
    'Rank products by SUM of item quantity, descending with NULLs first. Empty relations sort as 0, although selected SUM is NULL. Metrics and item rows are selected explicitly.',
  sort_avg_title: 'Relation AVG ranking',
  sort_avg_description:
    'Rank products by AVG of item quantity, descending with NULLs first. Empty relations sort as NULL. Metrics and item rows are selected explicitly.',
  sort_min_title: 'Relation MIN ranking',
  sort_min_description:
    'Rank products by MIN of item quantity, descending with NULLs first. Empty relations sort as NULL. Metrics and item rows are selected explicitly.',
  sort_max_title: 'Relation MAX ranking',
  sort_max_description:
    'Rank products by MAX of item quantity, descending with NULLs first. Empty relations sort as NULL. Metrics and item rows are selected explicitly.',
  selectCombineTitle: 'Select combine',
  selectCombineIntro:
    'Return named record lists and scalar aggregates from the same relation with select.combine. Each example runs one read-only Repository findMany request.',
  combineScopeHint:
    'Shows the first 10 root records by ID. Relation limits apply per parent and per branch. Run the application migrations and seeds if no example records exist.',
  combineRequest: 'Request · select AST',
  combineTable: 'Data table',
  combineJson: 'Raw JSON',
  combineNoRelated: 'No related records',
  combineTableHint:
    'Columns use response field paths. Record branches appear as nested tables; NULL differs from zero and empty lists.',
  combineRun: 'Run query',
  combineResult: 'Query result',
  combineResultHint:
    'Actual response: named branches live inside each relation object.',
  combineEmpty:
    'No root records. Run the application migrations and seeds, or create example records.',
  combine_preview_title: 'Order preview and independent branches',
  combine_preview_description:
    'One order in preview, the full order count, paid count and cancelled records. The preview limit does not limit sibling branches. Customers without orders keep empty lists and zero counts.',
  combine_statistics_title: 'Item records and multiple aggregates',
  combine_statistics_description:
    'Two item rows alongside COUNT, SUM quantity and AVG/MIN/MAX snapshot unit prices in cents. AVG is unweighted; an empty relation returns count 0 and null for the other aggregates.',
  combine_nested_title: 'Nested orders, items and products',
  combine_nested_description:
    'Each customer gets an order preview and count. Each previewed order combines an item preview, count and quantity sum; item records also include their product name.',
  combine_scoped_title: 'Shared filter and branch-local filters',
  combine_scoped_description:
    'The draft task filter applies to every branch. COUNT(assigneeId) counts non-null assignees; unassigned adds assigneeId = null. The one-row preview does not change either count.',
  combine_tags_title: 'Many-to-many tag combinations',
  combine_tags_description:
    'Return each project’s linked tags, total count and Documentation count. Branch filters stay inside that project’s relation; unlinked tags are excluded.',
  apiExamples: 'Repository examples',
  labIntro:
    'Explore one relationship operation at a time. Choose a relation, prepare an independent example, then use its form and table. Each card owns its project and targets; loading this page writes nothing.',
  labOperations: 'Relationship operations',
  labBoth: 'to-one / to-many',
  labManyOnly: 'to-many only',
  labRelation: 'Relation type',
  labPrepare: 'Prepare example',
  labPrepareAgain: 'Prepare a new example',
  labRefresh: 'Refresh table',
  labPrepareHint:
    'Preparation creates a project and four private targets. New preparation preserves earlier examples. Preparation uses multiple requests; each individual write is transactional.',
  labProject: 'Example project',
  labDefaultContent: '{{operation}} example {{id}}',
  labSummary: 'Profile summary',
  labLabel: 'Tag label',
  labTitle: 'Task title',
  labPoints: 'Points',
  labTarget: 'Target record',
  labChoose: 'Choose a record',
  labNewTarget: 'Create a new target on first run',
  labNoEligible: 'No eligible target. Prepare a new example to try again.',
  labSetTargets: 'Keep these targets linked',
  labSetEmpty:
    'Uncheck all to send set: []. Removed targets remain in the target table.',
  labThroughRole: 'Role on this link (through.role)',
  labCurrentProfile: 'Current profile',
  labNoProfile: 'No profile is currently linked.',
  labDeleteHint:
    'This deletes the selected example target record. It is not a disconnect; the row below will remain as a deletion result.',
  labUpsertHint:
    'The first run can create a target; subsequent runs with that same target update it. Targets outside this relation are not eligible.',
  labExecute: 'Execute {{operation}}',
  labRequest: 'Preview this operation’s request',
  labSaved: '{{operation}} write succeeded.',
  labRefreshFailed:
    'The write succeeded, but refreshing the table failed. Use Refresh table before another write.',
  labTargets: 'Targets and relationship state',
  labTableHint:
    'Each target is read independently: disconnect/set keep targets, while delete removes them. Only this card’s targets are listed.',
  labRecord: 'Record',
  labLinked: 'Linked to this project',
  labExists: 'Target exists',
  labDeleted: 'Deleted target',
  labYes: 'Yes',
  labNo: 'No',
  labLastCall: 'Last executed request and response',
  lab_create_title: 'Create and link',
  lab_create_description:
    'Create a target through the relation. Repository fills the relationship keys. A hasOne create requires an empty relation in this example.',
  lab_connect_title: 'Link an existing target',
  lab_connect_description:
    'Choose an unlinked target prepared for this card. No target is created by connect. A hasOne target must be available.',
  lab_disconnect_title: 'Unlink and keep the target',
  lab_disconnect_description:
    'Clear a nullable hasOne link, detach a hasMany target, or remove a join-table link. The target remains.',
  lab_set_title: 'Replace the relationship set',
  lab_set_description:
    'Keep exactly the selected existing targets. Only to-many relations support set; nullable hasMany keys permit removal.',
  lab_update_title: 'Edit a linked target',
  lab_update_description:
    'Edit one target within the current relation. A to-one update uses its current target without a selector.',
  lab_upsert_title: 'Update or create in relation scope',
  lab_upsert_description:
    'Create when no matching target is linked, otherwise update it. To-many uses a stable unique ID for both lookup and creation.',
  lab_delete_title: 'Delete the target record',
  lab_delete_description:
    'Delete a linked target, subject to constraints. Use only the dedicated targets prepared for this card; shared targets can affect other relations.',
  relationMutationsTitle: 'Relationship writes',
  relationMutationsIntro:
    'Run a complete Repository HTTP relationship workflow across belongsTo, hasOne, hasMany and belongsToMany. Every button uses api.repository(name); no example-specific mutation endpoint is involved.',
  relationBaselineTitle: 'Seeded relationship baseline',
  relationBaselineDescription:
    'Deterministic records mirror the Repository relationship-write documentation while using plugin-prefixed collection names.',
  relationSeedHint:
    'Run the application migrations and seeds to create the relationship example records.',
  relationRunTitle: 'Complete mutation walkthrough',
  relationRunDescription:
    'Creates an isolated project graph, applies incremental relationship operations, then replaces its tag set. Each root mutation is transactional.',
  relationRunButton: 'Run complete relationship write',
  relationRunIsolation:
    'Each run uses new IDs, so earlier examples remain available for inspection.',
  relationResultTitle: 'Final relationship state',
  relationResultDescription:
    'The owner and profile were updated, task operations were applied in relation scope, and set retained only the selected tags.',
  relationLifetimeTitle: 'Target lifetime checks',
  relationLifetimeDescription:
    'disconnect and set remove links but keep targets; delete removes the target record.',
  relationTraceHint:
    'Actual Repository names, createOne/updateOne payloads and responses issued by this run.',
  relationOwnerLabel: 'belongsTo · owner',
  relationProfileLabel: 'hasOne · profile',
  relationTasksLabel: 'hasMany · tasks',
  relationTagsLabel: 'belongsToMany · tags',
  relationTasks: 'Related tasks',
  relationPoints: 'Points',
  relationAssignee: 'Assignee',
  relationDisconnectCheck:
    'disconnect: task exists={{exists}}, projectId={{projectId}}',
  relationDeleteCheck: 'delete: task exists={{exists}}',
  relationSetCheck: 'set: removed tag exists={{exists}}',
  findManyTitle: 'findMany: array and stream',
  findManyIntro:
    'Run the same Repository query in two consumption modes. Await resolves once with the complete array; async iteration reads framed NDJSON records as they arrive. The database query, filters, sorting and limits stay the same.',
  findManyArrayTitle: 'Await an array',
  findManyArrayDescription:
    'Awaiting findMany sends a normal JSON request and resolves with all matching records.',
  findManyStreamTitle: 'Iterate a stream',
  findManyStreamDescription:
    'Using for await sends an NDJSON request and appends each decoded record to the result table.',
  findManyProtocol: 'HTTP response',
  findManyRunArray: 'Run array query',
  findManyRunStream: 'Run stream query',
  findManyReceived: 'Records received',
  findManyReceivedCount: '{{count}} records received',
  findManyResults: 'Results',
  findManyRecordTitle: 'Title',
  findManyCategory: 'Category',
  findManyDescription: 'Description',
  findManyEmpty: 'Run this query to load the seeded example records.',
  atomicTitle: 'Atomic numeric updates',
  atomicIntro:
    'Update numbers directly in the database with increment, decrement and multiply. Requests send the operation, never a value calculated from a potentially stale browser snapshot. All signed-in users share these example counters.',
  atomicStock: 'Warehouse stock',
  atomicStockHint:
    'Receive or deduct units. Deduction checks available stock in the same update, preventing negative inventory.',
  atomicWallet: 'Account balance (cents)',
  atomicWalletHint:
    'Top up or spend integer cents. The balance condition and subtraction are evaluated together in the database.',
  atomicPoints: 'Reward points',
  atomicPointsHint:
    'Add points or double the current points using multiply: 2. Doubling uses the current database value.',
  atomicVisits: 'Visit counter',
  atomicVisitsHint:
    'Increment once, or send 10 concurrent increment: 1 requests. Other users may also change this shared counter.',
  atomicAmount: 'Amount',
  atomic_increment: 'Increase',
  atomic_decrement: 'Decrease (guarded)',
  atomic_multiply: 'Double ×2',
  atomic_concurrent: '10 concurrent +1',
  atomicSeedHint:
    'Run the application migrations and seeds to create this example counter.',
  atomicInsufficient:
    'The counter was removed, or its current value is insufficient. Nothing was deducted.',
  atomicUpdated: 'Database returned the new value: {{value}}.',
  atomicConcurrentResult:
    '{{count}} of 10 concurrent increments succeeded. The displayed value is read again from the database.',
  atomicPartial:
    'Some increments failed. Successful requests remain committed; inspect the results before retrying.',
  atomicTraceHint:
    'Actual updateOne inputs and responses, including rejected updates. No automatic retries are performed.',
  groupByExamples: 'More groupBy examples',
  groupByMinimumCount: 'Minimum rows per group (new examples)',
  groupByEmpty:
    'No groups match these filters. Reduce the minimum count or change the status.',
  groupBy_customerRanking: 'Customer order ranking',
  groupBy_customerRankingHint:
    'GROUP BY customerId · COUNT(*) · HAVING count ≥ minimum · count DESC, customerId ASC. Customers without matching orders do not form a group.',
  groupBy_customerStatus: 'Customer × order status',
  groupBy_customerStatusHint:
    'GROUP BY customerId, status. The same customer can appear in several status groups. HAVING applies to each combination, not the customer total. Enum groups preserve exact values; sorting uses count and customerId.',
  groupBy_productPrice: 'Product × item unit price',
  groupBy_productPriceHint:
    'GROUP BY productId, unitPriceCents · COUNT(*) and SUM(quantity). Different item snapshot prices remain separate even for the same product. Sort by quantity DESC, productId ASC, price ASC. Prices are cents; COUNT measures item rows, not units.',
  aggregateApply: 'Apply',
  aggregateTitle: 'Aggregate queries',
  aggregateIntro:
    'Database-side statistics over the existing orders and items: aggregate, groupBy with HAVING, and per-customer relation counts. Status filters apply to all panels; the minimum quantity applies only to product groups. The minimum row count applies to the three additional groupBy examples.',
  aggregateAll: 'All statuses',
  aggregateHaving: 'Minimum grouped quantity (HAVING)',
  aggregateMetrics: 'Item aggregates',
  aggregate_count: 'COUNT · item rows',
  aggregate_quantity: 'SUM · quantity',
  aggregate_averagePrice: 'AVG · unit price (cents)',
  aggregate_minimumPrice: 'MIN · unit price (cents)',
  aggregate_maximumPrice: 'MAX · unit price (cents)',
  aggregateSemantics:
    'Average price is the unweighted average of item unit prices, not an order total or a quantity-weighted price. Empty sets return count 0 and NULL for SUM/AVG/MIN/MAX. Panels run separate queries and may observe concurrent edits.',
  aggregateStatuses: 'Orders grouped by status · groupBy',
  aggregateCustomers: 'Customer relation aggregates',
  aggregateCustomerHint:
    'First {{count}} customers by ID, including customers with zero matching orders. Counts use the selected status.',
  aggregateProducts: 'Items grouped by product',
  aggregateTraceHint:
    'Calls the configured Repository HTTP aggregate/groupBy actions with JSON ASTs; customer counts use findMany relation selections. Expand the requests to inspect the actual expressions.',
  crm: 'CRM example',
  ordersTitle: 'Orders example',
  subtitle: 'Customers, relationships and orders, powered by Repository APIs.',
  customer: 'Customer',
  contact: 'Contact',
  product: 'Product',
  order: 'Order',
  orderItem: 'Order item',
  customers: 'Customers',
  contacts: 'Contacts',
  products: 'Products',
  orders: 'Orders',
  items: 'Order items',
  name: 'Name',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  status: 'Status',
  sku: 'SKU',
  unitPriceCents: 'Unit price (cents)',
  number: 'Order number',
  customerId: 'Customer',
  orderId: 'Order',
  productId: 'Product',
  quantity: 'Quantity',
  lead: 'Lead',
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
  confirmed: 'Confirmed',
  paid: 'Paid',
  cancelled: 'Cancelled',
  new: 'New record',
  edit: 'Edit',
  view: 'View details',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  search: 'Search by name / number / ID',
  apply: 'Search',
  refresh: 'Refresh',
  previous: 'Previous',
  next: 'Next',
  page: 'Page {{page}}',
  count: '{{count}} records',
  empty: 'No records yet. Create the first record to get started.',
  loading: 'Loading…',
  listFeedback: {
    loading: 'Loading',
    empty: 'No data yet',
    noResults: 'No results',
    forbidden: 'Access denied',
    unauthenticated: 'Session expired',
    failed: 'Unable to load list',
    refreshFailed: 'Refresh failed; showing previous data',
    retry: 'Retry',
    retrying: 'Retrying…',
    clear: 'Clear filters',
    signIn: 'Sign in',
  },
  select: 'Select a record',
  createTitle: 'Create {{entity}}',
  editTitle: 'Edit {{entity}}',
  details: 'Record details',
  relations: 'Related records',
  none: 'None',
  lookup: 'Look up by ID',
  check: 'Check and open',
  notFound: 'No record with this ID.',
  found: 'Record exists.',
  saved: 'Record saved.',
  deleted: 'Record deleted.',
  confirmDelete:
    'Delete this record? Related contacts or order items will also be removed. Customers with orders and products used by order items cannot be deleted.',
  confirm: 'Confirm deletion',
  trace: 'Repository calls',
  traceHint: 'The latest request and result show the API used by this screen.',
  error: 'The operation failed.',
  loadError: 'Unable to load records. Retry with Refresh.',
  conflict:
    'This order changed since you opened it. Refresh and reopen it before editing.',
  choicesHint:
    'Create customers and products first, then orders and their items.',
  moneyHint:
    'Prices are integer cents. Line total = quantity × unit price; no floating point currency math.',
  version: 'Version',
  addItem: 'Add item',
  removeItem: 'Remove item',
  orderTotal: 'Order total (cents)',
  noItems: 'No order items.',
  itemRow: 'Item {{number}}',
  lineTotal: 'Line total (cents)',
  id: 'ID',
  back: 'Back to list',
  close: 'Close details',
  request: 'Request',
  response: 'Response',
  loadingChoices: 'Loading related records…',
};
export type RepositoryExampleResource = LocaleResource<typeof enUS>;
export default enUS;
