# Follow-up e Gerenciamento de Status de Leads

## 1. Introdução

### 1.1 Objetivos deste capítulo

Neste capítulo, vamos juntos aprender como implementar a conversão de oportunidades de CRM no NocoBase. Por meio de follow-up de leads e gerenciamento de status, você pode aumentar a eficiência do negócio e ter um controle mais refinado do processo de vendas.

### 1.2 Prévia do resultado final

No capítulo anterior, explicamos como gerenciar associações entre dados de leads, empresas, contatos e oportunidades. Agora, vamos focar no módulo de leads, principalmente discutindo como fazer o follow-up e o gerenciamento de status. Veja o exemplo abaixo:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Estrutura da Collection de Leads

### 2.1 Apresentação da Collection de Leads

Na funcionalidade de follow-up, o campo «status» tem papel crucial — não só reflete o progresso atual do lead (como Não qualificado, Novo lead, Em atendimento, Em follow-up, Em negociação, Concluído), como também direciona a exibição e mudanças do formulário inteiro. O bloco de tabela abaixo apresenta a estrutura de campos da collection de leads e suas descrições detalhadas:


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
| status         | **Status**          | Single select    | Status atual (Não qualificado, Novo lead, Em atendimento, Em follow-up, Em negociação, Concluído) |
| Account        | **Empresa**         | Many to one      | Associada à collection de Empresas                               |
| Contact        | **Contato**         | Many to one      | Associada à collection de Contatos                               |
| Opportunity    | **Oportunidade**    | Many to one      | Associada à collection de Oportunidades                          |

## 3. Criar Bloco de Tabela (table block) e Bloco de Detalhes de Leads

### 3.1 Explicação

Primeiro, precisamos criar um table block «Leads» para exibir os campos necessários. Ao mesmo tempo, configure um bloco de detalhes na lateral direita: ao clicar em um registro, o detalhe correspondente é exibido. Veja a configuração abaixo:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Configurar Botões de Ação

### 4.1 Visão geral dos botões

