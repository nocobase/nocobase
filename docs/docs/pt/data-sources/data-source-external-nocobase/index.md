---
title: 'NocoBase externo'
description: 'Conecte outra aplicação NocoBase como fonte de dados externa e conheça a configuração, os recursos disponíveis e as limitações de workflows.'
keywords: 'NocoBase externo,fonte de dados NocoBase,gerenciador de fontes de dados,workflow,NocoBase'
---

# NocoBase externo

## Introdução

A fonte de dados NocoBase externa conecta outra aplicação NocoBase à aplicação atual, preservando metadados da aplicação remota, incluindo coleções, interfaces de campos, títulos e campos de associação.

Em comparação com uma fonte de dados de banco de dados externa, normalmente não é necessário reconfigurar interfaces de campos nem criar manualmente campos de associação. Além de visualizar, criar, editar e excluir registros, ela também oferece suporte a upload e pré-visualização de arquivos, importação e exportação, consultas de gráficos e alguns cenários de workflow.

## Adicionar Fonte de Dados

Depois de ativar o plugin, adicione uma fonte de dados NocoBase externa no Gerenciador de fontes de dados e preencha as informações de acesso da aplicação remota.

| Opção | Descrição |
| --- | --- |
| URL da API | A URL completa da API da aplicação NocoBase remota, por exemplo `https://example.com/api` |
| Origin | A origem pública da aplicação NocoBase remota, por exemplo `https://example.com`. Ela é usada principalmente para tratar URLs de pré-visualização de arquivos locais na aplicação remota |
| API key | A credencial usada pela aplicação atual para acessar a aplicação NocoBase remota |
| Cabeçalhos da requisição | Cabeçalhos adicionais enviados para a aplicação remota, como informações de espaço |
| Timeout | Tempo limite das requisições para acessar a aplicação remota |

Depois que a fonte de dados é habilitada, o sistema carrega as coleções da aplicação remota.

