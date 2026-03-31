:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Item JS

## Introdução

O Item JS é usado para "itens personalizados" (não vinculados a um campo) em um formulário. Você pode usar JavaScript/JSX para renderizar qualquer conteúdo (como dicas, estatísticas, pré-visualizações, botões, etc.) e interagir com o formulário e o contexto do registro. É ideal para cenários como pré-visualizações em tempo real, dicas instrutivas e pequenos componentes interativos.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API de Contexto em Tempo de Execução (Uso Comum)

- `ctx.element`: O contêiner DOM (ElementProxy) do item atual, que suporta `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.form`: A instância do formulário AntD, permitindo operações como `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, etc.
- `ctx.blockModel`: O modelo do bloco de formulário ao qual pertence, que pode escutar `formValuesChange` para implementar a vinculação.
- `ctx.record` / `ctx.collection`: O registro atual e os metadados da **coleção** (disponíveis em alguns cenários).
- `ctx.requireAsync(url)`: Carrega assincronamente uma biblioteca AMD/UMD por URL.
- `ctx.importAsync(url)`: Importa dinamicamente um módulo ESM por URL.
- `ctx.openView(viewUid, options)`: Abre uma visualização configurada (gaveta/diálogo/página).
- `ctx.message` / `ctx.notification`: Mensagem e notificação global.
- `ctx.t()` / `ctx.i18n.t()`: Internacionalização.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza depois que o contêiner estiver pronto.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Bibliotecas integradas como React, ReactDOM, Ant Design, ícones do Ant Design e dayjs, usadas para renderização JSX e utilitários de data/hora. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` são mantidos para compatibilidade.)
- `ctx.render(vnode)`: Renderiza um elemento React/HTML/DOM para o contêiner padrão `ctx.element`. Múltiplas renderizações reutilizarão o Root e sobrescreverão o conteúdo existente do contêiner.

## Editor e Snippets

- `Snippets`: Abre uma lista de snippets de código integrados, permitindo que você pesquise e os insira na posição atual do cursor com um clique.
- `Run`: Executa o código atual diretamente e exibe os logs de execução no painel `Logs` na parte inferior. Suporta `console.log/info/warn/error` e destaque de erros.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Pode ser usado com o Funcionário AI para gerar/modificar scripts: [Funcionário AI · Nathan: Engenheiro Frontend](/ai-employees/built-in/ai-coding)

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

- É recomendado usar uma CDN confiável para carregar bibliotecas externas e ter um plano de contingência para cenários de falha (por exemplo, `if (!lib) return;`).
- É recomendado priorizar o uso de `class` ou `[name=...]` para seletores e evitar o uso de `id`s fixos para prevenir `id`s duplicados em múltiplos blocos/pop-ups.
- Limpeza de eventos: Mudanças frequentes nos valores do formulário podem disparar múltiplas renderizações. Antes de vincular um evento, ele deve ser limpo ou deduplicado (por exemplo, `remove` antes de `add`, usar `{ once: true }`, ou um atributo `dataset` para evitar duplicatas).

## Documentação Relacionada

- [Variáveis e Contexto](/interface-builder/variables)
- [Regras de Vinculação](/interface-builder/linkage-rule)
- [Visualizações e Pop-ups](/interface-builder/actions/types/view)