---
pkg: '@nocobase/plugin-ai'
title: 'Usar Lina e HY-MT1.5-1.8B local para traduzir entradas de localização'
description: 'Implante o modelo de tradução HY-MT1.5 GGUF com llama-server e configure-o para que Lina traduza em lote as entradas de localização do NocoBase.'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Usar Lina e HY-MT1.5-1.8B local para traduzir entradas de localização

Este guia descreve uma prática de tradução de localização: implantar localmente um pequeno modelo especializado em tradução, expô-lo como serviço compatível com OpenAI e configurá-lo para que Lina traduza em lote as entradas de localização do NocoBase.

Esta abordagem é adequada para muitas entradas do sistema, textos de plugins, menus, títulos de coleções e rótulos de campos. Em comparação com modelos online, modelos locais não são afetados por limites externos de RPM, TPM ou concorrência, e a concorrência pode ser ajustada conforme a capacidade da máquina e do modelo.

## Visão geral

Este guia usa:

- Modelo: `tencent/HY-MT1.5-1.8B-GGUF`
- Serviço de inferência: `llama-server`
- Integração: OpenAI-compatible API
- Funcionária de IA: Lina
- Ponto de entrada: página Localization Management

:::info{title=Observação}
HY-MT1.5-1.8B é um pequeno modelo especializado em tradução. Ele é mais adequado para entradas curtas, textos de interface e tradução em lote. Modelos gerais de chat não são recomendados como primeira opção para tarefas de localização.
:::

## Pré-requisitos

