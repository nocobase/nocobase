---
title: "AddSubModelButton"
description: "AddSubModelButton: adiciona subModel em um FlowModel especificado, com suporte a menus assíncronos, agrupamento, submenus, filtragem por classe base herdada e formato de alternância."
keywords: "AddSubModelButton,subModel,sub-modelo,FlowModel,FlowEngine,menu assíncrono,menu agrupado"
---

# AddSubModelButton

Usado para adicionar um sub-modelo (subModel) em um `FlowModel` especificado. Suporta múltiplas formas de configuração, como carregamento assíncrono, agrupamento, submenus e regras personalizadas de herança de modelo.

## Props

```ts pure
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `model` | `FlowModel` | **Obrigatório**. O modelo de destino ao qual o sub-modelo será adicionado. |
| `subModelKey` | `string` | **Obrigatório**. O nome da chave do sub-modelo dentro de `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | Tipo da estrutura de dados do sub-modelo. Padrão: `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Definição dos itens de menu. Suporta geração estática ou assíncrona. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Especifica uma classe base; lista todos os modelos que herdam dessa classe como itens de menu. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Especifica múltiplas classes base; lista automaticamente os modelos herdados em grupos. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Callback após a inicialização do sub-modelo. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Callback após o sub-modelo ser adicionado. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Callback após o sub-modelo ser removido. |
| `children` | `React.ReactNode` | Conteúdo do botão; pode ser personalizado como texto ou ícone. |
| `keepDropdownOpen` | `boolean` | Define se o menu suspenso permanece aberto após a adição. Por padrão, fecha automaticamente. |

## Definição do tipo SubModelItem

```ts pure
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  hide?: boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `key` | `string` | Identificador único. |
| `label` | `string` | Texto exibido. |
| `type` | `'group' \| 'divider'` | Grupo ou separador. Quando omitido, é um item normal ou submenu. |
| `disabled` | `boolean` | Se o item atual está desabilitado. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Ocultação dinâmica (retornar `true` significa ocultar). |
| `icon` | `React.ReactNode` | Conteúdo do ícone. |
| `children` | `SubModelItemsType` | Itens de submenu, usados para grupos aninhados ou submenus. |
| `useModel` | `string` | Especifica o tipo de Model a ser usado (nome registrado). |
| `createModelOptions` | `object` | Parâmetros para inicialização do modelo. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Formato de alternância: se já estiver adicionado, remove; caso contrário, adiciona (apenas uma instância permitida). |

## Exemplos

### Adicionando subModels com `<AddSubModelButton />`

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- Use `<AddSubModelButton />` para adicionar subModels; o botão precisa estar dentro de um FlowModel para funcionar;
- Use `model.mapSubModels()` para iterar sobre os subModels; o método `mapSubModels` resolve problemas de itens ausentes, ordenação, etc.;
- Use `<FlowModelRenderer />` para renderizar os subModels.

### Diferentes formatos de AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- Você pode usar o componente de botão `<Button>Add block</Button>`, que pode ser colocado em qualquer lugar;
- Também pode usar um ícone como `<PlusOutlined />`;
- Também é possível posicioná-lo no canto superior direito, na área de Flow Settings.

### Suporte ao formato de alternância

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- Para cenários simples, basta usar `toggleable: true`. Por padrão, a busca é feita pelo nome da classe e apenas uma instância da mesma classe é permitida;
- Regra de busca personalizada: `toggleable: (model: FlowModel) => boolean`.

### items assíncronos

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

Você pode obter items dinâmicos a partir do contexto, por exemplo:

- Pode ser uma chamada remota como `ctx.api.request()`;
- Pode obter dados necessários através das APIs fornecidas por `ctx.dataSourceManager`;
- Também pode ser uma propriedade ou método personalizado do contexto;
- Tanto `items` quanto `children` suportam chamadas async.

### Ocultação dinâmica de itens de menu (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` aceita `boolean` ou função (com suporte a async); retornar `true` significa ocultar;
- Aplica-se recursivamente a group e children.

### Usando grupos, submenus e separadores

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- Quando `type: divider`, é um separador;
- Quando `type: group` e há `children`, é um grupo de menu;
- Quando há `children` mas sem `type`, é um submenu.

### Geração automática de items via classes herdadas

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- Todos os FlowModel que herdam de `subModelBaseClass` serão listados;
- Use `Model.define()` para definir os metadados relacionados;
- Itens marcados com `hide: true` serão automaticamente ocultados.

### Agrupamento via classes herdadas

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- Todos os FlowModel que herdam de `subModelBaseClasses` serão listados;
- Agrupados automaticamente por `subModelBaseClasses` e deduplicados.

### Submenu de segundo nível com classes herdadas + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Defina o formato de exibição na classe base com `Model.define({ menuType: 'submenu' })`;
- Aparece como item de primeiro nível e expande em submenu de segundo nível; pode ser intercalado e ordenado com outros grupos via `meta.sort`.

### Submenu personalizado via `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### group children personalizado via `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Habilitando busca em submenus

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- Qualquer item de menu que contenha `children` exibirá uma caixa de busca naquele nível ao definir `searchable: true`;
- Suporta estruturas mistas com group e não-group no mesmo nível; a busca atua apenas no nível atual.
