---
title: "JSItem JS Item"
description: "JSItem JS Item: renderiza itens de operação personalizados na barra de ações usando JavaScript/JSX, com suporte a React, ctx e contexto de coleção/registro/formulário."
keywords: "JSItem,JS Item,item de operação personalizado,JavaScript,interface,NocoBase"
---

# JS Item

## Introdução

O JS Item é usado para renderizar um "item de operação personalizado" na barra de ações. Você escreve diretamente JavaScript/JSX para entregar qualquer UI — botão, grupo de botões, menu suspenso, texto de orientação, label de status ou um pequeno componente interativo — e, dentro do componente, pode chamar APIs, abrir modais, ler o registro atual ou atualizar os dados do Block.

Pode ser usado em barras de ferramentas de formulários, barras de ferramentas de tabelas (nível coleção), ações de linha de tabela (nível registro) etc., adequando-se aos seguintes cenários:

- Quando você precisa de uma estrutura de botão personalizada, e não apenas vincular um clique a um botão padrão;
- Quando precisa combinar várias operações em um grupo de botões ou menu suspenso;
- Quando precisa exibir status em tempo real, estatísticas ou texto explicativo na barra de ações;
- Quando precisa renderizar conteúdo diferente dinamicamente conforme o registro atual, dados selecionados ou valores do formulário.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## Diferença em relação a JS Action

- `JS Action`: mais adequado a "executar um script ao clicar em um botão"; o foco é a lógica de comportamento.
- `JS Item`: mais adequado a "renderizar um item de operação por conta própria"; controla tanto a interface quanto a lógica de interação.

Se você só quer adicionar lógica de clique a um botão existente, use `JS Action`. Se quer customizar a estrutura visual de um item de operação ou renderizar vários controles, use `JS Item`.

## API de contexto em runtime (mais usadas)

O JS Item injeta capacidades comuns no runtime, usáveis diretamente no script:

- `ctx.render(vnode)`: renderiza um elemento React, string HTML ou nó DOM no container do item de operação atual;
- `ctx.element`: o container DOM do item de operação atual (ElementProxy);
- `ctx.api.request(options)`: dispara uma requisição HTTP;
- `ctx.openView(viewUid, options)`: abre uma view configurada (drawer / dialog / página);
- `ctx.message` / `ctx.notification`: mensagens e notificações globais;
- `ctx.t()` / `ctx.i18n.t()`: internacionalização;
- `ctx.resource`: a Resource do contexto de coleção, usada para ler registros selecionados, atualizar a lista etc.;
- `ctx.record`: o registro atual no contexto de linha;
- `ctx.form`: a instância do AntD Form no contexto de formulário;
- `ctx.blockModel` / `ctx.collection`: metadados do Block e da coleção em que o item está;
- `ctx.requireAsync(url)`: carrega uma biblioteca AMD/UMD assíncrona pela URL;
- `ctx.importAsync(url)`: importa um módulo ESM dinamicamente pela URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: bibliotecas comuns embutidas, prontas para uso em renderização JSX, manipulação de tempo, manipulação de dados e cálculos matemáticos.

> As variáveis efetivamente disponíveis variam conforme a posição do item de operação. Por exemplo, em ações de linha de tabela costuma haver `ctx.record`; em barras de ferramentas de formulário, `ctx.form`; em barras de ferramentas de tabela, `ctx.resource`.

## Editor e snippets

- `Snippets`: abre a lista interna de snippets de código; é possível buscar e inserir um snippet na posição atual com um clique.
- `Run`: executa o código atual e envia logs para o painel `Logs` na parte inferior; suporta `console.log/info/warn/error` e destaque com localização de erros.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- Pode ser combinado com AI Employees para gerar ou modificar scripts: [AI Employee · Nathan: Engenheiro de front-end](/ai-employees/features/built-in-employee)

## Exemplos comuns (concisos)

### 1) Renderizar um botão simples

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) Operação de coleção: combinação de botão e menu suspenso

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) Operação de registro: abrir uma view com base na linha atual

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Abre uma view como drawer e passa argumentos no nível superior
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) Renderizar conteúdo de status personalizado

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## Atenção

- Se você só precisa "executar uma lógica ao clicar", prefira `JS Action`; é mais direto.
- Adicione `try/catch` em chamadas de API e mostre mensagens ao usuário para evitar falhas silenciosas.
- Em interações com tabelas, listas e modais, após o sucesso de um envio é recomendado disparar `ctx.resource?.refresh?.()` para atualizar os dados do Block ativamente.
- Ao usar bibliotecas externas, prefira CDNs confiáveis e tenha um fallback para o caso de falha de carregamento.

## Documentação relacionada

- [Variáveis e contexto](/interface-builder/variables)
- [Regras de linkagem](/interface-builder/linkage-rule)
- [Views e modais](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
