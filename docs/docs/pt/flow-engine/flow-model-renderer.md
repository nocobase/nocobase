:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Renderizar FlowModel

`FlowModelRenderer` é o componente React principal para renderizar um `FlowModel`. Ele é responsável por converter uma instância de `FlowModel` em um componente React visual.

## Uso Básico

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Uso básico
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Para Models de campo controlados, use `FieldModelRenderer` para renderizar:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Renderização de campo controlado
<FieldModelRenderer model={fieldModel} />
```

## Parâmetros de Props

### FlowModelRendererProps

| Parâmetro | Tipo | Padrão | Descrição |
|------|------|--------|------|
| `model` | `FlowModel` | - | A instância de FlowModel a ser renderizada |
| `uid` | `string` | - | O identificador único para o modelo de fluxo |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Conteúdo de fallback para exibir em caso de falha na renderização |
| `showFlowSettings` | `boolean \| object` | `false` | Define se o acesso às configurações do fluxo deve ser exibido |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | O estilo de interação para as configurações do fluxo |
| `hideRemoveInSettings` | `boolean` | `false` | Define se o botão de remover deve ser ocultado nas configurações |
| `showTitle` | `boolean` | `false` | Define se o título do modelo deve ser exibido no canto superior esquerdo da borda |
| `skipApplyAutoFlows` | `boolean` | `false` | Define se a aplicação de fluxos automáticos deve ser ignorada |
| `inputArgs` | `Record<string, any>` | - | Contexto extra passado para `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Define se a camada mais externa deve ser envolvida pelo componente `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Nível do menu de configurações: 1=somente o modelo atual, 2=incluir modelos filhos |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Itens adicionais da barra de ferramentas |

### Configuração Detalhada de `showFlowSettings`

Quando `showFlowSettings` é um objeto, as seguintes configurações são suportadas:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Exibir fundo
  showBorder: true,        // Exibir borda
  showDragHandle: true,    // Exibir alça de arrasto
  style: {},              // Estilo personalizado da barra de ferramentas
  toolbarPosition: 'inside' // Posição da barra de ferramentas: 'inside' | 'above' | 'below'
}}
```

## Ciclo de Vida da Renderização

O ciclo de renderização completo chama os seguintes métodos em ordem:

1.  **model.dispatchEvent('beforeRender')** - Evento `beforeRender`
2.  **model.render()** - Executa o método de renderização do modelo
3.  **model.onMount()** - Hook de montagem do componente
4.  **model.onUnmount()** - Hook de desmontagem do componente

## Exemplos de Uso

### Renderização Básica

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Carregando...</div>}
    />
  );
}
```

### Renderização com Configurações de Fluxo

```tsx pure
// Exibe as configurações, mas oculta o botão de remover
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Exibe as configurações e o título
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Usa o modo de menu de contexto
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Barra de Ferramentas Personalizada

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Ação Personalizada',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Ação personalizada');
      }
    }
  ]}
/>
```

### Ignorando Fluxos Automáticos

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Renderização de Modelo de Campo

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Tratamento de Erros

O `FlowModelRenderer` possui um mecanismo abrangente de tratamento de erros integrado:

-   **Limite de Erro Automático**: `showErrorFallback={true}` é habilitado por padrão
-   **Erros de Fluxo Automático**: Captura e trata erros durante a execução de fluxos automáticos
-   **Erros de Renderização**: Exibe conteúdo de fallback quando a renderização do modelo falha

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>A renderização falhou, por favor, tente novamente</div>}
/>
```

## Otimização de Performance

### Ignorando Fluxos Automáticos

Para cenários onde fluxos automáticos não são necessários, você pode ignorá-los para melhorar a performance:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Atualizações Reativas

O `FlowModelRenderer` utiliza o `observer` do `@formily/reactive-react` para atualizações reativas, garantindo que o componente seja renderizado novamente de forma automática quando o estado do modelo muda.

## Observações

1.  **Validação do Modelo**: Certifique-se de que o `model` passado possui um método `render` válido.
2.  **Gerenciamento do Ciclo de Vida**: Os hooks de ciclo de vida do modelo serão chamados nos momentos apropriados.
3.  **Limite de Erro**: É recomendado habilitar o limite de erro em um ambiente de produção para proporcionar uma melhor experiência ao usuário.
4.  **Consideração de Performance**: Para cenários que envolvem a renderização de um grande número de modelos, considere usar a opção `skipApplyAutoFlows`.