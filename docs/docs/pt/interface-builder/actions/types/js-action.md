:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/actions/types/js-action).
:::

# JS Action

## Introdução

JS Action é usado para executar JavaScript quando um botão é clicado, personalizando qualquer comportamento de negócio. Pode ser usado em barras de ferramentas de formulário, barras de ferramentas de tabela (nível de coleção), linhas de tabela (nível de registro), etc., para realizar operações como validação, avisos, chamadas de API, abrir janelas pop-up/gavetas, atualizar dados, etc.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API de Contexto de Tempo de Execução (Comumente Usada)

- `ctx.api.request(options)`: Faz uma requisição HTTP;
- `ctx.openView(viewUid, options)`: Abre uma visão configurada (gaveta/diálogo/página);
- `ctx.message` / `ctx.notification`: Avisos e notificações globais;
- `ctx.t()` / `ctx.i18n.t()`: Internacionalização;
- `ctx.resource`: Recurso de dados do contexto de nível de coleção (ex: barra de ferramentas de tabela, incluindo `getSelectedRows()`, `refresh()`, etc.);
- `ctx.record`: Registro da linha atual do contexto de nível de registro (ex: botão de linha de tabela);
- `ctx.form`: Instância do AntD Form do contexto de nível de formulário (ex: botão da barra de ferramentas de formulário);
- `ctx.collection`: Metadados da coleção atual;
- O editor de código suporta fragmentos `Snippets` e pré-execução `Run` (veja abaixo).


- `ctx.requireAsync(url)`: Carrega bibliotecas AMD/UMD assincronamente via URL;
- `ctx.importAsync(url)`: Importa módulos ESM dinamicamente via URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Bibliotecas integradas como React / ReactDOM / Ant Design / ícones do Ant Design / dayjs / lodash / math.js / formula.js, etc., usadas para renderização JSX, processamento de tempo, manipulação de dados e operações matemáticas.

> As variáveis reais disponíveis variam de acordo com a posição do botão. A lista acima é uma visão geral das capacidades comuns.

## Editor e Fragmentos

- `Snippets`: Abre a lista de fragmentos de código integrados, que podem ser pesquisados e inseridos na posição atual do cursor com um clique.
- `Run`: Executa o código atual diretamente e envia os logs de execução para o painel `Logs` na parte inferior; suporta `console.log/info/warn/error` e localização de erros com destaque.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Pode ser combinado com funcionários de IA para gerar/modificar scripts: [Funcionário de IA · Nathan: Engenheiro Frontend](/ai-employees/features/built-in-employee)

## Uso Comum (Exemplos Simplificados)

### 1) Requisição de API e aviso

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Botão de coleção: Validar seleção e processar

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Executar lógica de negócio…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Botão de registro: Ler o registro da linha atual

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Abrir visão (gaveta/diálogo)

```js
const popupUid = ctx.model.uid + '-open'; // Vincula ao botão atual para estabilidade
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Atualizar dados após o envio

```js
// Atualização geral: Prioriza recursos de tabela/lista, depois o recurso do bloco que contém o formulário
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Observações

- Comportamento idempotente: Evite envios múltiplos causados por cliques repetidos; você pode adicionar um interruptor de estado ou desativar o botão na lógica.
- Tratamento de erros: Adicione try/catch para chamadas de API e forneça avisos ao usuário.
- Ligação de visão: Ao abrir janelas pop-up/gavetas via `ctx.openView`, recomenda-se passar parâmetros explicitamente e, se necessário, atualizar ativamente o recurso pai após o sucesso do envio.

## Documentos Relacionados

- [Variáveis e contexto](/interface-builder/variables)
- [Regras de ligação](/interface-builder/linkage-rule)
- [Visões e janelas pop-up](/interface-builder/actions/types/view)