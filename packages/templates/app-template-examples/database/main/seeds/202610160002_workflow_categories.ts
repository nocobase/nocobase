import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202610160002_workflow_categories',
  async run(context) {
    const client = await context.connection.client<{
      schema: { hasTable(name: string): Promise<boolean> };
    }>();
    if (
      !(await client.schema.hasTable('lifecycle_example_workflow_categories'))
    )
      return;
    const categories = context.repository('lifecycleExampleWorkflowCategories');
    const catalog = context.repository('lifecycleExampleWorkflowCatalog');
    const defaults = [
      {
        id: 'finance',
        title: 'Finance',
        names: ['lifecycle.expenses', 'lifecycle.invoices'],
      },
      {
        id: 'commerce',
        title: 'Commerce',
        names: [
          'lifecycle.orders',
          'lifecycle.purchases',
          'lifecycle.fulfilments',
          'lifecycle.subscriptions',
        ],
      },
      {
        id: 'service',
        title: 'Service operations',
        names: ['lifecycle.tickets', 'lifecycle.exports'],
      },
      {
        id: 'office',
        title: 'Office operations',
        names: [
          'office.dataRequests',
          'office.extractions',
          'office.incoming',
          'office.clerkTasks',
          'office.teamTasks',
          'office.executorTasks',
        ],
      },
    ];
    for (const [sortOrder, category] of defaults.entries()) {
      // Preserve administrator edits, including deliberately uncategorized workflows.
      if (!(await categories.findOne({ filter: { id: category.id } })))
        await categories.createOne({
          values: { id: category.id, title: category.title, sortOrder },
        });
      for (const id of category.names)
        if (!(await catalog.findOne({ filter: { id } })))
          await catalog.createOne({ values: { id, categoryId: category.id } });
    }
  },
});
