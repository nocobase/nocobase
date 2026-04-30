# Implementando Conversão de Leads em CRM

## 1. Introdução

Este tutorial vai te guiar passo a passo na implementação da funcionalidade de Conversão de Oportunidades (Opportunity Conversion) do CRM no NocoBase. Vamos apresentar como criar as collections (tabelas de dados) necessárias, configurar páginas de gerenciamento de dados, projetar o fluxo de conversão e configurar gerenciamento de associações, ajudando você a construir todo o processo de negócio com sucesso.

🎉 [A solução de CRM do NocoBase está oficialmente no ar! Experimente!](https://www.nocobase.com/cn/blog/crm-solution)

## 2. Preparação: Criar as Collections Necessárias

Antes de começar, precisamos preparar as 4 collections abaixo e configurar seus relacionamentos.

### 2.1 LEAD Collection (Lead)

Essa é a collection para armazenar informações de potenciais clientes; os campos são:


| Field name     | Nome de exibição    | Field interface  | Description                                                      |
| -------------- | ------------------- | ---------------- | ---------------------------------------------------------------- |
| id             | **Id**              | Integer          | Chave primária                                                   |
| account_id     | **account_id**      | Integer          | FK ACCOUNT                                                       |
| contact_id     | **contact_id**      | Integer          | FK CONTACT                                                       |
| opportunity_id | **opportunity_id**  | Integer          | FK OPPORTUNITY                                                   |
| name           | **Nome do lead**    | Single line text | Nome do potencial cliente                                        |
| company        | **Empresa**         | Single line text | Nome da empresa do potencial cliente                             |
| email          | **E-mail**          | Email            | E-mail do potencial cliente                                      |
| phone          | **Telefone**        | Phone            | Telefone de contato                                              |
| status         | **Status**          | Single select    | Status atual do lead (Não qualificado, Novo lead, Em atendimento, Em follow-up, Em negociação, Concluído) |
| Account        | **Empresa**         | Many to one      | Associada à collection de Empresas                               |
| Contact        | **Contato**         | Many to one      | Associada à collection de Contatos                               |
| Opportunity    | **Oportunidade**    | Many to one      | Associada à collection de Oportunidades                          |

### 2.2 ACCOUNT Collection (Empresa)

Para armazenar detalhes da empresa; configuração de campos:


| Field name | Nome de exibição | Field interface  | Description                       |
| ---------- | ---------------- | ---------------- | --------------------------------- |
| name       | **Nome**         | Single line text | Nome da conta (empresa ou organização) |
| industry   | **Setor**        | Single select    | Setor da conta                    |
| phone      | **Telefone**     | Phone            | Telefone de contato da conta      |
| website    | **Site**         | URL              | Site oficial da conta             |

### 2.3 CONTACT Collection (Contato)

Collection para armazenar informações de contatos; campos:


| Field name | Nome de exibição | Field interface  | Description           |
| ---------- | ---------------- | ---------------- | --------------------- |
| name       | **Nome**         | Single line text | Nome do contato       |
| email      | **E-mail**       | Email            | E-mail do contato     |
| phone      | **Telefone**     | Phone            | Telefone do contato   |

### 2.4 OPPORTUNITY Collection (Oportunidade)

Para registrar informações de oportunidade; os campos:


| Field name | Nome de exibição | Field interface  | Description                                                      |
| ---------- | ---------------- | ---------------- | ---------------------------------------------------------------- |
| name       | **Nome**         | Single line text | Nome da oportunidade                                             |
| stage      | **Etapa**        | Single select    | Etapa da oportunidade (Qualificação, Necessidade, Proposta, Negociação, Fechamento, Sucesso, Falha) |
| amount     | **Valor**        | Number           | Valor da oportunidade                                            |
| close_date | **Data de fechamento** | Datetime    | Data prevista de fechamento                                      |

## 3. Entendendo o Fluxo de Conversão de Oportunidade

### 3.1 Visão geral do fluxo normal

Uma oportunidade, ao ser convertida de lead, geralmente passa pelas seguintes etapas:

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

### 3.2 Explicação dos relacionamentos

Suponha que você criou as 4 collections acima e configurou os relacionamentos de negócio entre elas:

![Relacionamentos](https://static-docs.nocobase.com/20250225090913.png)

## 4. Criar Páginas de Gerenciamento de Dados

No espaço de trabalho do NocoBase, crie páginas de gerenciamento de dados para cada collection, e adicione alguns leads aleatórios para testar.

![Páginas de gerenciamento](https://static-docs.nocobase.com/20250224234721.png)

## 5. Implementar a Conversão de Oportunidade

Esta seção foca em como converter um lead em dados de empresa, contato e oportunidade, e garantir que a operação de conversão não seja disparada repetidamente.

### 5.1 Criar a operação de edição «Converter»

Na tela de detalhes do lead correspondente, crie uma operação de edição com nome «Converter». No popup de conversão, faça as seguintes configurações:

#### 5.1.1 Exibir informações básicas do lead

Exiba as informações básicas do lead em modo somente leitura, garantindo que o usuário não modifique acidentalmente os dados originais.

#### 5.1.2 Exibir campos de relacionamento

No popup, exiba os três campos de relacionamento abaixo, ativando «Criação rápida» em cada um, para criar dados imediatamente quando não for encontrado um match.

![Exibir campos de relacionamento](https://static-docs.nocobase.com/20250224234155.png)

#### 5.1.3 Configurar mapeamento padrão da criação rápida

No popup de configurações da «Criação rápida», configure valores padrão para cada campo de relacionamento, mapeando automaticamente as informações do lead para a collection alvo. Regras de mapeamento:

- Lead/Nome do lead → Empresa/Nome
- Lead/E-mail → Empresa/E-mail
- Lead/Telefone → Empresa/Telefone
- Lead/Nome do lead → Contato/Nome
- Lead/E-mail → Contato/E-mail
- Lead/Telefone → Contato/Telefone
- Lead/Nome do lead → Oportunidade/Nome
- Lead/Status → Oportunidade/Etapa

Print de configuração:

![Mapeamento padrão 1](https://static-docs.nocobase.com/20250225000218.png)

Em seguida, vamos adicionar um feedback amigável à operação de submeter:
![20250226154935](https://static-docs.nocobase.com/20250226154935.png)
![20250226154952](https://static-docs.nocobase.com/20250226154952.png)

Efeito de submissão:
![Mapeamento padrão 2](https://static-docs.nocobase.com/20250225001256.png)

#### 5.1.4 Verificar efeito da conversão

Após configurar, ao executar a conversão, o sistema cria e relaciona novos dados de empresa, contato e oportunidade, conforme o mapeamento. Exemplo:

![](https://static-docs.nocobase.com/202502252130-transfer1.gif)
![](https://static-docs.nocobase.com/202502252130-transfer2.gif)

### 5.2 Evitar Conversão Duplicada

Para evitar que o mesmo lead seja convertido várias vezes, podemos controlar das seguintes formas:

#### 5.2.1 Atualizar status do lead

Na operação de submeter do formulário de conversão, adicione um passo de atualização automática de dados, mudando o status do lead para «Convertido».

Print de configuração:

![Atualizar status 1](https://static-docs.nocobase.com/20250225001758.png)
![Atualizar status 2](https://static-docs.nocobase.com/20250225001817.png)
Demonstração:
![202502252130-transfer](https://static-docs.nocobase.com/202502252130-transfer.gif)

#### 5.2.2 Configurar regra de vinculação do botão

Adicione uma regra de vinculação ao botão de conversão: quando o status do lead for «Convertido», esconde o botão automaticamente, evitando operações duplicadas.

Print de configuração:

![Vinculação botão 1](https://static-docs.nocobase.com/20250225001838.png)
![Vinculação botão 2](https://static-docs.nocobase.com/20250225001939.png)
![Vinculação botão 3](https://static-docs.nocobase.com/20250225002026.png)

## 6. Configurar Blocos de Gerenciamento de Associações na Página de Detalhes

Para que os usuários possam ver os dados associados nas páginas de detalhes de cada Collection, você precisa configurar os blocos de lista ou blocos de detalhes correspondentes.

### 6.1 Configurar Página de Detalhes da Collection Empresa

Na página de detalhes da empresa (por exemplo, no popup de edição/detalhes do contato), adicione os seguintes blocos de lista:

- Lista de contatos
- Lista de oportunidades
- Lista de leads

Print de exemplo:

![Página de detalhes da empresa](https://static-docs.nocobase.com/20250225085418.png)

### 6.2 Adicionar Condições de Filtro

Adicione regras de filtragem em cada bloco de lista, garantindo que só exibam os dados associados ao ID da empresa atual.

Print de configuração:

![Filtro 1](https://static-docs.nocobase.com/20250225085513.png)
![Filtro 2](https://static-docs.nocobase.com/20250225085638.png)

### 6.3 Configurar Página de Detalhes do Contato e da Oportunidade

No popup de detalhes da Collection de Contato, adicione os seguintes blocos:

- Lista de oportunidades
- Detalhes da empresa
- Lista de leads (filtrado por ID)

Print:

![Detalhes do contato](https://static-docs.nocobase.com/20250225090231.png)

Na página de detalhes da oportunidade, adicione também:

- Lista de contatos
- Detalhes da empresa
- Lista de leads (filtrado por ID)

Print:

![Detalhes da oportunidade](https://static-docs.nocobase.com/20250225091208.png)

## 7. Conclusão

Com os passos acima, você implementou com sucesso uma funcionalidade simples de conversão de oportunidade em CRM, e configurou o gerenciamento de associações entre contatos, empresas e leads. Esperamos que este tutorial, de forma clara e gradual, tenha te ajudado a dominar a construção de todo o processo de negócio, trazendo praticidade e eficiência operacional ao seu projeto.

---

Se encontrar qualquer problema durante o processo, sinta-se à vontade para conversar na [comunidade NocoBase](https://forum.nocobase.com) ou consultar a [documentação oficial](https://docs-cn.nocobase.com). Esperamos que este guia possa ajudar você a implementar a revisão de cadastro de usuário conforme suas necessidades reais e estender flexivelmente. Bom uso e sucesso no projeto!
