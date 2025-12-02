:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

**Parâmetros**

| Parâmetro              | Tipo          | Valor Padrão | Descrição                                                                 |
| ---------------------- | ------------- | ------------ | ------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`         | O objeto de dados a ser inserido.                                         |
| `options.whitelist?`   | `string[]`    | -            | Lista de permissões (whitelist) para os campos de `values`. Apenas os campos nesta lista serão armazenados. |
| `options.blacklist?`   | `string[]`    | -            | Lista de bloqueio (blacklist) para os campos de `values`. Os campos nesta lista não serão armazenados. |
| `options.transaction?` | `Transaction` | -            | Transação.                                                                |