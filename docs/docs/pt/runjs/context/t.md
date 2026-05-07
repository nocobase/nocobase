:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/t).
:::

# ctx.t()

Uma função de atalho de i18n usada no RunJS para traduzir textos com base nas configurações de idioma do contexto atual. É adequada para a internacionalização de textos em linha, como botões, títulos e avisos.

## Casos de Uso

O `ctx.t()` pode ser usado em todos os ambientes de execução do RunJS.

## Definição de Tipo

```ts
t(key: string, options?: Record<string, any>): string
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-------------|
| `key` | `string` | Chave de tradução ou template com espaços reservados (ex: `Olá {{name}}`, `{{count}} linhas`). |
| `options` | `object` | Opcional. Variáveis de interpolação (ex: `{ name: 'João', count: 5 }`) ou opções de i18n (ex: `defaultValue`, `ns`). |

## Valor de Retorno

- Retorna a string traduzida. Se não houver tradução para a chave e nenhum `defaultValue` for fornecido, poderá retornar a própria chave ou a string interpolada.

## Namespace (ns)

O **namespace padrão para o ambiente RunJS é `runjs`**. Quando o `ns` não é especificado, o `ctx.t(key)` procurará a chave no namespace `runjs`.

```ts
// Busca a chave no namespace 'runjs' por padrão
ctx.t('Submit'); // Equivalente a ctx.t('Submit', { ns: 'runjs' })

// Busca a chave em um namespace específico
ctx.t('Submit', { ns: 'myModule' });

// Pesquisa em vários namespaces sequencialmente (primeiro 'runjs', depois 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Exemplos

### Chave simples

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Com variáveis de interpolação

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Textos dinâmicos (ex: tempo relativo)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Especificando um namespace

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Observações

- **Plugin de Localização**: Para traduzir textos, o plugin de Localização deve estar ativado. Chaves de tradução ausentes serão extraídas automaticamente para a lista de gerenciamento de localização para manutenção e tradução unificadas.
- Suporta interpolação no estilo i18next: use `{{nomeDaVariavel}}` na chave e passe a variável correspondente em `options` para substituí-la.
- O idioma é determinado pelo contexto atual (ex: `ctx.i18n.language`, localidade do usuário).

## Relacionado

- [ctx.i18n](./i18n.md): Ler ou alternar idiomas