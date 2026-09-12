---
pkg: '@nocobase/plugin-ai'
title: 'Utiliser Lina et HY-MT1.5-1.8B local pour traduire les entrées de localisation'
description: 'Déployez le modèle de traduction HY-MT1.5 GGUF avec llama-server et configurez-le pour que Lina traduise en lot les entrées de localisation NocoBase.'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Utiliser Lina et HY-MT1.5-1.8B local pour traduire les entrées de localisation

Ce guide présente une pratique de traduction de localisation : déployer localement un petit modèle spécialisé en traduction, l’exposer comme service compatible OpenAI, puis le configurer pour que Lina traduise en lot les entrées de localisation NocoBase.

Cette approche convient aux entrées système, textes de plugins, menus, titres de collections et libellés de champs. Par rapport aux modèles en ligne, les modèles locaux ne sont pas soumis aux limites externes de RPM, TPM ou concurrence, et la concurrence peut être ajustée selon la machine et le modèle.

## Vue d’ensemble

Ce guide utilise :

- Modèle: `tencent/HY-MT1.5-1.8B-GGUF`
- Service d’inférence: `llama-server`
- Intégration: OpenAI-compatible API
- Employée IA: Lina
- Point d’entrée: page Localization Management

:::info{title=Remarque}
HY-MT1.5-1.8B est un petit modèle spécialisé en traduction. Il convient mieux aux entrées courtes, aux textes d’interface et aux traductions en lot. Les modèles de discussion généraux ne sont pas recommandés comme premier choix pour les tâches de localisation.
:::

## Prérequis

