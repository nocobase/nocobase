---
title: "Perguntas frequentes & guia de troubleshooting"
description: "Perguntas frequentes no desenvolvimento de plugins do cliente NocoBase: plugin não aparece, bloco não exibido, tradução não funciona, rota não encontrada, hot reload não funciona, erro de build, falha após deploy."
keywords: "FAQ,perguntas frequentes,guia de troubleshooting,Troubleshooting,NocoBase,build,deploy,tar,axios"
---

# Perguntas frequentes & guia de troubleshooting

Aqui reunimos as armadilhas mais comuns no desenvolvimento de plugins do cliente. Se você se deparou com aquela situação de "está tudo certo, mas não funciona", procure aqui antes.

## Plugin

### Plugin criado, mas não aparece no gerenciador

Confirme que você executou `yarn pm create` e não criou o diretório manualmente. Além de gerar os arquivos, `yarn pm create` registra o plugin na tabela `applicationPlugins` do banco de dados. Se você criou o diretório manualmente, execute `yarn nocobase upgrade` para reescaneá-los.

### Plugin ativado, mas a página não muda

Verifique na seguinte ordem:

1. Confirme que executou `yarn pm enable <pluginName>`
2. Atualize o navegador (às vezes é preciso um hard reload `Ctrl+Shift+R`)
3. Verifique se há erros no console do navegador

### Alterei o código, mas a página não atualiza

O comportamento de hot reload varia conforme o tipo de arquivo:

| Tipo de arquivo | Após alteração, é preciso |
| --- | --- |
| tsx/ts em `src/client-v2/` | Hot reload automático, sem ação necessária |
| Arquivos de tradução em `src/locale/` | **Reiniciar a aplicação** |
| Adicionar ou modificar collection em `src/server/collections/` | Executar `yarn nocobase upgrade` |

Se você alterou código do cliente mas não houve hot reload, primeiro tente atualizar o navegador.

## Rotas

### Rota de página registrada não acessível

As rotas no NocoBase v2 recebem o prefixo `/v2` por padrão. Por exemplo, se você registrou `path: '/hello'`, o endereço de acesso real é `/v2/hello`:

```ts
this.router.add('hello', {
  path: '/hello', // 实际访问 -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

Veja [Router de rotas](../router) para detalhes.

### Página de configurações de plugin abre em branco

Se o menu da página de configurações apareceu mas o conteúdo está vazio, geralmente é uma das duas razões:

**Razão 1: client v1 usou `componentLoader`**

`componentLoader` é uma forma do client-v2; o client v1 deve usar `Component` passando o componente diretamente:

```ts
// ❌ v1 client 不支持 componentLoader
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ v1 client 用 Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**Razão 2: o componente da página não usa `export default`**

`componentLoader` exige que o módulo tenha export default; faltou `default` e o módulo não será carregado.

## Blocos

### Bloco personalizado não aparece no menu "Adicionar bloco"

Confirme que registrou o modelo em `load()`:

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

Se estiver usando `registerModels` (forma sem carregamento sob demanda), confirme que `models/index.ts` exporta o modelo corretamente.

### Após adicionar o bloco, minha tabela não aparece na lista de seleção de data tables

Tabelas definidas via `defineCollection` são tabelas internas do servidor; por padrão, não aparecem na lista de data tables da UI.

**Abordagem recomendada**: na interface do NocoBase, em "[Gerenciamento de fontes de dados](../../../data-sources/data-source-main/index.md)", adicione a data table correspondente; após configurar campos e tipos de interface, a tabela aparece automaticamente na lista de seleção de data tables do bloco.

Se realmente precisar registrá-la no código do plugin (como em cenários de demonstração de plugins de exemplo), use `addCollection` para registrar manualmente; veja [Construir um plugin de gestão de dados com integração front-back](../examples/fullstack-plugin) para detalhes. Atenção: deve ser registrado pelo padrão de `eventBus`; chamá-lo diretamente em `load()` não funciona — `ensureLoaded()` é executado após `load()` e limpa e reconfigura todas as collections.

### Quero que meu bloco personalizado se vincule apenas a uma data table específica

