:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/ai-employees/features/llm-service).
:::

# Configurer le service LLM

Avant d'utiliser les Employés AI, vous devez d'abord configurer les services LLM disponibles.

Les fournisseurs pris en charge incluent OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, ainsi que les modèles locaux Ollama.

## Créer un service

Accédez à `Paramètres du système -> Employés AI -> LLM service`.

1. Cliquez sur `Add New` pour ouvrir la fenêtre de création.
2. Sélectionnez le `Provider`.
3. Remplissez le `Title`, l'`API Key` et l'`Base URL` (facultatif).
4. Configurez les `Enabled Models` :
   - `Recommended models` : utiliser les modèles recommandés officiellement.
   - `Select models` : sélectionner dans la liste retournée par le fournisseur.
   - `Manual input` : saisir manuellement l'ID du modèle et son nom d'affichage.
5. Cliquez sur `Submit` pour enregistrer.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Activation et tri des services

Dans la liste des services LLM, vous pouvez directement :

- Utiliser l'interrupteur `Enabled` pour activer ou désactiver un service.
- Faire glisser pour réorganiser l'ordre des services (ceci affecte l'ordre d'affichage des modèles).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Test de disponibilité

Utilisez `Test flight` au bas de la fenêtre de configuration du service pour vérifier la disponibilité du service et des modèles.

Il est recommandé de tester le service avant de l'utiliser en production.