**Parameters**

| Parameter Name         | Type          | Default Value | Description                                                                 |
| ---------------------- | ------------- | ------------- | --------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`          | The data object to be inserted                                              |
| `options.whitelist?`   | `string[]`    | -             | Whitelist of fields for `values`. Only fields in the list will be stored.   |
| `options.blacklist?`   | `string[]`    | -             | Blacklist of fields for `values`. Fields in the list will not be stored.    |
| `options.transaction?` | `Transaction` | -             | Transaction                                                                 |