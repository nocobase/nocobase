:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Fluxo de eventos

## Introdução

Se você precisa que ações personalizadas sejam disparadas quando um formulário muda, por exemplo, pode usar o fluxo de eventos. Além dos formulários, páginas, blocos, botões e campos também podem usar fluxos de eventos para configurar operações personalizadas.

## Como usar

Vamos ver um exemplo simples para entender como configurar fluxos de eventos. Vamos criar uma ligação entre duas tabelas, onde clicar em uma linha da tabela da esquerda filtra automaticamente os dados da tabela da direita.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Os passos de configuração são os seguintes:

1. Clique no ícone de "raio" no canto superior direito do bloco da tabela esquerda para abrir o painel de configuração do fluxo de eventos.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Clique em "Adicionar fluxo de eventos" (Add event flow), selecione "Clique na linha" (Row click) como o "Evento de gatilho" (Trigger event). Isso significa que o fluxo será disparado quando uma linha da tabela for clicada.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. A "Condição de gatilho" (Trigger condition) é usada para configurar condições. O fluxo de eventos só será disparado quando essas condições forem atendidas. Neste caso, não precisamos configurar nenhuma condição, então o fluxo será disparado em qualquer clique na linha.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Passe o mouse sobre "Adicionar passo" (Add step) para adicionar etapas de operação. Selecione "Definir escopo de dados" (Set data scope) para configurar o escopo de dados da tabela da direita.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Copie o UID da tabela da direita e cole-o no campo de entrada "UID do bloco de destino" (Target block UID). Um painel de configuração de condição aparecerá imediatamente abaixo, onde você pode configurar o escopo de dados para a tabela da direita.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Vamos configurar uma condição, como mostrado abaixo:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Após configurar o escopo de dados, você precisa atualizar o bloco para exibir os resultados filtrados. Em seguida, vamos configurar a atualização do bloco da tabela da direita. Adicione um passo "Atualizar blocos de destino" (Refresh target blocks) e insira o UID da tabela da direita.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Por fim, clique no botão "Salvar" no canto inferior direito para concluir a configuração.

## Tipos de eventos

### Antes da renderização (Before render)

Um evento universal que pode ser usado em páginas, blocos, botões ou campos. Use este evento para tarefas de inicialização, como configurar diferentes escopos de dados com base em diferentes condições.

### Clique na linha (Row click)

Um evento específico para blocos de tabela. Dispara quando uma linha da tabela é clicada. Quando disparado, ele adiciona um "Registro da linha clicada" (Clicked row record) ao contexto, que pode ser usado como uma variável em condições e passos.

### Mudança de valores do formulário (Form values change)

Um evento específico para blocos de formulário. Dispara quando os valores dos campos do formulário mudam. Você pode acessar os valores do formulário através da variável "Formulário atual" (Current form) em condições e passos.

### Clique (Click)

Um evento específico para botões. Dispara quando o botão é clicado.

## Tipos de passos

### Variável personalizada (Custom variable)

Crie uma variável personalizada para usar dentro do contexto.

#### Escopo

Variáveis personalizadas têm escopo. Por exemplo, uma variável definida no fluxo de eventos de um bloco só pode ser usada dentro desse bloco. Para que uma variável esteja disponível em todos os blocos da página atual, você precisa configurá-la no fluxo de eventos da página.

#### Variável de formulário (Form variable)

Use os valores de um bloco de formulário como uma variável. A configuração é a seguinte:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Título da variável: Título da variável
- Identificador da variável: Identificador da variável
- UID do formulário: UID do formulário

#### Outras variáveis

Mais tipos de variáveis serão suportados no futuro. Fique atento.

### Definir escopo de dados (Set data scope)

Defina o escopo de dados para um bloco de destino. A configuração é a seguinte:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- UID do bloco de destino: UID do bloco de destino
- Condição: Condição de filtro

### Atualizar blocos de destino (Refresh target blocks)

Atualize os blocos de destino. Vários blocos podem ser configurados. A configuração é a seguinte:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- UID do bloco de destino: UID do bloco de destino

### Navegar para URL (Navigate to URL)

Navegue para uma URL. A configuração é a seguinte:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL de destino, suporta variáveis
- Parâmetros de busca: Parâmetros de consulta na URL
- Abrir em nova janela: Se marcado, abre a URL em uma nova aba do navegador.

### Exibir mensagem (Show message)

Exiba mensagens de feedback globais.

#### Quando usar

- Fornece feedback de sucesso, aviso e erro.
- Exibe centralizado na parte superior e desaparece automaticamente, sendo uma forma leve de notificação que não interrompe as operações do usuário.

#### Configuração

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Tipo de mensagem: Tipo de mensagem
- Conteúdo da mensagem: Conteúdo da mensagem
- Duração: Por quanto tempo exibir (em segundos)

### Exibir notificação (Show notification)

Exiba alertas de notificação globais.

#### Quando usar

Exiba alertas de notificação nos quatro cantos do sistema. Comumente usado para:

- Conteúdo de notificação mais complexo.
- Notificações interativas que fornecem aos usuários os próximos passos.
- Notificações iniciadas pelo sistema.

#### Configuração

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Tipo de notificação: Tipo de notificação
- Título da notificação: Título da notificação
- Descrição da notificação: Descrição da notificação
- Posição: Posição, as opções são: superior esquerdo, superior direito, inferior esquerdo, inferior direito

### Executar JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Execute código JavaScript.