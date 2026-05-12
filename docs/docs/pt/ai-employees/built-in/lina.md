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

## Uso

Na página de Gerenciamento de Localização, clique no avatar da Lina e escolha o escopo da tarefa de tradução por IA.

### Tradução incremental

Traduz apenas entradas que ainda não têm tradução no idioma atual.

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

- Número de entradas a traduzir.
- Provedor a usar.
- Modelo a usar.

Após a confirmação, o sistema cria uma tarefa em segundo plano. O progresso pode ser visto nas tarefas assíncronas. Ao concluir, as traduções são gravadas no idioma correspondente.

![](https://static-docs.nocobase.com/202605121233608.png)

## Estratégia de tradução

Lina segue estas regras ao traduzir:

- Retornar apenas o texto traduzido, sem explicação ou conteúdo adicional.
- Preservar variáveis, placeholders, tags HTML, sintaxe ICU e formatação.
- Manter textos de interface concisos e naturais.

## Traduções de referência

Entradas curtas como campos, botões e status usam traduções de referência existentes para melhorar a consistência.

- Entradas integradas preferem traduções chinesas como referência.
- Entradas não integradas preferem o idioma padrão do sistema.

Quando há uma referência, Lina usa um prompt com semântica semelhante:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Recomendações de modelo

Tradução de localização costuma processar muitas entradas. Se possível, use primeiro um modelo pequeno especializado implantado localmente, pois modelos online geralmente têm limites de taxa, concorrência ou tokens.

Se não for possível implantar localmente, escolha um modelo especializado em tradução em vez de um modelo de chat geral.

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
