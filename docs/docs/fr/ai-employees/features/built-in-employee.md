:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/ai-employees/features/built-in-employee).
:::

# Employés IA intégrés

NocoBase est préinstallé avec plusieurs employés IA conçus pour des scénarios spécifiques.

Il vous suffit de configurer le service LLM et d'activer l'employé correspondant pour commencer à travailler ; les modèles peuvent être changés à la demande au cours de la conversation.


## Présentation

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Nom de l'employé | Positionnement du rôle | Capacités clés |
| :--- | :--- | :--- |
| **Cole** | Assistant NocoBase | Questions-réponses sur le produit, recherche documentaire |
| **Ellis** | Expert en e-mails | Rédaction d'e-mails, génération de résumés, suggestions de réponses |
| **Dex** | Expert en organisation de données | Traduction de champs, formatage, extraction d'informations |
| **Viz** | Analyste d'insights | Insights de données, analyse de tendances, interprétation d'indicateurs clés |
| **Lexi** | Assistant de traduction | Traduction multilingue, aide à la communication |
| **Vera** | Analyste de recherche | Recherche en ligne, agrégation d'informations, recherche approfondie |
| **Dara** | Expert en visualisation de données | Configuration de graphiques, génération de rapports visuels |
| **Orin** | Expert en modélisation de données | Aide à la conception de structures de collections, suggestions de champs |
| **Nathan** | Ingénieur Frontend | Aide à l'écriture de fragments de code frontend, ajustements de style |


Vous pouvez cliquer sur la **bulle flottante IA** en bas à droite de l'interface de l'application et sélectionner l'employé dont vous avez besoin pour commencer à collaborer.


## Employés IA pour scénarios dédiés

Certains employés IA intégrés (de type constructeur) n'apparaissent pas dans la liste des employés IA en bas à droite ; ils disposent d'espaces de travail dédiés, par exemple :

* **Orin** n'apparaît que sur la page de configuration de la source de données ;
* **Dara** n'apparaît que sur la page de configuration des graphiques ;
* **Nathan** n'apparaît que dans l'éditeur JS.



---

Voici quelques scénarios d'application typiques pour les employés IA afin de vous inspirer. D'autres potentiels attendent votre exploration dans vos activités réelles.


## Viz : Analyste d'insights

### Présentation

> Générez des graphiques et des insights en un clic, laissez les données parler d'elles-mêmes.

**Viz** est l'**analyste d'insights IA** intégré.
Il sait lire les données de votre page actuelle (telles que les Pistes, Opportunités, Comptes) et générer automatiquement des graphiques de tendance, des graphiques de comparaison, des cartes KPI et des conclusions concises, rendant l'analyse commerciale facile et intuitive.

> Vous voulez savoir « Pourquoi les ventes ont-elles chuté récemment ? »
> Dites simplement un mot à Viz, et il pourra vous dire où la baisse s'est produite, quelles en sont les raisons possibles et quelles pourraient être les prochaines étapes.

### Scénarios d'utilisation

Qu'il s'agisse de revues d'activité mensuelles, du ROI des canaux ou des entonnoirs de vente, vous pouvez laisser Viz analyser, générer des graphiques et interpréter les résultats.

| Scénario | Ce que vous voulez savoir | Résultat de Viz |
| -------- | ------------ | ------------------- |
| **Bilan mensuel** | En quoi ce mois est-il meilleur que le précédent ? | Carte KPI + Graphique de tendance + Trois suggestions d'amélioration |
| **Décomposition de la croissance** | La croissance des revenus est-elle tirée par le volume ou le prix ? | Graphique de décomposition des facteurs + Tableau comparatif |
| **Analyse des canaux** | Quel canal mérite le plus de continuer à investir ? | Graphique ROI + Courbe de rétention + Suggestions |
| **Analyse de l'entonnoir** | Où le trafic est-il bloqué ? | Graphique en entonnoir + Explication des goulots d'étranglement |
| **Rétention client** | Quels clients sont les plus précieux ? | Graphique de segmentation RFM + Courbe de rétention |
| **Évaluation des promotions** | Quelle a été l'efficacité de la grande promotion ? | Graphique comparatif + Analyse de l'élasticité des prix |

### Utilisation

**Points d'entrée sur la page**

* **Bouton en haut à droite (Recommandé)**
  
  Sur les pages comme les Pistes, Opportunités et Comptes, cliquez sur l'**icône Viz** dans le coin supérieur droit pour sélectionner des tâches prédéfinies, telles que :

  * Conversion d'étape et tendances
  * Comparaison des canaux sources
  * Analyse du bilan mensuel

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Panneau global en bas à droite**
  
  Sur n'importe quelle page, vous pouvez appeler le panneau IA global et parler directement à Viz :

  ```
  Analyser l'évolution des ventes au cours des 90 derniers jours
  ```

  Viz importera automatiquement le contexte des données de votre page actuelle.

