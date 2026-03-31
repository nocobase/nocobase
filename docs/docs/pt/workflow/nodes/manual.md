---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Manual

## Introdução

Quando um processo de negócio não pode ser totalmente automatizado para a tomada de decisões, você pode usar um nó manual para delegar parte da autoridade de decisão a uma pessoa.

Quando um nó manual é executado, ele interrompe todo o `fluxo de trabalho` e gera uma tarefa pendente para o usuário correspondente. Depois que o usuário envia a tarefa, o `fluxo de trabalho` pode continuar, permanecer pendente ou ser encerrado, dependendo do status selecionado. Isso é muito útil em cenários como processos de aprovação.

## Instalação

É um `plugin` integrado, então não precisa de instalação.

## Criar Nó

Na interface de configuração do `fluxo de trabalho`, clique no botão de adição ("+") no `fluxo de trabalho` para adicionar um nó "Manual":

![Criar Nó Manual](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Configurar Nó

### Responsável

Um nó manual precisa que você especifique um usuário como executor da tarefa pendente. A lista de tarefas pendentes pode ser adicionada como um bloco em uma página, e o conteúdo do pop-up da tarefa para cada nó precisa ser configurado na interface do próprio nó.

Selecione um usuário ou escolha a chave primária ou estrangeira dos dados do usuário a partir do contexto, usando uma variável.

![Nó Manual_Configurar_Responsável_Selecionar Variável](https://static-docs.nocobase.com/22fbca3b8e21fda3a81019037001445.png)

:::info{title=Observação}
Atualmente, a opção de responsável para nós manuais não suporta múltiplos usuários. Isso será implementado em uma versão futura.
:::

### Configurar Interface do Usuário

A configuração da interface para o item pendente é a parte central do nó manual. Você pode clicar no botão "Configurar interface do usuário" para abrir um pop-up de configuração separado, que pode ser configurado de forma "o que você vê é o que você obtém" (WYSIWYG), assim como uma página comum.

![Nó Manual_Configuração do Nó_Configuração da Interface](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Abas

As abas podem ser usadas para diferenciar conteúdos. Por exemplo, uma aba pode ser para o envio de um formulário de aprovação, outra para um formulário de rejeição, ou para exibir detalhes de dados relacionados. Elas podem ser configuradas livremente.

#### Blocos

Os tipos de blocos suportados são divididos principalmente em duas categorias: blocos de dados e blocos de formulário. Além disso, o Markdown é usado principalmente para conteúdo estático, como mensagens informativas.

##### Bloco de Dados

Os blocos de dados podem exibir dados do gatilho ou os resultados do processamento de qualquer nó, fornecendo informações contextuais relevantes para o responsável pela tarefa pendente. Por exemplo, se o `fluxo de trabalho` é acionado por um evento de formulário, você pode criar um bloco de detalhes para os dados do gatilho. Isso é consistente com a configuração de detalhes de uma página comum, permitindo que você selecione qualquer campo dos dados do gatilho para exibição.

![Nó Manual_Configuração do Nó_Configuração da Interface_Bloco de Dados_Gatilho](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Os blocos de dados de nó são semelhantes; você pode selecionar o resultado dos dados de um nó anterior para exibir como detalhes. Por exemplo, o resultado de um nó de cálculo anterior pode servir como informação de referência contextual para a tarefa pendente do responsável.

![Nó Manual_Configuração do Nó_Configuração da Interface_Bloco de Dados_Dados do Nó](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Observação}
Como o `fluxo de trabalho` não está em estado de execução durante a configuração da interface, nenhum dado específico é exibido nos blocos de dados. Os dados relevantes para uma instância específica do `fluxo de trabalho` só podem ser vistos na interface do pop-up de tarefas pendentes depois que o `fluxo de trabalho` for acionado e executado.
:::

##### Bloco de Formulário

Pelo menos um bloco de formulário deve ser configurado na interface de tarefas pendentes para lidar com a decisão final sobre a continuidade do `fluxo de trabalho`. Não configurar um formulário impedirá que o `fluxo de trabalho` prossiga após ser interrompido. Existem três tipos de blocos de formulário:

- Formulário personalizado
- Formulário para criar registro
- Formulário para atualizar registro

![Nó Manual_Configuração do Nó_Configuração da Interface_Tipos de Formulário](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Os formulários para criar e atualizar registros exigem a seleção de uma `coleção` base. Depois que o usuário da tarefa pendente envia o formulário, os valores contidos nele serão usados para criar ou atualizar dados na `coleção` especificada. Um formulário personalizado permite que você defina livremente um formulário temporário que não está vinculado a uma `coleção`. Os valores dos campos enviados pelo usuário da tarefa pendente podem ser usados em nós subsequentes.

Os botões de envio do formulário podem ser configurados em três tipos:

- Enviar e continuar o fluxo de trabalho
- Enviar e encerrar o fluxo de trabalho
- Apenas salvar valores do formulário

![Nó Manual_Configuração do Nó_Configuração da Interface_Botões do Formulário](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Os três botões representam três status de nó no processo do `fluxo de trabalho`. Após o envio, o status do nó muda para "Concluído", "Rejeitado" ou permanece em estado "Pendente". Um formulário deve ter pelo menos uma das duas primeiras opções configuradas para determinar o fluxo subsequente de todo o `fluxo de trabalho`.

No botão "Continuar `fluxo de trabalho`", você pode configurar atribuições para os campos do formulário:

![Nó Manual_Configuração do Nó_Configuração da Interface_Botão do Formulário_Definir Valores do Formulário](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Nó Manual_Configuração do Nó_Configuração da Interface_Botão do Formulário_Pop-up Definir Valores do Formulário](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Depois de abrir o pop-up, você pode atribuir valores a qualquer campo do formulário. Após o envio do formulário, esse valor será o valor final do campo. Isso é particularmente útil ao revisar dados. Você pode usar vários botões "Continuar `fluxo de trabalho`" diferentes em um formulário, com cada botão definindo valores enumerados distintos para campos como status, alcançando assim o efeito de continuar a execução subsequente do `fluxo de trabalho` com diferentes valores de dados.

## Bloco de Tarefas Pendentes

Para o processamento manual, você também precisa adicionar uma lista de tarefas pendentes a uma página para exibir as tarefas. Isso permite que o pessoal relevante acesse e lide com as tarefas específicas do nó manual através dessa lista.

### Adicionar Bloco

Você pode selecionar "Tarefas Pendentes do `Fluxo de Trabalho`" nos blocos de uma página para adicionar um bloco de lista de tarefas pendentes:

![Nó Manual_Adicionar Bloco de Tarefas Pendentes](https://static-docs.nocobase.com/198b417454cd73b704267bf30fe5e647.png)

Exemplo de bloco de lista de tarefas pendentes:

![Nó Manual_Lista de Tarefas Pendentes](https://static-docs.nocobase.com/cfefb0d2c6a91c5c9dfa550d6b220f34.png)

### Detalhes da Tarefa Pendente

Em seguida, o pessoal relevante pode clicar na tarefa pendente correspondente para abrir o pop-up da tarefa e realizar o processamento manual.

![Nó Manual_Detalhes da Tarefa Pendente](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Exemplo

### Revisão de Artigo

Suponha que um artigo enviado por um usuário comum precise ser aprovado por um administrador antes de poder ser atualizado para o status de publicado. Caso o `fluxo de trabalho` seja rejeitado, o artigo permanecerá em rascunho (não público). Esse processo pode ser implementado usando um formulário de atualização em um nó manual.

Crie um `fluxo de trabalho` acionado por "Criar Artigo" e adicione um nó manual:

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Orquestração do Fluxo de Trabalho" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

No nó manual, configure o responsável como administrador. Na configuração da interface, adicione um bloco baseado nos dados do gatilho para exibir os detalhes do novo artigo:

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Configuração do Nó_Bloco de Detalhes" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Na configuração da interface, adicione um bloco baseado em um formulário de atualização de registro, selecione a `coleção` de artigos, para que o administrador decida se aprova. Após a aprovação, o artigo correspondente será atualizado com base em outras configurações subsequentes. Depois de adicionar o formulário, haverá um botão "Continuar `fluxo de trabalho`" por padrão, que pode ser considerado como "Aprovar". Em seguida, adicione um botão "Encerrar `fluxo de trabalho`" para ser usado em caso de rejeição:

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Configuração do Nó_Formulário e Ações" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Ao continuar o `fluxo de trabalho`, precisamos atualizar o status do artigo. Existem duas formas de configurar isso. Uma é exibir o campo de status do artigo diretamente no formulário para que o operador selecione. Este método é mais adequado para situações que exigem preenchimento ativo do formulário, como o fornecimento de feedback:

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Configuração do Nó_Campos do Formulário" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Para simplificar a tarefa do operador, outra forma é configurar a atribuição de valores do formulário no botão "Continuar `fluxo de trabalho`". Na atribuição, adicione um campo "Status" com o valor "Publicado". Isso significa que, quando o operador clicar no botão, o artigo será atualizado para o status de publicado:

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Configuração do Nó_Atribuição do Formulário" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Em seguida, no menu de configuração no canto superior direito do bloco de formulário, selecione a condição de filtro para os dados a serem atualizados. Aqui, selecione a `coleção` "Artigos", e a condição de filtro é "ID `igual a` Variável do gatilho / Dados do gatilho / ID":

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Configuração do Nó_Condição do Formulário" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Por fim, você pode modificar os títulos de cada bloco, o texto dos botões relevantes e o texto de dica dos campos do formulário para tornar a interface mais amigável:

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Configuração do Nó_Formulário Final" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Feche o painel de configuração e clique no botão de envio para salvar a configuração do nó. O `fluxo de trabalho` está agora configurado. Após habilitar este `fluxo de trabalho`, ele será acionado automaticamente quando um novo artigo for criado. O administrador poderá ver que este `fluxo de trabalho` precisa ser processado na lista de tarefas pendentes. Ao clicar para visualizar, ele poderá ver os detalhes da tarefa pendente:

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Lista de Tarefas Pendentes" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Nó Manual_Exemplo_Revisão de Artigo_Detalhes da Tarefa Pendente" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

O administrador pode fazer um julgamento manual com base nos detalhes do artigo para decidir se ele pode ser publicado. Se sim, clicar no botão "Aprovar" atualizará o artigo para o status de publicado. Se não, clicar no botão "Rejeitar" manterá o artigo em rascunho.

## Aprovação de Licença

Suponha que um funcionário precise solicitar uma licença, que deve ser aprovada por um supervisor para entrar em vigor, e os dados de licença correspondentes do funcionário precisam ser deduzidos. Independentemente da aprovação ou rejeição, um nó de requisição HTTP será usado para chamar uma API de SMS e enviar uma mensagem de notificação ao funcionário (veja a seção [Requisição HTTP](#_HTTP_请求)). Este cenário pode ser implementado usando um formulário personalizado em um nó manual.

Crie um `fluxo de trabalho` acionado por "Criar Pedido de Licença" e adicione um nó manual. Isso é semelhante ao processo anterior de revisão de artigo, mas aqui o responsável é o supervisor. Na configuração da interface, adicione um bloco baseado nos dados do gatilho para exibir os detalhes do novo pedido de licença. Em seguida, adicione outro bloco baseado em um formulário personalizado para o supervisor decidir se aprova. No formulário personalizado, adicione um campo para o status de aprovação e um campo para o motivo da rejeição:

<figure>
  <img alt="Nó Manual_Exemplo_Aprovação de Licença_Configuração do Nó" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Diferente do processo de revisão de artigo, como precisamos continuar o processo subsequente com base no resultado da aprovação do supervisor, aqui configuramos apenas um botão "Continuar `fluxo de trabalho`" para envio, sem usar o botão "Encerrar `fluxo de trabalho`".

Ao mesmo tempo, após o nó manual, podemos usar um nó de condição para determinar se o supervisor aprovou o pedido de licença. No ramo de aprovação, adicione o processamento de dados para deduzir a licença e, após a fusão dos ramos, adicione um nó de requisição para enviar uma notificação por SMS ao funcionário. Isso resulta no seguinte `fluxo de trabalho` completo:

<figure>
  <img alt="Nó Manual_Exemplo_Aprovação de Licença_Orquestração do Fluxo de Trabalho" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

A condição no nó de condição é configurada como "Nó manual / Dados do formulário personalizado / O valor do campo de aprovação é 'Aprovado'":

<figure>
  <img alt="Nó Manual_Exemplo_Aprovação de Licença_Condição" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-472ad205c20" width="678" />
</figure>

Os dados no nó de envio de requisição também podem usar as variáveis de formulário correspondentes do nó manual para diferenciar o conteúdo do SMS de aprovação e rejeição. Assim, a configuração de todo o `fluxo de trabalho` é concluída. Após habilitar o `fluxo de trabalho`, quando um funcionário enviar um formulário de pedido de licença, o supervisor poderá processar a aprovação em suas tarefas pendentes. A operação é basicamente semelhante ao processo de revisão de artigo.