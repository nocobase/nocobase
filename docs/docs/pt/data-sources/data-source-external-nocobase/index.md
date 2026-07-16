---
title: 'NocoBase externo'
description: 'Conecte outro aplicativo NocoBase ao aplicativo atual como fonte de dados externa e conheça as configurações, os recursos disponíveis e as limitações de uso em fluxos de trabalho.'
keywords: 'NocoBase externo,Fonte de dados NocoBase,Gerenciamento de fontes de dados,Fluxo de trabalho,NocoBase'
---

#  NocoBase externo

##  Introdução

Uma fonte de dados NocoBase externa pode conectar outro aplicativo NocoBase ao aplicativo atual, mantendo os metadados configurados no aplicativo remoto, como tabelas de dados, interfaces de campos, títulos e campos de relacionamento.

Em comparação com uma fonte de dados de banco de dados externo, ao conectar um NocoBase externo normalmente não é necessário reconfigurar as interfaces de campos nem criar manualmente campos de relacionamento. Além de consultar, criar, editar e excluir registros, também são compatíveis o upload e a visualização de arquivos, a importação e exportação, as consultas de gráficos e alguns cenários de fluxo de trabalho.

##  Adicionar fonte de dados

Após ativar o plugin, adicione uma fonte de dados NocoBase externa em 「Gerenciamento de fontes de dados」 e preencha as informações de acesso do aplicativo remoto.

| Item de configuração | Descrição                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Endereço da API      | Endereço completo da API do aplicativo NocoBase remoto, por exemplo `https://example.com/api`       |
| Origin                | Origem de acesso do aplicativo NocoBase remoto, por exemplo `https://example.com`, usada principalmente para processar os endereços de visualização de arquivos locais do aplicativo remoto |
| Chave de API          | Credencial usada pelo aplicativo atual para acessar o NocoBase remoto                                 |
| Cabeçalhos da solicitação | Cabeçalhos adicionais que precisam ser enviados ao aplicativo remoto, como informações de espaço |
| Tempo limite          | Tempo limite das solicitações ao aplicativo remoto                                                  |

Depois de ativar a fonte de dados, o sistema carregará as tabelas de dados do aplicativo remoto.

