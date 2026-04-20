:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/form).
:::

# ctx.form

A instância do Ant Design Form dentro do bloco atual, usada para ler/escrever campos de formulário, disparar validação e submissão. É equivalente a `ctx.blockModel?.form` e pode ser usada diretamente em blocos relacionados a formulários (Formulário, Formulário de Edição, Subformulário, etc.).

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **JSField** | Ler/escrever outros campos do formulário para implementar vinculação (linkage), ou realizar cálculos e validações baseados em outros valores de campos. |
| **JSItem** | Ler/escrever campos da mesma linha ou outros campos em itens de sub-tabelas para obter vinculação dentro da tabela. |
| **JSColumn** | Ler os valores da linha atual ou de campos associados em uma coluna de tabela para renderização. |
| **Ações de Formulário / Fluxo de Trabalho** | Validação pré-submissão, atualização de campos em lote, redefinição de formulários, etc. |

> Nota: `ctx.form` está disponível apenas em contextos RunJS relacionados a blocos de formulário (Formulário, Formulário de Edição, Subformulário, etc.). Ele pode não existir em cenários que não sejam de formulário (como JSBlocks independentes ou blocos de Tabela). Recomenda-se realizar uma verificação de valor nulo antes do uso: `ctx.form?.getFieldsValue()`.

## Definição de Tipo

```ts
form: FormInstance<any>;
```

`FormInstance` é o tipo de instância do Ant Design Form. Os métodos comuns são os seguintes.

## Métodos Comuns

### Lendo Valores do Formulário

```ts
// Lê os valores dos campos atualmente registrados (por padrão, apenas campos renderizados)
const values = ctx.form.getFieldsValue();

// Lê os valores de todos os campos (incluindo campos registrados mas não renderizados, ex: ocultos ou dentro de seções colapsadas)
const allValues = ctx.form.getFieldsValue(true);

// Lê um único campo
const email = ctx.form.getFieldValue('email');

// Lê campos aninhados (ex: em uma sub-tabela)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Escrevendo Valores no Formulário

```ts
// Atualização em lote (comumente usada para vinculação/linkage)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Atualiza um único campo
ctx.form.setFieldValue('remark', 'Observação atualizada');
```

### Validação e Submissão

```ts
// Dispara a validação do formulário
await ctx.form.validateFields();

// Dispara a submissão do formulário
ctx.form.submit();
```

### Redefinição (Reset)

```ts
// Redefine todos os campos
ctx.form.resetFields();

// Redefine apenas campos específicos
ctx.form.resetFields(['status', 'remark']);
```

## Relação com Contextos Relacionados

### ctx.getValue / ctx.setValue

| Cenário | Uso Recomendado |
|------|----------|
| **Ler/Escrever campo atual** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Ler/Escrever outros campos** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Dentro do campo JS atual, priorize o uso de `getValue`/`setValue` para ler/escrever o próprio campo; use `ctx.form` quando precisar acessar outros campos.

### ctx.blockModel

| Necessidade | Uso Recomendado |
|------|----------|
| **Ler/Escrever campos de formulário** | `ctx.form` (Equivalente a `ctx.blockModel?.form`, mais conveniente) |
| **Acessar bloco pai** | `ctx.blockModel` (Contém `coleção`, `recurso`, etc.) |

### ctx.getVar('ctx.formValues')

Os valores do formulário devem ser obtidos via `await ctx.getVar('ctx.formValues')` e não são expostos diretamente como `ctx.formValues`. Em um contexto de formulário, é preferível usar `ctx.form.getFieldsValue()` para ler os valores mais recentes em tempo real.

## Observações

- `getFieldsValue()` retorna apenas campos renderizados por padrão. Para incluir campos não renderizados (ex: em seções colapsadas ou ocultos por regras condicionais), passe `true`: `getFieldsValue(true)`.
- Caminhos para campos aninhados, como sub-tabelas, são arrays, ex: `['orders', 0, 'amount']`. Você pode usar `ctx.namePath` para obter o caminho do campo atual e construir caminhos para outras colunas na mesma linha.
- `validateFields()` lança um objeto de erro contendo `errorFields` e outras informações. Se a validação falhar antes da submissão, você pode usar `ctx.exit()` para interromper as etapas subsequentes.
- Em cenários assíncronos, como fluxos de trabalho ou regras de vinculação, o `ctx.form` pode ainda não estar pronto. Recomenda-se usar encadeamento opcional (optional chaining) ou verificações de nulo.

## Exemplos

### Vinculação de Campo: Exibir conteúdo diferente com base no tipo

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Calcular campo atual com base em outros campos

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Ler/Escrever outras colunas na mesma linha dentro de uma sub-tabela

```ts
// ctx.namePath é o caminho do campo atual no formulário, ex: ['orders', 0, 'amount']
// Ler 'status' na mesma linha: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validação Pré-submissão

```ts
try {
  await ctx.form.validateFields();
  // Validação passou, continuar com a lógica de submissão
} catch (e) {
  ctx.message.error('Por favor, verifique os campos do formulário');
  ctx.exit();
}
```

### Submeter após Confirmação

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirmar Submissão',
  content: 'Você não poderá modificar isso após a submissão. Continuar?',
  okText: 'Confirmar',
  cancelText: 'Cancelar',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Interrompe se o usuário cancelar
}
```

## Relacionados

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Ler e escrever o valor do campo atual.
- [ctx.blockModel](./block-model.md): Modelo do bloco pai; `ctx.form` é equivalente a `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Diálogos de confirmação, frequentemente usados com `ctx.form.validateFields()` e `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Interrompe o processo em caso de falha na validação ou cancelamento do usuário.
- `ctx.namePath`: O caminho (array) do campo atual no formulário, usado para construir nomes para `getFieldValue` / `setFieldValue` em campos aninhados.