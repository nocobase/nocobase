# Multiportal, Multiaplicação e Multi-space

O NocoBase oferece três capacidades: Multiportal, Multiaplicação e Multi-space.

Elas resolvem problemas em dimensões diferentes e podem ser usadas separadamente ou em conjunto.

## Diferenças principais

| Capacidade | Multiportal | Multiaplicação | Multi-space |
|------|------|------|------|
| Que problema resolve | Fornece várias entradas de acesso | Divide o negócio em vários sistemas | Isola dados de negócio |
| Foco principal | De onde o usuário entra | Como o sistema é dividido | A quem os dados pertencem |
| Dados | Compartilhados | Independentes por padrão | Isolados |
| Páginas e menus | Independentes | Independentes | Compartilhados |
| Configuração de plugins | Compartilhada | Independente | Compartilhada |
| Sistema de usuários | Compartilhado | Pode ser compartilhado por SSO | Compartilhado |
| Cenários típicos | Papéis diferentes precisam de entradas diferentes | Negócios diferentes precisam de gestão independente | Múltiplas organizações, lojas ou inquilinos |
| Pode ser combinado | Sim | Sim | Sim |

## Multiportal

Multiportal fornece várias entradas de acesso dentro da mesma aplicação.

Por exemplo:

```text
Aplicação ERP

├─ Portal de administração (/v/admin)
├─ Portal da loja (/v/store)
├─ Portal do distribuidor (/v/dealer)
└─ Portal móvel (/v/mobile)
```

Características:

- Usa a mesma aplicação
- Compartilha os mesmos dados
- Compartilha a configuração de plugins
- Páginas e menus podem ser configurados de forma independente

É adequado para cenários em que papéis diferentes precisam de entradas diferentes, como:

- Administradores
- Funcionários
- Clientes
- Distribuidores

## Multiaplicação

Multiaplicação divide o negócio em várias aplicações independentes.

Por exemplo:

```text
Sistema do grupo

├─ CRM
├─ ERP
├─ OA
└─ Análise
```

Características:

- Cada aplicação é gerenciada de forma independente
- Configuração de plugins independente
- Conexão com banco de dados independente
- Atualização e manutenção independentes

Adequado para:

- Dividir grandes sistemas de negócio
- Desenvolvimento colaborativo entre várias equipes
- Criação em lote de aplicações para plataformas SaaS
- Aplicações independentes para diferentes clientes

## Multi-space

Multi-space isola dados de negócio dentro da mesma aplicação.

Por exemplo:

```text
Aplicação de gestão de lojas

Espaços
├─ Loja de Pequim
├─ Loja de Xangai
└─ Loja de Shenzhen
```

Características:

- Páginas compartilhadas
- Menus compartilhados
- Fluxos compartilhados
- Configuração compartilhada
- Dados isolados

Para tabelas com o campo de espaço habilitado, o sistema filtra automaticamente os dados de acordo com o espaço atual.

Na perspectiva do usuário:

- A loja de Pequim só pode ver os dados de Pequim
- A loja de Xangai só pode ver os dados de Xangai
- A loja de Shenzhen só pode ver os dados de Shenzhen

Mas todas as lojas continuam usando o mesmo sistema.

## Relação entre os três

Essas três capacidades não entram em conflito. Elas atuam em dimensões diferentes.

Elas podem ser usadas em conjunto:

```text
Sistema do grupo

Aplicação CRM
├─ Portal de administração
├─ Portal de vendas
└─ Portal do cliente

Espaços
├─ Filial de Pequim
├─ Filial de Xangai
└─ Filial de Shenzhen
```

Conceitualmente:

```text
Portal
    ↓
De onde o usuário entra no sistema

Aplicação
    ↓
Como o sistema é dividido

Espaço
    ↓
A quem os dados pertencem
```

## Como escolher

Se você quer apenas fornecer entradas diferentes para papéis diferentes, escolha **Multiportal**.

Se você quer dividir o negócio em vários sistemas independentes, escolha **Multiaplicação**.

Se você quer isolar os dados de diferentes organizações ou inquilinos dentro do mesmo sistema, escolha **Multi-space**.

Em projetos reais, essas três capacidades geralmente são usadas em conjunto, e não como substitutas umas das outras.

Em uma frase:

> Multiportal resolve o problema das entradas, Multiaplicação resolve a divisão do sistema e Multi-space resolve o isolamento de dados.