![](https://static-docs.nocobase.com/202606101149185.png)

## Permissões

Uma fonte de dados NocoBase externa é afetada pelas permissões da aplicação atual e da aplicação remota.

- Na aplicação atual, você pode configurar permissões de acesso para diferentes coleções e campos, como em outras fontes de dados externas.
- Na aplicação remota, os dados são lidos e operados de acordo com as permissões da API key configurada.

Fontes de dados NocoBase externas não retornam metadados de permissão usados para controlar com precisão a visibilidade de botões no frontend. Portanto, alguns botões podem não ser ocultados automaticamente por permissão da mesma forma que na fonte de dados principal. Independentemente de um botão estar visível, as operações enviadas ainda passam pela verificação de permissões no servidor da aplicação atual, e operações não autorizadas são rejeitadas.

:::warning{title=Observação}
Prepare uma API key dedicada para a fonte de dados NocoBase externa e conceda apenas as permissões necessárias de coleções e operações. Se um usuário tiver permissão na aplicação atual, mas a operação falhar, verifique as permissões da API key remota.
:::

## Usar Coleções

Depois que as coleções forem carregadas com sucesso, selecione esta fonte de dados na configuração de páginas, blocos, gráficos ou workflows para usar coleções da aplicação remota.

Quando a estrutura de coleções mudar na aplicação remota, recarregue as coleções na aplicação atual.

## Recursos

Fontes de dados NocoBase externas são usadas principalmente para utilizar coleções e dados de uma aplicação remota na aplicação atual. A estrutura das coleções, a configuração de campos e os dados reais continuam sendo mantidos pela aplicação remota.

### Coleções e Campos

A aplicação atual carrega metadados da aplicação remota, incluindo coleções, interfaces de campos, títulos e campos de associação. Em comparação com uma fonte de dados de banco de dados externa, normalmente você não precisa reconfigurar interfaces de campos nem criar manualmente campos de associação na aplicação atual.

A aplicação atual não oferece suporte à configuração direta de campos de uma fonte de dados NocoBase externa. Para adicionar campos, ajustar tipos de campos ou modificar campos de associação, faça as alterações na aplicação remota e depois recarregue as coleções na aplicação atual.

### Registros e Dados Associados

Fontes de dados NocoBase externas permitem visualizar, criar, editar e excluir registros em blocos de página, além de visualizar e manter dados associados. As operações são iniciadas pela aplicação atual e enviadas para a aplicação remota por meio da API key configurada.

### Arquivos e Anexos

Os arquivos são enviados para o armazenamento usado pela aplicação remota. A aplicação atual inicia as requisições de upload, pré-visualização e download, mas os arquivos em si não são armazenados na aplicação atual.

Origin é usado principalmente para tratar URLs de pré-visualização de arquivos armazenados localmente pela aplicação remota. Se a aplicação remota retornar um caminho relativo, a aplicação atual usa Origin para completar a URL de acesso ao arquivo. Origin deve ser o endereço público de acesso da aplicação NocoBase remota, por exemplo:

```text
https://example.com
```

Não use a URL da API como Origin.

### Importação e Exportação

As operações de importação e exportação leem ou escrevem na fonte de dados por meio de arquivos externos e são encaminhadas para execução na aplicação remota. A aplicação atual processa as operações do usuário, encaminha as requisições e retorna os resultados de download. A leitura e escrita reais dos dados são concluídas pela aplicação remota.

- Importar registros: a aplicação atual recebe o arquivo de importação enviado e o encaminha para a aplicação remota executar a importação.
- Exportar registros: a aplicação atual encaminha a requisição para a aplicação remota exportar registros. No modo síncrono, o arquivo de registros retornado pela aplicação remota é transmitido de volta ao navegador para download. No modo assíncrono, uma tarefa assíncrona local é criada, a exportação de registros é iniciada na aplicação remota, o progresso é sincronizado com a tarefa local e o arquivo resultante é transmitido da aplicação remota no momento do download.
- Exportar anexos: a aplicação atual encaminha a requisição para a aplicação remota exportar anexos. No modo síncrono, o pacote de anexos retornado pela aplicação remota é transmitido de volta ao navegador para download. No modo assíncrono, uma tarefa assíncrona local é criada, a exportação de anexos é iniciada na aplicação remota, o progresso é sincronizado com a tarefa local e o pacote de anexos é transmitido da aplicação remota no momento do download.

### Impressão por Modelo

A Impressão por Modelo pode usar registros de uma fonte de dados NocoBase externa. Os modelos de impressão e a configuração da ação de impressão são armazenados na aplicação atual. Ao imprimir, a aplicação atual lê registros remotos e dados associados, e gera o arquivo de impressão na aplicação atual.

### Gráficos

#### Painel de Consulta

Fontes de dados NocoBase externas podem ser usadas no painel de consulta de gráficos. A aplicação atual processa os parâmetros de consulta de acordo com as permissões locais configuradas para gráfico, fonte de dados, coleção e campos, e então solicita os resultados à aplicação remota.

A API key remota também precisa ter acesso aos dados correspondentes; caso contrário, a consulta falhará.

#### Painel SQL

O painel SQL é o modo de consulta SQL dos gráficos e é usado apenas para consultas. A aplicação atual salva a configuração SQL e inicia a chamada, enquanto o SQL é encaminhado para execução na aplicação remota.

Ao usar o painel SQL, o usuário local precisa ter permissões de configuração de UI na aplicação atual, e a API key remota também precisa ter permissões de configuração de UI na aplicação remota. O SQL não é decomposto por permissões de coleção e campo como no painel de consulta. Conceda permissões de configuração de UI a usuários locais e à API key correspondente com cuidado.

### Workflows

Fontes de dados NocoBase externas podem envolver workflows na aplicação atual e na aplicação remota. A aplicação atual responde a eventos em páginas locais, botões e cadeias de requisições API. Depois que a aplicação remota recebe requisições encaminhadas, ela as processa de acordo com sua própria configuração de workflow.

A aplicação atual não escuta eventos de criação, atualização ou exclusão que ocorrem dentro de coleções remotas. Eventos de coleções remotas são acionados apenas na aplicação remota.

#### Gatilhos

A tabela a seguir descreve como os gatilhos afetados por fontes de dados NocoBase externas se comportam na aplicação atual e na aplicação remota quando o workflow correspondente está habilitado.

| Gatilho | Aplicação atual | Aplicação remota | Descrição |
| --- | --- | --- | --- |
| Evento antes da ação | Acionado | Acionado apenas no modo global | Na aplicação atual, o modo global é acionado, e o modo local segue os vínculos de botões da aplicação atual. Depois que a aplicação remota recebe a requisição encaminhada, apenas o modo global é acionado |
| Evento depois da ação | Acionado | Acionado apenas no modo global | Na aplicação atual, o modo global é acionado, e o modo local segue os vínculos de botões da aplicação atual. Depois que a aplicação remota recebe a requisição encaminhada, apenas o modo global é acionado |
| Evento de ação personalizada | Acionado | Não acionado | Um botão "Acionar workflow" vinculado na aplicação atual aciona o workflow local. Requisições CRUD encaminhadas não acionam eventos de ação personalizada remotos |
| Evento de coleção | Não acionado | Acionado | Os dados reais mudam na aplicação remota. A aplicação atual não aciona eventos locais de coleção, enquanto a aplicação remota aciona seus próprios eventos de coleção |
| Gatilho agendado por campo de data | Não acionado | Acionado | A aplicação atual não aciona com base em campos de coleções remotas. A aplicação remota aciona de acordo com sua própria configuração de campos de data |

Gatilhos que não dependem de fontes de dados são acionados na aplicação atual e na aplicação remota de acordo com suas próprias configurações.

Para orquestrar workflows que operam dados NocoBase externos na aplicação atual, use eventos antes da ação, eventos depois da ação ou eventos de ação personalizada. Workflows existentes na aplicação remota são executados de forma independente na aplicação remota.

#### Nós

A tabela a seguir lista apenas nós relacionados a fontes de dados. Nós gerais, como condição, cálculo, loop e processamento JSON, não dependem do tipo de fonte de dados e podem ser usados normalmente.

| Nó | Disponível | Descrição |
| --- | --- | --- |
| Consultar registros | Disponível | Consulta registros na aplicação remota |
| Criar registro | Disponível | Cria registros na aplicação remota |
| Atualizar registro | Disponível | Atualiza registros na aplicação remota |
| Excluir registro | Disponível | Exclui registros na aplicação remota |
| Nó SQL | Não disponível | O nó SQL de workflow oferece suporte apenas a fontes de dados de banco de dados |
| Nó de agregação | Não disponível | O nó de agregação oferece suporte apenas a fontes de dados de banco de dados |

## FAQ

### As Coleções Não Aparecem

Verifique se a fonte de dados está habilitada e se a URL da API e a API key estão corretas. A aplicação remota também deve permitir que essa API key acesse as coleções correspondentes.

### Os Arquivos São Enviados, Mas Não Podem Ser Pré-visualizados

Se a aplicação atual ou a aplicação remota usar armazenamento local de arquivos, verifique se Origin é o endereço público de acesso da aplicação correspondente. Origin não deve ser a URL da API.

### A Aplicação Atual Tem Permissão, Mas a Operação Falha

Verifique as permissões da API key na aplicação remota. Fontes de dados NocoBase externas são afetadas pelas permissões da aplicação atual e da aplicação remota.

### As Coleções Não Podem Ser Usadas Após um Erro do Serviço Remoto

Se a aplicação remota retornar 502, reiniciar ou ficar temporariamente indisponível, a aplicação atual pode falhar temporariamente ao ler metadados de coleções remotas. Depois que o serviço remoto se recuperar, a aplicação atual recarrega automaticamente os metadados na próxima vez que as coleções dessa fonte de dados forem acessadas.

### Por Que os Campos Não Podem Ser Configurados na Aplicação Atual

Fontes de dados NocoBase externas usam a estrutura de coleções e a configuração de campos da aplicação remota. Ajuste os campos na aplicação remota e depois recarregue as coleções na aplicação atual.
