# Visualização do Pipeline de Vendas em CRM

## 1. Introdução

### 1.1 Prefácio

Este capítulo é a segunda parte da série [Como Implementar Conversão de Leads em CRM no NocoBase](https://www.nocobase.com/cn/tutorials/how-to-implement-lead-conversion-in-nocobase). No capítulo anterior, apresentamos o básico da conversão de leads, incluindo criação das collections necessárias, configuração de páginas de gerenciamento de dados e a funcionalidade de conversão de lead em empresa, contato e oportunidade. Este capítulo foca no fluxo de follow-up do lead e gerenciamento de status.

🎉 [A solução de CRM do NocoBase está oficialmente no ar! Experimente!](https://www.nocobase.com/cn/blog/crm-solution)

### 1.2 Objetivos deste capítulo

Neste capítulo, vamos aprender juntos como implementar a conversão de leads em CRM no NocoBase. Por meio de follow-up e gerenciamento de status, você melhora a eficiência do negócio e tem controle mais refinado do processo de vendas.

### 1.3 Prévia do resultado final

No capítulo anterior, explicamos como gerenciar a associação entre leads, empresas, contatos e oportunidades. Agora vamos focar no módulo de leads, principalmente discutindo como fazer follow-up e gerenciamento de status. Veja:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Estrutura da Collection de Leads

### 2.1 Apresentação da Collection de Leads

Na funcionalidade de follow-up, o campo "status" tem papel crucial — não só reflete o progresso atual do lead (Não qualificado, Novo lead, Em atendimento, Em follow-up, Em negociação, Concluído), como também direciona a exibição e mudanças do formulário inteiro. O bloco abaixo mostra a estrutura de campos da collection:


| Field name     | Nome de exibição    | Field interface  | Description                                                                      |
| -------------- | ------------------- | ---------------- | -------------------------------------------------------------------------------- |
| id             | **Id**              | Integer          | Chave primária                                                                   |
| account_id     | **account_id**      | Integer          | FK ACCOUNT da tabela de empresas                                                 |
| contact_id     | **contact_id**      | Integer          | FK CONTACT da tabela de contatos                                                 |
| opportunity_id | **opportunity_id**  | Integer          | FK OPPORTUNITY da tabela de oportunidades                                        |
| name           | **Nome do lead**    | Single line text | Nome do potencial cliente                                                        |
| company        | **Empresa**         | Single line text | Nome da empresa do potencial cliente                                             |
| email          | **E-mail**          | Email            | E-mail do potencial cliente                                                      |
| phone          | **Telefone**        | Phone            | Telefone de contato                                                              |
| status         | **Status**          | Single select    | Status atual do lead, padrão "Não qualificado" (Não qualificado, Novo lead, Em atendimento, Em follow-up, Em negociação, Concluído) |
| Account        | **Empresa**         | Many to one      | Associada à empresa                                                              |
| Contact        | **Contato**         | Many to one      | Associada ao contato                                                             |
| Opportunity    | **Oportunidade**    | Many to one      | Associada à oportunidade                                                         |

## 3. Criar Bloco de Tabela (table block) e Bloco de Detalhes de Leads

### 3.1 Explicação

Primeiro, precisamos criar um table block "Leads" para exibir os campos necessários. Ao mesmo tempo, configure um bloco de detalhes na lateral direita: ao clicar em um registro, o detalhe correspondente é exibido. Veja:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Configurar Botões de Ação

### 4.1 Visão geral

Para atender a diversas necessidades, criamos 10 botões. Cada um, com base no status, tem comportamento diferente (escondido, ativo ou desabilitado), guiando pelo fluxo correto.
![20250311083825](https://static-docs.nocobase.com/20250311083825.png)

### 4.2 Configuração detalhada de cada botão


| Botão                          | Estilo                                | Operação                                                       | Regra de vinculação                                                                                  |
| ------------------------------ | ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Botão Editar                   | Operação editar                       | —                                                              | Quando status é "Completed" (Concluído), desabilitado, evitando edições desnecessárias.             |
| Não qualificado (ativo)        | "Unqualified >"                       | Atualiza status para "Unqualified".                            | Exibido por padrão; se status é "Completed", desabilitado.                                          |
| Novo lead (não ativo)          | Update, "New >"                       | Define status como "New", e exibe mensagem "New".              | Se status do registro não for "Unqualified", esconde. (Já em "New" ou posterior, deve estar ativo)  |
| Novo lead (ativo)              | Update, "New >"                       | Atualiza status para "New".                                    | Esconde quando status é "Unqualified"; se "Completed", desabilita.                                  |
| Em atendimento (não ativo)     | Update, "Working >"                   | Atualiza status para "Working", exibe mensagem.                | Esconde quando status não for "Unqualified", "New".                                                 |
| Em atendimento (ativo)         | Update, "Working >"                   | Atualiza status para "Working".                                | Esconde quando status é "Unqualified" ou "New"; se "Completed", desabilita.                         |
| Em follow-up (não ativo)       | Update, "Nurturing >"                 | Define status como "Nurturing", exibe mensagem.                | Esconde quando status não for "Unqualified", "New", "Working".                                      |
| Em follow-up (ativo)           | Update, "Nurturing >"                 | Atualiza status para "Nurturing".                              | Esconde quando status é "Unqualified", "New", "Working"; se "Completed", desabilita.                |
| Botão Converter                | Editar, "transfer", ícone "√"         | Abre formulário de conversão; ao submeter, status vira "Completed". | Esconde quando status é "Completed", evitando transferências repetidas.                             |
| Conversão concluída (ativo)    | Visualizar, "transfered", ícone "√"   | Apenas exibe info pós-conversão, sem capacidade de edição.     | Exibido apenas se status é "Completed"; outros status, escondido.                                   |

- Exemplos de regra de vinculação:
  Em atendimento (não ativo)
  ![20250311084104](https://static-docs.nocobase.com/20250311084104.png)
  Em atendimento (ativo)
  ![20250311083953](https://static-docs.nocobase.com/20250311083953.png)
- Formulário de conversão:
  Botão converter (não ativo)
  ![](https://static-docs.nocobase.com/20250226094223.png)
  Botão converter (ativo)
  ![](https://static-docs.nocobase.com/20250226094203.png)
- Aviso ao submeter conversão:
  ![20250311084638](https://static-docs.nocobase.com/20250311084638.png)

### 4.3 Resumo

- Cada funcionalidade tem estilos para estados não ativo e ativo.
- Aproveitamos regras de vinculação para controlar a exibição (esconder ou desabilitar) conforme o status, guiando o vendedor pelo fluxo correto.

## 5. Regras de Vinculação do Formulário

### 5.1 Regra 1: Exibir apenas o nome

- Quando o registro não está confirmado, exibe apenas o nome.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Regra 2: Otimização em status "Novo lead"

- Quando status é "Novo lead", a página esconde o nome da empresa e exibe os contatos.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Regras de Markdown e Sintaxe Handlebars

### 6.1 Texto dinâmico

Na página, usamos sintaxe Handlebars para exibir mensagens diferentes conforme o status. Códigos por status:

Quando status é "Não qualificado":

```markdown
{{#if (eq $nRecord.status "Não qualificado")}}
**Acompanhe as informações relevantes dos seus leads não qualificados.**  
Se seu lead não está interessado no produto ou já saiu da empresa relevante, pode ser não qualificado.  
- Registre lições aprendidas para referência futura  
- Salve detalhes de contato e abordagens  
{{/if}}
```

Quando status é "Novo lead":

```markdown
{{#if (eq $nRecord.status "Novo lead")}}
**Colete mais informações sobre este lead.**  
- Entenda as necessidades e interesses do potencial cliente
- Reúna dados de contato e contexto da empresa
- Defina prioridade e modo de follow-up
{{/if}}
```

Quando status é "Em atendimento":

```markdown
{{#if (eq $nRecord.status "Em atendimento")}}
**Aborde proativamente o lead e avalie as necessidades.**  
- Conecte-se via telefone/e-mail com o potencial cliente
- Entenda problemas e desafios do cliente
- Avalie o fit entre necessidades do cliente e produto/serviço
{{/if}}
```

Quando status é "Em follow-up":

```markdown
{{#if (eq $nRecord.status "Em follow-up")}}
**Aprofunde nas necessidades, faça nutrição do lead.**  
- Forneça materiais ou sugestões de solução
- Tire dúvidas, elimine objeções
- Avalie probabilidade de conversão
{{/if}}
```

Quando status é "Conversão concluída":

```markdown
{{#if (eq $nRecord.status "Conversão concluída")}}
**Lead convertido em cliente com sucesso.**  
- Confirme a criação dos registros de empresa e contato
- Crie registro de oportunidade e plano de follow-up
- Repasse materiais e histórico ao vendedor responsável
{{/if}}
```

## 7. Exibir Objetos Associados Após Conversão e Links de Navegação

### 7.1 Sobre os objetos associados

Após a conversão, queremos exibir os objetos associados (empresa, contato, oportunidade) e poder ir direto às páginas de detalhes.
Pegue um popup de detalhes qualquer, por exemplo da empresa, e copie o link.
![20250311085502](https://static-docs.nocobase.com/20250311085502.png)
Atenção: em outros popups ou páginas, a parte final do link de detalhes (número após filterbytk) representa o id do objeto, por exemplo:

```text
{Base URL}/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{id}
```

### 7.2 Usar Handlebars para gerar links

Empresa:

```markdown
{{#if (eq $nRecord.status "Concluído")}}
**Empresa:**
[{{$nRecord.account.name}}](w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Contato:

```markdown
{{#if (eq $nRecord.status "Concluído")}}
**Contato:**
[{{$nRecord.contact.name}}](1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Oportunidade:

```markdown
{{#if (eq $nRecord.status "Concluído")}}
**Oportunidade:**
[{{$nRecord.opportunity.name}}](si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Esconder Objetos Associados Mas Manter os Valores

Para garantir a exibição correta das informações de associação após a conversão, defina o status de "Empresa", "Contato" e "Oportunidade" como "Escondido (manter valor)". Assim, mesmo sem aparecerem no formulário, seus valores são registrados e propagados.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Evitar Modificação de Status Após Conversão

Para evitar mudanças acidentais no status após a conversão, adicionamos uma condição em todos os botões: quando o status é "Concluído", todos os botões são desabilitados.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Encerramento

Concluindo esses passos, sua funcionalidade de follow-up e conversão de leads está pronta! Esperamos que com essa explicação passo a passo você tenha entendido melhor como funciona a vinculação dinâmica de status e formulário no NocoBase. Bom uso e sucesso nas operações!
