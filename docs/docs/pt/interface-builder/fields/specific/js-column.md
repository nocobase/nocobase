:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# JS Column

## Introdução

A JS Column é usada para "colunas personalizadas" em tabelas, renderizando o conteúdo de cada célula da linha via JavaScript. Ela não está vinculada a um campo específico e é ideal para cenários como colunas derivadas, exibições combinadas entre campos, selos de status, botões de ação e agregação de dados remotos.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API de Contexto de Tempo de Execução

Ao renderizar cada célula, a JS Column oferece as seguintes APIs de contexto:

- `ctx.element`: O contêiner DOM da célula atual (ElementProxy), com suporte para `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.record`: O objeto de registro da linha atual (somente leitura).
- `ctx.recordIndex`: O índice da linha dentro da página atual (começa em 0, pode ser afetado pela paginação).
- `ctx.collection`: Os metadados da **coleção** vinculada à tabela (somente leitura).
- `ctx.requireAsync(url)`: Carrega assincronamente uma biblioteca AMD/UMD por URL.
- `ctx.importAsync(url)`: Importa dinamicamente um módulo ESM por URL.
- `ctx.openView(options)`: Abre uma visualização configurada (modal/gaveta/página).
- `ctx.i18n.t()` / `ctx.t()`: Internacionalização.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza depois que o contêiner estiver pronto.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Bibliotecas integradas como React, ReactDOM, Ant Design, ícones do Ant Design e dayjs, usadas para renderização JSX e utilitários de data/hora. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` são mantidos para compatibilidade.)
- `ctx.render(vnode)`: Renderiza um elemento React/HTML/DOM para o contêiner padrão `ctx.element` (a célula atual). Múltiplas renderizações reutilizarão o Root e sobrescreverão o conteúdo existente do contêiner.

## Editor e Snippets

O editor de script da JS Column oferece suporte a destaque de sintaxe, dicas de erro e snippets de código integrados.

- `Snippets`: Abre a lista de snippets de código integrados, permitindo que você pesquise e os insira na posição atual do cursor com um clique.
- `Run`: Executa o código atual diretamente. O log de execução é exibido no painel `Logs` na parte inferior, com suporte para `console.log/info/warn/error` e destaque de erros.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Você também pode usar um Funcionário de IA para gerar código:

- [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/built-in/ai-coding)

## Usos Comuns

### 1) Renderização Básica (Lendo o registro da linha atual)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Usando JSX para Renderizar Componentes React

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

### 3) Abrindo um Modal/Gaveta a partir de uma Célula (Visualizar/Editar)

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

### 4) Carregando Bibliotecas de Terceiros (AMD/UMD ou ESM)

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

- É recomendável usar uma CDN confiável para carregar bibliotecas externas e ter um fallback para cenários de falha (por exemplo, `if (!lib) return;`).
- É recomendável usar seletores `class` ou `[name=...]` em vez de `id`s fixos para evitar `id`s duplicados em vários blocos ou modais.
- Limpeza de Eventos: As linhas da tabela podem mudar dinamicamente com a paginação ou atualização, fazendo com que as células sejam renderizadas várias vezes. Você deve limpar ou remover duplicatas de listeners de eventos antes de vinculá-los para evitar gatilhos repetidos.
- Dica de Desempenho: Evite carregar bibliotecas grandes repetidamente em cada célula. Em vez disso, armazene a biblioteca em cache em um nível superior (por exemplo, usando uma variável global ou de nível de tabela) e reutilize-a.