- O plugin **Localization Management** está ativado.
- O idioma de destino está ativado.
- As entradas de localização foram sincronizadas.
- A máquina local ou servidor pode executar [`llama-server`](https://github.com/ggml-org/llama.cpp).
- O serviço NocoBase consegue acessar o endereço HTTP do `llama-server`.

## Implantar HY-MT GGUF

### Instalar llama.cpp

No macOS, você pode instalar com Homebrew:

```bash
brew install llama.cpp
```

Também é possível usar um binário pré-compilado do llama.cpp ou compilá-lo a partir do código-fonte. O requisito final é que `llama-server` esteja disponível.

### Iniciar um serviço compatível com OpenAI

Inicie o serviço com o modelo GGUF do Hugging Face:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| Parâmetro | Descrição |
| --- | --- |
| `-hf` | Carrega o modelo do Hugging Face. |
| `--host` | Endereço de escuta. Use `127.0.0.1` para testes locais ou `0.0.0.0` para acesso por contêiner ou remoto. |
| `--port` | Porta do serviço HTTP. |
| `-c` | Comprimento do contexto. As entradas de localização geralmente são curtas, então `2048` costuma ser suficiente. |
| `-np` | Número de slots paralelos. Ajuste conforme o desempenho da máquina. |

:::info{title=Dica}
Se os recursos do servidor forem limitados, comece com `-np 1` ou `-np 2` e aumente gradualmente depois de verificar a estabilidade.
:::

## Testar o serviço do modelo

Depois que `llama-server` iniciar, verifique a saúde do serviço:

```bash
curl http://127.0.0.1:8000/health
```

Em seguida, teste a tradução pela API compatível com OpenAI:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

Se você iniciar a partir de um arquivo de modelo local, altere `model` para o nome real retornado ou configurado pelo serviço.

:::warning{title=Observação}
Se uma solicitação demorar muito para responder, o modelo pode estar lento, a concorrência pode estar alta demais ou o contexto pode estar grande demais. Reduza primeiro `-np` e a concorrência de tradução do NocoBase e observe o tempo de resposta.
:::

## Configurar um serviço LLM no NocoBase

Acesse `System Settings -> AI Employees -> LLM service` e adicione um serviço LLM.

| Configuração | Exemplo |
| --- | --- |
| Provider | OpenAI (completions) |
| Title | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | Se `llama-server` não tiver autenticação, use um valor fictício como `dummy`. |
| Enabled Models | Selecione `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M` ou informe o nome real do modelo. |

Após configurar, use `Test flight` para verificar o modelo.

:::info{title=Dica}
Se o NocoBase estiver em Docker, `127.0.0.1` aponta para o próprio contêiner e pode não acessar o serviço do host. Use o IP do host, o endereço da rede do contêiner ou `host.docker.internal`.
:::

## Configurar o modelo dedicado da Lina

Acesse `System Settings -> AI Employees -> AI employees`, abra Lina e mude para `Model settings`.

1. Ative `Enable dedicated model configuration`.
2. Selecione o modelo HY-MT local em `Models`.
3. Salve a configuração.

Depois disso, Lina usará esse modelo para tarefas de tradução de localização e evitará alternar para modelos gerais de chat.

Para detalhes, consulte [Configurar modelos de funcionários de IA](/ai-employees/features/model-settings).

## Configurar a concorrência de tradução

A concorrência das tarefas de tradução de localização é controlada por `AI_LOCALIZATION_CONCURRENCY`:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

Regras:

- Padrão: `10`
- Mínimo: `1`
- Máximo: `20`
- Valores fora do intervalo usam o padrão

A melhor concorrência depende de CPU, GPU, memória, quantização do modelo e `llama-server -np`. Se a concorrência padrão causar problemas:

1. Comece com `AI_LOCALIZATION_CONCURRENCY=1` e verifique a tradução de uma única entrada.
2. Defina `llama-server -np` e `AI_LOCALIZATION_CONCURRENCY` como `2` ou `4`.
3. Observe tempo de resposta, uso de CPU/GPU e progresso da tarefa.
4. Aumente gradualmente somente se estiver estável.

:::warning{title=Observação}
Não defina concorrência alta demais no início. Se ela exceder a capacidade real do modelo, as tarefas podem ficar mais lentas por filas, timeouts ou travamentos do serviço.
:::

## Executar a tradução de localização

Acesse `System Management -> Localization Management`.

1. Mude para o idioma de destino.
2. Clique em `Synchronize` para garantir que as entradas estejam sincronizadas.
3. Clique no avatar da Lina.
4. Escolha um escopo de tarefa:
   - `Incremental translation`: traduz entradas que ainda não têm tradução.
   - `Selected translation`: traduz entradas selecionadas na tabela.
   - `Full translation`: traduz todas as entradas no idioma atual.
5. Verifique a quantidade de entradas, o provedor e o modelo na caixa de confirmação.
6. Se escolher tradução incremental ou completa, selecione o escopo de tradução:
   - `All`
   - `Built-in entries`: entradas do sistema e de plugins.
   - `Custom entries`: nomes de rotas, nomes de coleções e campos, e conteúdo de UI.
7. Ajuste os idiomas de tradução de referência se necessário. A tradução incremental e completa configuram idiomas de referência separadamente para entradas integradas e personalizadas; a tradução selecionada mostra apenas uma configuração geral de idiomas de referência.
8. Confirme para criar a tarefa assíncrona.
9. Aguarde a conclusão, revise as traduções e publique.

Comece com `Selected translation` em algumas entradas para verificar o estilo e a velocidade antes de executar tradução incremental ou completa.

## Como Lina constrói as solicitações de tradução

Lina constrói solicitações a partir das entradas e traduções de referência. Para entradas curtas, referências existentes ajudam a melhorar a consistência:

- Entradas integradas usam traduções em chinês como referência padrão e japonês como referência alternativa.
- Entradas personalizadas usam o idioma padrão do sistema como referência padrão e chinês como referência alternativa.
- Usuários podem ajustar o idioma padrão e o idioma alternativo no diálogo de confirmação da tarefa.
- O sistema primeiro usa a tradução de referência no idioma padrão. Se ela não existir, tenta o idioma alternativo.
- Os resultados são gravados no idioma de destino, mas não são publicados automaticamente.

A semântica do prompt é semelhante a:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Solução de problemas

### Sem progresso após criar uma tarefa

Verifique se `llama-server` recebeu solicitações. Veja os logs do serviço ou chame `/v1/chat/completions` com `curl`.

Se o modelo recebe solicitações mas não retorna, reduza:

- `AI_LOCALIZATION_CONCURRENCY`
- `llama-server -np`
- `llama-server -c`

### O modelo retorna explicações em vez de traduções

Modelos locais de tradução costumam ser mais estáveis do que modelos gerais de chat. Se ainda aparecerem explicações, teste primeiro o mesmo prompt com `curl` para verificar o estilo de saída do modelo. Você também pode traduzir entradas mais curtas primeiro ou reduzir parâmetros de amostragem como temperature.

### NocoBase não consegue conectar ao serviço do modelo

Verifique:

- Se Base URL inclui `/v1`.
- Se o ambiente de execução do NocoBase consegue acessar o endereço.
- Se firewall ou rede de contêiner bloqueia a porta.
- Se `llama-server` ainda está em execução.

## Revisar antes de publicar

Depois que a tradução por IA terminar, revise antes de publicar:

- Filtre por módulo e verifique entradas curtas como menus, botões, nomes de campos e status.
- Verifique variáveis, placeholders, tags HTML e símbolos de formatação.
- Verifique a consistência dos principais termos de negócio.
- Se traduções de entradas integradas forem sobrescritas, sincronize novamente em Localization Management e selecione `Reset system built-in entry translations` para restaurar os padrões. Para contribuir traduções padrão do sistema e plugins oficiais, consulte [Translation Contribution](/get-started/translations).
- Publique primeiro em um ambiente de teste e depois sincronize para produção.

## Referências

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [Documentação do llama-server](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina: engenheira de localização](/ai-employees/built-in/lina)
