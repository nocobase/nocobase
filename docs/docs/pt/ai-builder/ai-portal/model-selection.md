---
title: "Seleção de LLM"
description: "Conheça os resultados dos testes e as orientações para selecionar os principais modelos de ponta na construção de aplicações NocoBase, com base em um sistema de avaliação padronizado que abrange modelagem de dados, páginas, permissões e fluxos de trabalho."
keywords: "NocoBase AI Builder,seleção de LLM,GPT,DeepSeek,Qwen,AI Agent,avaliação de modelos"
---

# Seleção de LLM

:::tip Conclusão principal

**Os principais modelos de ponta disponíveis atualmente no mercado são capazes de construir a estrutura central de uma aplicação NocoBase.**

Os modelos apresentam diferenças quanto à completude do resultado inicial, ao tempo de construção e à quantidade de problemas. Escolha um modelo considerando os serviços já disponíveis, as condições de rede da sua região, o custo e as preferências da sua equipe.

:::

Esta avaliação utilizou um conjunto padronizado de requisitos de CRM (um sistema de oportunidades de vendas e acompanhamento de clientes) para validar as aplicações construídas por diferentes modelos:

| Dimensões de avaliação | Itens de avaliação padronizados |
| :---: | :---: |
| 14 | 61 |

## Dimensões de avaliação

A avaliação abrange os principais recursos, as capacidades de configuração e os componentes fundamentais do NocoBase. Ela também verifica se cada modelo consegue compreender os requisitos e executar as tarefas de construção correspondentes.

| Capacidade | Foco da avaliação |
| --- | --- |
| Modelagem de dados | Coleções, tipos de campo, relacionamentos, restrições obrigatórias e de unicidade e valores padrão |
| Páginas e funcionalidades | Navegação, listas, formulários, detalhes, pesquisa, filtros e painéis |
| Lógica de negócio | Transições de status, validações de negócio, regras de cálculo e consistência dos dados relacionados |
| Permissões e segurança | Papéis, permissões de menu, permissões de ação, escopos de dados e permissões de campo |
| Automação de fluxos de trabalho | Gatilhos, nós, ramificações condicionais, notificações, efeitos colaterais nos dados e novas tentativas após falhas |
| Experiência do usuário | Arquitetura da informação, experiência de formulários, feedback das ações e layouts responsivos |
| Robustez | Entradas inválidas, envios duplicados, consistência em caso de falha, volume de dados e recuperação da rede |
| Cobertura dos requisitos | Se os requisitos explícitos e os principais fluxos de negócio foram totalmente implementados |
| Extensões razoáveis | Se os recursos adicionados proativamente pelo modelo atendem a um objetivo de negócio claro |
| Controle de escopo | Se o resultado contém módulos de negócio duplicados, não utilizados ou fora do escopo |

## Resultados da avaliação

| Dimensão de avaliação | GPT-5.6 Sol | DeepSeek-V4-Flash | Qwen3.8-Max | GPT-5.6 Luna |
| --- | :---: | :---: | :---: | :---: |
| Modelagem de dados | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> |
| Implementação das funcionalidades | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#d97706;font-weight:600">◐ Parcialmente aprovado</span> |
| Lógica de negócio | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> |
| Permissões e segurança | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> |
| Automação de fluxos de trabalho | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> |
| Experiência do usuário | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#d97706;font-weight:600">◐ Parcialmente aprovado</span> |
| Robustez | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> |
| Cobertura dos requisitos | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#d97706;font-weight:600">◐ Parcialmente aprovado</span> |
| Extensões razoáveis | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> |
| Controle de escopo | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> | <span style="color:#15803d;font-weight:600">✓ Aprovado</span> |
| **Velocidade de construção** | <span style="color:#2563eb;font-weight:700">Relativamente rápido</span> | <span style="color:#2563eb;font-weight:700">Relativamente rápido</span> | <span style="color:#d97706;font-weight:700">Lento</span> | <span style="color:#15803d;font-weight:700">Mais rápido</span> |
| **Pontuação de qualidade em uma única execução** | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">91</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#c2410c;background:#fff7ed;font-weight:800">77</span> |

:::tip Pontuação de qualidade em uma única execução

A pontuação de qualidade em uma única execução tem o máximo de 100 pontos. Um ponto é descontado para cada bug encontrado durante a primeira verificação completa de aceitação, fornecendo uma indicação da qualidade da construção inicial do modelo. O modelo pode resolver esses problemas por meio de feedback e revisões posteriores.

