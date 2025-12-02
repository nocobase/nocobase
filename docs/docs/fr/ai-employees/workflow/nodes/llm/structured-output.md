---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Sortie structurée

## Introduction

Dans certains scénarios d'application, les utilisateurs peuvent souhaiter que le modèle LLM réponde avec un contenu structuré au format JSON. Vous pouvez y parvenir en configurant la fonctionnalité de « Sortie structurée ».

![](https://static-docs.nocobase.com/202503041306405.png)

## Configuration

- **JSON Schema** - Vous pouvez spécifier la structure attendue de la réponse du modèle en configurant un [JSON Schema](https://json-schema.org/).
- **Nom** - _Facultatif_, ce champ aide le modèle à mieux comprendre l'objet représenté par le JSON Schema.
- **Description** - _Facultatif_, ce champ aide le modèle à mieux comprendre l'objectif du JSON Schema.
- **Strict** - Exige que le modèle génère une réponse strictement conforme à la structure du JSON Schema. Actuellement, seuls certains nouveaux modèles d'OpenAI prennent en charge ce paramètre. Veuillez vérifier la compatibilité de votre modèle avant de l'activer.

## Méthode de génération du contenu structuré

La manière dont un modèle génère du contenu structuré dépend du **modèle** utilisé et de sa configuration de **Response format** :

1. Modèles dont le **Response format** ne prend en charge que `text`

   - Lors de l'appel, le nœud liera un **Tool** qui génère du contenu au format JSON basé sur le JSON Schema, guidant le modèle à produire une réponse structurée en appelant ce **Tool**.

2. Modèles dont le **Response format** prend en charge le mode JSON (`json_object`)

   - Si le mode JSON est sélectionné lors de l'appel, vous devez explicitement indiquer au modèle dans le Prompt de retourner au format JSON et de fournir des descriptions pour les champs de la réponse.
   - Dans ce mode, le JSON Schema est uniquement utilisé pour analyser la chaîne JSON retournée par le modèle et la convertir en l'objet JSON cible.

3. Modèles dont le **Response format** prend en charge le JSON Schema (`json_schema`)

   - Le JSON Schema est directement utilisé pour spécifier la structure de réponse cible pour le modèle.
   - Le paramètre **Strict** optionnel exige que le modèle suive strictement le JSON Schema lors de la génération de la réponse.

4. Modèles locaux Ollama
   - Si un JSON Schema est configuré, le nœud le transmettra comme paramètre `format` au modèle lors de l'appel.

## Utilisation du résultat de la sortie structurée

Le contenu structuré de la réponse du modèle est enregistré sous forme d'objet JSON dans le champ « Structured content » du nœud et peut être utilisé par les nœuds suivants.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)