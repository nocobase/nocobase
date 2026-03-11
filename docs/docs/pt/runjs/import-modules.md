:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/import-modules).
:::

# Importando módulos

No RunJS, você pode usar dois tipos de módulos: **módulos integrados** (acessados diretamente via `ctx.libs`, sem necessidade de import) e **módulos externos** (carregados sob demanda via `ctx.importAsync()` ou `ctx.requireAsync()`).

---

## Módulos integrados - ctx.libs (sem necessidade de import)

O RunJS inclui várias bibliotecas integradas que podem ser acessadas diretamente através de `ctx.libs`. Você **não** precisa usar `import` ou carregamento assíncrono para elas.

| Propriedade | Descrição |
|------|------|
| **ctx.libs.React** | React core, usado para JSX e Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (pode ser usado para `createRoot`, etc.) |
| **ctx.libs.antd** | Biblioteca de componentes Ant Design |
| **ctx.libs.antdIcons** | Ícones do Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Expressões matemáticas, operações de matriz, etc. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Fórmulas estilo Excel (SUM, AVERAGE, etc.) |

### Exemplo: React e antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Clique aqui</Button>);
```

### Exemplo: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Exemplo: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Módulos externos

Quando você precisar de bibliotecas de terceiros, escolha o método de carregamento com base no formato do módulo:

- **Módulos ESM** → Use `ctx.importAsync()`
- **Módulos UMD/AMD** → Use `ctx.requireAsync()`

---

### Importando módulos ESM

Use **`ctx.importAsync()`** para carregar dinamicamente módulos ESM por URL. Isso é adequado para cenários como blocos JS, campos JS e ações JS.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: O endereço do módulo ESM. Suporta formatos curtos como `<pacote>@<versão>` ou subcaminhos como `<pacote>@<versão>/<caminho-do-arquivo>` (ex: `vue@3.4.0`, `lodash@4/lodash.js`). Estes serão prefixados com a URL base do CDN configurada. URLs completas também são suportadas.
- **Retorno**: O objeto de namespace do módulo resolvido.

#### Padrão: https://esm.sh

Se não houver configuração, as formas curtas usarão **https://esm.sh** como prefixo do CDN. Por exemplo:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalente ao carregamento de https://esm.sh/vue@3.4.0
```

#### Serviço esm.sh auto-hospedado

Se você precisar usar uma rede interna ou um CDN próprio, pode implantar um serviço compatível com o protocolo esm.sh e especificá-lo via variáveis de ambiente:

- **ESM_CDN_BASE_URL**: URL base do CDN ESM (padrão `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Sufixo opcional (ex: `/+esm` para jsDelivr)

Para auto-hospedagem, consulte: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importando módulos UMD/AMD

Use **`ctx.requireAsync()`** para carregar assincronamente módulos UMD/AMD ou scripts que se anexam ao objeto global.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Suporta duas formas:
  - **Caminho curto**: `<pacote>@<versão>/<caminho-do-arquivo>`, semelhante ao `ctx.importAsync()`, resolvido de acordo com a configuração atual do CDN ESM. Ao resolver, `?raw` é anexado para solicitar o arquivo original diretamente (geralmente uma build UMD). Por exemplo, `echarts@5/dist/echarts.min.js` na verdade solicita `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (quando o esm.sh padrão é usado).
  - **URL completa**: Qualquer endereço de CDN completo (ex: `https://cdn.jsdelivr.net/npm/xxx`).
- **Retorno**: O objeto da biblioteca carregada (a forma específica depende de como a biblioteca exporta seu conteúdo).

Após o carregamento, muitas bibliotecas UMD se anexam ao objeto global (ex: `window.xxx`). Você pode usá-las conforme descrito na documentação da biblioteca.

**Exemplo**

```ts
// Caminho curto (resolvido via esm.sh como ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL completa
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Nota**: Se uma biblioteca fornecer uma versão ESM, prefira usar `ctx.importAsync()` para obter melhor semântica de módulo e Tree-shaking.