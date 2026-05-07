:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Introdução

O JS Field é usado para renderizar conteúdo personalizado com JavaScript na posição de um campo, comumente encontrado em blocos de detalhes, itens de formulário apenas de leitura ou como "outros itens personalizados" em colunas de tabela. É adequado para exibições personalizadas, combinação de informações derivadas, selos de status, texto rico ou renderização de gráficos.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipos

- Apenas leitura: Usado para exibição não editável, lê `ctx.value` para renderizar a saída.
- Editável: Usado para interações de entrada personalizadas, fornece `ctx.getValue()`/`ctx.setValue(v)` e o evento de contêiner `js-field:value-change`, facilitando a sincronização bidirecional com os valores do formulário.

## Cenários de uso

- Apenas leitura
  - Bloco de detalhes: Exibe conteúdos apenas de leitura, como resultados de cálculos, selos de status, trechos de texto rico, gráficos, etc.;
  - Bloco de tabela: Usado como "Outras colunas personalizadas > JS Field" para exibição apenas de leitura (se você precisar de uma coluna não vinculada a um campo, use o JS Column);

- Editável
  - Bloco de formulário (CreateForm/EditForm): Usado para controles de entrada personalizados ou entradas compostas, acompanhando a validação e o envio do formulário;
  - Cenários adequados: Componentes de entrada de bibliotecas externas, editores de texto rico/código, componentes dinâmicos complexos, etc.;

## API de contexto de tempo de execução

O código de tempo de execução do JS Field pode usar diretamente as seguintes capacidades de contexto:

- `ctx.element`: Contêiner DOM do campo (ElementProxy), suporta `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.value`: Valor atual do campo (apenas leitura);
- `ctx.record`: Objeto do registro atual (apenas leitura);
- `ctx.collection`: Metainformações da coleção à qual o campo pertence (apenas leitura);
- `ctx.requireAsync(url)`: Carrega bibliotecas AMD/UMD assincronamente via URL;
- `ctx.importAsync(url)`: Importa módulos ESM dinamicamente via URL;
- `ctx.openView(options)`: Abre uma visualização configurada (janela pop-up/gaveta/página);
- `ctx.i18n.t()` / `ctx.t()`: Internacionalização;
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza após o contêiner estar pronto;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Bibliotecas comuns integradas como React / ReactDOM / Ant Design / Ícones do Ant Design / dayjs / lodash / math.js / formula.js, usadas para renderização JSX, processamento de tempo, manipulação de dados e operações matemáticas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ainda são mantidos para compatibilidade.)
- `ctx.render(vnode)`: Renderiza elementos React, strings HTML ou nós DOM no contêiner padrão `ctx.element`; renderizações repetidas reutilizarão o Root e sobrescreverão o conteúdo existente do contêiner.

Específico para o tipo editável (JSEditableField):

- `ctx.getValue()`: Obtém o valor atual do formulário (prioriza o estado do formulário, depois recorre às props do campo).
- `ctx.setValue(v)`: Define o valor do formulário e as props do campo, mantendo a sincronização bidirecional.
- Evento de contêiner `js-field:value-change`: Acionado quando o valor externo muda, facilitando a atualização da exibição da entrada pelo script.

## Editor e Snippets

O editor de script do JS Field suporta realce de sintaxe, dicas de erro e trechos de código integrados (Snippets).

- `Snippets`: Abre a lista de trechos de código integrados, permitindo pesquisar e inserir na posição atual do cursor com um clique.
- `Run`: Executa o código atual diretamente, os logs de execução são exibidos no painel `Logs` na parte inferior, suportando `console.log/info/warn/error` e localização de erros com realce.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Pode ser combinado com o Funcionário de IA para gerar código:

- [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/features/built-in-employee)

## Usos comuns

### 1) Renderização básica (leitura do valor do campo)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Usando JSX para renderizar componentes React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Carregando bibliotecas de terceiros (AMD/UMD ou ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Clique para abrir pop-up/gaveta (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Ver detalhes</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Entrada editável (JSEditableFieldModel)

```js
// Renderiza uma entrada simples com JSX e sincroniza o valor do formulário
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Sincroniza com a entrada quando o valor externo muda (opcional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Observações

- Recomenda-se usar CDNs confiáveis para carregar bibliotecas externas e preparar um plano de contingência para falhas (ex: `if (!lib) return;`).
- Sugere-se priorizar o uso de `class` ou `[name=...]` para seletores, evitando o uso de `id` fixo para prevenir duplicidade de `id` em múltiplos blocos ou janelas pop-up.
- Limpeza de eventos: O campo pode ser renderizado novamente várias vezes devido a mudanças de dados ou troca de visualização; antes de vincular eventos, deve-se limpá-los ou remover duplicatas para evitar disparos repetidos. Pode-se "remover primeiro e depois adicionar".