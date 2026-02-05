---
pkg: "@nocobase/plugin-ai"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Conversation textuelle

## Introduction

En utilisant le nœud LLM d'un flux de travail, vous pouvez initier une conversation avec un service LLM en ligne, en tirant parti des capacités des grands modèles pour vous aider à accomplir une série de processus métier.

![](https://static-docs.nocobase.com/202503041012091.png)

## Créer un nœud LLM

Étant donné que les conversations avec les services LLM sont souvent chronophages, le nœud LLM ne peut être utilisé que dans les flux de travail asynchrones.

![](https://static-docs.nocobase.com/202503041013363.png)

## Sélectionner un modèle

Commencez par sélectionner un service LLM déjà connecté. Si aucun service LLM n'est encore connecté, vous devrez d'abord ajouter une configuration de service LLM. Consultez : [Gestion des services LLM](/ai-employees/quick-start/llm-service)

Après avoir sélectionné un service, l'application tentera de récupérer une liste des modèles disponibles auprès du service LLM pour que vous puissiez choisir. Certains services LLM en ligne peuvent avoir des API pour récupérer des modèles qui ne sont pas conformes aux protocoles API standard ; dans de tels cas, vous pouvez également saisir manuellement l'ID du modèle.

![](https://static-docs.nocobase.com/202503041013084.png)

## Définir les paramètres d'invocation

Vous pouvez ajuster les paramètres d'appel du modèle LLM selon vos besoins.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Il convient de noter le paramètre **Response format**. Cette option est utilisée pour indiquer au grand modèle le format de sa réponse, qui peut être du texte ou du JSON. Si vous sélectionnez le mode JSON, veuillez noter ce qui suit :

- Le modèle LLM correspondant doit prendre en charge l'appel en mode JSON. De plus, vous devez explicitement demander au LLM de répondre au format JSON dans le Prompt, par exemple : "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Dans le cas contraire, il pourrait n'y avoir aucune réponse, entraînant une erreur `400 status code (no body)`.
- La réponse sera une chaîne JSON. Vous devrez l'analyser en utilisant les capacités d'autres nœuds du flux de travail pour pouvoir utiliser son contenu structuré. Vous pouvez également utiliser la fonctionnalité [Sortie structurée](/ai-employees/workflow/nodes/llm/structured-output).

## Messages

Le tableau de messages envoyé au modèle LLM peut inclure un ensemble de messages historiques. Les messages prennent en charge trois types :

- System - Généralement utilisé pour définir le rôle et le comportement du modèle LLM dans la conversation.
- User - Le contenu saisi par l'utilisateur.
- Assistant - Le contenu de la réponse du modèle.

Pour les messages utilisateur, à condition que le modèle le prenne en charge, vous pouvez ajouter plusieurs éléments de contenu dans une seule invite, correspondant au paramètre `content`. Si le modèle que vous utilisez ne prend en charge le paramètre `content` que sous forme de chaîne de caractères (ce qui est le cas pour la plupart des modèles ne prenant pas en charge les conversations multimodales), veuillez diviser le message en plusieurs invites, chaque invite ne contenant qu'un seul élément de contenu. De cette façon, le nœud enverra le contenu sous forme de chaîne de caractères.

![](https://static-docs.nocobase.com/202503041016140.png)

Vous pouvez utiliser des variables dans le contenu du message pour référencer le contexte du flux de travail.

![](https://static-docs.nocobase.com/202503041017879.png)

## Utiliser le contenu de la réponse du nœud LLM

Vous pouvez utiliser le contenu de la réponse du nœud LLM comme variable dans d'autres nœuds.

![](https://static-docs.nocobase.com/202503041018508.png)