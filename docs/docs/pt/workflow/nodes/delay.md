:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Atraso

## Introdução

O nó de **Atraso** permite adicionar um atraso ao **fluxo de trabalho**. Após o término do atraso, você pode configurar se o **fluxo de trabalho** deve continuar executando os nós seguintes ou ser encerrado antecipadamente.

Ele é frequentemente usado em conjunto com o nó de Ramificação Paralela. Você pode adicionar um nó de **Atraso** em uma das ramificações para lidar com o processamento após um tempo limite. Por exemplo, em uma ramificação paralela, uma ramificação pode conter um processamento manual e a outra um nó de **Atraso**. Quando o processamento manual atinge o tempo limite, se você configurar para "falhar no tempo limite", isso significa que o processamento manual deve ser concluído dentro do tempo limitado. Se configurar para "continuar no tempo limite", o processamento manual pode ser ignorado após o tempo estipulado.

## Instalação

É um **plugin** integrado, não requer instalação.

## Criar Nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição ("+") no fluxo para adicionar um nó de "**Atraso**":

![Criar Nó de Atraso](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Configuração do Nó

![Nó de Atraso_Configuração do Nó](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Tempo de Atraso

Para o tempo de atraso, você pode inserir um número e selecionar uma unidade de tempo. As unidades de tempo suportadas são: segundos, minutos, horas, dias e semanas.

### Status ao Atingir Tempo Limite

Para o status ao atingir o tempo limite, você pode escolher "**Passar e continuar**" ou "**Falhar e sair**". A primeira opção significa que, após o término do atraso, o **fluxo de trabalho** continuará a executar os nós subsequentes. A segunda opção significa que, após o término do atraso, o **fluxo de trabalho** será encerrado prematuramente com um status de falha.

## Exemplo

Vamos considerar um cenário onde um pedido de serviço precisa de uma resposta dentro de um tempo limitado após ser iniciado. Precisamos adicionar um nó manual em uma das duas ramificações paralelas e um nó de **Atraso** na outra. Se o processamento manual não for respondido em 10 minutos, o status do pedido de serviço é atualizado para "tempo limite excedido e não processado".

![Nó de Atraso_Exemplo_Organização do Fluxo](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)