![](https://static-docs.nocobase.com/202606101149185.png)

##  Permissões

Uma fonte de dados NocoBase externa está sujeita às permissões do aplicativo atual e do aplicativo remoto.

-  O aplicativo atual pode configurar permissões de acesso diferentes para tabelas e campos, assim como em outras fontes de dados externas;
-  o aplicativo remoto lê e manipula os dados correspondentes de acordo com as permissões da chave de API configurada.

A fonte de dados NocoBase externa não retorna os metadados de permissões usados para controlar detalhadamente no frontend o estado de exibição dos botões. Por isso, alguns botões podem não ser ocultados automaticamente conforme as permissões, como ocorre na fonte de dados principal. Independentemente de o botão estar visível, a operação de envio ainda passará pela verificação de permissões no servidor do aplicativo atual, e as operações não autorizadas serão rejeitadas.

:::warning{title=Observação}
Recomenda-se preparar uma chave de API exclusiva para a fonte de dados NocoBase externa e conceder apenas as permissões necessárias de tabelas e operações. Se o aplicativo atual tiver permissão, mas a operação falhar, verifique as permissões da chave de API remota.
:::

##  Usar tabelas de dados

Depois que as tabelas de dados forem carregadas com sucesso, selecione essa fonte de dados na configuração da página, na configuração de blocos, nos gráficos ou nos fluxos de trabalho para usar as tabelas de dados do aplicativo remoto.

Quando a estrutura das tabelas de dados do aplicativo remoto for alterada, será necessário recarregá-las no aplicativo atual.

##  Recursos

A fonte de dados NocoBase externa é usada principalmente para utilizar, no aplicativo atual, as tabelas de dados e os dados do aplicativo remoto. A estrutura das tabelas, a configuração dos campos e os dados reais continuam sendo mantidos pelo aplicativo remoto.

###  Tabelas de dados e campos

O aplicativo atual carregará os metadados do aplicativo remoto, como tabelas de dados, interfaces de campos, títulos e campos de relacionamento. Em comparação com uma fonte de dados de banco de dados externo, normalmente não é necessário reconfigurar as interfaces de campos nem criar manualmente campos de relacionamento no aplicativo atual.

O aplicativo atual não permite configurar diretamente os campos da fonte de dados NocoBase externa. Para adicionar campos, ajustar tipos de campo ou modificar campos de relacionamento, faça isso no aplicativo remoto e depois volte ao aplicativo atual para recarregar as tabelas de dados.

###  Registros e dados relacionados

A fonte de dados NocoBase externa permite consultar, criar, editar e excluir registros nos blocos da página, além de consultar e manter dados relacionados. As operações são iniciadas pelo aplicativo atual, que solicita os dados ao aplicativo remoto usando a chave de API configurada.

###  Arquivos e anexos

Os arquivos serão enviados para o armazenamento usado pelo aplicativo remoto. O aplicativo atual é responsável por iniciar as solicitações de upload, visualização e download; os próprios arquivos não são armazenados no aplicativo atual.

O Origin é usado principalmente para processar os endereços de visualização dos arquivos armazenados localmente no aplicativo remoto. Se o endereço retornado pelo aplicativo remoto for um caminho relativo, o aplicativo atual usará o Origin para completar o endereço de acesso ao arquivo. O Origin deve ser preenchido com o endereço público de acesso do aplicativo NocoBase remoto, por exemplo:

```text
https://example.com
```

Não preencha o endereço da API como Origin.

###  Importação e exportação

A importação e a exportação são operações de leitura e gravação de dados por meio de arquivos externos e serão encaminhadas ao aplicativo remoto para execução. O aplicativo atual é responsável por receber a operação do usuário, encaminhar a solicitação e retornar o resultado do download; a leitura e a gravação dos dados são realizadas pelo aplicativo remoto.

-  Importar registros: o aplicativo atual recebe o arquivo de importação enviado e o encaminha ao aplicativo remoto para executar a importação;
-  Exportar registros: o aplicativo atual encaminha a solicitação para que o aplicativo remoto exporte os registros. No modo síncrono, o fluxo do arquivo de registros retornado pelo aplicativo remoto é enviado ao navegador para download; no modo assíncrono, uma tarefa assíncrona local é criada, a exportação dos registros é iniciada no aplicativo remoto e o progresso é sincronizado. Ao baixar o resultado, o arquivo de registros é obtido do aplicativo remoto por streaming.
-  Exportar anexos: o aplicativo atual encaminha a solicitação para que o aplicativo remoto exporte os anexos. No modo síncrono, o pacote de anexos retornado pelo aplicativo remoto é enviado ao navegador para download; no modo assíncrono, uma tarefa assíncrona local é criada, a exportação dos anexos é iniciada no aplicativo remoto e o progresso é sincronizado. Ao baixar o resultado, o pacote de anexos é obtido do aplicativo remoto por streaming.

###  Impressão de modelos

A impressão de modelos pode usar registros da fonte de dados NocoBase externa. Os modelos de impressão e as configurações das ações de impressão são armazenados no aplicativo atual. Durante a impressão, o aplicativo atual lê os registros e os dados relacionados do aplicativo remoto e gera o arquivo de impressão no aplicativo atual.

###  Gráficos

####  Painel de consultas

A fonte de dados NocoBase externa pode ser usada em painéis de consultas de gráficos. O aplicativo atual processará os parâmetros da consulta de acordo com as permissões configuradas localmente para gráficos, fontes de dados, tabelas de dados e campos e, em seguida, solicitará os resultados ao aplicativo remoto.

A chave de API remota também precisa ter permissão de acesso aos dados correspondentes; caso contrário, a consulta falhará.

####  Painel SQL

O painel SQL é um modo de consulta SQL dos gráficos e serve apenas para consultas. O aplicativo atual armazena a configuração SQL e inicia a chamada; a instrução SQL é encaminhada ao aplicativo remoto para execução.

Ao usar o painel SQL, o usuário local precisa ter permissão de configuração da interface do usuário no aplicativo atual, e a chave de API remota também precisa ter essa permissão no aplicativo remoto. Ao contrário do painel de consultas, o SQL não divide os parâmetros da consulta de acordo com as permissões de tabelas e campos. Conceda com cautela as permissões de configuração da interface do usuário aos usuários locais e à chave de API correspondente.

###  Fluxos de trabalho

Uma fonte de dados NocoBase externa pode envolver dois conjuntos de fluxos de trabalho: o do aplicativo atual e o do aplicativo remoto. O aplicativo atual responde aos eventos na cadeia de solicitações de páginas locais, botões e APIs; depois que o aplicativo remoto recebe uma solicitação encaminhada, ele a processa de acordo com sua própria configuração de fluxo de trabalho.

É importante observar que o aplicativo atual não monitora os eventos de criação, atualização ou exclusão ocorridos internamente nas tabelas de dados remotas. Os eventos das tabelas de dados remotas só serão acionados no aplicativo remoto.

####  Gatilhos

A tabela a seguir descreve, quando o fluxo de trabalho correspondente está ativado, como os gatilhos afetados pela fonte de dados NocoBase externa são acionados no aplicativo atual e no aplicativo remoto.

| Gatilho | Aplicativo atual | Aplicativo remoto | Descrição |
| ------- | ---------------- | ----------------- | --------- |
| Evento antes da solicitação | Acionado | Acionado apenas no modo global | No aplicativo atual, é acionado no modo global; no modo local, é acionado conforme o botão ao qual está vinculado no aplicativo atual. Depois que o aplicativo remoto recebe a solicitação encaminhada, é acionado apenas no modo global |
| Evento depois da solicitação | Acionado | Acionado apenas no modo global | No aplicativo atual, é acionado no modo global; no modo local, é acionado conforme o botão ao qual está vinculado no aplicativo atual. Depois que o aplicativo remoto recebe a solicitação encaminhada, é acionado apenas no modo global |
| Evento de ação personalizada | Acionado | Não acionado | O botão 「Acionar fluxo de trabalho」 vinculado no aplicativo atual acionará o fluxo local; as solicitações CRUD encaminhadas não acionarão eventos de ação personalizada no aplicativo remoto |
| Evento da tabela de dados | Não acionado | Acionado | Os dados reais são alterados remotamente, portanto o aplicativo atual não aciona eventos locais da tabela de dados; o aplicativo remoto aciona seus próprios eventos da tabela de dados |
| Gatilho programado por campo de data | Não acionado | Acionado | O aplicativo atual não aciona gatilhos com base nos campos das tabelas de dados remotas; o aplicativo remoto aciona-os de acordo com a configuração de seus próprios campos de data |

Os gatilhos que não dependem de fontes de dados são acionados no aplicativo atual e no aplicativo remoto de acordo com as respectivas configurações.

Para orquestrar no aplicativo atual um fluxo que opere dados do NocoBase externo, recomenda-se usar eventos antes da solicitação, depois da solicitação ou de ação personalizada. Os fluxos de trabalho já existentes no aplicativo remoto são executados de forma independente pelo aplicativo remoto.

####  Nós

A tabela a seguir lista apenas os nós relacionados a fontes de dados. Nós comuns, como condição, cálculo, loop e processamento de JSON, não dependem do tipo de fonte de dados e podem ser usados como em um fluxo de trabalho comum.

| Nó | Disponível | Descrição |
| --- | ---------- | --------- |
| Consultar registros | Disponível | Consultar registros no aplicativo remoto |
| Criar registros | Disponível | Criar registros no aplicativo remoto |
| Atualizar registros | Disponível | Atualizar registros no aplicativo remoto |
| Excluir registros | Disponível | Excluir registros no aplicativo remoto |
| Nó SQL | Indisponível | O nó SQL de fluxo de trabalho é compatível apenas com fontes de dados de banco de dados |
| Nó de agregação | Indisponível | O nó de agregação é compatível apenas com fontes de dados de banco de dados |

##  Perguntas frequentes

###  A tabela de dados não aparece

Verifique se a fonte de dados está ativada e se o endereço da API e a chave de API estão corretos. O aplicativo remoto também precisa permitir que essa chave de API acesse a tabela de dados correspondente.

###  O upload do arquivo foi concluído, mas não é possível visualizá-lo

Se o aplicativo atual ou o aplicativo remoto usar armazenamento local de arquivos, verifique se o Origin foi preenchido com o endereço público de acesso do aplicativo correspondente. O Origin não deve ser preenchido com o endereço da API.

###  O aplicativo atual tem permissão, mas a operação falha

Verifique as permissões da chave de API do aplicativo remoto. A fonte de dados NocoBase externa está sujeita simultaneamente às permissões do aplicativo atual e às do aplicativo remoto.

###  A tabela de dados não pode ser usada após uma falha no serviço remoto

Se o aplicativo remoto apresentar um erro 502, for reiniciado ou ficar temporariamente indisponível, o aplicativo atual poderá não conseguir ler temporariamente os metadados das tabelas de dados remotas. Depois que o serviço remoto for restaurado, o aplicativo atual recarregará automaticamente os metadados na próxima vez que a tabela de dados dessa fonte for acessada.

###  Por que não é possível configurar campos no aplicativo atual

A fonte de dados NocoBase externa usa a estrutura das tabelas de dados e a configuração de campos do aplicativo remoto. Ajuste os campos no aplicativo remoto e depois volte ao aplicativo atual para recarregar as tabelas de dados.