:::

:::info Observação sobre o tempo de construção

O tempo de construção é afetado por fatores como o desempenho do hardware do computador, a instalação de dependências e a compilação do Build, a velocidade de resposta do serviço de modelo e as condições da rede.

:::

## Detalhes dos itens de avaliação

Os 61 itens de avaliação padronizados estão organizados em três camadas: 46 itens para a qualidade do resultado da construção, 7 para a compreensão dos requisitos e extensões razoáveis e 8 para a eficiência do processo de construção. Todos os itens utilizam métodos de inspeção e critérios de aprovação consistentes.

### Camada 1: Qualidade do resultado da construção (46 itens)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensão de avaliação</th><th>Itens de avaliação padronizados</th></tr></thead>
  <tbody>
    <tr><td>Modelagem de dados (8 itens)</td><td><code>DM-01</code> Se todas as coleções necessárias foram criadas<br /><code>DM-02</code> Se todos os campos necessários existem<br /><code>DM-03</code> Se os tipos de campo estão corretos<br /><code>DM-04</code> Se relacionamentos um para um podem ser criados e utilizados<br /><code>DM-05</code> Se relacionamentos um para muitos podem ser criados e utilizados<br /><code>DM-06</code> Se relacionamentos muitos para muitos podem ser criados e utilizados<br /><code>DM-07</code> Se as regras de obrigatoriedade, unicidade e valor padrão entram em vigor<br /><code>DM-08</code> Se os dados relacionados podem ser visualizados e filtrados</td></tr>
    <tr><td>Implementação das funcionalidades (6 itens)</td><td><code>FC-01</code> Se todas as páginas e entradas de navegação necessárias estão presentes<br /><code>FC-02</code> Se os registros podem ser criados, visualizados, editados e excluídos<br /><code>FC-03</code> Se os principais percursos do usuário podem ser concluídos de ponta a ponta<br /><code>FC-04</code> Se as principais ações de negócio estão disponíveis<br /><code>FC-05</code> Se pesquisa, filtragem e ordenação estão disponíveis<br /><code>FC-06</code> Se os painéis contêm o conteúdo necessário</td></tr>
    <tr><td>Lógica de negócio (6 itens)</td><td><code>BL-01</code> Se as regras de transição de status das oportunidades estão corretas<br /><code>BL-02</code> Se as regras de validação de negócio entram em vigor<br /><code>BL-03</code> Se os campos calculados e as definições estatísticas estão corretos<br /><code>BL-04</code> Se os dados são mapeados corretamente após a conversão do lead<br /><code>BL-05</code> Se as atualizações dos registros relacionados permanecem consistentes<br /><code>BL-06</code> Se as regras de exclusão e arquivamento estão corretas</td></tr>
    <tr><td>Permissões e segurança (7 itens)</td><td><code>ACL-01</code> Se todos os papéis necessários foram criados<br /><code>ACL-02</code> Se os usuários de teste e as atribuições de papéis estão corretos<br /><code>ACL-03</code> Se as permissões de acesso a páginas e menus estão corretas<br /><code>ACL-04</code> Se as permissões de operação de dados estão corretas<br /><code>ACL-05</code> Se os escopos de dados no nível do registro estão corretos<br /><code>ACL-06</code> Se as permissões de visualização e edição no nível do campo estão corretas<br /><code>ACL-07</code> Se as alterações e combinações de papéis funcionam corretamente</td></tr>
    <tr><td>Automação de fluxos de trabalho (7 itens)</td><td><code>WF-01</code> Se todos os fluxos de trabalho necessários foram criados e habilitados<br /><code>WF-02</code> Se os gatilhos dos fluxos de trabalho foram projetados corretamente<br /><code>WF-03</code> Se a ordem dos nós e a transferência de dados estão corretas<br /><code>WF-04</code> Se as condições e os resultados das ramificações estão corretos<br /><code>WF-05</code> Se os efeitos colaterais de leitura e gravação de registros estão corretos<br /><code>WF-06</code> Se os destinatários e o conteúdo das notificações estão corretos<br /><code>WF-07</code> Se os logs de falhas e o comportamento de novas tentativas são rastreáveis</td></tr>
    <tr><td>Experiência do usuário (7 itens)</td><td><code>UX-01</code> Se a navegação e a arquitetura da informação são claras<br /><code>UX-02</code> Se as informações das listas e as ações comuns são fáceis de utilizar<br /><code>UX-03</code> Se o agrupamento, a ordem e as orientações dos formulários são claros<br /><code>UX-04</code> Se as páginas de detalhes ajudam na compreensão e nas ações de acompanhamento<br /><code>UX-05</code> Se o feedback das ações e as mudanças de status são claros<br /><code>UX-06</code> Se a aplicação pode ser utilizada em diferentes larguras de tela<br /><code>UX-07</code> Se os estados vazio, de carregamento e de erro estão completos</td></tr>
    <tr><td>Robustez (5 itens)</td><td><code>ROB-01</code> Se entradas inválidas e de limite são tratadas com segurança<br /><code>ROB-02</code> Se envios duplicados provocam efeitos colaterais duplicados<br /><code>ROB-03</code> Se os dados permanecem consistentes quando a execução falha<br /><code>ROB-04</code> Se a aplicação continua utilizável com conjuntos de dados vazios e grandes<br /><code>ROB-05</code> Se a aplicação consegue se recuperar após a interrupção de uma sessão ou da rede</td></tr>
  </tbody>
