---
title: 'NocoBase externo'
description: 'Conecte outro aplicativo NocoBase ao aplicativo atual como uma fonte de dados externa e conheça a configuração, os recursos disponíveis e as limitações de uso em workflows.'
keywords: 'NocoBase externo,Fonte de dados NocoBase,Gerenciamento de fontes de dados,Workflow,NocoBase'
---

#  NocoBase externo

##  Introdução

A fonte de dados externa do NocoBase permite conectar outro aplicativo NocoBase ao aplicativo atual, mantendo os metadados configurados no aplicativo remoto, como tabelas de dados, interfaces de campos, títulos e campos de relacionamento.

Em comparação com uma fonte de dados de banco de dados externo, ao conectar um NocoBase externo normalmente não é necessário configurar novamente as interfaces de campos nem criar manualmente os campos de relacionamento. Além de visualizar, criar, editar e excluir registros, também são compatíveis o upload e a visualização prévia de arquivos, a importação e exportação, as consultas de gráficos e alguns cenários de workflow.

##  Adicionar fonte de dados

Depois de ativar o plugin, adicione uma fonte de dados externa do NocoBase em «Gerenciamento de fontes de dados» e preencha as informações de acesso do aplicativo remoto.

| Item de configuração | Descrição                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Endereço da API      | Endereço completo da API do aplicativo NocoBase remoto, por exemplo, `https://example.com/api` |
| Origin               | Origem de acesso do aplicativo NocoBase remoto, por exemplo, `https://example.com`, usada principalmente para processar os endereços de visualização prévia de arquivos locais do aplicativo remoto |
| API key              | Credencial usada pelo aplicativo atual para acessar o NocoBase remoto                    |
| Cabeçalhos da requisição | Cabeçalhos adicionais que precisam ser enviados ao aplicativo remoto, como informações de espaço |
| Tempo limite         | Tempo limite das requisições ao aplicativo remoto                                         |

Depois de ativar a fonte de dados, o sistema carregará as tabelas de dados do aplicativo remoto.

