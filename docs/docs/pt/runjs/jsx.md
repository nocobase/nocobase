:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/jsx).
:::

# JSX

O RunJS suporta a sintaxe JSX, permitindo que você escreva código de forma semelhante a componentes React. O JSX é compilado automaticamente antes da execução.

## Notas de compilação

- Usa o [sucrase](https://github.com/alangpierce/sucrase) para transformar o JSX.
- O JSX é compilado em `ctx.libs.React.createElement` e `ctx.libs.React.Fragment`.
- **Não é necessário importar o React**: Você pode escrever JSX diretamente; ele usará automaticamente o `ctx.libs.React` após a compilação.
- Ao carregar um React externo via `ctx.importAsync('react@x.x.x')`, o JSX passará a usar o método `createElement` dessa instância específica.

## Usando React e componentes integrados

O RunJS inclui o React e bibliotecas de UI comuns de forma integrada. Você pode acessá-los diretamente via `ctx.libs` sem usar `import`:

- **ctx.libs.React** — Núcleo do React
- **ctx.libs.ReactDOM** — ReactDOM (pode ser usado com `createRoot`, se necessário)
- **ctx.libs.antd** — Componentes do Ant Design
- **ctx.libs.antdIcons** — Ícones do Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Clique</Button>);
```

Ao escrever JSX diretamente, você não precisa desestruturar o React. Você só precisa desestruturar de `ctx.libs` ao usar **Hooks** (como `useState`, `useEffect`) ou **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Contagem: {count}</div>;
};

ctx.render(<Counter />);
```

**Nota**: O React integrado e o React externo importado via `ctx.importAsync()` **não podem ser misturados**. Se você usar uma biblioteca de UI externa, o React também deve ser importado da mesma fonte externa.

## Usando React e componentes externos

Ao carregar uma versão específica do React e de bibliotecas de UI via `ctx.importAsync()`, o JSX usará essa instância do React:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Clique</Button>);
```

Se o antd depender de react/react-dom, você pode especificar a mesma versão via `deps` para evitar múltiplas instâncias:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Botão</Button>);
```

**Nota**: Ao usar um React externo, bibliotecas de UI como o antd também devem ser importadas via `ctx.importAsync()`. Não as misture com `ctx.libs.antd`.

## Pontos principais da sintaxe JSX

- **Componentes e props**: `<Button type="primary">Texto</Button>`
- **Fragment**: `<>...</>` ou `<React.Fragment>...</React.Fragment>` (requer a desestruturação de `const { React } = ctx.libs` ao usar Fragment)
- **Expressões**: Use `{expressão}` no JSX para inserir variáveis ou operações, como `{ctx.user.name}` ou `{count + 1}`. Não use a sintaxe de template `{{ }}`.
- **Renderização condicional**: `{flag && <span>Conteúdo</span>}` ou `{flag ? <A /> : <B />}`
- **Renderização de listas**: Use `array.map()` para retornar uma lista de elementos e garanta que cada elemento tenha uma `key` estável.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```