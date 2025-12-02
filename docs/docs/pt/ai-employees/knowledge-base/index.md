:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

## Introdução

O plugin de Base de Conhecimento de IA fornece recursos de recuperação RAG para agentes de IA.

Os recursos de recuperação RAG permitem que os agentes de IA forneçam respostas mais precisas, profissionais e relevantes para o contexto da empresa ao responderem a perguntas dos usuários.

A utilização de documentos de domínio profissional e internos da empresa, fornecidos pela base de conhecimento mantida pelo administrador, melhora a precisão e a rastreabilidade das respostas dos agentes de IA.

### O que é RAG

RAG (Retrieval Augmented Generation) significa "Geração Aumentada por Recuperação".

- Recuperação: A pergunta do usuário é convertida em um vetor por um modelo de Embedding (por exemplo, BERT). Blocos de texto mais relevantes (Top-K) são recuperados da biblioteca de vetores por meio de recuperação densa (similaridade semântica) ou recuperação esparsa (correspondência de palavras-chave).
- Aumento: Os resultados da recuperação são concatenados com a pergunta original para formar um prompt aumentado, que é então injetado na janela de contexto do LLM.
- Geração: O LLM combina o prompt aumentado para gerar a resposta final, garantindo a factualidade e a rastreabilidade.

## Instalação

1. Acesse a página de gerenciamento de plugins.
2. Encontre o plugin `AI: Knowledge base` e ative-o.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)