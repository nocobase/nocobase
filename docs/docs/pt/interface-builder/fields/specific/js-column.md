:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Introdução

JS Column é usado para "colunas personalizadas" em tabelas, renderizando o conteúdo das células de cada linha via JavaScript. Não está vinculado a um campo específico, sendo adequado para cenários como colunas derivadas, exibições combinadas entre campos, emblemas de status, operações de botão, agregação de dados remotos, etc.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API de Contexto de Tempo de Execução

Ao renderizar cada célula, a JS Column pode usar as seguintes capacidades de contexto:

- `ctx.element`: O contêiner DOM da célula atual (ElementProxy), suportando `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.record`: O objeto de registro da linha atual (somente leitura);
- `ctx.recordIndex`: O índice da linha na página atual (começa em 0, pode ser afetado pela paginação);
- `ctx.collection`: Metainformações da coleção vinculada à tabela (somente leitura);
- `ctx.requireAsync(url)`: Carrega bibliotecas AMD/UMD de forma assíncrona via URL;
- `ctx.importAsync(url)`: Importa módulos ESM dinamicamente via URL;
- `ctx.openView(options)`: Abre uma visualização configurada (janela modal/gaveta/página);
- `ctx.i18n.t()` / `ctx.t()`: Internacionalização;
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza após o contêiner estar pronto;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Bibliotecas comuns integradas como React / ReactDOM / Ant Design / Ícones do Ant Design / dayjs / lodash / math.js / formula.js, usadas para renderização JSX, processamento de tempo, manipulação de dados e operações matemáticas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ainda são mantidos para compatibilidade.)
- `ctx.render(vnode)`: Renderiza elementos React/HTML/DOM no contêiner padrão `ctx.element` (célula atual). Múltiplas renderizações reutilizarão o Root e substituirão o conteúdo existente do contêiner.

## Editor e Snippets

O editor de script da JS Column suporta realce de sintaxe, dicas de erro e trechos de código integrados (Snippets).

- `Snippets`: Abre a lista de trechos de código integrados, permitindo pesquisar e inserir na posição atual do cursor com um clique.
- `Run`: Executa o código atual diretamente, com os logs de execução saindo no painel `Logs` na parte inferior, suportando `console.log/info/warn/error` e localização de erros com realce.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Pode ser combinado com funcionários de IA para gerar código:

- [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/features/built-in-employee)

## Usos Comuns

### 1) Renderização básica (leitura do registro da linha atual)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Usando JSX para renderizar componentes React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Abrindo janela modal/gaveta na célula (visualizar/editar)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Visualizar</a>
);
```

### 4) Carregando bibliotecas de terceiros (AMD/UMD ou ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Observações

- Sugere-se usar CDNs confiáveis para o carregamento de bibliotecas externas e preparar um fallback para cenários de falha (ex: `if (!lib) return;`).
- Recomenda-se priorizar o uso de seletores `class` ou `[name=...]`, evitando o uso de `id` fixo para prevenir duplicidade de `id` em múltiplos blocos/janelas modais.
- Limpeza de eventos: as linhas da tabela podem mudar dinamicamente com a paginação/atualização e as células serão renderizadas várias vezes. Você deve limpar ou remover duplicatas antes de vincular eventos para evitar disparos repetidos.
- Sugestão de desempenho: evite carregar repetidamente bibliotecas grandes em cada célula; você deve armazenar a biblioteca em cache no nível superior (como por meio de variáveis globais ou de nível de tabela) para reutilização.