:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/event-flow).
:::

# Fluxo de eventos

## Introdução

Se você deseja disparar algumas ações personalizadas quando um formulário é alterado, você pode usar o fluxo de eventos para fazer isso. Além de formulários, páginas, blocos, botões e campos também podem usar fluxos de eventos para configurar operações personalizadas.

## Como usar

Abaixo, usaremos um exemplo simples para explicar como configurar o fluxo de eventos. Vamos implementar uma vinculação entre duas tabelas: quando você clica em uma linha da tabela à esquerda, os dados da tabela à direita são filtrados automaticamente.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Os passos de configuração são os seguintes:

1. Clique no ícone de "raio" no canto superior direito do bloco de tabela à esquerda para abrir a interface de configuração do fluxo de eventos.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Clique em "Adicionar fluxo de eventos (Add event flow)", selecione "Clique na linha (Row click)" em "Evento de gatilho", indicando que o gatilho ocorre ao clicar em uma linha da tabela.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Configure o "Momento de execução (Execution timing)", usado para controlar a ordem desta sequência de eventos em relação aos fluxos integrados do sistema. Geralmente, você pode manter o padrão; se desejar exibir um aviso ou redirecionar após a execução da lógica integrada, selecione "Após todos os fluxos (After all flows)". Veja mais detalhes abaixo em [Momento de execução](#momento-de-execução).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Condição de gatilho (Trigger condition)" é usada para configurar condições; o fluxo de eventos só será disparado quando as condições forem atendidas. Aqui não precisamos configurar nada, pois qualquer clique na linha disparará o fluxo.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Passe o mouse sobre "Adicionar etapa (Add step)" para adicionar etapas de operação. Escolhemos "Definir escopo de dados (Set data scope)" para configurar o escopo de dados da tabela à direita.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Copie o UID da tabela à direita e insira-o no campo "UID do bloco de destino (Target block UID)". Uma interface de configuração de condição será exibida imediatamente abaixo, onde você pode configurar o escopo de dados da tabela à direita.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Vamos configurar uma condição, conforme mostrado na imagem abaixo:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Após configurar o escopo de dados, você também precisa atualizar o bloco para exibir os resultados filtrados. A seguir, vamos configurar a atualização do bloco da tabela à direita. Adicione uma etapa "Atualizar blocos de destino (Refresh target blocks)" e insira o UID da tabela à direita.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Por fim, clique no botão salvar no canto inferior direito e a configuração estará concluída.

## Detalhes dos eventos

### Antes da renderização

Evento universal, disponível em páginas, blocos, botões ou campos. Neste evento, você pode realizar trabalhos de inicialização, como configurar diferentes escopos de dados sob diferentes condições.

### Clique na linha (Row click)

Evento exclusivo para blocos de tabela. Disparado ao clicar em uma linha da tabela. Ao ser disparado, um "Registro da linha clicada (Clicked row record)" é adicionado ao contexto, podendo ser usado como variável em condições e etapas.

### Mudança de valores do formulário (Form values change)

Evento exclusivo para blocos de formulário. Disparado quando o valor de um campo do formulário é alterado. Você pode obter os valores do formulário através da variável "Formulário atual (Current form)" em condições e etapas.

### Clique (Click)

Evento exclusivo para botões. Disparado ao clicar no botão.

## Momento de execução

Na configuração do fluxo de eventos, existem dois conceitos que podem ser confundidos:

- **Evento de gatilho:** Quando a execução começa (ex: Antes da renderização, Clique na linha, Clique, Mudança de valores do formulário, etc.).
- **Momento de execução:** Após o evento de gatilho ocorrer, em que posição o seu **fluxo de eventos personalizado** deve ser inserido em relação ao **fluxo integrado** do sistema.

### O que são "Fluxos integrados / Etapas integradas"?

Muitas páginas, blocos ou operações já possuem um conjunto de processos de tratamento integrados ao sistema (ex: enviar, abrir pop-up, solicitar dados, etc.). Quando você adiciona um novo fluxo de eventos personalizado para o mesmo evento (ex: "Clique"), o "Momento de execução" decide:

- Se o seu fluxo de eventos deve ser executado antes ou depois da lógica integrada;
- Ou se o seu fluxo de eventos deve ser inserido antes ou depois de uma etapa específica do fluxo integrado.

### Como entender as opções de Momento de execução na UI?

- **Antes de todos os fluxos (padrão):** Executado primeiro. Adequado para "interceptação/preparação" (ex: validação, confirmação dupla, inicialização de variáveis, etc.).
- **Após todos os fluxos:** Executado após a conclusão da lógica integrada. Adequado para "finalização/feedback" (ex: mensagens de aviso, atualizar outros blocos, redirecionar página, etc.).
- **Antes do fluxo especificado / Após o fluxo especificado:** Ponto de inserção mais refinado. Após selecionar, você deve escolher o "Fluxo integrado" específico.
- **Antes da etapa do fluxo especificado / Após a etapa do fluxo especificado:** O ponto de inserção mais preciso. Após selecionar, você deve escolher tanto o "Fluxo integrado" quanto a "Etapa do fluxo integrado".

> Dica: Se você não tiver certeza de qual fluxo/etapa integrada escolher, priorize o uso das duas primeiras opções ("Antes / Após").

## Detalhes das etapas

### Variável personalizada (Custom variable)

Usada para definir uma variável personalizada e usá-la no contexto.

#### Escopo

Variáveis personalizadas possuem escopo; por exemplo, uma variável definida no fluxo de eventos de um bloco só pode ser usada dentro desse bloco. Se você deseja que ela seja usada em todos os blocos da página atual, a configuração deve ser feita no fluxo de eventos da página.

#### Variável de formulário (Form variable)

Usa o valor de um bloco de formulário específico como variável. A configuração detalhada é a seguinte:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Título da variável
- Variable identifier: Identificador da variável
- Form UID: UID do formulário

#### Outras variáveis

Outras variáveis serão suportadas sucessivamente, aguarde.

### Definir escopo de dados (Set data scope)

Define o escopo de dados do bloco de destino. A configuração detalhada é a seguinte:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID do bloco de destino
- Condition: Condição de filtro

### Atualizar blocos de destino (Refresh target blocks)

Atualiza os blocos de destino, permitindo a configuração de múltiplos blocos. A configuração detalhada é a seguinte:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID do bloco de destino

### Navegar para URL (Navigate to URL)

Redireciona para uma URL específica. A configuração detalhada é a seguinte:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL de destino, suporta o uso de variáveis
- Search parameters: Parâmetros de consulta na URL
- Open in new window: Se marcado, abrirá uma nova página no navegador ao redirecionar

### Mostrar mensagem (Show message)

Exibe informações de feedback da operação globalmente.

#### Quando usar

- Pode fornecer informações de feedback como sucesso, aviso e erro.
- Exibido centralizado no topo e desaparece automaticamente, sendo uma forma leve de aviso que não interrompe a operação do usuário.

#### Configuração detalhada

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Tipo de mensagem
- Message content: Conteúdo da mensagem
- Duration: Duração da exibição, em segundos

### Mostrar notificação (Show notification)

Exibe informações de alerta de notificação globalmente.

#### Quando usar

Exibe informações de alerta de notificação nos quatro cantos do sistema. Frequentemente usado nas seguintes situações:

- Conteúdo de notificação mais complexo.
- Notificações com interação, oferecendo ao usuário pontos de ação para o próximo passo.
- Envios ativos do sistema.

#### Configuração detalhada

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Tipo de notificação
- Notification title: Título da notificação
- Notification description: Descrição da notificação
- Placement: Posição, as opções incluem: superior esquerdo, superior direito, inferior esquerdo, inferior direito

### Executar JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Executa código JavaScript.

## Exemplo

### Formulário: Chamar API de terceiros para preencher campos

Cenário: Disparar um fluxo de eventos em um formulário, solicitar uma API de terceiros e, após obter os dados, preencher automaticamente os campos do formulário.

Passos de configuração:

1. Abra a configuração do fluxo de eventos no bloco de formulário e adicione um novo fluxo;
2. Selecione "Antes da renderização" como evento de gatilho;
3. Selecione "Após todos os fluxos" como momento de execução;
4. Adicione a etapa "Executar JavaScript (Execute JavaScript)", cole e modifique o código abaixo conforme necessário:

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Nota: ctx.api incluirá os cabeçalhos de autenticação/personalizados atuais do NocoBase por padrão
  // Aqui nós os substituímos por um "Authorization vazio" para evitar o envio do token para terceiros
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// substitua pelo nome real do campo
ctx.form.setFieldsValue({ username });
```