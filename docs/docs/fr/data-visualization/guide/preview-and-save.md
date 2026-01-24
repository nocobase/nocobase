:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Prévisualisation et Enregistrement

*   **Prévisualisation** : Affiche temporairement les modifications du panneau de configuration dans le graphique de la page afin de vérifier le résultat.
*   **Enregistrement** : Sauvegarde définitivement les modifications du panneau de configuration dans la base de données.

## Points d'accès

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

-   En mode de configuration visuel (Basic), les modifications sont appliquées automatiquement à la prévisualisation par défaut.
-   En modes SQL et Custom, cliquez sur le bouton **Prévisualiser** à droite pour appliquer les modifications à la prévisualisation.
-   Un bouton **Prévisualiser** unifié est disponible en bas de l'ensemble du panneau de configuration.

## Comportement de la prévisualisation

-   La configuration est affichée temporairement sur la page, mais n'est pas écrite dans la base de données. Après un rafraîchissement de la page ou une annulation de l'opération, le résultat de la prévisualisation n'est pas conservé.
-   **Anti-rebond intégré** : Si plusieurs actualisations sont déclenchées en peu de temps, seule la dernière est exécutée afin d'éviter les requêtes fréquentes.
-   Cliquer à nouveau sur **Prévisualiser** écrase le résultat de la prévisualisation précédente.

## Messages d'erreur

-   **Erreurs de requête ou échecs de validation** : les messages d'erreur sont affichés dans la zone « Voir les données ».
-   **Erreurs de configuration du graphique** (mapping Basic manquant, exceptions du code JS Custom) : les erreurs sont affichées dans la zone du graphique ou la console, tout en maintenant la page opérationnelle.
-   Confirmez les noms de colonnes et les types de données dans la zone « Voir les données » avant de procéder au mapping des champs ou à la rédaction de code Custom, cela permet de réduire efficacement les erreurs.

## Enregistrer et Annuler

-   **Enregistrer** : Écrit les modifications actuelles dans la configuration du bloc et les applique immédiatement à la page.
-   **Annuler** : Annule les modifications non enregistrées et rétablit l'état de la dernière sauvegarde.
-   **Portée de l'enregistrement** :
    -   **Requête de données** : Les paramètres du Builder ; en mode SQL, le texte SQL est également enregistré.
    -   **Options du graphique** : Le type Basic, le mapping des champs et les propriétés ; le texte JS Custom.
    -   **Événements interactifs** : Le texte JS et la logique de liaison des événements.
-   Après l'enregistrement, le bloc prend effet pour tous les visiteurs (sous réserve des paramètres de permissions de la page).

## Parcours d'opération recommandé

-   Configurez la requête de données → Exécutez la requête → Vérifiez les noms de colonnes et les types dans « Voir les données » → Configurez les options du graphique pour mapper les champs principaux → Prévisualisez pour valider → Enregistrez pour appliquer.