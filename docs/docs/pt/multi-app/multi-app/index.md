---
pkg: '@nocobase/plugin-app-supervisor'
---

# Gestão de múltiplas aplicações

## Visão geral

A gestão multiaplicação do NocoBase permite criar e operar várias instâncias **fisicamente isoladas** em um ou mais ambientes. Com o **AppSupervisor**, tudo é administrado por um único ponto de entrada.

## Aplicação única

No início, a maioria dos projetos usa uma única aplicação.

Esse modelo é simples e barato de operar, mas com o crescimento surgem limites:

- Acúmulo de funcionalidades
- Dificuldade de isolamento entre domínios
- Aumento de custo de manutenção e escala

## Multiaplicação em memória compartilhada

Nesse modo, várias aplicações rodam em uma única instância NocoBase. Cada app é independente (pode ter banco próprio e ciclo de vida próprio), mas compartilha processo e memória.

![](https://static-docs.nocobase.com/202512231055907.png)

Vantagens:

- Separação por app
- Configuração mais clara
- Menor custo de recurso que multi-processo/multi-contêiner

Limitação: falha ou sobrecarga de uma app pode impactar as demais.

## Implantação híbrida multiambiente

Quando escala e complexidade aumentam, o modo compartilhado pode não ser suficiente. O modelo híbrido multiambiente adiciona uma app de entrada e vários ambientes de execução.

A app de entrada é responsável por:

- Criar/configurar apps
- Gerenciar ciclo de vida
- Consolidar status

Os ambientes de execução são responsáveis por:

- Hospedar e executar as apps de negócio

![](https://static-docs.nocobase.com/202512231215186.png)

Esse modelo é ideal para SaaS, muitos ambientes de demonstração e cenários multi-tenant.