**Interaction**

Viz prend en charge les questions en langage naturel et comprend les suivis sur plusieurs tours.
Exemple :

```
Salut Viz, génère les tendances des pistes pour ce mois-ci.
```

```
Affiche uniquement les performances des canaux tiers.
```

```
Quelle région croît le plus rapidement ?
```

Chaque question de suivi continuera d'approfondir l'analyse sur la base des résultats précédents, sans avoir besoin de ressaisir les conditions de données.

### Conseils pour discuter avec Viz

| Méthode | Effet |
| ---------- | ------------------- |
| Préciser la plage temporelle | « Les 30 derniers jours » ou « Mois dernier vs ce mois » est plus précis |
| Spécifier les dimensions | « Voir par région/canal/produit » aide à aligner les perspectives |
| Se concentrer sur les tendances | Viz est doué pour identifier la direction du changement et les raisons clés |
| Utiliser le langage naturel | Pas besoin de syntaxe impérative, posez simplement des questions comme si vous discutiez |


---



## Dex : Expert en organisation de données

### Présentation

> Extrayez et remplissez rapidement des formulaires, transformant des informations désordonnées en données structurées.

`Dex` est un expert en organisation de données qui extrait les informations requises à partir de données ou de fichiers non structurés et les organise en informations structurées. Il peut également appeler des outils pour remplir ces informations dans des formulaires.

### Utilisation

Invoquez `Dex` sur la page du formulaire pour ouvrir la fenêtre de conversation.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Cliquez sur **Add work context** (Ajouter un contexte de travail) dans la zone de saisie et sélectionnez **Pick block** (Choisir un bloc) ; la page passera en mode de sélection de bloc.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Sélectionnez le bloc de formulaire sur la page.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Saisissez les données que vous souhaitez que `Dex` organise dans la boîte de dialogue.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Après l'envoi, `Dex` structurera les données et utilisera ses compétences pour mettre à jour les données dans le formulaire sélectionné.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin : Modélisateur de données

### Présentation

> Concevez intelligemment des collections et optimisez les structures de base de données.

`Orin` est un expert en modélisation de données. Sur la page de configuration de la source de données principale, vous pouvez laisser `Orin` vous aider à créer ou modifier des collections.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Utilisation

Accédez au plugin de gestion de source de données et sélectionnez la configuration de la source de données principale.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Cliquez sur l'avatar d' `Orin` dans le coin supérieur droit pour ouvrir la boîte de dialogue de l'employé IA.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Décrivez vos besoins de modélisation à `Orin`, envoyez et attendez une réponse. 

Une fois qu'`Orin` aura confirmé vos besoins, il utilisera ses compétences et vous répondra avec un aperçu de la modélisation des données.

Après avoir examiné l'aperçu, cliquez sur le bouton **Finish review and apply** (Terminer la révision et appliquer) pour créer les collections selon la modélisation d'`Orin`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan : Ingénieur Frontend

### Présentation

> Vous aide à écrire et optimiser le code frontend pour implémenter des logiques d'interaction complexes.

`Nathan` est l'expert en développement frontend de NocoBase. Dans les scénarios où JavaScript est requis, tels que `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Flux d'événements` et `Liaison`, l'avatar de Nathan apparaîtra dans le coin supérieur droit de l'éditeur de code, vous permettant de lui demander de l'aide pour écrire ou modifier le code dans l'éditeur.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Utilisation

Dans l'éditeur de code, cliquez sur `Nathan` pour ouvrir la boîte de dialogue de l'employé IA ; le code présent dans l'éditeur sera automatiquement joint à la zone de saisie et envoyé à `Nathan` comme contexte d'application.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Saisissez vos besoins de codage, envoyez-les à `Nathan` et attendez sa réponse.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Cliquez sur le bouton **Apply to editor** (Appliquer à l'éditeur) sur le bloc de code renvoyé par `Nathan` pour écraser le code dans l'éditeur par le sien.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Cliquez sur le bouton **Run** (Exécuter) dans l'éditeur de code pour visualiser les effets en temps réel.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Historique du code

Cliquez sur l'icône **Ligne de commande** dans le coin supérieur droit de la boîte de dialogue de `Nathan` pour afficher les fragments de code que vous avez envoyés et ceux auxquels `Nathan` a répondu au cours de la session actuelle.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)