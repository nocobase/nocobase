---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/multi-app/multi-app/index).
:::

# Gerenciamento de múltiplas aplicações

## Visão geral das funções

O gerenciamento de múltiplas aplicações é a solução de gerenciamento unificado de aplicações fornecida pelo NocoBase para criar e gerenciar múltiplas instâncias de aplicações NocoBase fisicamente isoladas em um ou mais ambientes de execução. Através do supervisor de aplicações (AppSupervisor), você pode criar e manter múltiplas aplicações em uma entrada unificada para atender às necessidades de diferentes negócios e estágios de escala.

## Aplicação única

No estágio inicial do projeto, a maioria dos usuários começará com uma única aplicação.

Nesse modo, o sistema só precisa implantar uma instância do NocoBase, e todas as funções de negócio, dados e usuários são executados na mesma aplicação. A implantação é simples e o custo de configuração é baixo, sendo ideal para validação de protótipos, projetos pequenos ou ferramentas internas.

Mas à medida que o negócio se torna gradualmente complexo, uma única aplicação enfrentará algumas limitações naturais:

- As funções continuam se acumulando, tornando o sistema inchado
- É difícil isolar diferentes negócios entre si
- O custo de expansão e manutenção da aplicação continua a subir

Nesse momento, você desejará dividir diferentes negócios em múltiplas aplicações para melhorar a manutenibilidade e a escalabilidade do sistema.

## Múltiplas aplicações em memória compartilhada

Quando você deseja dividir o negócio, mas não quer introduzir uma arquitetura complexa de implantação e operação, pode atualizar para o modo de múltiplas aplicações de memória compartilhada.

Nesse modo, múltiplas aplicações podem ser executadas simultaneamente em uma instância do NocoBase. Cada aplicação é independente, pode se conectar a um banco de dados independente, pode ser criada, iniciada e parada individualmente, mas elas compartilham o mesmo processo e espaço de memória, e você ainda precisa manter apenas uma instância do NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Essa abordagem traz melhorias óbvias:

- O negócio pode ser dividido pela dimensão da aplicação
- As funções e configurações entre as aplicações são mais claras
- Comparado com soluções de múltiplos processos ou múltiplos contêineres, o consumo de recursos é menor

No entanto, como todas as aplicações são executadas no mesmo processo, elas compartilham recursos como CPU e memória. Uma anomalia ou carga alta em uma única aplicação pode afetar a estabilidade de outras aplicações.

Quando o número de aplicações continua a aumentar, ou quando requisitos mais altos de isolamento e estabilidade são apresentados, a arquitetura precisa ser atualizada ainda mais.

## Implantação híbrida multiambiente

Quando a escala e a complexidade do negócio atingem um certo nível e o número de aplicações precisa ser expandido em escala, o modo de múltiplas aplicações de memória compartilhada enfrentará desafios como disputa de recursos, estabilidade e segurança. No estágio de escala, você pode considerar a adoção de uma implantação híbrida de múltiplos ambientes para dar suporte a cenários de negócios mais complexos.

O núcleo dessa arquitetura é a introdução de uma aplicação de entrada, ou seja, implantar um NocoBase como um centro de gerenciamento unificado e, ao mesmo tempo, implantar múltiplos NocoBase como ambientes de execução de aplicações para executar as aplicações de negócio reais.

A aplicação de entrada é responsável por:

- Criação, configuração e gerenciamento do ciclo de vida das aplicações
- Envio de comandos de gerenciamento e resumo de status

O ambiente de aplicação de instância é responsável por:

- Carregar e executar as aplicações de negócio reais através do modo de múltiplas aplicações de memória compartilhada

Para você, múltiplas aplicações ainda podem ser criadas e gerenciadas através de uma única entrada, mas internamente:

- Diferentes aplicações podem ser executadas em diferentes nós ou clusters
- Cada aplicação pode usar bancos de dados e middlewares independentes
- Aplicações de alta carga podem ser expandidas ou isoladas conforme a necessidade

![](https://static-docs.nocobase.com/202512231215186.png)

Essa abordagem é adequada para plataformas SaaS, um grande número de ambientes de demonstração ou cenários multi-tenant, garantindo flexibilidade e, ao mesmo tempo, melhorando a estabilidade e a operabilidade do sistema.