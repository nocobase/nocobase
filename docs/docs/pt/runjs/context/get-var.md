:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/get-var).
:::

# ctx.getVar()

Lê valores de variáveis do contexto de execução atual de forma **assíncrona**. A resolução de variáveis é consistente com a de `{{ctx.xxx}}` em SQL e templates, geralmente originada do usuário atual, registro atual, parâmetros de visualização, contexto de popups, etc.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSField** | Obter informações sobre o registro atual, usuário, recurso, etc., para renderização ou lógica. |
| **Regras de Ligação / Fluxo de Eventos** | Ler `ctx.record`, `ctx.formValues`, etc., para lógica condicional. |
| **Fórmulas / Templates** | Usa as mesmas regras de resolução de variáveis que `{{ctx.xxx}}`. |

## Definição de Tipo

```ts
getVar(path: string): Promise<any>;
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `path` | `string` | Caminho da variável; **deve começar com `ctx.`**. Suporta notação de ponto e índices de array. |

**Valor de Retorno**: `Promise<any>`. Use `await` para obter o valor resolvido; retorna `undefined` se a variável não existir.

> Se for passado um caminho que não comece com `ctx.`, um erro será lançado: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Caminhos de Variáveis Comuns

| Caminho | Descrição |
|------|------|
| `ctx.record` | Registro atual (disponível quando um bloco de formulário/detalhes está vinculado a um registro) |
| `ctx.record.id` | Chave primária do registro atual |
| `ctx.formValues` | Valores atuais do formulário (comumente usados em regras de ligação e fluxos de eventos; em cenários de formulário, prefira `ctx.form.getFieldsValue()` para leitura em tempo real) |
| `ctx.user` | Usuário logado no momento |
| `ctx.user.id` | ID do usuário atual |
| `ctx.user.nickname` | Apelido do usuário atual |
| `ctx.user.roles.name` | Nomes das funções (roles) do usuário atual (array) |
| `ctx.popup.record` | Registro dentro de um popup |
| `ctx.popup.record.id` | Chave primária do registro dentro de um popup |
| `ctx.urlSearchParams` | Parâmetros de consulta da URL (analisados a partir de `?key=value`) |
| `ctx.token` | Token de API atual |
| `ctx.role` | Função (role) atual |

## ctx.getVarInfos()

Obtém as **informações estruturais** (tipo, título, subpropriedades, etc.) das variáveis resolvíveis no contexto atual, facilitando a exploração dos caminhos disponíveis. O valor de retorno é uma descrição estática baseada em `meta` e não inclui valores reais de execução.

### Definição de Tipo

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

No valor de retorno, cada chave é um caminho de variável e o valor são as informações estruturais para esse caminho (incluindo `type`, `title`, `properties`, etc.).

### Parâmetros

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `path` | `string \| string[]` | Caminho de truncamento; coleta apenas a estrutura da variável sob este caminho. Suporta `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; um array representa a fusão de múltiplos caminhos. |
| `maxDepth` | `number` | Profundidade máxima de expansão, o padrão é `3`. Quando `path` não é fornecido, as propriedades de nível superior têm `depth=1`. Quando `path` é fornecido, o nó correspondente ao caminho tem `depth=1`. |

### Exemplo

```ts
// Obtém a estrutura da variável sob record (expandida em até 3 níveis)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Obtém a estrutura de popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Obtém a estrutura completa das variáveis de nível superior (padrão maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Diferença para ctx.getValue

| Método | Cenário | Descrição |
|------|----------|------|
| `ctx.getValue()` | Campos editáveis como JSField ou JSItem | Obtém de forma síncrona o valor do **campo atual**; requer vinculação ao formulário. |
| `ctx.getVar(path)` | Qualquer contexto RunJS | Obtém de forma assíncrona **qualquer variável ctx**; o caminho deve começar com `ctx.`. |

Em um JSField, use `getValue`/`setValue` para ler/escrever no campo atual; use `getVar` para acessar outras variáveis de contexto (como `record`, `user`, `formValues`).

## Observações

- **O caminho deve começar com `ctx.`**: por exemplo, `ctx.record.id`, caso contrário, um erro será lançado.
- **Método assíncrono**: Você deve usar `await` para obter o resultado, por exemplo, `const id = await ctx.getVar('ctx.record.id')`.
- **Variável não existe**: Retorna `undefined`. Você pode usar `??` após o resultado para definir um valor padrão: `(await ctx.getVar('ctx.user.nickname')) ?? 'Visitante'`.
- **Valores do formulário**: `ctx.formValues` deve ser recuperado via `await ctx.getVar('ctx.formValues')`; ele não é exposto diretamente como `ctx.formValues`. No contexto de um formulário, prefira usar `ctx.form.getFieldsValue()` para ler os valores mais recentes em tempo real.

## Exemplos

### Obter ID do Registro Atual

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Registro atual: ${recordId}`);
}
```

### Obter Registro Dentro de um Popup

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Registro do popup atual: ${recordId}`);
}
```

### Ler Subitens de um Campo de Array

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Retorna um array de nomes de funções, ex: ['admin', 'member']
```

### Definir Valor Padrão

```ts
// getVar não possui um parâmetro defaultValue; use ?? após o resultado
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Visitante';
```

### Ler Valores de Campos de Formulário

```ts
// Tanto ctx.formValues quanto ctx.form são para cenários de formulário; use getVar para ler campos aninhados
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Ler Parâmetros de Consulta da URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Corresponde a ?id=xxx
```

### Explorar Variáveis Disponíveis

```ts
// Obtém a estrutura da variável sob record (expandida em até 3 níveis)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars se parece com { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Relacionados

- [ctx.getValue()](./get-value.md) - Obtém o valor do campo atual de forma síncrona (apenas JSField/JSItem)
- [ctx.form](./form.md) - Instância do formulário, `ctx.form.getFieldsValue()` pode ler valores do formulário em tempo real
- [ctx.model](./model.md) - O modelo onde o contexto de execução atual reside
- [ctx.blockModel](./block-model.md) - O bloco pai onde o JS atual está localizado
- [ctx.resource](./resource.md) - A instância de recurso (resource) no contexto atual
- `{{ctx.xxx}}` em SQL / Templates - Usa as mesmas regras de resolução que `ctx.getVar('ctx.xxx')`