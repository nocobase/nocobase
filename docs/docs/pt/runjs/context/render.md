:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/render).
:::

# ctx.render()

Renderiza elementos React, strings HTML ou nós DOM em um contêiner especificado. Se o `container` não for fornecido, o padrão é renderizar no `ctx.element` e herdar automaticamente o contexto da aplicação, como ConfigProvider e temas.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSBlock** | Renderiza conteúdo personalizado de blocos (gráficos, listas, cartões, etc.) |
| **JSField / JSItem / JSColumn** | Renderiza exibições personalizadas para campos editáveis ou colunas de tabela |
| **Bloco de detalhes** | Personaliza o formato de exibição de campos em páginas de detalhes |

> Nota: `ctx.render()` requer um contêiner de renderização. Se o `container` não for passado e o `ctx.element` não existir (por exemplo, em cenários de lógica pura sem uma UI), um erro será lançado.

## Definição de tipo

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Conteúdo a ser renderizado |
| `container` | `Element` \| `DocumentFragment` (Opcional) | Contêiner de renderização de destino, o padrão é `ctx.element` |

**Valor de retorno**:

- Ao renderizar um **elemento React**: Retorna `ReactDOMClient.Root`, facilitando a chamada de `root.render()` para atualizações subsequentes.
- Ao renderizar uma **string HTML** ou **nó DOM**: Retorna `null`.

## Descrição do tipo vnode

| Tipo | Comportamento |
|------|------|
| `React.ReactElement` (JSX) | Renderizado usando o `createRoot` do React, fornecendo recursos completos do React e herdando automaticamente o contexto da aplicação. |
| `string` | Define o `innerHTML` do contêiner após a sanitização com DOMPurify; qualquer raiz React existente será desmontada primeiro. |
| `Node` (Element, Text, etc.) | Adiciona via `appendChild` após limpar o contêiner; qualquer raiz React existente será desmontada primeiro. |
| `DocumentFragment` | Adiciona nós filhos do fragmento ao contêiner; qualquer raiz React existente será desmontada primeiro. |

## Exemplos

### Renderizando elementos React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Título')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicou'))}>
      {ctx.t('Botão')}
    </Button>
  </Card>
);
```

### Renderizando strings HTML

```ts
ctx.render('<h1>Olá Mundo</h1>');

// Combinando com ctx.t para internacionalização
ctx.render('<div style="padding:16px">' + ctx.t('Conteúdo') + '</div>');

// Renderização condicional
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Sem dados') + '</span>');
```

### Renderizando nós DOM

```ts
const div = document.createElement('div');
div.textContent = 'Olá Mundo';
ctx.render(div);

// Renderiza um contêiner vazio primeiro, depois o entrega a uma biblioteca de terceiros (ex: ECharts) para inicialização
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Especificando um contêiner personalizado

```ts
// Renderiza em um elemento DOM específico
const customEl = document.getElementById('meu-conteiner');
ctx.render(<div>Conteúdo</div>, customEl);
```

### Chamadas múltiplas substituirão o conteúdo

```ts
// A segunda chamada substituirá o conteúdo existente no contêiner
ctx.render(<div>Primeira</div>);
ctx.render(<div>Segunda</div>);  // Apenas "Segunda" será exibido
```

## Observações

- **Chamadas múltiplas substituirão o conteúdo**: Cada chamada de `ctx.render()` substitui o conteúdo existente no contêiner em vez de anexá-lo.
- **Segurança de strings HTML**: O HTML passado é sanitizado via DOMPurify para reduzir riscos de XSS, mas ainda é recomendado evitar a concatenação de entradas de usuários não confiáveis.
- **Não manipule ctx.element diretamente**: `ctx.element.innerHTML` está obsoleto; o `ctx.render()` deve ser usado de forma consistente em seu lugar.
- **Passe o contêiner quando não houver um padrão**: Em cenários onde `ctx.element` é `undefined` (por exemplo, dentro de módulos carregados via `ctx.importAsync`), um `container` deve ser fornecido explicitamente.

## Relacionado

- [ctx.element](./element.md) - Contêiner de renderização padrão, usado quando nenhum contêiner é passado para `ctx.render()`.
- [ctx.libs](./libs.md) - Bibliotecas integradas como React e Ant Design, usadas para renderização JSX.
- [ctx.importAsync()](./import-async.md) - Usado em conjunto com `ctx.render()` após carregar bibliotecas externas de React/componentes sob demanda.