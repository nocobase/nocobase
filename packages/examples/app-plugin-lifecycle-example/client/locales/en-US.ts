import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  navigation: {
    group: 'Workflow',
    tickets: 'Help desk',
    expenses: 'Expense reports',
    orders: 'Order payment',
    exports: 'Data exports',
    purchases: 'Flash sale',
    fulfilments: 'Shipping',
    subscriptions: 'Subscriptions',
  },
  identity: { label: 'Signed in as' },
  roles: {
    agent: 'Support agents',
    customer: 'Customers',
    applicant: 'Employees',
    manager: 'Managers',
    director: 'Executives',
    finance: 'Finance',
  },
  common: {
    signedInUser: 'Signed-in user',
    system: 'System',
    unassigned: 'Unassigned',
    loading: 'Loading…',
    cancel: 'Cancel',
    close: 'Close',
    demoOptions: 'Demo options',
  },
  tickets: {
    title: 'Help desk',
    agentDescription:
      'Take new tickets, reply to customers and resolve them. A ticket waiting on the customer closes itself when they stay silent, and a customer reply brings it back to its assignee.',
    customerDescription:
      'Ask the support team for help and follow the conversation. A closed ticket can be reopened for {{days}} days.',
    queue: 'Ticket queue',
    mine: 'My tickets',
    newTicket: 'New ticket',
    empty: 'No tickets here.',
    pick: 'Pick a ticket to read the conversation.',
    filters: {
      all: 'All',
      new: 'New',
      open: 'Open',
      awaitingCustomer: 'Waiting',
      closed: 'Closed',
    },
    form: {
      title: 'Contact support',
      subject: 'Subject',
      subjectPlaceholder: 'Summarize the problem in a sentence',
      category: 'Category',
      priority: 'Priority',
      description: 'Description',
      descriptionPlaceholder:
        'What happened, what you expected, and the steps to reproduce it',
      failNotifications: 'Email deliveries that fail on purpose',
      failHint:
        'Each reply to this ticket emails you. Make the first attempts fail to watch the effect retry.',
      submit: 'Submit ticket',
    },
    categories: {
      account: 'Account & sign-in',
      billing: 'Billing',
      howto: 'How do I…',
      incident: 'Something is broken',
    },
    priorities: {
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
    },
    meta: {
      customer: 'Customer',
      category: 'Category',
      priority: 'Priority',
      assignee: 'Assignee',
      created: 'Created',
    },
    banner: {
      new: 'Waiting for an agent to take it.',
      open: '{{assignee}} is working on it.',
      awaiting:
        'Waiting for the customer. Closes automatically in {{time}} without a reply.',
      overdue: 'The wait is over; the next sweep closes it.',
      resolved: 'Resolved by support.',
      timeout: 'Closed automatically: the customer did not reply in time.',
      reopenUntil: 'You can reopen it until {{date}}.',
      reopenExpired: 'It can no longer be reopened; please open a new ticket.',
    },
    thread: {
      wrote: '{{name}} · {{time}}',
      accept: '{{actor}} took the ticket',
      resolve: '{{actor}} marked it resolved',
      autoClose: 'Closed automatically after waiting {{minutes}} minutes',
      reopen: '{{actor}} reopened the ticket',
      delivery: {
        queued: 'Email to customer queued',
        running: 'Sending email to customer…',
        succeeded: 'Emailed to customer',
        failed: 'Email failed after {{attempts}} attempts: {{error}}',
        retrying: 'Email attempt {{attempts}} failed, retrying: {{error}}',
      },
    },
    composer: {
      agentPlaceholder: 'Reply to the customer…',
      customerPlaceholder: 'Add a reply…',
      reopenPlaceholder: 'Tell us what is still wrong…',
      reply: 'Send reply',
      accept: 'Take ticket',
      resolve: 'Mark resolved',
      customerReply: 'Send',
      reopen: 'Reopen',
      nothing: 'Nothing for you to do on this ticket right now.',
    },
  },
  expenses: {
    title: 'Expense reports',
    applicantDescription:
      'Claim business expenses. Up to {{auto}} is approved automatically; above that your manager approves, and above {{finance}} the finance director too.',
    approverDescription:
      'Reports waiting for your approval. A report you leave for {{minutes}} minutes passes to your own manager.',
    finalApproverDescription: 'Reports waiting for your approval.',
    mine: 'My reports',
    approvals: 'Waiting for me',
    newReport: 'New report',
    empty: 'No reports here.',
    emptyApprovals: 'Nothing is waiting for your approval.',
    pick: 'Pick a report to see it.',
    number: 'Report {{id}}',
    editor: {
      title: 'Purpose',
      titlePlaceholder: 'For example: Shanghai trade show, October',
      purpose: 'Details',
      purposePlaceholder: 'Who went, why, and anything an approver should know',
      items: 'Expenses',
      date: 'Date',
      category: 'Category',
      description: 'Description',
      amount: 'Amount (¥)',
      addItem: 'Add expense',
      removeItem: 'Remove',
      total: 'Total',
      failPayments: 'Payment attempts that fail on purpose',
      failHint:
        'An approved report is paid by an effect. Make the first attempts fail to watch it retry.',
      save: 'Save draft',
      saved: 'Saved.',
      submit: 'Submit for approval',
      resubmit: 'Resubmit',
    },
    categories: {
      transport: 'Transport',
      lodging: 'Lodging',
      meals: 'Meals',
      office: 'Office supplies',
      entertainment: 'Client entertainment',
      other: 'Other',
    },
    steps: {
      submit: 'Submitted',
      manager: 'Manager',
      finance: 'Finance',
      payment: 'Paid',
    },
    meta: {
      applicant: 'Applicant',
      approver: 'Waiting for',
      created: 'Created',
      paymentRef: 'Payment reference',
      total: 'Total',
    },
    banner: {
      draft: 'Draft. Only you can see it until you submit it.',
      awaiting:
        'Waiting for {{approver}}. Passes to their manager in {{time}} without a decision.',
      awaitingFinal: 'Waiting for {{approver}}.',
      overdue: 'The wait is over; the next sweep passes it on.',
      needsInfo: '{{actor}} sent it back: {{reason}}',
      rejected: '{{actor}} rejected it: {{reason}}',
      approved: 'Approved. Payment is on its way.',
      paymentRetrying:
        'Payment attempt {{attempts}} failed, retrying: {{error}}',
      paymentFailed:
        'Payment failed after {{attempts}} attempts: {{error}}. Finance will follow up.',
      paid: 'Paid. Reference {{ref}}.',
    },
    timeline: {
      title: 'Approval history',
      empty: 'Not submitted yet.',
      autoApproved: 'Within {{limit}}: approved automatically',
      escalated: 'No decision in time; passed to the next manager up',
      paid: 'Payment completed',
    },
    decision: {
      title: 'Your decision',
      placeholder: 'Comment (required to send back or reject)',
      approve: 'Approve',
      requestInfo: 'Send back',
      reject: 'Reject',
    },
    withdraw: 'Withdraw',
  },
  flows: {
    customer: 'Customer',
    final: 'This one is finished; nothing moves it any more.',
    process: 'Process',
    legend:
      'The record’s state is filled, the states it went through are outlined. ⚙ only the server fires it, ⏱ a trigger fires it, ✓/✗ an effect’s success or failure continues with it.',
    nothing: 'Nothing for you to do here right now; it waits for the outside.',
  },
  webhooks: {
    title: 'Webhooks',
    hint: 'What the sandbox sent, held or delivered, and how each delivery was answered. Deliver one again to see a replay, or held ones in another order.',
    empty: 'No webhooks yet.',
    hold: 'Hold the webhook',
    deliver: 'Deliver',
    deliverAgain: 'Deliver again',
    deliveries_one: 'delivered {{count}} time',
    deliveries_other: 'delivered {{count}} times',
    occurred: 'Happened {{time}}',
    outcomes: {
      applied: 'Applied',
      replayed: 'Replayed',
      ignored: 'Ignored',
      retry: 'Will retry',
      held: 'Held',
    },
  },
  orders: {
    title: 'Order payment',
    list: 'Orders',
    new: 'New order',
    empty: 'No orders here.',
    pick: 'Pick an order to see where its payment stands.',
    shows:
      'The payment is confirmed by the provider’s webhook, not by the page: the order waits as a state, and the webhook — however late, early or often it arrives — moves it on exactly once. A payment arriving after the order was cancelled is refunded.',
    description:
      'Customers pay on the payment provider’s hosted checkout; the order moves on when the provider’s webhook arrives. An unpaid order closes after {{minutes}} minutes.',
    nothing: 'Nothing for you to do: the order waits for the payment provider.',
    actions: {
      checkout: 'Pay',
      cancel: 'Cancel order',
      ship: 'Ship',
      refundOrder: 'Refund',
      retryRefund: 'Retry refund',
    },
    form: {
      title: 'Place an order',
      item: 'Item',
      amount: 'Amount (¥)',
      failCheckouts: 'Checkout attempts that fail on purpose',
      failRefunds: 'Refund attempts that fail on purpose',
      failHint:
        'Opening the checkout and refunding are effects with retries; make them fail to watch the retries and where the order stops.',
      submit: 'Place order',
    },
    fields: {
      customer: 'Customer',
      amount: 'Amount',
      attempt: 'Payment round',
      session: 'Checkout session',
      paymentRef: 'Payment',
      refundRef: 'Refund',
    },
    banner: {
      draft: 'Not paid yet.',
      creatingCheckout: 'Opening the provider’s checkout…',
      awaitingPayment:
        'Waiting for the payment provider. Closes in {{time}} if it does not pay.',
      overdue: 'The window is over; the next sweep closes it.',
      paymentFailed: '{{error}} Pay again, or it closes in {{time}}.',
      paid: 'Paid, ready to ship.',
      cancelled: {
        customer: 'Cancelled by the customer.',
        timeout: 'Closed: not paid in time.',
        refundRequested: 'Refunded at the customer’s request.',
      },
      refunding: 'Refunding…',
      refundNeedsAttention:
        'The refund failed: {{error}} It waits for someone to retry it.',
      refunded: 'Refunded.',
      fulfilled: 'Paid and shipped.',
    },
    sessionStatus: {
      open: 'open',
      paid: 'paid',
      declined: 'declined',
      expired: 'expired',
    },
    outside: {
      title: 'Payment provider (sandbox)',
      description:
        'Plays the customer on the provider’s checkout, and the provider sending its webhook. Hold a webhook to deliver it late, twice, or after cancelling.',
      checkout: 'Hosted checkout',
      session: 'Session {{id}}: {{status}}.',
      noSession: 'No checkout is open; the customer pays first.',
      pay: 'Pay',
      decline: 'Decline the card',
      tryThis:
        'Try: hold the webhook, pay, cancel the order, then deliver the held webhook — the money arrives after the cancellation and is refunded.',
    },
  },
  exports: {
    title: 'Data exports',
    list: 'Exports',
    new: 'New export',
    empty: 'No exports here.',
    pick: 'Pick an export to watch it being polled.',
    shows:
      'The vendor has no webhook, so the lifecycle asks: a trigger fires a self-transition every few seconds, and entering the state again polls the vendor. A deadline fixed on the record ends the wait.',
    description:
      'The vendor renders exports slowly and calls nobody back, so each export polls it every {{seconds}} seconds and gives up after {{minutes}} minutes.',
    nothing: 'Nothing for you to do: the export is polling the vendor.',
    actions: {
      submit: 'Start export',
      retry: 'Export again',
      cancel: 'Cancel',
    },
    outcomes: {
      success: 'succeeds',
      failure: 'fails',
      stuck: 'gets stuck at 60%',
    },
    jobStatus: {
      running: 'running',
      succeeded: 'done',
      failed: 'failed',
      cancelled: 'cancelled',
    },
    form: {
      title: 'Request an export',
      name: 'Name',
      duration: 'Vendor takes (seconds)',
      outcome: 'The vendor’s job',
      hint: 'A stuck job never finishes: the export times out at its deadline and stops the job.',
      submit: 'Create',
    },
    fields: {
      vendor: 'Vendor',
      vendorValue: '{{seconds}} s, {{outcome}}',
      job: 'Vendor job',
      polls: 'Polls',
      deadline: 'Deadline',
    },
    banner: {
      draft: 'Not started.',
      starting: 'Submitting the job to the vendor…',
      processing: 'The vendor is working on it. Gives up in {{time}}.',
      done: 'Ready: {{url}}',
      failed: 'Failed: {{error}}',
      timedOut:
        'The vendor did not finish before the deadline; its job was stopped.',
      cancelled: 'Cancelled.',
    },
    outside: {
      title: 'Vendor (sandbox)',
      description:
        'What the export knows about the vendor’s job: only what its last poll saw. The vendor sends no webhook, so nothing else can.',
      lifecycleSide: 'What the export knows',
      lifecycleHint:
        'Job {{id}}, as the last poll saw it; the next poll brings it up to date.',
      lastPoll: 'Last poll saw {{status}}, {{progress}}% ({{count}} polls).',
      noPoll: 'Not polled yet.',
      nextPoll: 'Next poll in about {{time}}.',
      pollDue: 'The next sweep polls it.',
      noJob: 'No job at the vendor yet.',
    },
  },
  purchases: {
    title: 'Flash sale',
    list: 'Purchases',
    new: 'New purchase',
    empty: 'No purchases here.',
    pick: 'Pick a purchase to follow its steps.',
    shows:
      'A purchase spans two systems that a database rollback cannot undo. Each step is a state with one effect, and when the charge is refused the reservation is undone by a step of its own — so what is still owed is always the record’s state.',
    description:
      'The warehouse holds the units, then the payment provider takes the money. When the card is declined the units are given back by a compensating step; a compensation that keeps failing stops and waits for a person.',
    nothing: 'Nothing for you to do: the purchase is running its steps.',
    actions: {
      submit: 'Place order',
      abandon: 'Discard',
      retryRelease: 'Retry the release',
    },
    items: {
      headphones: 'Headphones',
      keyboard: 'Mechanical keyboard',
      lamp: 'Desk lamp',
    },
    form: {
      title: 'Buy in the flash sale',
      item: 'Item',
      quantity: 'Quantity',
      total: 'Total {{total}}',
      declineCharge: 'The card is declined',
      failReleases: 'Stock releases that fail on purpose',
      failHint:
        'Decline the card to watch the compensation; make the release fail 3 times or more to watch it stop and wait for a person.',
      submit: 'Create',
    },
    fields: {
      customer: 'Customer',
      amount: 'Amount',
      reservation: 'Reservation',
      paymentRef: 'Payment',
    },
    banner: {
      draft: 'Not placed yet.',
      reserving: 'Reserving the units…',
      charging: 'Units held; charging the card…',
      releasing: 'The charge failed ({{error}}); giving the units back…',
      compensationNeedsAttention:
        'The units could not be given back: {{error}} It waits for someone to retry the release.',
      confirmed: 'Confirmed: units reserved and paid.',
      cancelled: {
        customer: 'Discarded.',
        outOfStock: 'Cancelled: {{error}}',
        paymentDeclined:
          'Cancelled: the card was declined, and the units were given back.',
      },
    },
    outside: {
      title: 'Warehouse and payment provider (sandbox)',
      description:
        'Each step is an effect on a system outside the application; the undo is a step too.',
      steps: 'Steps',
      stepsHint: 'The last run of each step’s effect.',
      reserve: 'Reserve stock',
      charge: 'Charge the card',
      release: 'Release stock (compensation)',
      notYet: 'Not run',
      stock: 'Warehouse stock',
      stockHint: 'Watch the units leave and come back.',
      item: 'Item',
      available: 'Available',
      reserved: 'Reserved',
    },
  },
  fulfilments: {
    title: 'Shipping',
    list: 'Shipments',
    new: 'New shipment',
    empty: 'No shipments here.',
    pick: 'Pick a shipment to play its payment, warehouse and carrier.',
    shows:
      'A shipment waits for two signals from two systems in whichever order they come, then follows the carrier’s events — applied by when they happened, not when they arrived.',
    description:
      'A shipment leaves once the payment is captured and the warehouse has picked it, in either order. The carrier’s webhooks then arrive late and out of order; only a newer event moves it.',
    nothing: 'Nothing for you to do: the shipment waits for the outside.',
    actions: {
      ship: 'Hand to carrier',
      cancel: 'Cancel shipment',
    },
    signals: {
      payment: 'payment captured',
      pick: 'warehouse picked',
    },
    and: ' and ',
    carrier: {
      booked: 'Booked',
      pickedUp: 'Picked up',
      inTransit: 'In transit',
      outForDelivery: 'Out for delivery',
      delivered: 'Delivered',
      exception: 'Exception',
    },
    form: {
      title: 'Open a shipment',
      name: 'Name',
      customer: 'Customer',
      submit: 'Create',
    },
    fields: {
      customer: 'Customer',
      paid: 'Payment captured',
      picked: 'Picked',
      tracking: 'Tracking number',
      carrier: 'Carrier says',
      carrierAt: 'As of',
    },
    banner: {
      preparing: 'Waiting for: {{waiting}}.',
      readyToShip: 'Paid and picked: ready to hand to the carrier.',
      booking: 'Booking the carrier…',
      shipped: 'On its way.',
      exception: 'The carrier reported a problem; a newer event clears it.',
      delivered: 'Delivered.',
      cancelled: 'Cancelled.',
    },
    outside: {
      title: 'Payment provider, warehouse and carrier (sandbox)',
      description:
        'Send each system’s webhook, now or held. Deliver held ones in another order to see which apply.',
      signals: 'Two signals',
      signalsHint: 'Either may come first; the second moves the shipment on.',
      capture: 'Payment captured',
      pick: 'Warehouse picked',
      carrierTitle: 'Carrier',
      carrierHint: 'Events about the parcel, each with the time it happened.',
      status: 'Status',
      location: 'Location',
      offset: 'Minutes from now',
      send: 'Send',
      offsetHint:
        'The last field shifts when the scan happened: a negative number reports an older scan.',
      scramble: 'Hold three scans to deliver in any order',
    },
  },
  subscriptions: {
    title: 'Subscriptions',
    list: 'Subscriptions',
    new: 'Subscribe',
    empty: 'No subscriptions here.',
    pick: 'Pick a subscription to follow its billing.',
    shows:
      'A subscription moves round active → charging → active once a period, for as long as it lives. The renewal is due at the subscription’s own period end, which the sweep finds; a declined card is retried by a trigger until it gives up.',
    description:
      'Charged every {{period}} minutes. A declined charge is retried every {{dunning}} minute(s); after {{tries}} tries the subscription is cancelled.',
    nothing: 'Nothing for you to do: billing runs on its own.',
    actions: {
      updateCard: 'Update card',
      cancel: 'Unsubscribe',
    },
    plans: {
      basic: 'Basic',
      pro: 'Pro',
    },
    periodN_one: '{{count}} period',
    periodN_other: '{{count}} periods',
    form: {
      title: 'Subscribe',
      plan: 'Plan',
      charge: '{{price}} is charged now and at the start of every period.',
      cardDeclines: 'Charges the card declines',
      failHint:
        'Declines are answers, not outages: the charge is not retried at once but by the dunning trigger, under a new key.',
      submit: 'Subscribe',
    },
    fields: {
      customer: 'Customer',
      periods: 'Periods paid',
      periodEnd: 'Period ends',
      dunning: 'Failed tries',
      lastCharge: 'Last charge',
      card: 'Card',
      cardWorks: 'Works',
      cardValue_one: 'declines the next charge',
      cardValue_other: 'declines the next {{count}} charges',
    },
    banner: {
      renewing: 'Charging the card…',
      active: 'Active. Renews in {{time}}.',
      due: 'The period has ended; the next sweep renews it.',
      pastDue: '{{error}} Try {{tries}} of {{max}}; next try in {{time}}.',
      cancelled: {
        customer: 'Unsubscribed.',
        unpaid: 'Cancelled: the card kept being declined.',
      },
    },
    outside: {
      title: 'Billing (sandbox)',
      description:
        'Every charge is a run of the charge effect, keyed by the period and the try.',
      charges: 'Charges',
      chargesHint: 'Oldest first.',
      noCharges: 'No charges yet.',
      sweep: 'Renewal sweep',
      sweepHint:
        'Renewals are found by the sweep at each subscription’s period end; it runs every 10 seconds, or now.',
    },
  },
  guide: {
    title: 'About this example',
    show: 'Show',
    hide: 'Hide',
    purpose: 'What it shows',
    howTo: 'How to try it',
    samples:
      'The sample records load when the application is installed with sample data (APP_SAMPLE_DATA=true). On a database installed without them, run “pnpm nocobase db sample”.',
    tickets: {
      purpose:
        'A ticket keeps where it stands in its own status field, and every change — accept, reply, resolve, reopen — is a transition declared in source. The conversation is the transition log: each message is the input of the transition it caused. Emails run as effects after the transition commits, with retries, and a ticket left waiting on its customer is closed by a trigger.',
      step1:
        'Use “Signed in as” at the top right to switch between the support agents and the customers. Agents see the whole queue; a customer sees only their own tickets.',
      step2:
        'As an agent, open the new ticket “无法登录管理后台” and reply. It now waits on the customer, and closes itself after a couple of minutes of silence; the triggers are swept every 10 seconds.',
      step3:
        'Switch to 王女士 and reply to a ticket waiting on her: it goes back to its agent. A closed ticket can be reopened by its customer for 7 days — try it as 李先生 on “如何导出本月的订单报表？”.',
      step4:
        'File a ticket as a customer with “Email deliveries that fail on purpose” set under Demo options, then reply to it as an agent: “Under the hood” shows the email effect failing and retrying.',
    },
    expenses: {
      purpose:
        'An expense report is routed by its amount: up to ¥5,000 it is approved automatically, above that the applicant’s manager approves, and above ¥50,000 the finance director as well. Approvers approve, send back or reject with a reason, an idle manager is passed over by a trigger, and an approved report is paid by an effect that then marks it paid.',
      step1:
        'Use “Signed in as” to play the employees 林晓 and 何东, their managers, the executive and the finance director. An employee sees their own reports; an approver sees what waits for them.',
      step2:
        'As 林晓, submit the draft “杭州客户拜访” (¥872): it is approved automatically and paid a moment later. “Under the hood” shows the payment effect and the “paid” transition it fired.',
      step3:
        'Switch to 赵静, the finance director, and approve “法兰克福展会参展”, which 陈明 has already approved: above ¥50,000 it needs both.',
      step4:
        'As 何东, resubmit “北京客户现场支持”, which was sent back for more information, then approve it as 孙磊. A report left with a manager for 3 minutes escalates to the manager’s manager.',
      step5:
        'Under “Under the hood”, “What the current identity can do” gives the reason for every action the current person may not take. Open a waiting report in two windows and act in both: the second is refused because the version it saw is stale.',
    },
    orders: {
      purpose:
        'An order is marked paid only by the payment provider’s webhook, never by the page. While it waits it is only a state on the record — no timer, no open request — and a webhook that arrives late, early or twice still moves it exactly once. Money that arrives after the order was cancelled is refunded.',
      step1:
        'Open the sample order “降噪耳机 × 1” and click “Pay”: an effect opens the provider’s hosted checkout, and the order waits for payment.',
      step2:
        'In the dashed “Payment provider (sandbox)” card, pay or decline the card. The webhook the provider sends is what moves the order; “Deliver again” is answered Replayed.',
      step3:
        'Tick “Hold the webhook”, pay, click “Cancel order”, then deliver the held webhook: the payment lands after the cancellation and is refunded.',
      step4:
        'The sample “机械键盘 × 1” fails its first checkout on purpose, to show the effect retrying. An order left unpaid expires after 3 minutes.',
    },
    exports: {
      purpose:
        'The vendor sends no webhook, so the export polls it: a trigger fires the self-transition “poll”, re-entering “processing” runs the check, and the deadline written on the record decides when to give up.',
      step1:
        'Open “9 月订单明细” and click “Start export”. The vendor takes 30 seconds; watch “What the vendor knows” run ahead of what the export knows until the next poll.',
      step2:
        'Start “全年客户名单”, whose vendor job gets stuck: at the deadline the export times out and stops the vendor’s job. “Export again” starts a new round.',
      step3:
        'Under “Under the hood”, every poll is a transition in the log and every check an effect run.',
    },
    purchases: {
      purpose:
        'A flash-sale purchase spans two systems: the warehouse reserves the stock, then the payment provider charges the card. When the charge is declined, the reservation is undone by a compensating step of its own; a compensation that keeps failing stops in a state a person retries.',
      step1:
        'Open the sample purchase of two lamps and click “Place order”: the units are reserved, the card is charged, and the purchase completes.',
      step2:
        'Place the sample keyboard purchase, whose card is declined, and watch the unit leave “Warehouse stock” and come back.',
      step3:
        'Create a purchase with the card declined and “Stock releases that fail on purpose” set to 3: the release stops and waits for “Retry the release”.',
    },
    fulfilments: {
      purpose:
        'A shipment waits for two signals from two systems — the payment captured and the warehouse’s pick — in whichever order they come, then follows the carrier. Carrier events are applied by when they happened, not when they arrived, and an older one is refused as stale.',
      step1:
        'Open the sample shipment and send “Warehouse picked” and “Payment captured” in either order: the second moves it to ready to ship.',
      step2:
        'Click “Hand to carrier”, then send the carrier’s scans, each with a status and a location.',
      step3:
        'Tick “Hold three scans to deliver in any order” and deliver the latest scan first: the earlier ones are ignored as stale.',
      step4:
        'A negative “Minutes from now” reports a scan that happened earlier, which is what a late event looks like.',
    },
    subscriptions: {
      purpose:
        'A subscription is charged at the start of every period for as long as it lives. The plugin’s sweep renews each one at its own period end, and a declined charge is retried by the dunning trigger, under a new key, until it recovers or the subscription is cancelled.',
      step1:
        'Click “Subscribe” and pick a plan: the first charge runs at once. There is no sample subscription, because creating one charges the card.',
      step2:
        'Subscribe with “Charges the card declines” set to 1: it goes past due, is retried a minute later and recovers. “Update card” recovers it at once.',
      step3:
        'A period lasts 3 minutes; “Run triggers now” under “Renewal sweep” renews whatever is due without waiting for the next sweep.',
    },
  },
  blockers: {
    agentOnly: 'Only a support agent can work on tickets.',
    requesterOnly: 'Only the customer who filed the ticket can do this.',
    systemOnly: 'The system does this on its own once the wait has passed.',
    reopenExpired: 'Closed too long ago to reopen; file a new ticket instead.',
    applicantOnly: 'Only the applicant can do this with their report.',
    approverOnly: 'Only the current approver can decide on this report.',
    topApprover: 'The current approver is already the highest level.',
    customersOnly: 'Only a customer can file a ticket, for themselves.',
    applicantsOnly:
      'Only an employee can file an expense report, for themselves.',
    alreadyPaid: 'The payment has already been confirmed.',
    alreadyPicked: 'The warehouse has already picked it.',
    staleCarrierEvent: 'A newer carrier event has already been applied.',
    periodNotOver: 'The current period has not ended yet.',
  },
  problems: {
    message: 'Write a message.',
    reason: 'Give a reason.',
    subject: 'Give the ticket a subject.',
    description: 'Describe the problem.',
    category: 'Choose a category.',
    priority: 'Choose a priority.',
    title: 'Give it a name.',
    amountCents: 'The amount must be more than 0.',
    durationSeconds: 'The vendor takes between 5 and 600 seconds.',
    vendorOutcome: 'Choose how the job ends.',
    sku: 'Choose an item.',
    quantity: 'Buy between 1 and 5.',
    plan: 'Choose a plan.',
    customerId: 'Choose the customer.',
  },
  errors: {
    EXPENSE_NOT_FOUND: 'The expense report does not exist.',
    OWN_EXPENSE_ONLY: 'Only the applicant can edit this report.',
    EXPENSE_LOCKED:
      'A report under review cannot be edited; withdraw it first.',
    EXPENSE_CHANGED:
      'The report changed while you were editing it; reload it and try again.',
    SANDBOX_SESSION_CLOSED: 'The checkout is no longer open.',
    SANDBOX_NOT_FOUND: 'The sandbox has no such object.',
    UNKNOWN_WEBHOOK_EVENT: 'The sandbox does not send that event.',
    WEBHOOK_EVENT_NOT_FOUND: 'No such webhook event.',
  },
  lifecycle: {
    title: 'Under the hood',
    hint: 'What the lifecycle recorded for this record. A real application would not show this to its users.',
    available: 'What the current identity can do',
    final: 'No transition leaves this state.',
    diagram: 'Diagram (Mermaid)',
    diagramHint:
      'toMermaid(describe()) draws the lifecycle as a state diagram; paste it into any Mermaid renderer.',
    retry: 'Retry',
    cancel: 'Cancel',
    continue: 'Continue',
    continuationWaits: '{{transition}} waits: {{error}}',
    continuationAbandoned:
      '{{transition}} given up after {{attempts}} tries, until continued by hand: {{error}}',
    states: 'States',
    parameters: 'Parameters',
    transitions: 'Transition log',
    effects: 'Effect runs',
    noTransitions: 'No transitions yet.',
    noEffects: 'No effects yet.',
    attempts: '{{attempts}}/{{max}}',
    runTriggers: 'Run triggers now',
    sweepNote:
      'Triggers are swept every 10 seconds anyway; this runs the sweep immediately.',
    swept_one: 'The sweep fired {{count}} transition.',
    swept_other: 'The sweep fired {{count}} transitions.',
    columns: {
      time: 'Time',
      transition: 'Transition',
      change: 'Change',
      actor: 'By',
      input: 'Input',
      effect: 'Effect',
      status: 'Status',
      attempts: 'Attempts',
      error: 'Last error',
    },
  },
  states: {
    new: 'New',
    open: 'Open',
    awaitingCustomer: 'Waiting on customer',
    closed: 'Closed',
    draft: 'Draft',
    awaitingManager: 'Awaiting manager',
    awaitingFinance: 'Awaiting finance',
    needsInfo: 'Sent back',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
    creatingCheckout: 'Opening checkout',
    awaitingPayment: 'Awaiting payment',
    paymentFailed: 'Payment failed',
    cancelled: 'Cancelled',
    refunding: 'Refunding',
    refundNeedsAttention: 'Refund needs attention',
    refunded: 'Refunded',
    fulfilled: 'Shipped',
    starting: 'Starting',
    processing: 'Processing',
    done: 'Done',
    failed: 'Failed',
    timedOut: 'Timed out',
    reserving: 'Reserving stock',
    charging: 'Charging',
    releasing: 'Releasing stock',
    compensationNeedsAttention: 'Compensation stuck',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    readyToShip: 'Ready to ship',
    booking: 'Booking carrier',
    shipped: 'In transit',
    exception: 'Carrier exception',
    delivered: 'Delivered',
    renewing: 'Charging',
    active: 'Active',
    pastDue: 'Past due',
  },
  transitions: {
    create: 'Created',
    accept: 'Take',
    reply: 'Reply',
    customerReply: 'Customer reply',
    resolve: 'Resolve',
    autoClose: 'Close automatically',
    reopen: 'Reopen',
    submit: 'Submit',
    approve: 'Approve',
    reject: 'Reject',
    requestInfo: 'Send back',
    resubmit: 'Resubmit',
    withdraw: 'Withdraw',
    escalate: 'Escalate',
    paid: 'Mark paid',
  },
  runs: {
    queued: 'Queued',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    dead: 'Gave up',
    cancelled: 'Cancelled',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type LifecycleExampleResource = LocaleResource<typeof enUS>;

export default enUS;
