---
title: "Gestão de Leads"
description: "Guia de operação da gestão de Leads do CRM: criar Leads, pontuação automática por AI, filtros inteligentes e conversão de Leads em Clientes e Oportunidades."
keywords: "gestão de Leads,Lead,pontuação por AI,conversão de Leads,funil de vendas,NocoBase CRM"
---

# Gestão de Leads

> O Lead é o ponto de partida do processo de vendas — todo primeiro contato com um Cliente potencial começa aqui. Este capítulo guia você por todo o ciclo de vida do Lead: criação, pontuação, filtros, acompanhamento e conversão.

![cn_01-leads](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_01-leads.png)

## Visão geral da página de Leads

No menu superior, clique em **Vendas → Leads** para entrar na página de gestão de Leads.

![01-leads-2026-04-02-00-04-18](https://static-docs.nocobase.com/01-leads-2026-04-02-00-04-18.png)

No topo da página há uma fileira de **botões de filtros inteligentes** que ajudam a alternar visualizações rapidamente:

Primeiro grupo:

| Botão | Descrição |
|------|------|
| All | Mostra todos os Leads |
| New | Novos, sem acompanhamento iniciado |
| Working | Em acompanhamento |
| Qualified | Confirmados como Leads qualificados |
| Unqualified | Marcados como não qualificados |

Segundo grupo:

| Tag | Significado |
|------|------|
| 🔥 Hot | Leads com pontuação de AI ≥ 75 |
| Hoje | Leads criados hoje |
| Esta semana | Leads criados nesta semana |
| Este mês | Leads criados neste mês |
| Não atribuídos | Leads ainda sem Owner definido |
| Grandes empresas | Leads originários de Clientes corporativos |


![01-leads-2026-04-02-00-06-19](https://static-docs.nocobase.com/01-leads-2026-04-02-00-06-19.gif)


A tabela permite captar as informações principais de relance e contém colunas compostas:

- **Medidor de pontuação por AI**: medidor circular de 0 a 100, em vermelho (baixa) → amarelo (média) → verde (alta), refletindo intuitivamente a qualidade do Lead
- **Coluna composta nome+empresa**: nome e empresa exibidos juntos para economizar espaço
- **Coluna composta e-mail+telefone**: contato visível de forma clara
- **Coluna de tempo relativo**: exibe "há 3 horas", "há 2 dias" etc.; Leads atrasados são destacados em vermelho para lembrar você de fazer o acompanhamento

![01-leads-2026-04-02-00-07-04](https://static-docs.nocobase.com/01-leads-2026-04-02-00-07-04.gif)

## Criar Lead

Clique no botão **Add new** acima da tabela para abrir o formulário de criação de Lead.

![01-leads-2026-04-02-00-08-08](https://static-docs.nocobase.com/01-leads-2026-04-02-00-08-08.png)

Preencha as seguintes informações:

| Campo | Descrição | Obrigatório |
|------|------|---------|
| Name | Nome do Lead | ✅ |
| Company | Empresa | Recomendado |
| Email | Endereço de e-mail | Recomendado |
| Phone | Número de telefone | Recomendado |
| Source | Origem do Lead (formulário do site, evento, indicação etc.) | Recomendado |
...

### Verificação de duplicidade em tempo real

Conforme você preenche o formulário, o sistema verifica em tempo real os campos de nome, empresa, e-mail, telefone e celular. Se ao digitar for encontrado algum registro semelhante:

- **Aviso amarelo**: registro semelhante encontrado, recomenda-se conferir
- **Aviso vermelho**: registro totalmente duplicado encontrado, fortemente recomendado verificar o registro existente

![01-leads-2026-04-02-00-11-05](https://static-docs.nocobase.com/01-leads-2026-04-02-00-11-05.png)


Isso evita de forma eficaz que a mesma pessoa seja cadastrada várias vezes.

### Preenchimento de formulário por AI

Se você tem o texto de um cartão de visita ou o registro de uma conversa, não precisa preencher campo a campo — clique no botão de AI, escolha "Preenchimento de formulário", cole o texto e a AI extrai automaticamente nome, empresa, e-mail, telefone etc., preenchendo o formulário com um clique.

Após preencher, clique em **Submit** para salvar.

![01-leads-2026-04-02-00-15-14](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-14.png)

### Pontuação automática por AI

Após salvar, o sistema dispara automaticamente o **workflow de pontuação por AI**. A AI analisa as informações do Lead e gera os seguintes resultados:

| Saída da AI | Descrição |
|---------|------|
| Score | Pontuação geral de 0 a 100 |
| Conversion Probability | Previsão de probabilidade de conversão |
| NBA (Próxima melhor ação) | Recomendação de acompanhamento dada pela AI, por exemplo "Recomenda-se ligação em até 24 horas" |
| Tags | Tags geradas automaticamente, como "Alta intenção", "Tomador de decisão" etc. |

![01-leads-2026-04-02-00-15-53](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-53.png)

> 💡 **Dica**: quanto maior a pontuação de AI, melhor a qualidade do Lead. Recomenda-se priorizar Leads Hot (≥ 75 pontos) e concentrar esforços nos Clientes com maior probabilidade de fechamento.

## Filtrar e buscar

Os botões de filtros inteligentes do topo permitem **filtrar em tempo real** — basta clicar e o filtro entra em vigor, sem precisar atualizar a página.

Alguns cenários comuns:

- **Início do dia**: clique em "Hoje" para ver os Leads novos do dia, depois clique em "Hot" para verificar se há Leads de alta pontuação que precisam de contato imediato
- **Distribuir Leads**: clique em "Não atribuídos" para encontrar Leads ainda sem Owner e atribua um a um aos colegas de vendas
- **Revisão**: clique em "Unqualified" para revisar Leads marcados como não qualificados e verificar possíveis erros de avaliação

> 💡 **Dica**: o sistema suporta filtros via parâmetros na URL. Por exemplo, ao acessar a página de Leads com `?status=new`, o botão de filtro "New" é selecionado automaticamente. Isso é muito útil quando você chega de outra página.

## Detalhes do Lead

Na tabela, clique em qualquer Lead para abrir o modal de detalhes. O modal contém **3 abas**:

### Aba Detalhes

É a aba com mais informações; de cima para baixo contém:

![01-leads-2026-04-02-00-17-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-36.png)

**Fluxo de etapas e botões de ação**

A área superior contém a barra de etapas e os botões de ação (Edit / Convert / Lost / Assign). Barra de etapas:

```
New → Working → Converted / Lost
```

Você pode **clicar diretamente em uma etapa** para avançar o status do Lead. Por exemplo, ao iniciar o acompanhamento clique em "Working" e, ao confirmar que o Lead é qualificado, clique em "Converted" para disparar o fluxo de conversão.

![01-leads-2026-04-02-00-23-03](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-03.png)

Se já existir o registro alvo (Cliente, contato, Oportunidade), basta pesquisar e selecionar. Caso não exista, clique no botão de criação à direita do campo: o modal de criação abre com o conteúdo associado ao Lead preenchido automaticamente.
![01-leads-2026-04-07-00-14-21](https://static-docs.nocobase.com/01-leads-2026-04-07-00-14-21.gif)


Ao clicar em "Lost", aparece uma caixa de diálogo para você informar o motivo da perda — útil para análises posteriores.

![01-leads-2026-04-02-00-23-25](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-25.png)


**Cartão de pontuação por AI**

Mostra os detalhes da pontuação de AI, incluindo:
- Medidor de AI Score (0–100)
- Conversion Probability (probabilidade de conversão)
- Pipeline Days (dias no pipeline)
- NBA (próxima melhor ação)

**Área de tags coloridas**

Exibe Rating (avaliação), Status (status), Source (origem) e outros atributos-chave em tags coloridas.

**Informações básicas e botões rápidos de atividade**

Campos básicos como informações da empresa e contatos. Essa área também tem um conjunto de botões rápidos de atividade: Log Call (registrar ligação), Send Email (enviar e-mail), Schedule (criar evento), com associação automática ao Lead atual.

**AI Insights**

Insights e recomendações de acompanhamento gerados pela AI.

**Área de comentários**

Os membros da equipe podem deixar comentários para discussão; todos os comentários são migrados automaticamente para o registro de Cliente recém-criado quando o Lead é convertido.

![01-leads-2026-04-02-00-24-10](https://static-docs.nocobase.com/01-leads-2026-04-02-00-24-10.png)

### Aba E-mails

Mostra todos os e-mails relacionados a esse Lead, facilitando a revisão do histórico de comunicação. Permite enviar e-mails diretamente daqui e oferece botões com suporte de AI.

![01-leads-2026-04-02-00-17-57](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-57.png)

### Aba Histórico de alterações

Registra todas as mudanças de campos do Lead, com a precisão de "quem mudou qual campo de A para B em qual momento". Útil para rastreabilidade e revisões.

![01-leads-2026-04-02-00-22-07](https://static-docs.nocobase.com/01-leads-2026-04-02-00-22-07.png)


## Conversão do Lead

Esta é a operação **mais importante** da gestão de Leads — converter, com um clique, um Lead qualificado em Cliente, contato e Oportunidade.

### Como converter

No modal de detalhes do Lead, clique na etapa **Converted** no componente de fluxo de etapas.

![01-leads-2026-04-02-00-26-01](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-01.png)

### Fluxo de conversão

O sistema dispara automaticamente o **workflow de conversão de Lead**, executando as seguintes operações de uma só vez:

1. **Criar Cliente (Customer)** — cria um novo registro de Cliente com o nome da empresa do Lead; nome/setor/porte/endereço são preenchidos automaticamente a partir do Lead, com verificação de duplicidade
2. **Criar contato (Contact)** — cria um contato com nome, e-mail, telefone e cargo do Lead, vinculado ao Cliente
3. **Criar Oportunidade (Opportunity)** — cria um novo registro de Oportunidade; nome/origem/valor/etapa são preenchidos automaticamente a partir do Lead, vinculados ao Cliente
4. **Migrar comentários** — todos os comentários do Lead são copiados automaticamente para os registros recém-criados
5. **Atualizar status do Lead** — o status do Lead é marcado como Qualified

### Efeito após a conversão

Após a conversão, ao voltar à lista de Leads, você notará que a **coluna composta nome+empresa** desse Lead se torna um link clicável:

- Clique no nome → abre o detalhe do contato
- Clique no nome da empresa → abre o detalhe do Cliente

![01-leads-2026-04-02-00-26-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-36.png)

> 💡 **Dica**: a conversão é irreversível. Antes de converter, confirme se as informações do Lead estão corretas e completas, especialmente o nome da empresa e os dados de contato — eles serão usados como dados iniciais do Cliente e do contato.

## Atribuição automática

Quando um Lead não tem Owner definido, o sistema dispara automaticamente o **workflow de atribuição de Leads**.

A lógica de atribuição é simples: **atribui automaticamente ao vendedor que tem o menor número de Leads no momento**, garantindo equilíbrio na carga de trabalho da equipe.

Esse workflow é verificado tanto na criação quanto na atualização do Lead — se o campo Owner estiver vazio, a atribuição é feita automaticamente.

> 💡 **Dica**: se você quiser definir o Owner manualmente, basta editar o campo Owner nos detalhes. A atribuição manual sobrescreve a atribuição automática.

---

Após a conversão do Lead, seus Clientes e Oportunidades já estão prontos. Em seguida, vá para [Oportunidades e cotações](./guide-opportunities) e veja como avançar no funil de vendas.

## Páginas relacionadas

- [Visão geral do guia de operação do CRM](./index.md)
- [Oportunidades e cotações](./guide-opportunities)
- [Gestão de Clientes](./guide-customers-emails)
