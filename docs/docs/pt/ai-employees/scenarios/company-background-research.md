---
title: "Fluxo de trabalho + IA para que os funcionários concluam a automação da pesquisa de histórico da empresa"
description: "Por meio de formulários de informações da empresa, registros de investigação de antecedentes, fluxos de trabalho e funcionários de IA, um processo de investigação de antecedentes da empresa pode ser automaticamente acionado, retido e apoiado para revisão manual."
keywords: "NocoBase, funcionários de IA, fluxo de trabalho, pesquisa de antecedentes da empresa, due diligence, automação, prática comercial"
---

# Fluxo de trabalho + IA para que os funcionários concluam a automação da pesquisa de histórico da empresa

No NocoBase, você pode transformar a pesquisa de histórico da empresa em um fluxo de tarefas automatizado e rastreável. A equipe de negócios ainda trabalha na página familiar de informações da empresa, enquanto a equipe de fluxo de trabalho e de IA é responsável por preencher as informações básicas, registrar o processo de processamento e salvar cada relatório gerado.

![](https://static-docs.nocobase.com/202607121806356.png)

Este cenário é adequado para lidar com um problema comum: as informações básicas da empresa não são um campo estático que termina após serem inseridas uma vez. A informação pública mudará, ocorrerão eventos regulamentares e o estado da cooperação será constantemente ajustado à medida que os negócios progridem. Se você confiar regularmente apenas na gravação suplementar manual, será fácil perdê-la; se você permitir que a IA cubra diretamente as informações da empresa, será difícil explicar “como esse julgamento surgiu”. A abordagem aqui é separar e salvar os dados atuais e o processo de pesquisa - o registro da empresa salva a versão usada pelo pessoal de negócios e o registro de verificação de antecedentes salva o status, o resultado e o histórico de cada pesquisa de IA.

## Vejamos primeiro as duas tabelas

O formulário de informações da empresa fornece as informações básicas do objeto de pesquisa, e o formulário de registro de investigação de antecedentes é responsável pela realização de cada tarefa de pesquisa. Um salva as informações atualmente disponíveis e o outro salva o processo de processamento e os resultados históricos.

### `companies`: Tabela de informações da empresa

| Campos principais               | efeito                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Company name           | As principais informações identificativas do objeto de pesquisa.                                   |
| Website                | Fornece dicas do site oficial para reduzir erros de julgamento causados ​​por empresas com o mesmo nome ou abreviatura.                   |
| Address                | Auxiliar na determinação de regiões, entidades e escopo de negócios.                                 |
| Company type           | Marque relações comerciais, como clientes, fornecedores, parceiros, etc. para facilitar o julgamento subsequente e as prioridades de acompanhamento. |
| Background information | Salve o relatório de histórico da empresa que você está usando atualmente e use o Markdown para renderizar conteúdo estruturado. |

### `background_check_tasks`: formulário de registro de verificação de antecedentes

| Campos principais                  | efeito                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Company ID / Company name | Registre a qual empresa esta pesquisa se destina para facilitar a execução da tarefa e a revisão histórica.                                 |
| Status                    | O fluxo de tarefas de marcação de `pending` para `processing` e `completed` também é a base para evitar acionamentos repetidos. |
| Research report           | Salve o relatório de pesquisa completo gerado pela IA desta vez.                                                   |
| Summary                   | Salve o resumo do processo de pesquisa da AI, pontos de risco e informações a serem complementadas.                                     |
| Previous background       | Salve a versão antiga antes de escrever novamente, oferecendo suporte ao rastreamento histórico e à comparação de relatórios antigos e novos.                                   |

![](https://static-docs.nocobase.com/202607121807627.png)

## Entre no processo de pesquisa a partir das informações da empresa

A lista de empresas é a entrada mais familiar para empresários. Você pode ver o nome da empresa, site oficial, tipo de empresa, pessoa de contato, email e outras informações na página. Depois de entrar em uma empresa, o pessoal comercial pode visualizar o relatório de antecedentes atual ou iniciar uma nova investigação de antecedentes.

Depois de entrar na página de edição, "Informações de segundo plano" são exibidas usando o componente de edição Markdown. O conteúdo gerado pela IA não é um breve resumo, mas um relatório estruturado que pode ser lido, copiado e mantido. O pessoal comercial ainda pode modificá-lo manualmente, mas cada resultado gerado pela IA deixará um histórico correspondente no registro de verificação de antecedentes.

![](https://static-docs.nocobase.com/202607121807450.png)

Dessa forma, a página ainda parece uma interface comum de manutenção de dados da empresa, e o método de processamento subjacente tornou-se "dados atuais + histórico de pesquisa". A tabela da empresa salva a versão atual e a tabela de tarefas salva o processo e a cadeia de evidências.

## Três métodos de disparo

![](https://static-docs.nocobase.com/202607121807495.png)

A pesquisa de base não deve depender apenas de um botão manual. Nos negócios reais, você pode querer completar automaticamente as informações após adicionar uma nova empresa, também pode precisar fazer registros históricos regularmente e também pode tomar a iniciativa de reinvestigar antes de assinar um contrato ou revisar.

O fluxo de trabalho `New company background check` lida com pesquisas automáticas após adicionar ou atualizar uma empresa. Ele escuta os eventos de dados da tabela da empresa e é acionado quando o nome da empresa existe e as informações de histórico estão vazias. A IA não será chamada imediatamente após o acionamento, mas primeiro verificará se há alguma tarefa inacabada para a mesma empresa; caso contrário, um novo registro de verificação de antecedentes será criado.

![](https://static-docs.nocobase.com/202607121807374.png)

O fluxo de trabalho `Timing company background check` é responsável pela conclusão contínua dos dados históricos. Ele é executado a cada 30 minutos, consulta empresas cujas informações básicas ainda estão vazias e percorre lotes. Dentro do loop, também verificamos se a tarefa já existe e então decidimos se desejamos criar uma nova tarefa. Dessa forma, a tarefa agendada pode ser executada repetidamente sem criar vários registros processados ​​simultaneamente devido à verificação repetida.

![](https://static-docs.nocobase.com/202607121807404.png)

O fluxo de trabalho `Manual company background check` está vinculado ao botão "Executar verificação de antecedentes" na página de detalhes da empresa, que é adequado para que o pessoal de negócios inicie proativamente uma pesquisa antes de visitar, assinar um contrato ou revisar. O acionamento manual e o acionamento automático usam o mesmo conjunto de links de acompanhamento: um registro de verificação de antecedentes é criado primeiro e, em seguida, o fluxo de trabalho de execução da tarefa assume a investigação da IA.

![](https://static-docs.nocobase.com/202607121807793.png)

Essas três entradas resolvem problemas em diferentes momentos e, em última análise, são mescladas no mesmo formulário de registro de investigação de antecedentes. Novos gatilhos, gatilhos programados e gatilhos manuais são responsáveis ​​​​apenas por registrar a "necessidade de investigação", e a execução específica, o gerenciamento de status e o write-back de resultados são entregues aos fluxos de trabalho subsequentes para processamento unificado.

## Transforme a pesquisa de IA em tarefas

`Do company background check` é o fluxo de trabalho que realmente realiza pesquisas. Ele escuta o registro `pending` na tabela de registros de verificação de antecedentes. Depois que o processo automático, agendado ou manual anterior criar uma tarefa, esse fluxo de trabalho será acionado de forma assíncrona.

Quando executado, o fluxo de trabalho primeiro consulta se a empresa ainda existe. Caso a empresa não exista, a tarefa será encerrada e a descrição será escrita; caso a empresa exista, o status da tarefa será alterado para `processing`, e então o funcionário da IA ​​será chamado para gerar o relatório. A palavra imediata do funcionário de IA requer a saída de duas partes: um relatório Markdown que pode ser escrito diretamente no campo de histórico da empresa e um resumo para revisão manual.

![](https://static-docs.nocobase.com/202607121808833.png)

Depois que a IA retorna resultados estruturados, o fluxo de trabalho primeiro grava o relatório, o resumo e o conteúdo de histórico antigo no registro de verificação de antecedentes e, em seguida, grava o novo relatório de volta no registro da empresa. Essa ordem evita o problema de "apenas os resultados mais recentes, sem registros de processos": a página da empresa mantém o conteúdo mais recente disponível e os registros de tarefas retêm o contexto antes desta geração e do write-back.

![](https://static-docs.nocobase.com/202607121808662.png)

Após a tarefa, o processamento em lote também se tornará mais natural. O fluxo de trabalho programado não precisa esperar a conclusão da pesquisa de cada empresa, sendo responsável apenas pela criação de vários registros para serem processados; cada registro aciona independentemente a pesquisa de IA. Várias empresas podem avançar em paralelo e, se uma determinada tarefa falhar ou expirar, outras empresas não serão bloqueadas.

## Torne os resultados de IA revisáveis

Os relatórios gerados por IA são organizados de acordo com uma estrutura fixa: perfil da empresa, negócio principal, histórico de desenvolvimento e histórico de capital, posição de mercado e perspectiva competitiva, julgamento de acompanhamento de vendas e links de citação. O pessoal empresarial pode ver não apenas a “conclusão”, mas também as dicas de risco e informações adicionais fornecidas pela IA no resumo.

A página de detalhes do registro de investigação de antecedentes exibe "Relatório de pesquisa" e "Antecedentes anteriores" nas guias e fornece uma operação de "Copiar". Dessa forma, você pode copiar rapidamente este relatório durante a discussão, revisão ou comunicação externa, e também pode verificar as alterações em relação à versão antiga.

Os detalhes do registro também configuram duas tarefas de trabalho de IA. em:

- Melhorar o relatório de pesquisa de base: gerar novamente o relatório após adicionar informações por meio de diálogo e gravar os resultados nos registros da empresa
- Compare os relatórios de pesquisa de base antigos e novos: leia os relatórios antigos e novos e deixe a IA explicar as diferenças substanciais trazidas por esta atualização

Isto permite que a IA não se limite a “gerar texto uma vez”, mas participe no processo de manutenção contínua, revisão e comparação de versões.

![](https://static-docs.nocobase.com/202607121808444.png)

## Como combinar fluxo de trabalho

No geral, este conjunto de fluxos de trabalho pode ser dividido em quatro camadas.

A primeira camada é responsável pela criação de tarefas. `New company background check` é para empresas recém-adicionadas ou atualizadas, `Timing company background check` é para conclusão de dados históricos e `Manual company background check` é para iniciativa manual. Todos eles verificarão se há registros inacabados antes de criar uma tarefa, reduzindo o processamento duplicado da origem.

A segunda camada é responsável pela execução das tarefas. `Do company background check` escuta o registro de verificação de antecedentes, avança a tarefa pendente para processamento, liga para o funcionário de IA e escreve o relatório, o resumo e os campos de histórico atuais da empresa após a conclusão.

A terceira camada é responsável por fornecer recursos controlados de write-back aos funcionários de IA. Como um fluxo de trabalho baseado em ferramenta, `Update company background` restringe a IA a gravar apenas registros especificados de acordo com parâmetros claros para evitar o excesso de permissões de modificação de dados.

A quarta camada é responsável pela limpeza de exceção. `Clean overtime processing background check` é executado a cada 30 minutos para limpar tarefas não concluídas que não foram concluídas por mais de 15 minutos para evitar o processamento de tarefas de longo prazo após interrupção anormal.

![](https://static-docs.nocobase.com/202607121808799.png)

## Para quais cenários podem ser migrados?

O que esta cena mostra não é um formulário isolado ou um botão de IA separado, mas uma combinação de vários recursos no NocoBase: a tabela de dados é responsável por transportar objetos de negócios e registros históricos, a página é responsável por visualizar e acionar pelo pessoal de negócios, o fluxo de trabalho é responsável por agendar e escrever de volta, e a equipe de IA é responsável por gerar resultados estruturados revisáveis.

Modelos semelhantes podem ser migrados para cenários como admissão de fornecedores, due diligence de clientes, revisão preliminar de risco de contrato, pontuação de qualidade de leads, monitoramento da opinião pública e triagem preliminar de metas de investimento e financiamento. Desde que existam vários requisitos no negócio, como "os dados precisam ser continuamente concluídos", "os resultados da IA ​​precisam ser deixados para trás" e "as versões históricas não podem ser substituídas", um processo automatizado executável, rastreável e escalável pode ser construído de maneira semelhante.

## Documentação de referência

- [Fluxo de trabalho NocoBase](/workflow/)
- [Funcionário NocoBase AI](/ai-employees/)
- [Nó de funcionário de IA do fluxo de trabalho NocoBase ](/ai-employees/workflow/nodes/employee/configuration)
- [Ferramenta de personalização de funcionários NocoBase AI ](/ai-employees/features/tools)