Sobrescreva `static filterCollection` no modelo; apenas as collections em que o retorno for `true` aparecem na lista:

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## Campos

### Componente de campo personalizado não aparece no menu suspenso "Componente de campo"

Verifique na seguinte ordem:

1. Confirme que chamou `DisplayItemModel.bindModelToInterface('ModelName', ['input'])`, com o tipo de interface combinando — por exemplo, `input` para campo de texto de linha única, `checkbox` para checkbox
2. Confirme que o modelo está registrado em `load()` (`registerModels` ou `registerModelLoaders`)
3. Confirme que o modelo de campo chama `define({ label })`

### O menu suspenso "Componente de campo" mostra o nome da classe

Você esqueceu de chamar `define({ label })` no modelo de campo; basta adicionar:

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

Garanta também que existe a chave correspondente nos arquivos de tradução em `src/locale/`; caso contrário, em ambiente em chinês, o texto em inglês ainda será exibido.

## Ações

### Botão de ação personalizado não aparece em "Configurar ações"

Confirme que o `static scene` correto está definido no modelo:

| Valor | Posição |
| --- | --- |
| `ActionSceneEnum.collection` | Barra de ações no topo do bloco (ao lado do botão "Novo", por exemplo) |
| `ActionSceneEnum.record` | Coluna de ações de cada linha da tabela (ao lado de "Editar"/"Excluir", por exemplo) |
| `ActionSceneEnum.both` | Aparece nos dois cenários |

### Clico no botão de ação e nada acontece

