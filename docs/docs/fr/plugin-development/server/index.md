:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vue d'ensemble

Le développement de plugins côté serveur NocoBase vous offre diverses fonctionnalités et capacités pour personnaliser et étendre les fonctionnalités principales de NocoBase. Vous trouverez ci-dessous les principales capacités et les chapitres associés :

| Module                                       | Description                                                                                             | Chapitre associé                                      |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :---------------------------------------------------- |
| **Classe de plugin**                         | Créez et gérez des plugins côté serveur, étendez les fonctionnalités principales                         | [plugin.md](plugin.md)                                |
| **Opérations sur la base de données**        | Fournit des interfaces pour les opérations sur la base de données, prenant en charge le CRUD et la gestion des transactions | [database.md](database.md)                            |
| **Collections personnalisées**               | Personnalisez les structures de **collection** en fonction de vos besoins métier pour une gestion flexible du modèle de données | [collections.md](collections.md)                      |
| **Compatibilité des données lors de la mise à niveau des plugins** | Assurez-vous que les mises à niveau des plugins n'affectent pas les données existantes en effectuant la migration et la gestion de la compatibilité des données | [migration.md](migration.md)                          |
| **Gestion des sources de données externes**  | Intégrez et gérez les **sources de données** externes pour permettre l'interaction des données           | [data-source-manager.md](data-source-manager.md)    |
| **API personnalisées**                       | Étendez la gestion des ressources API en écrivant des interfaces personnalisées                          | [resource-manager.md](resource-manager.md)            |
| **Gestion des permissions API**              | Personnalisez les permissions API pour un contrôle d'accès granulaire                                   | [acl.md](acl.md)                                      |
| **Interception et filtrage des requêtes/réponses** | Ajoutez des intercepteurs ou des middlewares de requête et de réponse pour gérer des tâches comme la journalisation, l'authentification, etc. | [context.md](context.md) et [middleware.md](middleware.md) |
| **Écoute d'événements**                      | Écoutez les événements système (par exemple, de l'application ou de la base de données) et déclenchez les gestionnaires correspondants | [event.md](event.md)                                  |
| **Gestion du cache**                         | Gérez le cache pour améliorer les performances de l'application et la vitesse de réponse                 | [cache.md](cache.md)                                  |
| **Tâches planifiées**                        | Créez et gérez des tâches planifiées, telles que le nettoyage périodique, la synchronisation des données, etc. | [cron-job-manager.md](cron-job-manager.md)            |
| **Support multilingue**                      | Intégrez le support multilingue pour implémenter l'internationalisation et la localisation               | [i18n.md](i18n.md)                                    |
| **Sortie des logs**                          | Personnalisez les formats et les méthodes de sortie des logs pour améliorer les capacités de débogage et de surveillance | [logger.md](logger.md)                                |
| **Commandes personnalisées**                 | Étendez l'interface CLI de NocoBase en ajoutant des commandes personnalisées                             | [command.md](command.md)                              |
| **Écriture de cas de test**                  | Écrivez et exécutez des cas de test pour garantir la stabilité et la précision fonctionnelle des plugins | [test.md](test.md)                                    |