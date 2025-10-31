# Permission Control

In NocoBase, **permission control** can be configured through the interface or flexibly defined in code.

## Interface Configuration
In the "Roles & Permissions" panel, you can set action permissions for configurable Collections.

## Code Configuration
Permissions can be configured in code.

### 1. Custom Action Permission
Use a custom `Condition` to restrict access to a specific resource and action:

```ts
this.app.acl.allow(resource, action, condition);
```

### 2. Custom Permission Snippet
You can register frequently used permission combinations as snippets, which can be quickly applied after being bound to a role:

```ts
this.app.acl.registerSnippet({
  name: 'pm',
  actions: ['pm:*'],
});
```

### 3. Custom Configurable Action
If you need to make certain custom actions configurable in the interface, you can register them using `setAvailableAction`:

```ts
this.app.acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}',
  type: 'new-data',
  onNewRecord: true,
})
```