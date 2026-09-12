---
title: "Perfis e permissões"
description: "Descrição do sistema de Perfis do CRM: que páginas cada cargo pode ver e em que dados pode operar."
keywords: "Perfis e permissões,permissões de dados,permissões de menu,Perfil de departamento,NocoBase CRM"
---

# Perfis e permissões

> Pessoas em cargos diferentes veem menus distintos e operam dados diferentes ao entrar no CRM. Este capítulo responde a uma pergunta: **"O que eu posso ver e o que eu posso fazer?"**

## Qual é o meu Perfil?

O Perfil vem de duas origens:
1. **Perfil pessoal** — Perfil atribuído diretamente pelo administrador, que acompanha você
   ![08-roles-2026-04-07-01-45-14](https://static-docs.nocobase.com/08-roles-2026-04-07-01-45-14.png)

2. **Perfil de departamento** — o departamento ao qual você pertence está vinculado a um Perfil; ao ingressar no departamento você herda automaticamente

![08-roles-2026-04-07-01-46-57](https://static-docs.nocobase.com/08-roles-2026-04-07-01-46-57.png)

Os dois se somam. Por exemplo, se você tem o Perfil "representante de vendas" individualmente e também é integrante do departamento de Marketing, então você acumula as permissões de ambos os Perfis.

![cn_08-roles](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles.png)

> \* **Sales Manager** e **Executive** não têm vínculo de departamento; são atribuídos diretamente ao indivíduo pelo administrador.

---

## Páginas que cada Perfil pode ver

Após o login, a barra de menu mostra apenas as páginas às quais você tem acesso:

![cn_08-roles_1](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_1.png)

> ¹ Representantes de vendas veem apenas o painel pessoal SalesRep, não veem os painéis SalesManager nem Executive.

![08-roles-2026-04-07-01-47-48](https://static-docs.nocobase.com/08-roles-2026-04-07-01-47-48.png)

---

## Em quais dados eu posso operar?

### Lógica central das permissões de dados

![cn_08-roles_2](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_2.png)

### Permissões de dados do representante de vendas

Como é o Perfil mais utilizado, vale destacar:

![cn_08-roles_3](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_3.png)

**Por que os Leads são visíveis para todos?**
- Você precisa ver os Leads "não atribuídos" para reivindicar proativamente
- Ao verificar duplicidade, é necessário ver toda a base para evitar duplicações
- Leads de outras pessoas você só pode ver, sem alterar

![08-roles-2026-04-07-01-48-42](https://static-docs.nocobase.com/08-roles-2026-04-07-01-48-42.png)

**Por que vejo apenas os meus Clientes?**
- Os Clientes são ativos centrais e têm dono claro
- Para evitar que você veja os contatos dos Clientes de outra pessoa
- Em caso de transferência, fale com seu gerente

![08-roles-2026-04-07-01-50-37](https://static-docs.nocobase.com/08-roles-2026-04-07-01-50-37.png)

**² Os contatos seguem o Cliente**

O conjunto de contatos que você consegue ver:
1. Contatos pelos quais você é diretamente responsável
2. **Todos** os contatos sob os Clientes que você é responsável (mesmo que cadastrados por outra pessoa)

> Exemplo: você é responsável pelo Cliente "Huawei", então todos os contatos sob a Huawei são visíveis para você, independentemente de quem os cadastrou.

![08-roles-2026-04-07-01-51-26](https://static-docs.nocobase.com/08-roles-2026-04-07-01-51-26.png)

### Permissões de dados de outros Perfis

| Perfil | Dados gerenciados integralmente | Outros dados |
|------|-----------------|---------|
| Gerente de vendas | Todos os dados do CRM | — |
| Executivo | — | Todos somente leitura + exportação |
| Financeiro | Pedidos, pagamentos, taxas de câmbio, cotações | Demais somente leitura |
| Marketing | Leads, tags de Lead, templates de análise de dados | Demais somente leitura |
| Customer Success Manager | Clientes, contatos, atividades, comentários, mesclagem de Clientes | Demais somente leitura |
| Suporte técnico | Atividades, comentários (apenas os criados por si) | Contatos: pode ver os que é responsável |
| Produto | Produtos, categorias, preços por faixa | Demais somente leitura |

---

## Verificação de duplicidade: resolvendo o problema do "não consigo ver"

Como os dados de Cliente têm isolamento por dono, você não vê os Clientes de outros vendedores. Mas, antes de cadastrar um Lead ou Cliente novo, você precisa confirmar **se já não há alguém acompanhando aquele caso**.

![cn_08-roles_4](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_4.png)

A página de verificação de duplicidade suporta três tipos de busca:

- **Verificar Lead**: digite nome, empresa, e-mail ou celular
- **Verificar Cliente**: digite nome da empresa ou telefone
- **Verificar contato**: digite nome, e-mail ou celular

O resultado mostra **quem é o responsável**. Se já existir, basta falar com o colega correspondente para alinhar e evitar conflitos.

![08-roles-2026-04-07-01-52-51](https://static-docs.nocobase.com/08-roles-2026-04-07-01-52-51.gif)

---

## Perguntas frequentes

**P: Não consigo ver uma página, o que faço?**

Significa que seu Perfil não tem acesso àquela página. Se for necessário para o seu trabalho, fale com o administrador para ajustar.

**P: Consigo ver os dados, mas não tenho o botão de editar/excluir.**

Você só tem permissão de visualização sobre esses dados. Geralmente é porque o registro não pertence a você (o owner não é você). Os botões sem permissão ficam ocultos, não são exibidos.

**P: Acabei de entrar em um departamento, quando as permissões entram em vigor?**

Imediatamente. Basta atualizar a página para ver o novo menu.

**P: Uma pessoa pode ter vários Perfis?**

Sim. Perfis pessoais + Perfil de departamento se acumulam. Por exemplo, se você foi atribuído ao Perfil "representante de vendas" individualmente e também integra o departamento de Marketing, você acumula as permissões de ambos os Perfis.

## Documentos relacionados

- [Introdução ao sistema e dashboards](./guide-overview) — uso de cada dashboard
- [Gestão de Leads](./guide-leads) — operação completa do Lead
- [Gestão de Clientes](./guide-customers-emails) — visão 360 do Cliente
