---
pkg: "@nocobase/plugin-ai"
title: "Integração de MCP com Funcionários de IA"
description: "Integre serviços MCP aos Funcionários de IA, teste a disponibilidade do serviço MCP e gerencie as permissões de chamada de ferramentas MCP."
keywords: "Habilidades de Funcionário de IA,MCP,Model Context Protocol,tools"
---

# Integração de MCP

Os Funcionários de IA podem se integrar a serviços MCP que seguem o protocolo Model Context Protocol (MCP). Após a integração, o Funcionário de IA pode usar as ferramentas fornecidas pelo serviço MCP para realizar tarefas.


## Configuração do MCP

Acesse o módulo de configuração do MCP. Aqui você pode adicionar novos serviços MCP e gerenciar os serviços MCP já integrados.

![20260323095943](https://static-docs.nocobase.com/20260323095943.png)


## Adicionar Serviço MCP

Clique no botão `Adicionar` no canto superior direito da lista de serviços MCP e, na janela pop-up, insira as informações de integração do serviço MCP para concluir a adição.

São suportados dois protocolos de transporte de serviços MCP: Stdio e HTTP (Streamable / SSE).

![20260323100904](https://static-docs.nocobase.com/20260323100904.png)

Ao adicionar um serviço MCP, é necessário informar `nome`, `título` e `descrição`. O `nome` é o identificador único do serviço MCP; o `título` é o nome exibido no sistema; a `descrição` é opcional e serve para descrever brevemente as funcionalidades fornecidas pelo serviço MCP.

![20260323101635](https://static-docs.nocobase.com/20260323101635.png)

### Stdio

Ao adicionar um serviço MCP que utiliza o protocolo de transporte stdio, é necessário informar o `comando` e os `argumentos do comando` que executam o serviço MCP. Conforme necessário, você pode adicionar as `variáveis de ambiente` exigidas pelo comando que executa o serviço MCP.

:::warning
Os comandos para executar o serviço MCP, como node, npx, uvx, go, etc., precisam do suporte do ambiente do servidor onde o NocoBase está implantado para funcionar.

A imagem Docker do NocoBase suporta apenas comandos de ambiente Node.js, como node e npx.
:::

![20260323103511](https://static-docs.nocobase.com/20260323103511.png)

### HTTP

Ao adicionar um serviço MCP que utiliza o protocolo de transporte http, é necessário informar a `URL` do serviço MCP e, conforme necessário, adicionar `cabeçalhos de requisição`.

O protocolo de transporte http suporta dois modos de transmissão: Streamable e SSE. Streamable é o novo modo de transporte adicionado ao padrão MCP, enquanto o SSE será descontinuado em breve. Selecione o modo de transporte específico de acordo com a documentação do serviço MCP utilizado.

![20260323103906](https://static-docs.nocobase.com/20260323103906.png)

### Teste de Disponibilidade

Ao adicionar e editar um serviço MCP, após preencher as informações de configuração do MCP, você pode iniciar um teste de disponibilidade. Quando as informações de configuração do MCP estiverem completas e corretas e o serviço MCP estiver disponível, será retornada uma mensagem de sucesso do teste de disponibilidade.

![20260323105608](https://static-docs.nocobase.com/20260323105608.png)

## Visualizar Serviço MCP

Clique no botão `Visualizar` na lista de serviços MCP para ver a lista de ferramentas fornecidas pelo serviço MCP.

Na lista de ferramentas do serviço MCP, você também pode configurar as permissões do Funcionário de IA para usar essas ferramentas. Quando a permissão da ferramenta estiver definida como `Ask`, o sistema perguntará se a chamada é permitida antes de executá-la; quando definida como `Allow`, a ferramenta será chamada diretamente quando necessário.

![20260323111106](https://static-docs.nocobase.com/20260323111106.png)

## Usar Serviço MCP

Após habilitar o serviço MCP necessário no módulo de configuração do MCP, durante a conversa com o Funcionário de IA, ele utilizará automaticamente as ferramentas fornecidas pelo serviço MCP para realizar as tarefas.

![20260323110535](https://static-docs.nocobase.com/20260323110535.png)
