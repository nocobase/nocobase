:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Procédures de maintenance

## Premier démarrage de l'application

Lors du premier démarrage de l'application, commencez par lancer un seul nœud. Attendez que les plugins soient entièrement installés et activés, puis démarrez les autres nœuds.

## Mise à niveau de version

Lorsque vous devez mettre à niveau votre version de NocoBase, suivez cette procédure.

:::warning{title=Attention}
Dans un environnement de **production** en cluster, l'utilisation de fonctionnalités telles que la gestion des plugins et les mises à niveau de version doit être effectuée avec la plus grande prudence, voire évitée.

NocoBase ne prend pas encore en charge les mises à niveau en ligne pour les versions en cluster. Pour garantir la cohérence des données, il est nécessaire de suspendre les services externes pendant le processus de mise à niveau.
:::

Étapes à suivre :

1.  Arrêtez le service actuel

    Arrêtez toutes les instances de l'application NocoBase et redirigez le trafic du répartiteur de charge vers une page d'état 503.

2.  Sauvegardez les données

    Avant la mise à niveau, il est fortement recommandé de sauvegarder les données de la base de données afin de prévenir tout problème potentiel pendant le processus.

3.  Mettez à jour la version

    Référez-vous à la section [Mise à niveau Docker](../get-started/upgrading/docker) pour mettre à jour la version de l'image de l'application NocoBase.

4.  Démarrez le service

    1.  Démarrez un nœud du cluster et attendez que la mise à jour soit terminée et que le nœud démarre correctement.
    2.  Vérifiez que les fonctionnalités sont correctes. En cas d'anomalies persistantes après dépannage, vous pouvez revenir à la version précédente.
    3.  Démarrez les autres nœuds.
    4.  Redirigez le trafic du répartiteur de charge vers le cluster d'applications.

## Maintenance intégrée à l'application

La maintenance intégrée à l'application désigne l'exécution d'opérations de maintenance directement depuis l'application en cours d'exécution. Cela inclut :

*   Gestion des plugins (installation, activation, désactivation de plugins, etc.)
*   Sauvegarde et restauration
*   Gestion des migrations d'environnement

Étapes à suivre :

1.  Réduisez le nombre de nœuds

    Réduisez le nombre de nœuds d'application actifs dans le cluster à un seul, et arrêtez le service sur les autres nœuds.

2.  Effectuez les opérations de maintenance intégrées à l'application, telles que l'installation et l'activation de plugins, la sauvegarde de données, etc.

3.  Restaurez les nœuds

    Une fois les opérations de maintenance terminées et les fonctionnalités vérifiées, démarrez les autres nœuds. Après leur démarrage réussi, restaurez l'état de fonctionnement normal du cluster.