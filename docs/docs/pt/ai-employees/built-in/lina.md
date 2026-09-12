---
title: 'Lina: Engenheira de localização'
description: 'Documentação de funcionários de IA do NocoBase.'
keywords: 'Lina,Localization Engineer,AI translation,Localization Management,AI Employee,NocoBase'
---

# Lina: Engenheira de localização

## Função

Lina: Engenheira de localização é especializado neste cenário integrado do NocoBase e ajuda a concluir tarefas relacionadas com mais eficiência.

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=Dica}
Lina é dedicada a cenários de localização e não usa Skills ou Tools gerais.
:::

## Cenários

- Traduzir entradas do sistema e plugins em lote.
- Traduzir conteúdos de coleções, campos e menus.
- Traduzir apenas entradas selecionadas na tabela.

## Pré-requisitos

Antes de usar Lina, conclua a configuração a seguir:

- Ative o plugin **Gerenciamento de Localização**.
- Configure um serviço LLM disponível e atribua um modelo padrão à Lina. Consulte [Configurar modelos de funcionários de IA](/ai-employees/features/model-settings) e [Recomendações de modelo](#recomendações-de-modelo).
- Ative o idioma de destino nas configurações do sistema.
- Sincronize as entradas a traduzir na página de Gerenciamento de Localização.

:::info{title=Dica}
Lina cria tarefas de tradução para o idioma atual.
:::

## Configuração do prompt

Abra o diálogo de edição da Lina em `Configurações do sistema -> Funcionários de IA -> AI employees` e ajuste o prompt em `Role setting`. O prompt normalmente é usado para definir informações do domínio de negócio, regras de terminologia e restrições de saída. Ele não deve ser longo demais; caso contrário, pode não ser adequado para modelos especializados em tradução.

![](https://static-docs.nocobase.com/202605191351816.png)

Exemplo de prompt padrão:

```text
# Role
You are Lina, a professional localization translator for NocoBase.

# Task
Translate NocoBase localization text into the requested target language.

# Translation requirements
1. Keep the translation faithful, concise, and natural for product UI.
2. Use consistent NocoBase and software terminology.
3. Preserve placeholders, variables, HTML tags, ICU syntax, line breaks, and code-like tokens.
4. Return only the translated text. Do not explain, quote, or use Markdown.
5. If the text should not be translated, return it unchanged.
```

As traduções de referência e o texto a traduzir não precisam ser escritos no prompt da Lina. Ao criar uma tarefa, o sistema os adiciona automaticamente com base no conteúdo da entrada, no idioma de destino e na configuração de idiomas de referência no diálogo de confirmação.

## Uso

Na página de Gerenciamento de Localização, clique no avatar da Lina e escolha o escopo da tarefa de tradução por IA.

### Tradução incremental

Traduz apenas entradas que ainda não têm tradução no idioma atual.

Para entradas integradas, se já existir uma tradução no pacote de idioma do sistema ou do plugin para o idioma de destino, a entrada será considerada traduzida mesmo que ainda não exista um registro correspondente na tabela de traduções de localização, e não será contada na tradução incremental.

### Tradução selecionada

Selecione entradas na tabela primeiro e traduza apenas o conteúdo selecionado.

Se nenhuma entrada for selecionada, o sistema solicitará a seleção.

### Tradução completa

Traduz todas as entradas elegíveis no idioma atual.

:::warning{title=Observação}
A tradução completa pode sobrescrever traduções existentes. Confirme idioma, quantidade de entradas e modelo antes de iniciar.
:::

## Confirmação da tarefa

Antes de criar a tarefa, o sistema exibe uma confirmação com:

- Descrição da tarefa.
- Número de entradas a traduzir.
- Provedor a usar.
- Modelo a usar.
- Configuração dos idiomas de tradução de referência.

A tradução completa e a tradução incremental também permitem escolher o escopo de tradução no diálogo de confirmação:

- **Todos**: processa todas as entradas que correspondem às condições da tarefa atual.
- **Entradas integradas**: entradas do sistema e de plugins.
- **Entradas personalizadas**: nomes de rotas, nomes de coleções e campos, e conteúdo de UI.

A tradução selecionada processa apenas os registros já selecionados na tabela, portanto não exibe o escopo de tradução. Ela também exibe apenas uma configuração geral de idiomas de referência, sem separar entradas integradas e personalizadas.

Se o número de entradas a traduzir for 0, o sistema avisa o usuário e não cria uma tarefa em segundo plano. Após a confirmação, o sistema cria uma tarefa em segundo plano. O progresso pode ser visto nas tarefas assíncronas. Ao concluir, as traduções são gravadas no idioma correspondente.

![](https://static-docs.nocobase.com/202605191341968.png)

## Traduções de referência

Entradas curtas como campos, botões e status usam traduções de referência existentes para melhorar a consistência.

- Entradas integradas usam traduções em chinês como referência padrão e japonês como referência alternativa.
- Entradas personalizadas usam o idioma padrão do sistema como referência padrão e chinês como referência alternativa.
- Usuários podem ajustar o idioma padrão e o idioma alternativo no diálogo de confirmação da tarefa.
- O sistema primeiro usa a tradução de referência no idioma padrão. Se ela não existir, tenta o idioma alternativo.

Quando há uma referência, Lina usa um prompt com semântica semelhante:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Recomendações de modelo

Tradução de localização costuma processar muitas entradas. Se possível, use primeiro um modelo pequeno especializado implantado localmente, pois modelos online geralmente têm limites de taxa, concorrência ou tokens.

Se não for possível implantar localmente, escolha um modelo especializado em tradução em vez de um modelo de chat geral. Modelos de tradução geralmente são mais adequados para entradas curtas, textos de UI e tradução em lote. Lina organiza o prompt da funcionária, as traduções de referência e o texto a traduzir em um prompt enviado ao modelo. Usuários podem ajustar o prompt da Lina para controlar o estilo e as regras de tradução.

A concorrência pode ser ajustada conforme a capacidade do modelo para controlar vazão, tempo de resposta e custo.

Para uma prática completa com um modelo pequeno especializado implantado localmente, consulte [Usar Lina e HY-MT1.5-1.8B local para traduzir entradas de localização](/ai-employees/scenarios/localization-hy-mt).

:::info{title=Dica}
A concorrência é controlada por `AI_LOCALIZATION_CONCURRENCY`. Padrão `10`, intervalo `1` a `20`; valores fora do intervalo usam o padrão.
:::

## Progresso e tratamento de falhas

As tarefas de tradução da Lina rodam como tarefas assíncronas em segundo plano e gravam resultados entrada por entrada.

![](https://static-docs.nocobase.com/202605121235761.png)

Se uma entrada falhar, o erro é registrado e a tarefa é interrompida para evitar resultados não controlados.

- O plugin AI ou Async Task Manager não está habilitado.
- Lina não tem um modelo disponível configurado.
- O serviço do modelo está indisponível ou expira.

Verifique detalhes da tarefa assíncrona e logs do servidor para provedor, modelo, idioma, ID da entrada e duração.

## Revisão antes da publicação

Após a tradução por IA, revise antes de publicar:

- Entradas curtas como menus, botões e campos se ajustam ao contexto do produto.
- Variáveis, placeholders e tags HTML são preservados.
- A terminologia de negócio é consistente.
- Publique após revisar.
