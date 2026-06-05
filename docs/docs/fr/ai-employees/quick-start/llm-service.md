:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Démarrage rapide

## Introduction

Avant d'utiliser l'employé IA, vous devez d'abord connecter un service LLM en ligne. NocoBase prend actuellement en charge les services LLM en ligne les plus courants, tels que OpenAI, Gemini, Claude, DepSeek, Qwen, etc.
En plus des services LLM en ligne, NocoBase prend également en charge la connexion aux modèles locaux Ollama.

## Configurer un service LLM

Accédez à la page de configuration du plugin Employé IA, puis cliquez sur l'onglet `LLM service` pour accéder à la page de gestion des services LLM.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

Passez la souris sur le bouton `Add New` situé dans le coin supérieur droit de la liste des services LLM, puis sélectionnez le service LLM que vous souhaitez utiliser.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

Prenons OpenAI comme exemple : dans la fenêtre contextuelle, saisissez un `title` facile à retenir, puis entrez la `clé API` (API key) obtenue auprès d'OpenAI. Cliquez sur `Submit` pour enregistrer et finaliser ainsi la configuration du service LLM.

Le champ `Base URL` peut généralement être laissé vide. Si vous utilisez un service LLM tiers compatible avec l'API OpenAI, veuillez renseigner l'URL de base correspondante.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Test de disponibilité

Sur la page de configuration du service LLM, cliquez sur le bouton `Test flight`, saisissez le nom du modèle que vous souhaitez utiliser, puis cliquez sur le bouton `Run` pour vérifier la disponibilité du service LLM et du modèle.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)