- Le plugin **Localization Management** est activé.
- La langue cible est activée.
- Les entrées de localisation ont été synchronisées.
- La machine locale ou le serveur peut exécuter [`llama-server`](https://github.com/ggml-org/llama.cpp).
- Le service NocoBase peut accéder à l’adresse HTTP de `llama-server`.

## Déployer HY-MT GGUF

### Installer llama.cpp

Sur macOS, vous pouvez l’installer avec Homebrew:

```bash
brew install llama.cpp
```

Vous pouvez aussi utiliser un binaire llama.cpp précompilé ou le compiler depuis les sources. L’exigence finale est que `llama-server` soit disponible.

### Démarrer un service compatible OpenAI

Démarrez le service avec le modèle GGUF depuis Hugging Face:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| Paramètre | Description |
| --- | --- |
| `-hf` | Charger le modèle depuis Hugging Face. |
| `--host` | Adresse d’écoute. Utilisez `127.0.0.1` pour les tests locaux ou `0.0.0.0` pour un accès depuis un conteneur ou à distance. |
| `--port` | Port du service HTTP. |
| `-c` | Longueur de contexte. Les entrées de localisation sont généralement courtes, donc `2048` suffit en général. |
| `-np` | Nombre de slots parallèles. Ajustez selon les performances de la machine. |

:::info{title=Astuce}
Si les ressources serveur sont limitées, commencez avec `-np 1` ou `-np 2`, puis augmentez progressivement après avoir vérifié la stabilité.
:::

## Tester le service de modèle

Après le démarrage de `llama-server`, vérifiez l’état du service:

```bash
curl http://127.0.0.1:8000/health
```

Testez ensuite la traduction via l’API compatible OpenAI:

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

Si vous partez d’un fichier de modèle local, remplacez `model` par le nom réel retourné ou configuré par le service.

:::warning{title=Remarque}
Si une requête ne répond pas longtemps, le modèle peut être trop lent, la concurrence trop élevée ou le contexte trop grand. Réduisez d’abord `-np` et la concurrence de traduction NocoBase, puis observez le temps de réponse.
:::

## Configurer un service LLM dans NocoBase

Allez dans `System Settings -> AI Employees -> LLM service` et ajoutez un service LLM.

| Paramètre | Exemple |
| --- | --- |
| Provider | OpenAI (completions) |
| Title | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | Si `llama-server` n’utilise pas d’authentification, utilisez une valeur factice comme `dummy`. |
| Enabled Models | Sélectionnez `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M` ou saisissez le nom réel du modèle. |

Après la configuration, utilisez `Test flight` pour vérifier le modèle.

:::info{title=Astuce}
Si NocoBase s’exécute dans Docker, `127.0.0.1` pointe vers le conteneur lui-même et peut ne pas accéder au service hôte. Utilisez l’IP de l’hôte, l’adresse réseau du conteneur ou `host.docker.internal`.
:::

## Configurer le modèle dédié de Lina

Allez dans `System Settings -> AI Employees -> AI employees`, ouvrez Lina, puis passez à `Model settings`.

1. Activez `Enable dedicated model configuration`.
2. Sélectionnez le modèle HY-MT local dans `Models`.
3. Enregistrez la configuration.

Après cela, Lina utilisera ce modèle pour les tâches de traduction de localisation et évitera de basculer vers des modèles de discussion généraux.

Pour plus de détails, consultez [Configurer les modèles des employés IA](/ai-employees/features/model-settings).

## Configurer la concurrence de traduction

La concurrence des tâches de traduction de localisation est contrôlée par `AI_LOCALIZATION_CONCURRENCY`:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

Règles:

- Valeur par défaut: `10`
- Minimum: `1`
- Maximum: `20`
- Les valeurs hors plage utilisent la valeur par défaut

La meilleure concurrence dépend du CPU, du GPU, de la mémoire, de la quantification du modèle et de `llama-server -np`. Si la concurrence par défaut pose problème:

1. Commencez avec `AI_LOCALIZATION_CONCURRENCY=1` et vérifiez la traduction d’une seule entrée.
2. Définissez `llama-server -np` et `AI_LOCALIZATION_CONCURRENCY` sur `2` ou `4`.
3. Observez le temps de réponse, l’utilisation CPU/GPU et la progression de la tâche.
4. Augmentez progressivement seulement si tout reste stable.

:::warning{title=Remarque}
Ne définissez pas une concurrence trop élevée au départ. Si elle dépasse la capacité réelle du modèle, les tâches peuvent ralentir à cause de files d’attente, de timeouts ou de blocages du service.
:::

## Exécuter la traduction de localisation

Allez dans `System Management -> Localization Management`.

1. Passez à la langue cible.
2. Cliquez sur `Synchronize` pour vous assurer que les entrées sont synchronisées.
3. Cliquez sur l’avatar de Lina.
4. Choisissez un périmètre de tâche:
   - `Incremental translation`: traduit les entrées qui n’ont pas encore de traduction.
   - `Selected translation`: traduit les entrées sélectionnées dans le tableau.
   - `Full translation`: traduit toutes les entrées de la langue actuelle.
5. Vérifiez le nombre d’entrées, le fournisseur et le modèle dans la boîte de confirmation.
6. Si vous choisissez la traduction incrémentale ou complète, sélectionnez un périmètre de traduction:
   - `All`
   - `Built-in entries`: entrées système et plugin.
   - `Custom entries`: noms de routes, noms de collections et de champs, ainsi que contenu UI.
7. Ajustez les langues de traduction de référence si nécessaire. La traduction incrémentale et complète configurent séparément les langues de référence pour les entrées intégrées et personnalisées; la traduction des éléments sélectionnés n’affiche qu’une configuration générale des langues de référence.
8. Confirmez pour créer la tâche asynchrone.
9. Attendez la fin, relisez les traductions, puis publiez.

Commencez par `Selected translation` sur quelques entrées pour vérifier le style de sortie et la vitesse avant de lancer une traduction incrémentale ou complète.

## Comment Lina construit les requêtes de traduction

Lina construit les requêtes à partir des entrées et des traductions de référence. Pour les entrées courtes, les références existantes améliorent la cohérence:

- Les entrées intégrées utilisent les traductions chinoises comme référence par défaut et le japonais comme référence de secours.
- Les entrées personnalisées utilisent la langue par défaut du système comme référence par défaut et le chinois comme référence de secours.
- Les utilisateurs peuvent ajuster la langue par défaut et la langue de secours dans la boîte de confirmation de la tâche.
- Le système utilise d’abord la traduction de référence dans la langue par défaut. Si elle n’existe pas, il essaie ensuite la langue de secours.
- Les résultats sont écrits dans la langue cible, mais ne sont pas publiés automatiquement.

La sémantique du prompt est similaire à:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Dépannage

### Aucune progression après la création d’une tâche

Vérifiez si `llama-server` a reçu des requêtes. Consultez les logs du service ou appelez `/v1/chat/completions` avec `curl`.

Si le modèle reçoit les requêtes mais ne répond pas, réduisez:

- `AI_LOCALIZATION_CONCURRENCY`
- `llama-server -np`
- `llama-server -c`

### Le modèle renvoie des explications au lieu de traductions

Les modèles de traduction locaux sont généralement plus stables que les modèles de discussion généraux. Si des explications apparaissent encore, testez d’abord le même prompt avec `curl` pour vérifier le style de sortie du modèle. Vous pouvez aussi traduire d’abord des entrées plus courtes ou réduire des paramètres d’échantillonnage comme temperature.

### NocoBase ne peut pas se connecter au service de modèle

Vérifiez:

- Que Base URL inclut `/v1`.
- Que l’environnement d’exécution NocoBase peut accéder à l’adresse.
- Que le pare-feu ou le réseau de conteneurs ne bloque pas le port.
- Que `llama-server` est toujours en cours d’exécution.

## Relire avant publication

Après la traduction par IA, relisez avant de publier:

- Filtrez par module et vérifiez les entrées courtes comme les menus, boutons, noms de champs et statuts.
- Vérifiez les variables, placeholders, balises HTML et symboles de formatage.
- Vérifiez la cohérence des termes métier importants.
- Si les traductions d’entrées intégrées sont écrasées, resynchronisez dans Localization Management et sélectionnez `Reset system built-in entry translations` pour restaurer les valeurs par défaut. Pour contribuer aux traductions par défaut du système et des plugins officiels, consultez [Translation Contribution](/get-started/translations).
- Publiez d’abord dans un environnement de test, puis synchronisez vers la production.

## Références

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [Documentation llama-server](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina: ingénieure localisation](/ai-employees/built-in/lina)