![](https://static-docs.nocobase.com/202606101149185.png)

##  Permissões

A fonte de dados externa do NocoBase está sujeita às permissões do aplicativo atual e do aplicativo remoto.

-  O aplicativo atual pode configurar permissões de acesso diferentes para tabelas e campos, assim como em outras fontes de dados externas;
-  o aplicativo remoto lê e manipula os dados correspondentes de acordo com as permissões da API key configurada.

A fonte de dados externa do NocoBase não retorna metadados de permissão usados para controlar detalhadamente, no frontend, o estado de exibição dos botões. Por isso, alguns botões podem não ser ocultados automaticamente conforme as permissões, como ocorre na fonte de dados principal. Independentemente de o botão ser exibido, a operação de envio ainda passará pela verificação de permissões no servidor do aplicativo atual, e operações não autorizadas serão rejeitadas.

:::warning{title=Observação}
Recomenda-se preparar uma API key exclusiva para a fonte de dados externa do NocoBase e conceder apenas as permissões necessárias de tabelas e operações. Se o aplicativo atual tiver permissão, mas a operação falhar, verifique as permissões da API key remota.
:::

##  Usar tabelas de dados

Depois que as tabelas de dados forem carregadas com sucesso, selecione essa fonte de dados na configuração de páginas, blocos, gráficos ou workflows para usar as tabelas de dados do aplicativo remoto.

Quando a estrutura das tabelas de dados do aplicativo remoto for alterada, será necessário recarregá-las no aplicativo atual.

##  Descrição dos recursos

A fonte de dados externa do NocoBase é usada principalmente para utilizar no aplicativo atual as tabelas e os dados do aplicativo remoto. A estrutura das tabelas, a configuração dos campos e os dados reais continuam sendo mantidos pelo aplicativo remoto.

###  Tabelas e campos

O aplicativo atual carregará os metadados do aplicativo remoto, como tabelas de dados, interfaces de campos, títulos e campos de relacionamento. Em comparação com uma fonte de dados de banco de dados externo, normalmente não é necessário configurar novamente as interfaces de campos nem criar manualmente os campos de relacionamento no aplicativo atual.

O aplicativo atual não é compatível com a configuração direta dos campos de uma fonte de dados externa do NocoBase. Para adicionar campos, ajustar tipos de campo ou modificar campos de relacionamento, faça isso no aplicativo remoto e depois volte ao aplicativo atual para recarregar as tabelas de dados.

###  Registros e dados relacionados

A fonte de dados externa do NocoBase permite visualizar, criar, editar e excluir registros nos blocos da página, além de visualizar e manter dados relacionados. As operações são iniciadas pelo aplicativo atual, que solicita os dados ao aplicativo remoto usando a API key configurada.

###  Arquivos e anexos

Os arquivos serão enviados para o armazenamento usado pelo aplicativo remoto. O aplicativo atual é responsável por iniciar as solicitações de upload, visualização prévia e download; os próprios arquivos não são armazenados no aplicativo atual.

A Origin é usada principalmente para processar os endereços de visualização prévia dos arquivos armazenados localmente no aplicativo remoto. Se o aplicativo remoto retornar um caminho relativo, o aplicativo atual usará a Origin para completar o endereço de acesso ao arquivo. A Origin deve ser o endereço público de acesso do aplicativo NocoBase remoto, por exemplo:

```text
https://example.com
```

Não preencha a Origin com o endereço da API.

###  Importação e exportação

A importação e a exportação são operações de leitura e gravação de dados por meio de arquivos externos, e ambas serão encaminhadas ao aplicativo remoto para execução. O aplicativo atual é responsável por receber a operação do usuário, encaminhar a solicitação e retornar o resultado do download; a leitura e a gravação efetivas dos dados são realizadas pelo aplicativo remoto.

-  Importar registros: o aplicativo atual recebe o arquivo de importação enviado e o encaminha ao aplicativo remoto para execução;
-  Exportar registros: o aplicativo atual encaminha a solicitação de exportação de registros ao aplicativo remoto. No modo síncrono, o fluxo do arquivo de registros retornado pelo aplicativo remoto é enviado ao navegador para download; no modo assíncrono, uma tarefa assíncrona local é criada, a exportação de registros é iniciada no aplicativo remoto e o progresso é sincronizado. Ao obter o resultado do download, o arquivo de registros é recebido do aplicativo remoto por streaming.
-  Exportar anexos: o aplicativo atual encaminha a solicitação de exportação de anexos ao aplicativo remoto. No modo síncrono, o pacote de anexos retornado pelo aplicativo remoto é enviado ao navegador para download por streaming; no modo assíncrono, uma tarefa assíncrona local é criada, a exportação de anexos é iniciada no aplicativo remoto e o progresso é sincronizado. Ao obter o resultado do download, o pacote de anexos é recebido do aplicativo remoto por streaming.

###  Impressão de modelos

A impressão de modelos pode usar registros de uma fonte de dados externa do NocoBase. Os modelos de impressão e as configurações das ações de impressão são armazenados no aplicativo atual. Durante a impressão, o aplicativo atual lê os registros e os dados relacionados do aplicativo remoto e gera o arquivo de impressão no aplicativo atual.

###  Gráficos

####  Painel de consultas

A fonte de dados externa do NocoBase pode ser usada em painéis de consultas de gráficos. O aplicativo atual processará os parâmetros de consulta de acordo com as permissões locais configuradas para gráficos, fontes de dados, tabelas e campos e, em seguida, solicitará o resultado ao aplicativo remoto.

A API key remota também precisa ter permissão de acesso aos dados correspondentes; caso contrário, a consulta falhará.

####  Painel SQL

O painel SQL é um modo de consulta SQL de gráficos e serve apenas para consultas. O aplicativo atual armazena a configuração SQL e inicia a chamada; a consulta SQL é encaminhada ao aplicativo remoto para execução.

Ao usar o painel SQL, o usuário local precisa ter permissão de configuração da UI no aplicativo atual, e a API key remota também precisa ter permissão de configuração da UI no aplicativo remoto. Diferentemente do painel de consultas, o SQL não divide os parâmetros de consulta de acordo com as permissões de tabelas e campos. Conceda com cautela permissões de configuração da UI aos usuários locais e à API key correspondente.

###  Workflows

Uma fonte de dados externa do NocoBase pode envolver dois conjuntos de workflows: os do aplicativo atual e os do aplicativo remoto. O aplicativo atual responde aos eventos no fluxo de solicitações de páginas, botões e APIs locais; depois de receber uma solicitação encaminhada, o aplicativo remoto a processa de acordo com a própria configuração de workflows.

É importante observar que o aplicativo atual não monitora os eventos de criação, atualização e exclusão ocorridos internamente nas tabelas de dados remotas. Os eventos das tabelas de dados remotas só serão acionados no aplicativo remoto.

####  Gatilhos

A tabela abaixo descreve, quando o workflow correspondente está ativado, como os gatilhos afetados pela fonte de dados externa são acionados no aplicativo atual e no aplicativo remoto.

| Gatilho | Aplicativo atual | Aplicativo remoto | Descrição |
| ---------------- | -------- | -------------- | -------------------------------------------------------------------------------------------- |
| Evento antes da solicitação | Acionado | Acionado apenas no modo global | No aplicativo atual, é acionado no modo global; no modo local, é acionado de acordo com a vinculação ao botão do aplicativo atual. Depois que o aplicativo remoto recebe a solicitação encaminhada, é acionado apenas no modo global |
| Evento após a solicitação | Acionado | Acionado apenas no modo global | No aplicativo atual, é acionado no modo global; no modo local, é acionado de acordo com a vinculação ao botão do aplicativo atual. Depois que o aplicativo remoto recebe a solicitação encaminhada, é acionado apenas no modo global |
| Evento de ação personalizada | Acionado | Não acionado | O botão «Acionar workflow» vinculado no aplicativo atual aciona o fluxo local; as solicitações CRUD encaminhadas não acionam eventos de ação personalizada no aplicativo remoto |
| Evento da tabela de dados | Não acionado | Acionado | Os dados reais são alterados remotamente, portanto o aplicativo atual não aciona eventos locais da tabela de dados; o aplicativo remoto aciona os próprios eventos da tabela de dados |
| Gatilho agendado por campo de data | Não acionado | Acionado | O aplicativo atual não aciona gatilhos com base nos campos das tabelas de dados remotas; o aplicativo remoto aciona-os de acordo com a própria configuração de campos de data |

Os gatilhos que não dependem de uma fonte de dados são acionados no aplicativo atual e no aplicativo remoto de acordo com as respectivas configurações.

Para orquestrar no aplicativo atual um fluxo que opere dados do NocoBase externo, recomenda-se usar eventos antes da solicitação, após a solicitação ou de ação personalizada. Os workflows já existentes no aplicativo remoto são executados de forma independente pelo próprio aplicativo remoto.

####  Nós

A tabela abaixo lista apenas os nós relacionados a fontes de dados. Nós comuns, como condição, cálculo, loop e processamento de JSON, não dependem do tipo de fonte de dados e podem ser usados como em um workflow comum.

| Nó | Disponível | Descrição |
| -------- | -------- | --------------------------------- |
| Consultar registros | Disponível | Consultar registros no aplicativo remoto |
| Criar registros | Disponível | Criar registros no aplicativo remoto |
| Atualizar registros | Disponível | Atualizar registros no aplicativo remoto |
| Excluir registros | Disponível | Excluir registros no aplicativo remoto |
| Nó SQL | Indisponível | O nó SQL de workflows é compatível apenas com fontes de dados de banco de dados |
| Nó de agregação | Indisponível | O nó de agregação é compatível apenas com fontes de dados de banco de dados |

##  Perguntas frequentes

###  A tabela de dados não aparece

Verifique se a fonte de dados está ativada e se o endereço da API e a API key estão corretos. O aplicativo remoto também precisa permitir que essa API key acesse a tabela de dados correspondente.

###  O upload do arquivo foi bem-sucedido, mas não é possível visualizá-lo

Se o aplicativo atual ou o aplicativo remoto usar armazenamento de arquivos local, verifique se a Origin está preenchida com o endereço público de acesso do aplicativo correspondente. A Origin não deve ser preenchida com o endereço da API.

###  O aplicativo atual tem permissão, mas a operação falha

Verifique as permissões da API key do aplicativo remoto. A fonte de dados externa do NocoBase está sujeita simultaneamente às permissões do aplicativo atual e às do aplicativo remoto.

###  A tabela de dados não pode ser usada após uma falha no serviço remoto

Se o aplicativo remoto apresentar um erro 502, for reiniciado ou ficar temporariamente indisponível, o aplicativo atual poderá não conseguir ler temporariamente os metadados das tabelas de dados remotas. Depois que o serviço remoto for restabelecido, o aplicativo atual recarregará automaticamente os metadados na próxima vez que acessar as tabelas de dados dessa fonte.

###  Por que não é possível configurar campos no aplicativo atual

A fonte de dados externa do NocoBase usa a estrutura das tabelas e a configuração dos campos do aplicativo remoto. Ajuste os campos no aplicativo remoto e depois volte ao aplicativo atual para recarregar as tabelas de dados.
