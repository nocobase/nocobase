:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Ação JS

## Introdução

A Ação JS é usada para executar JavaScript quando um botão é clicado, permitindo que você personalize qualquer comportamento de negócio. Ela pode ser utilizada em barras de ferramentas de formulários, barras de ferramentas de tabelas (nível de **coleção**), linhas de tabelas (nível de registro) e outros locais para realizar operações como validação, exibir notificações, fazer chamadas de API, abrir pop-ups/gavetas e atualizar dados.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API de Contexto de Tempo de Execução (Comumente Usada)

- `ctx.api.request(options)`: Faz uma requisição HTTP;
- `ctx.openView(viewUid, options)`: Abre uma visualização configurada (gaveta/diálogo/página);
- `ctx.message` / `ctx.notification`: Mensagens e notificações globais;
- `ctx.t()` / `ctx.i18n.t()`: Internacionalização;
- `ctx.resource`: Recurso de dados para o contexto de nível de **coleção** (por exemplo, barra de ferramentas da tabela), incluindo métodos como `getSelectedRows()` e `refresh()`;
- `ctx.record`: O registro da linha atual para o contexto de nível de registro (por exemplo, botão de linha da tabela);
- `ctx.form`: A instância do AntD Form para o contexto de nível de formulário (por exemplo, botão da barra de ferramentas do formulário);
- `ctx.collection`: Metadados da **coleção** atual;
- O editor de código suporta `Snippets` (trechos de código) e `Run` (pré-execução) (veja abaixo).

- `ctx.requireAsync(url)`: Carrega assincronamente uma biblioteca AMD/UMD a partir de uma URL;
- `ctx.importAsync(url)`: Importa dinamicamente um módulo ESM a partir de uma URL;

> As variáveis realmente disponíveis podem variar dependendo da localização do botão. A lista acima é uma visão geral das capacidades comuns.

## Editor e Snippets

- `Snippets`: Abre uma lista de trechos de código (snippets) embutidos que podem ser pesquisados e inseridos na posição atual do cursor com um único clique.
- `Run`: Executa o código atual diretamente e exibe os logs de execução no painel `Logs` na parte inferior; ele suporta `console.log/info/warn/error` e destaca erros para fácil localização.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Você pode usar funcionários de IA para gerar/modificar scripts: [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/built-in/ai-coding)

## Uso Comum (Exemplos Simplificados)

### 1) Requisição de API e Notificação

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Botão de Coleção: Validar Seleção e Processar

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Implementar a lógica de negócio…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Botão de Registro: Ler o Registro da Linha Atual

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Abrir Visualização (Gaveta/Diálogo)

```js
const popupUid = ctx.model.uid + '-open'; // Vincula ao botão atual para estabilidade
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Atualizar Dados Após o Envio

```js
// Atualização geral: Prioriza recursos de tabela/lista, depois o recurso do bloco que contém o formulário
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Observações

- **Ações Idempotentes**: Para evitar múltiplos envios causados por cliques repetidos, você pode adicionar um sinalizador de estado na sua lógica ou desabilitar o botão.
- **Tratamento de Erros**: Adicione blocos `try/catch` para chamadas de API e forneça feedback amigável ao usuário.
- **Interação de Visualização**: Ao abrir um pop-up/gaveta com `ctx.openView`, é recomendado passar parâmetros explicitamente e, se necessário, atualizar ativamente o recurso pai após um envio bem-sucedido.

## Documentos Relacionados

- [Variáveis e Contexto](/interface-builder/variables)
- [Regras de Vinculação](/interface-builder/linkage-rule)
- [Visualizações e Pop-ups](/interface-builder/actions/types/view)