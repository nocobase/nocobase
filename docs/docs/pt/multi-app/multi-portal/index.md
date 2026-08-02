---
title: "Multiportal"
description: "Conheça o conceito, os cenários de uso, a configuração e a relação entre Multiportal, Multiaplicação e Multi-space no NocoBase."
keywords: "workspace, portal, multiportal, NocoBase"
pkg: "@nocobase/plugin-multi-portal"
---

# Multiportal

## O que é um portal

Um portal é usado para fornecer várias entradas de acesso dentro da mesma aplicação.

Cada portal pode ter de forma independente:

- Páginas
- Menus
- Estrutura de navegação
- Layout
- Configuração de permissões

O plugin Multiportal fornece os seguintes recursos:

- Gerenciamento de portais
- Alternância de portais
- Controle de permissões de portais

Com esses recursos, é possível oferecer experiências diferentes para papéis diferentes, compartilhando os mesmos dados e capacidades de negócio.

## Por que usar portais

Em cenários de negócio reais, papéis diferentes geralmente precisam de interfaces diferentes.

Por exemplo, em um sistema de gestão de varejo:

```text
Sistema de Gestão de Varejo

├─ Portal da matriz
├─ Portal da loja
├─ Portal do distribuidor
└─ Portal móvel
```

A equipe da matriz se concentra em:

- Gestão de produtos
- Gestão de estoque
- Análise de dados

A equipe da loja se concentra em:

- Caixa
- Contagem de estoque
- Processamento de pedidos

Os distribuidores se concentram em:

- Compras
- Conciliação
- Status de envio

Embora todos usem o mesmo sistema, papéis diferentes não precisam ver os mesmos menus e páginas.

É exatamente esse problema que os portais resolvem.

## Relação entre portais e menus

Cada portal tem sua própria árvore de menus.

Os menus de diferentes portais não interferem entre si.

Por exemplo:

```text
Portal da matriz
├─ Gestão de produtos
├─ Gestão da cadeia de suprimentos
└─ Análise de dados

Portal da loja
├─ Caixa
├─ Gestão de pedidos
└─ Contagem de estoque
```

## Relação entre portais e páginas

As páginas pertencem aos seus respectivos portais.

A mesma página também pode ser exibida apenas em portais específicos.

Isso permite projetar fluxos de trabalho completamente diferentes para papéis diferentes.

## Relação entre portais e permissões

Os próprios portais podem ser configurados com permissões de acesso.

Somente usuários autorizados podem acessar o portal correspondente.

Portais não autorizados:

- Não aparecem na lista do seletor
- Não podem ser acessados diretamente

## Gerenciamento de portais

Depois de habilitar o plugin Multiportal, o sistema fornece por padrão dois portais integrados:

| Portal | Caminho | Finalidade |
|----------|----------|----------|
| Desktop | `/v/admin` | Entrada para desktop |
| Mobile | `/v/mobile` | Entrada para mobile |

### Portais integrados

![2026-07-10-08-01-50](https://static-docs.nocobase.com/2026-07-10-08-01-50.png)

### Portal para desktop

Caminho de acesso:

```text
/v/admin
```

![2026-07-10-08-03-12](https://static-docs.nocobase.com/2026-07-10-08-03-12.png)

### Portal móvel

Caminho de acesso:

```text
/v/mobile
```

![2026-07-10-08-04-59](https://static-docs.nocobase.com/2026-07-10-08-04-59.png)

## Criar um portal

Além dos portais integrados, você pode criar mais portais de acordo com as necessidades do negócio.

Por exemplo:

- Portal da loja
- Portal do distribuidor
- Portal de atendimento ao cliente
- Portal de análise de dados

Depois de criar, você pode configurar:

- Páginas
- Menus
- Permissões
- Navegação

![2026-07-10-08-06-15](https://static-docs.nocobase.com/2026-07-10-08-06-15.png)

## Alternar portais

Os usuários podem alternar rapidamente entre portais pelo seletor de portais.

### Alternar portais dentro de um único app

Adicione ao painel do seletor de portais no canto superior esquerdo

![2026-07-10-08-20-41](https://static-docs.nocobase.com/2026-07-10-08-20-41.png)

Adicione ao bloco do painel de ações

![2026-07-10-08-21-15](https://static-docs.nocobase.com/2026-07-10-08-21-15.png)

### Alternar portais entre apps

Depois de habilitar Multiaplicação e configurar SSO, os usuários também podem alternar entre portais de diferentes apps pelo seletor de portais.

Adicione ao painel do seletor de portais no canto superior esquerdo

![2026-07-10-08-25-19](https://static-docs.nocobase.com/2026-07-10-08-25-19.png)

Adicione ao bloco do painel de ações

![2026-07-10-08-25-50](https://static-docs.nocobase.com/2026-07-10-08-25-50.png)

## Permissões de portal

Você pode controlar quais portais um usuário pode acessar por meio das permissões de papel.

Portais não autorizados não aparecem na lista do seletor de portais, e os usuários não podem acessar essas entradas diretamente.

![2026-07-10-08-29-22](https://static-docs.nocobase.com/2026-07-10-08-29-22.png)

## Links relacionados

Para ver as diferenças e formas de combinação entre Multiportal, Multiaplicação e Multi-space, consulte: [Multiaplicação vs Multiportal vs Multi-space](../multi-app-vs-multi-portal-vs-multi-space.md).
