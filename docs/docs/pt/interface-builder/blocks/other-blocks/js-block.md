:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block

## Introdução

O JS Block é um "bloco de renderização personalizado" altamente flexível que permite escrever scripts JavaScript diretamente para gerar interfaces, vincular eventos, chamar APIs de dados ou integrar bibliotecas de terceiros. É adequado para visualizações personalizadas, experimentos temporários e cenários de extensão leves que são difíceis de cobrir com os blocos integrados.

## API de Contexto de Execução

O contexto de execução do JS Block já possui capacidades comuns injetadas e pode ser usado diretamente:

- `ctx.element`: O contêiner DOM do bloco (já encapsulado com segurança, ElementProxy), suportando `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.requireAsync(url)`: Carrega assincronamente uma biblioteca AMD/UMD por URL;
- `ctx.importAsync(url)`: Importa dinamicamente um módulo ESM por URL;
- `ctx.openView`: Abre uma visualização configurada (popup/gaveta/página);
- `ctx.useResource(...)` + `ctx.resource`: Acessa dados como um recurso;
- `ctx.i18n.t()` / `ctx.t()`: Capacidade de internacionalização integrada;
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza após o contêiner estar pronto para evitar problemas de temporização;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Bibliotecas universais integradas como React / ReactDOM / Ant Design / Ícones do Ant Design / dayjs / lodash / math.js / formula.js, usadas para renderização JSX, processamento de tempo, manipulação de dados e operações matemáticas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ainda são mantidos para compatibilidade.)
- `ctx.render(vnode)`: Renderiza elementos React, strings HTML ou nós DOM no contêiner padrão `ctx.element`; múltiplas chamadas reutilizarão o mesmo React Root e substituirão o conteúdo existente do contêiner.

## Adicionar Bloco

- Você pode adicionar um JS Block em uma página ou em um popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor e Snippets

O editor de script do JS Block suporta realce de sintaxe, dicas de erro e snippets de código integrados (Snippets), permitindo que você insira rapidamente exemplos comuns, como: renderizar gráficos, vincular eventos de botão, carregar bibliotecas externas, renderizar componentes React/Vue, linhas do tempo, cartões de informações, etc.

- `Snippets`: Abre a lista de snippets de código integrados, onde você pode pesquisar e inserir um snippet selecionado no editor de código, na posição atual do cursor, com um clique.
- `Run`: Executa diretamente o código no editor atual e exibe os logs de execução no painel `Logs` na parte inferior. Suporta a exibição de `console.log/info/warn/error`, e os erros serão destacados e podem ser localizados em linhas e colunas específicas.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Além disso, no canto superior direito do editor, você pode chamar diretamente o funcionário de IA "Engenheiro Frontend · Nathan", para que ele ajude você a escrever ou modificar scripts com base no contexto atual. Você pode então clicar em "Apply to editor" para aplicar ao editor e executar para ver o efeito. Para detalhes, consulte:

- [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/features/built-in-employee)

## Ambiente de Execução e Segurança

- Contêiner: O sistema fornece um contêiner DOM seguro `ctx.element` (ElementProxy) para o script, que afeta apenas o bloco atual e não interfere em outras áreas da página.
- Sandbox: O script é executado em um ambiente controlado. `window`/`document`/`navigator` usam objetos proxy seguros, permitindo APIs comuns enquanto restringe comportamentos de risco.
- Re-renderização: O bloco será automaticamente re-renderizado quando for ocultado e depois exibido novamente (para evitar a reexecução na montagem inicial).

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

- Recomenda-se o uso de CDNs confiáveis para o carregamento de bibliotecas externas.
- Sugestão de uso de seletores: Priorize o uso de seletores de atributo `class` ou `[name=...]`; evite usar `id`s fixos para prevenir conflitos de estilo ou evento causados por `id`s duplicados em múltiplos blocos ou popups.
- Limpeza de eventos: O bloco pode ser re-renderizado várias vezes; os eventos devem ser limpos ou deduplicados antes da vinculação para evitar disparos repetidos. Você pode adotar a abordagem de "remover primeiro e depois adicionar", usar listeners de uso único ou adicionar sinalizadores para evitar repetições.

## Documentos Relacionados

- [Variáveis e Contexto](/interface-builder/variables)
- [Regras de Vinculação](/interface-builder/linkage-rule)
- [Visualizações e Popups](/interface-builder/actions/types/view)