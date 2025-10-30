**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Details**

- `filter`: Specifies the filter conditions for the records to be deleted. For detailed usage of Filter, please refer to the [`find()`](#find) method.
- `filterByTk`: Specifies the filter conditions for the records to be deleted by TargetKey.
- `truncate`: Whether to truncate the collection data. This is effective only when the `filter` or `filterByTk` parameters are not provided.
- `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.