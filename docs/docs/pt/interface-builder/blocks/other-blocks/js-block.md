:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Bloco JS

## Introdução

O Bloco JS é um "bloco de renderização personalizado" altamente flexível que permite escrever scripts JavaScript diretamente para gerar interfaces, vincular eventos, chamar APIs de dados ou integrar bibliotecas de terceiros. Ele é ideal para visualizações personalizadas, experimentos temporários e cenários de extensão leves que são difíceis de cobrir com os blocos integrados.

## API de Contexto de Execução

O contexto de execução do Bloco JS já vem com capacidades comuns injetadas e pode ser usado diretamente:

- `ctx.element`: O contêiner DOM do bloco (envolto de forma segura como ElementProxy), suportando `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.requireAsync(url)`: Carrega assincronamente uma biblioteca AMD/UMD por URL.
- `ctx.importAsync(url)`: Importa dinamicamente um módulo ESM por URL.
- `ctx.openView`: Abre uma visualização configurada (popup/gaveta/página).
- `ctx.useResource(...)` + `ctx.resource`: Acessa dados como um recurso.
- `ctx.i18n.t()` / `ctx.t()`: Capacidade de internacionalização integrada.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza depois que o contêiner estiver pronto para evitar problemas de temporização.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Bibliotecas de uso geral integradas como React, ReactDOM, Ant Design, ícones do Ant Design e dayjs, para renderização JSX e manipulação de tempo. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` são mantidas para compatibilidade.)
- `ctx.render(vnode)`: Renderiza um elemento React, string HTML ou nó DOM para o contêiner padrão `ctx.element`. Múltiplas chamadas reutilizarão o mesmo React Root e sobrescreverão o conteúdo existente do contêiner.

## Adicionando um Bloco

Você pode adicionar um Bloco JS a uma página ou a um popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor e Snippets

O editor de script do Bloco JS suporta realce de sintaxe, dicas de erro e snippets de código integrados (Snippets), permitindo que você insira rapidamente exemplos comuns como: renderizar gráficos, vincular eventos de botão, carregar bibliotecas externas, renderizar componentes React/Vue, linhas do tempo, cartões de informação, etc.

- `Snippets`: Abre a lista de snippets de código integrados. Você pode pesquisar e inserir um snippet selecionado no editor de código, na posição atual do cursor, com um clique.
- `Run`: Executa diretamente o código no editor atual e exibe os logs de execução no painel `Logs` na parte inferior. Ele suporta a exibição de `console.log/info/warn/error`, e os erros serão destacados com links para a linha e coluna específicas.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Além disso, você pode chamar diretamente o funcionário de IA "Engenheiro Frontend · Nathan" no canto superior direito do editor. Ele pode ajudar você a escrever ou modificar scripts com base no contexto atual. Você pode então "Aplicar ao editor" com um clique e executar o código para ver o efeito. Para mais detalhes, consulte:

- [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/built-in/ai-coding)

## Ambiente de Execução e Segurança

- **Contêiner**: O sistema fornece um contêiner DOM seguro `ctx.element` (ElementProxy) para o script, que afeta apenas o bloco atual e não interfere com outras áreas da página.
- **Sandbox**: O script é executado em um ambiente controlado. `window`/`document`/`navigator` usam objetos proxy seguros, permitindo APIs comuns enquanto restringe comportamentos de risco.
- **Re-renderização**: O bloco é automaticamente re-renderizado quando é ocultado e depois mostrado novamente (para evitar a reexecução do script de montagem inicial).

## Usos Comuns (Exemplos Simplificados)

### 1) Renderizar React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicado!'))}>
      {ctx.t('Clique')}
    </Button>
  </div>
);
```

### 2) Modelo de Requisição de API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Requisição finalizada'));
console.log(ctx.t('Dados da resposta:'), resp?.data);
```

### 3) Carregar ECharts e Renderizar

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Abrir uma Visualização (Gaveta)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Gaveta de exemplo'), size: 'large' });
```

### 5) Ler um Recurso e Renderizar JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Observações

- É recomendado usar CDNs confiáveis para carregar bibliotecas externas.
- **Recomendação de Uso de Seletores**: Priorize o uso de seletores de `class` ou `[name=...]`. Evite usar `id`s fixos para prevenir conflitos de estilo ou evento causados por `id`s duplicados ao usar múltiplos blocos ou popups.
- **Limpeza de Eventos**: Como o bloco pode ser re-renderizado várias vezes, os listeners de evento devem ser limpos ou deduplicados antes de serem vinculados para evitar disparos repetidos. Você pode usar uma abordagem de "remover e depois adicionar", um listener de uso único ou uma flag para prevenir duplicações.

## Documentos Relacionados

- [Variáveis e Contexto](/interface-builder/variables)
- [Regras de Vinculação](/interface-builder/linkage-rule)
- [Visualizações e Popups](/interface-builder/actions/types/view)