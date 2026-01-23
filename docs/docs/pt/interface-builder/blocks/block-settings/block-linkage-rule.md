:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Regras de Vinculação de Blocos

## Introdução

As regras de vinculação de blocos permitem que você controle dinamicamente a exibição dos blocos, gerenciando a apresentação dos elementos no nível do bloco. Como os blocos servem como contêineres para campos e botões de ação, essas regras permitem que você controle de forma flexível a exibição de toda a visualização a partir da dimensão do bloco.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Observação**: Antes de executar as regras de vinculação de blocos, a exibição do bloco deve primeiro passar por uma **verificação de permissão ACL**. Somente quando um usuário tiver as permissões de acesso correspondentes, a lógica das regras de vinculação de blocos será avaliada. Em outras palavras, as regras de vinculação de blocos só entram em vigor após o cumprimento dos requisitos de permissão de visualização da ACL. Se não houver regras de vinculação de blocos, o bloco é exibido por padrão.

### Controlando Blocos com Variáveis Globais

As **regras de vinculação de blocos** suportam o uso de variáveis globais para controlar dinamicamente o conteúdo exibido nos blocos, permitindo que usuários com diferentes funções e permissões vejam e interajam com visualizações de dados personalizadas. Por exemplo, em um sistema de gerenciamento de pedidos, embora diferentes funções (como administradores, vendedores e pessoal financeiro) tenham permissão para visualizar pedidos, os campos e botões de ação que cada função precisa ver podem ser diferentes. Ao configurar variáveis globais, você pode ajustar de forma flexível os campos exibidos, os botões de ação e até mesmo as regras de classificação e filtragem de dados com base na função do usuário, permissões ou outras condições.

#### Casos de Uso Específicos:

-   **Controle de Funções e Permissões**: Controle a visibilidade ou editabilidade de certos campos com base nas permissões de diferentes funções. Por exemplo, a equipe de vendas pode visualizar apenas as informações básicas do pedido, enquanto o pessoal financeiro pode visualizar os detalhes de pagamento.
-   **Visualizações Personalizadas**: Personalize diferentes visualizações de blocos para diferentes departamentos ou equipes, garantindo que cada usuário veja apenas o conteúdo relevante para seu trabalho, melhorando assim a eficiência.
-   **Gerenciamento de Permissões de Ação**: Controle a exibição de botões de ação usando variáveis globais. Por exemplo, algumas funções podem apenas visualizar dados, enquanto outras podem executar ações como modificar ou excluir.

### Controlando Blocos com Variáveis de Contexto

Os blocos também podem ser controlados por variáveis no contexto. Por exemplo, você pode usar variáveis de contexto como "Registro atual", "Formulário atual" e "Registro do pop-up atual" para exibir ou ocultar blocos dinamicamente.

Exemplo: O bloco "Informações de Oportunidade de Pedido" é exibido apenas quando o status do pedido é "Pago".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Para mais informações sobre regras de vinculação, consulte [Regras de Vinculação](/interface-builder/linkage-rule).