Para atender a diversas necessidades de operação, precisamos criar 11 botões. Cada botão, com base no status do registro, tem comportamento distinto (escondido, ativo ou desabilitado), guiando o usuário pelo fluxo correto.
![20250226173632](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 Configuração detalhada de cada botão

#### 4.2.1 Botão Editar

- Regra de vinculação: quando o status do registro é "Completed" (Concluído), o botão é desabilitado automaticamente, evitando edições desnecessárias.

#### 4.2.2 Não qualificado Botão 1 (não ativo)

- Estilo: título exibido como "Unqualified >".
- Comportamento: ao clicar, executa update, atualizando o status do registro para "Unqualified", e após sucesso retorna à página anterior, exibindo a mensagem "Unqualified".
- Regra de vinculação: exibido apenas quando o status está vazio; assim que o status tem valor, o botão é escondido automaticamente.

#### 4.2.3 Não qualificado Botão 2 (ativo)

- Estilo: também exibido como "Unqualified >".
- Comportamento: usado para atualizar o status do registro para "Unqualified".
- Regra de vinculação: quando o status está vazio, o botão é escondido; se o status for "Completed", o botão é desabilitado.

#### 4.2.4 Novo lead Botão 1 (não ativo)

- Estilo: título exibido como "New >".
- Comportamento: ao clicar, atualiza o registro, define o status como "New", e após sucesso exibe a mensagem "New".
- Regra de vinculação: se o status do registro já estiver em "New", "Working", "Nurturing" ou "Completed", o botão é escondido.

#### 4.2.5 Novo lead Botão 2 (ativo)

- Estilo: título também "New >".
- Comportamento: também usado para atualizar o status para "New".
- Regra de vinculação: quando o status pertence a "Unqualified" ou está vazio, é escondido; se o status for "Completed", o botão é desabilitado.

#### 4.2.6 Em atendimento Botão (não ativo)

- Estilo: título exibido como "Working >".
- Comportamento: ao clicar, atualiza o status para "Working" e exibe a mensagem "Working".
- Regra de vinculação: se o status do registro já é "Working", "Nurturing" ou "Completed", o botão é escondido.

#### 4.2.7 Em atendimento Botão (ativo)

- Estilo: título também "Working >".
- Comportamento: usado para atualizar o status do registro para "Working".
- Regra de vinculação: quando o status é "Unqualified", "New" ou está vazio, é escondido; se é "Completed", é desabilitado.

#### 4.2.8 Em follow-up Botão (não ativo)

- Estilo: título exibido como "Nurturing >".
- Comportamento: ao clicar, atualiza o status para "Nurturing" e exibe a mensagem "Nurturing".
- Regra de vinculação: se o status já é "Nurturing" ou "Completed", o botão é escondido.

#### 4.2.9 Em follow-up Botão (ativo)

- Estilo: título também "Nurturing >".
- Comportamento: também atualiza o status para "Nurturing".
- Regra de vinculação: quando o status é "Unqualified", "New", "Working" ou está vazio, é escondido; se é "Completed", é desabilitado.

#### 4.2.10 Botão Converter

- Estilo: título exibido como "transfer", abre como popup modal.
- Comportamento: usado para executar a transferência do registro. Após a operação, o sistema abre uma interface com gaveta, Tabs e formulário, facilitando a transferência do registro.
- Regra de vinculação: quando o status do registro é "Completed", o botão é escondido para evitar transferências duplicadas.
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 Botão Conversão Concluída (ativo)

- Estilo: título exibido como "transfered", também em popup modal.
- Comportamento: este botão só serve para exibir as informações pós-conversão, sem capacidade de edição.
- Regra de vinculação: exibido apenas quando o status é "Completed"; nos outros (como "Unqualified", "New", "Working", "Nurturing" ou vazio), é escondido.
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 Resumo da configuração dos botões

- Cada funcionalidade tem estilos diferentes para estados não ativo e ativo.
- Aproveitando regras de vinculação, com base no status do registro controlamos dinamicamente a exibição (escondido ou desabilitado), guiando os vendedores pelo fluxo correto.

## 5. Configuração de Regras de Vinculação do Formulário

### 5.1 Regra 1: Exibir apenas o nome

- Quando o registro não está confirmado ou o status está vazio, exibe apenas o nome.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Regra 2: Otimização de exibição em status «Novo lead»

- Quando o status é «Novo lead», a página esconde o nome da empresa e exibe os contatos.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Regras de Markdown e Sintaxe Handlebars na Página

### 6.1 Exibição dinâmica de texto

Na página, usamos a sintaxe Handlebars para exibir mensagens dinâmicas conforme o status. Aqui estão os códigos de exemplo para cada status:

Quando o status é «Não qualificado»:

```markdown
{{#if (eq $nRecord.status "Não qualificado")}}
**Acompanhe as informações relevantes dos seus leads não qualificados.**  
Se seu lead não está interessado no produto ou já saiu da empresa relevante, pode estar não qualificado.  
- Registre lições aprendidas para referência futura  
- Salve detalhes de contato e abordagens  
{{/if}}
```

Quando o status é «Novo lead»:

```markdown
{{#if (eq $nRecord.status "Novo lead")}}
**Identifique os produtos ou serviços necessários para essa oportunidade.**  
- Reúna casos de clientes, referências ou análise de concorrência  
- Confirme seus principais stakeholders  
- Identifique recursos disponíveis  
{{/if}}
```

Quando o status é «Em atendimento»:

```markdown
{{#if (eq $nRecord.status "Em atendimento")}}
**Entregue sua solução aos stakeholders.**  
- Comunique o valor da solução  
- Esclareça cronograma e orçamento  
- Crie com o cliente um plano de quando e como fechar  
{{/if}}
```

Quando o status é «Em follow-up»:

```markdown
{{#if (eq $nRecord.status "Em follow-up")}}
**Defina o plano de implementação do projeto do cliente.**  
- Faça acordos conforme necessidade  
- Siga o processo interno de descontos  
- Obtenha o contrato assinado  
{{/if}}
```

Quando o status é «Conversão concluída»:

```markdown
{{#if (eq $nRecord.status "Conversão concluída")}}
**Confirme o plano de implementação e os passos finais.**  
- Garanta que todos os acordos restantes e assinaturas estão em vigor  
- Siga a política interna de descontos  
- Garanta que o contrato está assinado e a implementação corre como planejado  
{{/if}}
```

## 7. Exibir Objetos Associados Após Conversão e Links de Navegação

### 7.1 Explicação dos objetos associados

Após a conversão, queremos exibir os objetos associados (empresa, contato, oportunidade) e links para suas páginas de detalhes. Atenção: em outros popups ou páginas, a parte final do link de detalhes (o número após filterbytk) representa o id do objeto atual, por exemplo:

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 Usar Handlebars para gerar links de associação

Para Empresa:

```markdown
{{#if (eq $nRecord.status "Concluído")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Para Contato:

```markdown
{{#if (eq $nRecord.status "Concluído")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Para Oportunidade:

```markdown
{{#if (eq $nRecord.status "Concluído")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Esconder Objetos Associados Mas Manter os Valores

Para garantir a exibição correta das informações de associação após a conversão, é preciso definir o status de "Empresa", "Contato" e "Oportunidade" como "Escondido (manter valor)". Assim, mesmo que esses campos não apareçam no formulário, seus valores são registrados e propagados.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Evitar Modificação de Status Após Conversão

Para evitar mudanças acidentais no status após a conversão, adicionamos uma condição em todos os botões: quando o status é "Concluído", todos os botões são desabilitados.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Encerramento

Concluindo todos os passos acima, sua funcionalidade de follow-up e conversão de leads está pronta! Esperamos que, através da explicação passo a passo deste capítulo, você tenha ficado com uma compreensão mais clara de como implementar mudança de status com vinculação de formulário no NocoBase. Bom uso e boas operações!