Confirme que `on` em `registerFlow` está definido como `'click'`:

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // 监听按钮点击
  steps: {
    doSomething: {
      async handler(ctx) {
        // 你的逻辑
      },
    },
  },
});
```

:::warning Atenção

O `uiSchema` em `registerFlow` é a UI do painel de configuração (estado de configuração), não uma modal em tempo de execução. Se você quer abrir um formulário ao clicar no botão, use `ctx.viewer.dialog()` dentro do `handler` para abrir a modal.

:::

## Internacionalização

### A tradução não funciona

Causas mais comuns:

- **Primeira vez** adicionando o diretório `src/locale/` ou um arquivo — é preciso reiniciar a aplicação
- **Chave de tradução inconsistente** — confirme que a chave coincide exatamente com a string no código, atenção a espaços e maiúsculas/minúsculas
- **Em componentes, está usando `ctx.t()` diretamente** — `ctx.t()` não injeta automaticamente o namespace do plugin; em componentes, use o hook `useT()` (importado de `locale.ts`)

### Confusão entre `tExpr()`, `useT()` e `this.t()`

Esses três métodos de tradução têm cenários diferentes; usá-los no lugar errado dá erro ou tradução sem efeito:

| Método | Onde usar | Descrição |
| --- | --- | --- |
| `tExpr()` | Definições estáticas como `define()`, `registerFlow()` | No carregamento do módulo, o i18n ainda não foi inicializado; usa tradução adiada |
| `useT()` | Dentro de componentes React | Retorna a função de tradução já vinculada ao namespace do plugin |
| `this.t()` | Dentro do `load()` do Plugin | Injeta automaticamente o nome do pacote do plugin como namespace |

Veja [i18n internacionalização](../component/i18n) para detalhes.

## Requisições de API

### Requisição retorna 403 Forbidden

Geralmente o ACL no servidor não foi configurado. Por exemplo, se a sua collection é `todoItems`, é preciso permitir as ações correspondentes em `load()` no plugin do servidor:

```ts
// 只允许查询
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// 允许完整增删改查
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` indica que usuários logados podem acessar. Sem `acl.allow`, por padrão, somente administradores podem operar.

### Requisição retorna 404 Not Found

Verifique na seguinte ordem:

- Se estiver usando `defineCollection`, confirme que o nome da collection está escrito corretamente
- Se estiver usando `resourceManager.define`, confirme o nome do resource e da action
- Confira o formato da URL — o formato da API do NocoBase é `resourceName:actionName`, por exemplo `todoItems:list`, `externalApi:get`

## Build e deploy

### `yarn build --tar` falha com "no paths specified to add to archive"

Ao executar `yarn build <pluginName> --tar`, ocorre o erro:

```bash
TypeError: no paths specified to add to archive
```

Mas executando `yarn build <pluginName>` (sem `--tar`) funciona normalmente.

Esse problema costuma acontecer porque o `.npmignore` do plugin **usa sintaxe negativa** (prefixo `!` do npm). Ao empacotar com `--tar`, o NocoBase lê cada linha do `.npmignore` e prefixa com `!` para converter em padrões de exclusão do `fast-glob`. Se o seu `.npmignore` já usa sintaxe negativa, por exemplo:

```
*
!dist
!package.json
```

após o processamento vira `['!*', '!!dist', '!!package.json', '**/*']`. Aqui, `!*` exclui todos os arquivos do nível raiz (incluindo `package.json`), e `!!dist` não é interpretado pelo `fast-glob` como "reincluir dist" — a negação não funciona. Se o diretório `dist/` estiver vazio ou se o build não produzir arquivos, a lista final coletada fica vazia, e o `tar` lança esse erro.

**Solução:** não use sintaxe negativa no `.npmignore`; liste apenas os diretórios a excluir:

```
/node_modules
/src
```

A lógica de empacotamento converte isso em padrões de exclusão (`!./node_modules`, `!./src`) e adiciona `**/*` para casar com todos os outros arquivos. É simples e evita os problemas com a negação.

### Plugin enviado para produção falha ao ativar (funciona localmente)

Em desenvolvimento local o plugin funciona, mas após enviar para produção pelo "Gerenciador de plugins" e ativá-lo, o log mostra um erro como:

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

Esse problema costuma ocorrer porque o **plugin empacotou dependências internas do NocoBase em seu próprio `node_modules/`**. O sistema de build do NocoBase mantém uma [lista external](../../dependency-management); pacotes nessa lista (como `react`, `antd`, `axios`, `lodash` etc.) são fornecidos pelo host do NocoBase e não devem ser empacotados no plugin. Se o plugin trouxer uma cópia privada, em tempo de execução pode haver conflito com a versão já carregada pelo host, causando erros estranhos.

**Por que localmente funciona:** durante o desenvolvimento local, o plugin está em `packages/plugins/` sem `node_modules/` privado; as dependências são resolvidas para a versão já carregada na raiz do projeto, sem conflito.

**Solução:** mova as `dependencies` do `package.json` do plugin para `devDependencies` — o sistema de build do NocoBase trata as dependências do plugin automaticamente:

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

Em seguida, reconstrua e empacote. Assim, `dist/node_modules/` do plugin não conterá esses pacotes, e em tempo de execução será usada a versão fornecida pelo host do NocoBase.

:::tip Princípio geral

O sistema de build do NocoBase mantém uma [lista external](../../dependency-management); pacotes nessa lista (como `react`, `antd`, `axios`, `lodash` etc.) são fornecidos pelo host do NocoBase e não devem ser empacotados pelo plugin. Todas as dependências do plugin devem ficar em `devDependencies`; o sistema de build decide automaticamente quais empacotar em `dist/node_modules/` e quais ficam por conta do host.

:::

## Links relacionados

- [Plugin](../plugin) — entrada do plugin e ciclo de vida
- [Router de rotas](../router) — registro de rotas e prefixo `/v2`
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel
- [FlowEngine → Extensão de blocos](../flow-engine/block) — BlockModel, TableBlockModel, filterCollection
- [FlowEngine → Extensão de campos](../flow-engine/field) — FieldModel, bindModelToInterface
- [FlowEngine → Extensão de ações](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n internacionalização](../component/i18n) — arquivos de tradução, useT, uso de tExpr
- [Context → Capacidades comuns](../ctx/common-capabilities) — ctx.api, ctx.viewer etc.
- [Server → Collections](../../server/collections) — defineCollection e addCollection
- [Server → Controle de permissões ACL](../../server/acl) — configuração de permissões de API
- [Build de plugin](../../build) — configuração de build, lista external, fluxo de empacotamento
