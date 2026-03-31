:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Employés IA intégrés

## Présentation

NocoBase intègre les employés IA suivants. Ils disposent de compétences, d'outils et de bases de connaissances complètes. Il vous suffit de leur configurer un LLM pour qu'ils puissent commencer à travailler.

- `Orin` : Expert en modélisation de données
- `Avery` : Remplisseur de formulaires
- `Viz` : Analyste d'insights
- `Lexi` : Traducteur
- `Nathan` : Ingénieur code frontend
- `Cole` : Assistant NocoBase
- `Vera` : Analyste de recherche
- `Dex` : Organisateur de données
- `Ellis` : Expert en e-mail

## Comment les activer

Accédez à la page de configuration du plugin des employés IA, cliquez sur l'onglet `AI employees` pour accéder à la page de gestion des employés IA.

Vous constaterez que le système intègre plusieurs employés IA, mais qu'aucun n'est activé. Vous ne pouvez pas encore collaborer avec eux sur la page de l'application.

![20251022121248](https://static-docs.nocobase.com/20251022121248.png)

Sélectionnez l'employé IA intégré que vous souhaitez activer, puis cliquez sur le bouton `Edit` pour accéder à la page d'édition de l'employé IA.

Tout d'abord, dans l'onglet `Profile`, activez l'interrupteur `Enable`.

![20251022121546](https://static-docs.nocobase.com/20251022121546.png)

Ensuite, dans l'onglet `Model settings`, configurez le modèle pour l'employé IA intégré :

- Sélectionnez le service LLM que vous avez créé dans la gestion des services LLM ;
- Saisissez le nom du grand modèle que vous souhaitez utiliser.

![20251022121729](https://static-docs.nocobase.com/20251022121729.png)

### Finaliser l'activation

Après avoir configuré le modèle pour l'employé IA intégré, cliquez sur le bouton `Submit` pour enregistrer les modifications.

Vous pourrez ensuite voir cet employé IA intégré dans le bouton de lancement rapide des employés IA, situé dans le coin inférieur droit de la page.

![20251022121951](https://static-docs.nocobase.com/20251022121951.png)

### Remarque

Certains employés IA intégrés n'apparaîtront pas dans la liste des employés IA en bas à droite après avoir été activés. Par exemple, Orin n'apparaîtra que sur la page de configuration des données principales ; Nathan, lui, n'apparaîtra que dans l'éditeur JS.