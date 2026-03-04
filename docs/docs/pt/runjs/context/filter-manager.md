:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/filter-manager).
:::

# ctx.filterManager

O Gerenciador de Conexão de Filtro é usado para gerenciar as associações de filtragem entre formulários de filtro (`FilterForm`) e blocos de dados (tabelas, listas, gráficos, etc.). Ele é fornecido pelo `BlockGridModel` e está disponível apenas dentro do seu contexto (ex: blocos de formulário de filtro, blocos de dados).

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **Bloco de Formulário de Filtro** | Gerencia as configurações de conexão entre itens de filtro e blocos de destino; atualiza os dados de destino quando os filtros são alterados. |
| **Bloco de Dados (Tabela/Lista)** | Atua como um destino de filtro, vinculando condições de filtro via `bindToTarget`. |
| **Regras de Vinculação / FilterModel Personalizado** | Chama `refreshTargetsByFilter` dentro de `doFilter` ou `doReset` para acionar a atualização dos destinos. |
| **Configuração de Campo de Conexão** | Usa `getConnectFieldsConfig` e `saveConnectFieldsConfig` para manter os mapeamentos de campos entre filtros e destinos. |

> Nota: `ctx.filterManager` só está disponível em contextos RunJS que possuem um `BlockGridModel` (ex: dentro de uma página que contém um formulário de filtro); ele será `undefined` em JSBlocks comuns ou páginas independentes. Recomenda-se usar o encadeamento opcional (optional chaining) antes de acessá-lo.

## Definições de Tipo

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID do modelo de filtro
  targetId: string;   // UID do modelo do bloco de dados de destino
  filterPaths?: string[];  // Caminhos de campo do bloco de destino
  operator?: string;  // Operador de filtro
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Métodos Comuns

| Método | Descrição |
|------|------|
| `getFilterConfigs()` | Obtém todas as configurações de conexão de filtro atuais. |
| `getConnectFieldsConfig(filterId)` | Obtém a configuração de campo de conexão para um filtro específico. |
| `saveConnectFieldsConfig(filterId, config)` | Salva a configuração de campo de conexão para um filtro. |
| `addFilterConfig(config)` | Adiciona uma configuração de filtro (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Remove configurações de filtro por filterId, targetId ou ambos. |
| `bindToTarget(targetId)` | Vincula a configuração de filtro a um bloco de destino, acionando seu recurso para aplicar o filtro. |
| `unbindFromTarget(targetId)` | Desvincula o filtro do bloco de destino. |
| `refreshTargetsByFilter(filterId | filterId[])` | Atualiza os dados dos blocos de destino associados com base no(s) filtro(s). |

## Conceitos Centrais

- **FilterModel**: Um modelo que fornece condições de filtro (ex: `FilterFormItemModel`), que deve implementar `getFilterValue()` para retornar o valor atual do filtro.
- **TargetModel**: O bloco de dados que está sendo filtrado; seu `resource` deve suportar `addFilterGroup`, `removeFilterGroup` e `refresh`.

## Exemplos

### Adicionar Configuração de Filtro

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Atualizar Blocos de Destino

```ts
// No doFilter / doReset de um formulário de filtro
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Atualizar destinos associados a múltiplos filtros
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Configuração de Campo de Conexão

```ts
// Obter configuração de conexão
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Salvar configuração de conexão
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Remover Configuração

```ts
// Excluir todas as configurações de um filtro específico
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Excluir todas as configurações de filtro de um destino específico
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Relacionados

- [ctx.resource](./resource.md): O recurso do bloco de destino deve suportar a interface de filtro.
- [ctx.model](./model.md): Usado para obter o UID do modelo atual para filterId / targetId.