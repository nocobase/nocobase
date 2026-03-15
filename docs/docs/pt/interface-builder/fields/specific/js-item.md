:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Introdução

O JS Item é usado para "itens personalizados" em formulários (não vinculados a campos). Você pode usar JavaScript/JSX para renderizar qualquer conteúdo (dicas, estatísticas, pré-visualizações, botões, etc.) e interagir com o formulário e o contexto do registro, sendo adequado para cenários como pré-visualizações em tempo real, dicas de instrução, pequenos componentes interativos, etc.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API de Contexto em Tempo de Execução (Uso Comum)

- `ctx.element`: O contêiner DOM (ElementProxy) do item atual, suportando `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.form`: Instância do AntD Form, permitindo `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, etc.;
- `ctx.blockModel`: Modelo do bloco de formulário onde está inserido, podendo ouvir `formValuesChange` para implementar vinculação;
- `ctx.record` / `ctx.collection`: Registro atual e metadados da **coleção** (disponível em alguns cenários);
- `ctx.requireAsync(url)`: Carrega assincronamente uma biblioteca AMD/UMD via URL;
- `ctx.importAsync(url)`: Importa dinamicamente um módulo ESM via URL;
- `ctx.openView(viewUid, options)`: Abre uma visualização configurada (gaveta/diálogo/página);
- `ctx.message` / `ctx.notification`: Mensagens e notificações globais;
- `ctx.t()` / `ctx.i18n.t()`: Internacionalização;
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza após o contêiner estar pronto;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Bibliotecas integradas como React / ReactDOM / Ant Design / Ícones do Ant Design / dayjs / lodash / math.js / formula.js, usadas para renderização JSX, processamento de tempo, manipulação de dados e operações matemáticas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ainda são mantidos para compatibilidade.)
- `ctx.render(vnode)`: Renderiza elementos React/HTML/DOM no contêiner padrão `ctx.element`; múltiplas renderizações reutilizarão o Root e sobrescreverão o conteúdo existente do contêiner.

## Editor e Snippets

- `Snippets`: Abre a lista de trechos de código integrados, permitindo pesquisar e inserir com um clique na posição atual do cursor.
- `Run`: Executa o código atual diretamente e exibe os logs de execução no painel `Logs` na parte inferior; suporta `console.log/info/warn/error` e localização de erros com destaque.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Pode ser combinado com o Funcionário AI para gerar/modificar scripts: [Funcionário AI · Nathan: Engenheiro Frontend](/ai-employees/features/built-in-employee)

## Uso Comum (Exemplos Simplificados)

### 1) Pré-visualização em Tempo Real (Lendo Valores do Formulário)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Abrir uma Visualização (Gaveta)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Carregar e Renderizar Bibliotecas Externas

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Observações

- Para o carregamento de bibliotecas externas, recomenda-se o uso de CDNs confiáveis e a implementação de tratamentos para falhas (ex: `if (!lib) return;`).
- Recomenda-se priorizar o uso de `class` ou `[name=...]` para seletores, evitando o uso de `id` fixo para prevenir duplicidade de `id` em múltiplos blocos ou janelas pop-up.
- Limpeza de eventos: Mudanças frequentes nos valores do formulário dispararão múltiplas renderizações; antes de vincular eventos, deve-se realizar a limpeza ou evitar duplicatas (ex: usar `remove` antes de `add`, ou `{ once: true }`, ou marcar com `dataset` para evitar repetição).

## Documentação Relacionada

- [Variáveis e Contexto](/interface-builder/variables)
- [Regras de Vinculação](/interface-builder/linkage-rule)
- [Visualizações e Janelas Pop-up](/interface-builder/actions/types/view)