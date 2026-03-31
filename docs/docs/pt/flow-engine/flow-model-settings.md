:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# FlowModel: Fluxo de Eventos e Configuração

O FlowModel oferece uma abordagem baseada em "fluxo de eventos" (Flow) para implementar a lógica de configuração de componentes, tornando o comportamento e a configuração dos componentes mais extensíveis e visuais.

## Modelo Personalizado

Você pode criar um modelo de componente personalizado estendendo `FlowModel`. O modelo precisa implementar o método `render()` para definir a lógica de renderização do componente.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Registrando um Fluxo (Flow de Eventos)

Cada modelo pode registrar um ou mais **fluxos** para descrever a lógica de configuração e os passos de interação do componente.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Configurações do Botão',
  steps: {
    general: {
      title: 'Configuração Geral',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Título do Botão',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Descrição

-   `key`: O identificador único para o fluxo.
-   `title`: O nome do fluxo, usado para exibição na interface do usuário (UI).
-   `steps`: Define os passos de configuração (Step). Cada passo inclui:
    -   `title`: O título do passo.
    -   `uiSchema`: A estrutura do formulário de configuração (compatível com Formily Schema).
    -   `defaultParams`: Parâmetros padrão.
    -   `handler(ctx, params)`: Acionado ao salvar, usado para atualizar o estado do modelo.

## Renderizando o Modelo

Ao renderizar um modelo de componente, você pode usar o parâmetro `showFlowSettings` para controlar se o recurso de configuração será ativado. Se `showFlowSettings` estiver ativado, uma entrada de configuração (como um ícone de configurações ou um botão) aparecerá automaticamente no canto superior direito do componente.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Abrindo o Formulário de Configuração Manualmente com `openFlowSettings`

Além de abrir o formulário de configuração através da entrada de interação integrada, você também pode chamar `openFlowSettings()` manualmente no código.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Definição dos Parâmetros

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Obrigatório, a instância do modelo ao qual pertence
  preset?: boolean;               // Renderiza apenas os passos marcados como preset=true (padrão false)
  flowKey?: string;               // Especifica um único fluxo
  flowKeys?: string[];            // Especifica múltiplos fluxos (ignorado se flowKey também for fornecido)
  stepKey?: string;               // Especifica um único passo (geralmente usado com flowKey)
  uiMode?: 'dialog' | 'drawer';   // O contêiner para exibir o formulário, padrão 'dialog'
  onCancel?: () => void;          // Callback quando o botão cancelar é clicado
  onSaved?: () => void;           // Callback após a configuração ser salva com sucesso
}
```

### Exemplo: Abrindo o Formulário de Configuração de um Fluxo Específico no Modo Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Configurações do botão salvas');
  },
});
```