</table>

### Camada 2: Compreensão dos requisitos e extensões razoáveis (7 itens)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensão de avaliação</th><th>Itens de avaliação padronizados</th></tr></thead>
  <tbody>
    <tr><td>Cobertura dos requisitos (3 itens)</td><td><code>COV-01</code> Se todas as páginas e ações solicitadas no prompt foram implementadas<br /><code>COV-02</code> Se todos os dados, permissões e fluxos de trabalho solicitados no prompt foram implementados<br /><code>COV-03</code> Se estão presentes os recursos exigidos pelo processo principal, mas não especificados individualmente no prompt</td></tr>
    <tr><td>Extensões razoáveis (2 itens)</td><td><code>EXT-01</code> Se os campos, relacionamentos e regras adicionados proativamente são necessários<br /><code>EXT-02</code> Se as páginas, ações e estatísticas adicionadas proativamente atendem a um objetivo claro</td></tr>
    <tr><td>Controle de escopo (2 itens)</td><td><code>SCOPE-01</code> Se foram gerados recursos e configurações duplicados ou não utilizados<br /><code>SCOPE-02</code> Se foram adicionados módulos de negócio que não têm relação com o escopo da tarefa</td></tr>
  </tbody>
</table>

### Camada 3: Eficiência do processo de construção (8 itens)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensão de avaliação</th><th>Itens de avaliação padronizados</th></tr></thead>
  <tbody>
    <tr><td>Tempo até o primeiro resultado utilizável (1 item)</td><td><code>EFF-FIRST-01</code> Tempo necessário para chegar ao primeiro resultado utilizável</td></tr>
    <tr><td>Eficiência de convergência (3 itens)</td><td><code>EFF-FINAL-01</code> Número de iterações necessárias para chegar à aceitação final<br /><code>EFF-FINAL-02</code> Tempo total necessário para chegar ao estado final<br /><code>EFF-FINAL-03</code> Tokens consumidos para chegar ao estado final</td></tr>
    <tr><td>Intervenção humana (1 item)</td><td><code>EFF-HUMAN-01</code> Número de intervenções humanas durante a avaliação</td></tr>
    <tr><td>Repetibilidade (3 itens)</td><td><code>EFF-STABLE-01</code> Se execuções repetidas da mesma tarefa produzem resultados de aceitação consistentes<br /><code>EFF-STABLE-02</code> Se coleções, relacionamentos, papéis e fluxos de trabalho permanecem consistentes em três execuções<br /><code>EFF-STABLE-03</code> Se a variação no número de iterações e no tempo permanece controlada</td></tr>
  </tbody>
</table>

## Próximos passos

- [Construção com AI Agent](./agent-workflow.md) — Descreva páginas e interações em linguagem natural e faça iterações contínuas com um AI Agent
- [Início rápido do AI Portal](./index.md) — Crie e execute o seu primeiro AI Portal
- [Modelagem de Dados](../data-modeling.md) — Crie coleções, campos e relacionamentos com linguagem natural
- [Gerenciamento de Fluxos de Trabalho](../workflow.md) — Crie, edite, habilite e diagnostique fluxos de trabalho
- [Configuração de Permissões](../acl.md) — Gerencie papéis, políticas de permissão, atribuições de usuários e avaliações de risco
