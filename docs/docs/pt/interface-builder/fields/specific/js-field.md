:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Campo JS

## Introdução

O Campo JS é usado para renderizar conteúdo personalizado em uma posição de campo usando JavaScript. É comumente usado em blocos de detalhes, itens somente leitura em formulários ou como "Outros itens personalizados" em colunas de tabela. É ideal para exibições personalizadas, combinação de informações derivadas, renderização de selos de status, texto rico ou gráficos.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipos

- Somente leitura: Usado para exibição não editável, lê `ctx.value` para renderizar a saída.
- Editável: Usado para interações de entrada personalizadas. Ele fornece `ctx.getValue()`/`ctx.setValue(v)` e um evento de contêiner `js-field:value-change` para facilitar a sincronização bidirecional com os valores do formulário.

## Casos de Uso

- Somente leitura
  - Bloco de detalhes: Exibe conteúdo somente leitura, como resultados de cálculo, selos de status, trechos de texto rico, gráficos, etc.
  - Bloco de tabela: Usado como "Outra coluna personalizada > Campo JS" para exibição somente leitura (se você precisar de uma coluna não vinculada a um campo, use a Coluna JS).

- Editável
  - Bloco de formulário (CreateForm/EditForm): Usado para controles de entrada personalizados ou entradas compostas, que são validados e enviados com o formulário.
  - Adequado para cenários como: componentes de entrada de bibliotecas externas, editores de texto rico/código, componentes dinâmicos complexos, etc.

## API de Contexto de Tempo de Execução

O código de tempo de execução do Campo JS pode usar diretamente os seguintes recursos de contexto:

- `ctx.element`: O contêiner DOM do campo (ElementProxy), suportando `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.value`: O valor atual do campo (somente leitura).
- `ctx.record`: O objeto de registro atual (somente leitura).
- `ctx.collection`: Metadados da **coleção** à qual o campo pertence (somente leitura).
- `ctx.requireAsync(url)`: Carrega assincronamente uma biblioteca AMD/UMD por URL.
- `ctx.importAsync(url)`: Importa dinamicamente um módulo ESM por URL.
- `ctx.openView(options)`: Abre uma visualização configurada (popup/gaveta/página).
- `ctx.i18n.t()` / `ctx.t()`: Internacionalização.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza após o contêiner estar pronto.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Bibliotecas integradas como React, ReactDOM, Ant Design, ícones do Ant Design e dayjs, usadas para renderização JSX e manipulação de tempo. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` são mantidos para compatibilidade.)
- `ctx.render(vnode)`: Renderiza um elemento React, string HTML ou nó DOM no contêiner padrão `ctx.element`. A renderização repetida reutilizará o Root e sobrescreverá o conteúdo existente do contêiner.

Específico para o tipo Editável (JSEditableField):

- `ctx.getValue()`: Obtém o valor atual do formulário (prioriza o estado do formulário, depois retorna para as props do campo).
- `ctx.setValue(v)`: Define o valor do formulário e as props do campo, mantendo a sincronização bidirecional.
- Evento de contêiner `js-field:value-change`: Acionado quando um valor externo muda, facilitando para o script atualizar a exibição da entrada.

## Editor e Snippets

O editor de script do Campo JS suporta realce de sintaxe, dicas de erro e snippets de código integrados.

- `Snippets`: Abre uma lista de snippets de código integrados, que podem ser pesquisados e inseridos na posição atual do cursor com um clique.
- `Run`: Executa diretamente o código atual. O log de execução é exibido no painel `Logs` na parte inferior, suportando `console.log/info/warn/error` e realce de erro para fácil localização.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Você também pode gerar código com o Funcionário de IA:

- [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/built-in/ai-coding)

## Usos Comuns

### 1) Renderização Básica (Lendo o Valor do Campo)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Usando JSX para Renderizar um Componente React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Carregando Bibliotecas de Terceiros (AMD/UMD ou ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Clicando para Abrir um Popup/Gaveta (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Ver Detalhes</a>`;
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

### 5) Entrada Editável (JSEditableFieldModel)

```js
// Renderiza uma entrada simples usando JSX e sincroniza o valor do formulário
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

// Sincroniza a entrada quando o valor externo muda (opcional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Observações

- Recomenda-se usar um CDN confiável para carregar bibliotecas externas e ter um fallback para cenários de falha (por exemplo, `if (!lib) return;`).
- É aconselhável priorizar o uso de `class` ou `[name=...]` para seletores e evitar o uso de `id`s fixos para prevenir `id`s duplicados em múltiplos blocos ou popups.
- Limpeza de eventos: Um campo pode ser renderizado novamente várias vezes devido a alterações de dados ou troca de visualização. Antes de vincular um evento, você deve limpá-lo ou remover duplicatas para evitar gatilhos repetidos. Você pode "remover e depois adicionar".