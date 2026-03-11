:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/set-value).
:::

# ctx.setValue()

Define o valor do campo atual em cenários de campos editáveis, como JSField e JSItem. Combinado com `ctx.getValue()`, permite a vinculação bidirecional (two-way binding) com o formulário.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSField** | Escreve valores selecionados pelo usuário ou calculados em campos personalizados editáveis. |
| **JSItem** | Atualiza o valor da célula atual em itens editáveis de tabelas ou subtabelas. |
| **JSColumn** | Atualiza o valor do campo da linha correspondente com base na lógica durante a renderização da coluna da tabela. |

> **Nota**: `ctx.setValue(v)` está disponível apenas em contextos RunJS com vinculação de formulário. Ele não está disponível em cenários sem vinculação de campo, como fluxos de trabalho, regras de ligação ou JSBlock. Recomenda-se o uso de encadeamento opcional (optional chaining) antes do uso: `ctx.setValue?.(value)`.

## Definição de tipo

```ts
setValue<T = any>(value: T): void;
```

- **Parâmetros**: `value` é o valor do campo a ser gravado. O tipo é determinado pelo tipo de item de formulário do campo.

## Comportamento

- `ctx.setValue(v)` atualiza o valor do campo atual no Ant Design Form e aciona a lógica de ligação e validação do formulário relacionada.
- Se o formulário ainda não terminou de renderizar ou o campo não estiver registrado, a chamada pode ser ineficaz. Recomenda-se usar `ctx.getValue()` para confirmar o resultado da gravação.

## Exemplos

### Vinculação bidirecional com getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Definindo valores padrão com base em condições

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Gravando de volta no campo atual quando vinculado a outros campos

```ts
// Atualiza o campo atual de forma síncrona quando outro campo for alterado
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Personalizado', value: 'custom' });
}
```

## Observações

- Em campos não editáveis (ex: JSField em modo de leitura, JSBlock), `ctx.setValue` pode ser `undefined`. Recomenda-se usar `ctx.setValue?.(value)` para evitar erros.
- Ao definir valores para campos de associação (M2O, O2M, etc.), você precisa passar uma estrutura que corresponda ao tipo do campo (ex: `{ id, [titleField]: label }`), dependendo da configuração específica do campo.

## Relacionados

- [ctx.getValue()](./get-value.md) - Obtém o valor do campo atual, usado com setValue para vinculação bidirecional.
- [ctx.form](./form.md) - Instância do Ant Design Form, usada para ler ou escrever em outros campos.
- `js-field:value-change` - Um evento de contêiner acionado quando um valor externo é alterado, usado para atualizar a exibição.