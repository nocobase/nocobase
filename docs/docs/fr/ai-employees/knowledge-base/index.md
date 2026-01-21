:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Aperçu

## Introduction

Le plugin Base de connaissances IA offre des capacités de récupération RAG aux agents IA.

Les capacités de récupération RAG permettent aux agents IA de fournir des réponses plus précises, plus professionnelles et plus pertinentes pour l'entreprise lorsqu'ils répondent aux questions des utilisateurs.

L'utilisation de documents de domaine professionnel et de documents internes à l'entreprise, issus de la base de connaissances maintenue par l'administrateur, améliore la précision et la traçabilité des réponses des agents IA.

### Qu'est-ce que le RAG ?

RAG (Retrieval Augmented Generation) signifie « Génération Augmentée par Récupération ».

- **Récupération** : La question de l'utilisateur est convertie en vecteur par un modèle d'intégration (Embedding model) (par exemple, BERT). Les blocs de texte les plus pertinents (Top-K) sont ensuite récupérés de la bibliothèque de vecteurs via une récupération dense (similarité sémantique) ou une récupération clairsemée (correspondance de mots-clés).
- **Augmentation** : Les résultats de la récupération sont concaténés avec la question originale pour former une invite augmentée (Prompt), qui est ensuite injectée dans la fenêtre de contexte du LLM.
- **Génération** : Le LLM combine l'invite augmentée pour générer la réponse finale, garantissant ainsi sa factualité et sa traçabilité.

## Installation

1. Accédez à la page de gestion des plugins.
2. Recherchez le plugin `AI: Knowledge base` et activez-le.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)