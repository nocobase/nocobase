:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/get-value).
:::

# ctx.getValue()

Em cenários de campos editáveis, como JSField e JSItem, use isso para obter o valor mais recente do campo atual. Combinado com `ctx.setValue(v)`, ele permite a vinculação bidirecional (two-way binding) com o formulário.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSField** | Lê a entrada do usuário ou o valor atual do formulário em campos personalizados editáveis. |
| **JSItem** | Lê o valor da célula atual em itens editáveis de tabelas/subtabelas. |
| **JSColumn** | Lê o valor do campo da linha correspondente durante a renderização da coluna da tabela. |

> **Nota**: `ctx.getValue()` está disponível apenas em contextos RunJS com vinculação de formulário; ele não existe em cenários sem vinculação de campo, como fluxos de trabalho ou regras de ligação.

## Definição de Tipo

```ts
getValue<T = any>(): T | undefined;
```

- **Valor de retorno**: O valor atual do campo, cujo tipo é determinado pelo tipo de item de formulário do campo; pode ser `undefined` se o campo não estiver registrado ou não estiver preenchido.

## Ordem de busca

O `ctx.getValue()` busca os valores na seguinte ordem:

1. **Estado do Formulário**: Prioriza a leitura do estado atual do Ant Design Form.
2. **Valor de Fallback**: Se o campo não estiver no formulário, ele recorre ao valor inicial ou às propriedades (props) do campo.

> Se o formulário ainda não terminou de renderizar ou o campo não estiver registrado, ele pode retornar `undefined`.

## Exemplos

### Renderizar com base no valor atual

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Por favor, insira o conteúdo primeiro</span>);
} else {
  ctx.render(<span>Valor atual: {current}</span>);
}
```

### Vinculação bidirecional com setValue

```tsx
const { Input } = ctx.libs.antd;

// Lê o valor atual como valor padrão
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Relacionados

- [ctx.setValue()](./set-value.md) - Define o valor do campo atual, usado com `getValue` para vinculação bidirecional.
- [ctx.form](./form.md) - Instância do Ant Design Form, para ler/escrever em outros campos.
- `js-field:value-change` - Evento de contêiner acionado quando valores externos mudam, usado para atualizar a exibição.