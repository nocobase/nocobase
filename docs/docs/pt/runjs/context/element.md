:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/element).
:::

# ctx.element

Uma instância de `ElementProxy` que aponta para o contêiner DOM do sandbox, servindo como o alvo de renderização padrão para `ctx.render()`. Está disponível em cenários onde existe um contêiner de renderização, como `JSBlock`, `JSField`, `JSItem` e `JSColumn`.

## Cenários de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock** | O contêiner DOM do bloco, usado para renderizar conteúdo personalizado do bloco. |
| **JSField / JSItem / FormJSFieldItem** | O contêiner de renderização para um campo ou item de formulário (geralmente um `<span>`). |
| **JSColumn** | O contêiner DOM para uma célula de tabela, usado para renderizar conteúdo personalizado da coluna. |

> Observação: `ctx.element` só está disponível em contextos RunJS que possuem um contêiner de renderização. Em contextos sem UI (como lógica puramente de backend), ele pode ser `undefined`. Recomenda-se realizar uma verificação de valor nulo antes do uso.

## Definição de Tipo

```typescript
element: ElementProxy | undefined;

// ElementProxy é um proxy para o HTMLElement original, expondo uma API segura
class ElementProxy {
  __el: HTMLElement;  // O elemento DOM nativo interno (acessível apenas em cenários específicos)
  innerHTML: string;  // Sanitizado via DOMPurify durante a leitura/escrita
  outerHTML: string; // Idem ao anterior
  appendChild(child: HTMLElement | string): void;
  // Outros métodos de HTMLElement são repassados (o uso direto não é recomendado)
}
```

## Requisitos de Segurança

**Recomendado: Toda renderização deve ser realizada via `ctx.render()`.** Evite usar as APIs DOM de `ctx.element` diretamente (ex: `innerHTML`, `appendChild`, `querySelector`, etc.).

### Por que ctx.render() é recomendado

| Vantagem | Descrição |
|------|------|
| **Segurança** | Controle de segurança centralizado para evitar XSS e operações DOM inadequadas. |
| **Suporte ao React** | Suporte completo para JSX, componentes React e ciclos de vida. |
| **Herança de Contexto** | Herda automaticamente o `ConfigProvider` da aplicação, temas, etc. |
| **Tratamento de Conflitos** | Gerencia automaticamente a criação/desmontagem da raiz React para evitar conflitos de múltiplas instâncias. |

### ❌ Não recomendado: Manipulação direta de ctx.element

```ts
// ❌ Não recomendado: Usar APIs de ctx.element diretamente
ctx.element.innerHTML = '<div>Conteúdo</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` está depreciado. Por favor, use `ctx.render()` em seu lugar.

### ✅ Recomendado: Usar ctx.render()

```ts
// ✅ Renderizando um componente React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Bem-vindo')}>
    <Button type="primary">Clique aqui</Button>
  </Card>
);

// ✅ Renderizando uma string HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Conteúdo') + '</div>');

// ✅ Renderizando um nó DOM
const div = document.createElement('div');
div.textContent = ctx.t('Olá');
ctx.render(div);
```

## Caso Especial: Como âncora de Popover

Quando você precisar abrir um Popover usando o elemento atual como âncora, você pode acessar `ctx.element?.__el` para obter o DOM nativo como `target`:

```ts
// ctx.viewer.popover requer um DOM nativo como target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Conteúdo do Popover</div>,
});
```

> Use `__el` apenas em cenários como "usar o contêiner atual como âncora"; não manipule o DOM diretamente em outros casos.

## Relação com ctx.render

- Se `ctx.render(vnode)` for chamado sem um argumento `container`, ele renderiza no contêiner `ctx.element` por padrão.
- Se tanto `ctx.element` estiver ausente quanto nenhum `container` for fornecido, um erro será lançado.
- Você pode especificar explicitamente um contêiner: `ctx.render(vnode, customContainer)`.

## Observações

- `ctx.element` destina-se ao uso interno pelo `ctx.render()`. Acessar ou modificar suas propriedades/métodos diretamente não é recomendado.
- Em contextos sem contêiner de renderização, `ctx.element` será `undefined`. Certifique-se de que o contêiner está disponível ou passe um `container` manualmente antes de chamar `ctx.render()`.
- Embora `innerHTML`/`outerHTML` no `ElementProxy` sejam sanitizados via DOMPurify, ainda é recomendado usar `ctx.render()` para um gerenciamento de renderização unificado.

## Relacionado

- [ctx.render](./render.md): Renderizar conteúdo em um contêiner
- [ctx.view](./view.md): Controlador de visualização atual
- [ctx.modal](./modal.md): API de atalho para modais