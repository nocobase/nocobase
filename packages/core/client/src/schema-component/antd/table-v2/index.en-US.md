# TableV2

`TableV2` is a wrapper component for the `antd` table component.

## With Collection

We need to use `TableBlockProvider` to pass down the configuration and data of the table. `useTableBlockProps` passes the data and props to the `Table` component, and `CollectionField` dynamically reads the configuration of the data table and renders the table columns based on the configuration.

`TableBlockProvider` is a secondary wrapper for `DataBlockProvider`, and its properties can be referred to in [DataBlockProvider](/core/data-block/data-block-provider#property-details). `CollectionField` automatically looks up the configuration of the corresponding data table based on the `field.name` and renders the corresponding table columns. For more information about `CollectionField`, please refer to [CollectionField](/core/data-source/collection-field).

<code src="./demos/new-demos/collection.tsx"></code>

## Extends Collection

If the Collection is not created through the DataSource Manager but is custom extended, you can refer to [ExtendCollectionsProvider](/core/data-source/extend-collections-provider).

<code src="./demos/new-demos/extend-collection.tsx"></code>

## With ActionToolbar

We can combine [ActionToolbar](/components/action#actionbar) to implement the operation bar of the table, such as adding, refreshing, filtering, and batch deletion.

- Refresh button: can be directly used with the built-in `useRefreshActionProps()`
- Batch delete button: can be used with the built-in `useBulkDestroyActionProps()`
- Filter button: can be directly used with [Filter.Action](/components/filter) and `useFilterActionProps`
- For adding button, you can refer to the usage of [Action.Drawer](/components/action#与-form-结合)

If you want to customize, you can use [useDataBlockResource()](/core/data-block/data-block-resource-provider) and [useDataBlockRequest()](/core/data-block/data-block-request-provider#usedatablockrequest) to manipulate the data.

<code src="./demos/new-demos/action-toolbar.tsx"></code>

## View Or Edit Record

The `Table` component passes the data of the current row to the underlying components through [CollectionRecordProvider](/core/data-block/collection-record-provider), and we can use [useCollectionRecord()](/core/data-block/collection-record-provider#usecollectionrecord) to get the data of the current row.

Then, we use `useFormBlockProviderProps()` to pass the configuration and data of the table to the [FormBlockProvider](http://localhost:8000/components/form-v2#%E8%8E%B7%E5%8F%96%E6%95%B0%E6%8D%AE%E8%A1%A8%E6%95%B0%E6%8D%AE) component, and the `FormBlockProvider` will automatically request the form data and configuration.

Then, we use `useFormBlockProps()` to pass the data to the `Form` component.

In the editing scenario, we can update the data and refresh the list using [useDataBlockResource()](/core/data-block/data-block-resource-provider) and [useDataBlockRequest()](/core/data-block/data-block-request-provider#usedatablockrequest).

<code src="./demos/new-demos/record.tsx"></code>
