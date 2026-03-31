---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Traitement manuel

## Introduction

Lorsqu'un processus métier ne peut pas être entièrement automatisé pour la prise de décision, vous pouvez utiliser un nœud manuel pour déléguer une partie de cette autorité à une personne.

Lors de son exécution, un nœud manuel interrompt le déroulement du flux de travail et génère une tâche à faire pour l'utilisateur concerné. Une fois que l'utilisateur a soumis la tâche, le flux de travail continue, reste en attente ou est terminé, selon le statut sélectionné. Cette fonctionnalité est particulièrement utile pour les processus d'approbation, par exemple.

## Installation

Ce plugin est intégré, aucune installation n'est requise.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Traitement manuel » :

![Créer un nœud manuel](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Configurer le nœud

### Responsable

Un nœud manuel doit désigner un utilisateur comme responsable de la tâche à faire. La liste des tâches à faire peut être ajoutée en tant que bloc sur une page. Le contenu de la fenêtre contextuelle de la tâche pour chaque nœud doit être configuré dans l'interface du nœud.

Sélectionnez un utilisateur, ou choisissez la clé primaire ou la clé étrangère des données utilisateur à partir du contexte via une variable.

![Nœud manuel_Configuration_Responsable_Sélectionner une variable](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Remarque}
Actuellement, l'option de responsable pour les nœuds manuels ne prend pas en charge plusieurs utilisateurs. Cette fonctionnalité sera ajoutée dans une future version.
:::

### Configurer l'interface utilisateur

La configuration de l'interface pour les tâches à faire est l'élément central du nœud manuel. Vous pouvez cliquer sur le bouton « Configurer l'interface utilisateur » pour ouvrir une fenêtre contextuelle de configuration distincte, que vous pouvez configurer en mode WYSIWYG (ce que vous voyez est ce que vous obtenez), comme une page normale.

![Nœud manuel_Configuration du nœud_Configuration de l'interface](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Onglets

Les onglets peuvent être utilisés pour distinguer différents contenus. Par exemple, un onglet peut servir à la soumission d'un formulaire d'approbation, un autre à la soumission d'un formulaire de rejet, ou encore à afficher les détails de données connexes. Ils sont entièrement configurables.

#### Blocs

Les types de blocs pris en charge se divisent principalement en deux catégories : les blocs de données et les blocs de formulaire. Le Markdown est quant à lui principalement utilisé pour le contenu statique, comme les messages d'information.

##### Bloc de données

Les blocs de données peuvent afficher les données de déclenchement ou les résultats de traitement de n'importe quel nœud, fournissant ainsi des informations contextuelles pertinentes au responsable de la tâche à faire. Par exemple, si le flux de travail est déclenché par un événement de formulaire, vous pouvez créer un bloc de détails pour les données de déclenchement. Cette configuration est similaire à celle des détails d'une page normale, vous permettant de sélectionner n'importe quel champ des données de déclenchement pour l'affichage.

![Nœud manuel_Configuration du nœud_Configuration de l'interface_Bloc de données_Déclencheur](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Les blocs de données de nœud fonctionnent de manière similaire : vous pouvez sélectionner le résultat des données d'un nœud en amont pour l'afficher en détail. Par exemple, le résultat d'un nœud de calcul en amont peut servir d'information de référence contextuelle pour la tâche à faire du responsable.

![Nœud manuel_Configuration du nœud_Configuration de l'interface_Bloc de données_Données du nœud](https://static-docs.nocobase.com/a583e26e508e954f45db310a72c2d0a404c.png)

:::info{title=Remarque}
Étant donné que le flux de travail n'est pas en cours d'exécution lors de la configuration de l'interface, aucun bloc de données n'affiche de données spécifiques. Les données pertinentes pour une instance de flux de travail donnée ne seront visibles dans la fenêtre contextuelle des tâches à faire qu'après le déclenchement et l'exécution du flux de travail.
:::

##### Bloc de formulaire

Au moins un bloc de formulaire doit être configuré dans l'interface des tâches à faire pour gérer la décision finale de poursuite du flux de travail. L'absence de configuration d'un formulaire empêchera le flux de travail de se poursuivre après son interruption. Il existe trois types de blocs de formulaire :

- Formulaire personnalisé
- Formulaire de création d'enregistrement
- Formulaire de mise à jour d'enregistrement

![Nœud manuel_Configuration du nœud_Configuration de l'interface_Types de formulaire](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Les formulaires de création et de mise à jour d'enregistrements nécessitent la sélection d'une collection de base. Après la soumission par l'utilisateur de la tâche à faire, les valeurs du formulaire seront utilisées pour créer ou mettre à jour des données dans la collection spécifiée. Un formulaire personnalisé vous permet de définir librement un formulaire temporaire qui n'est pas lié à une collection. Les valeurs des champs soumises par l'utilisateur de la tâche à faire pourront être utilisées dans les nœuds suivants.

Les boutons de soumission du formulaire peuvent être configurés selon trois types :

- Soumettre et continuer le flux de travail
- Soumettre et terminer le flux de travail
- Enregistrer uniquement les valeurs du formulaire

![Nœud manuel_Configuration du nœud_Configuration de l'interface_Boutons du formulaire](https://static-docs.nocobase.com/6b45995b14152e831019037001445.png)

Ces trois boutons représentent les trois statuts possibles d'un nœud dans le flux de travail. Après la soumission, le statut du nœud passe à « Terminé », « Rejeté » ou reste en « Attente ». Un formulaire doit obligatoirement configurer au moins l'un des deux premiers boutons pour déterminer la suite du déroulement du flux de travail.

Sur le bouton « Soumettre et continuer le flux de travail », vous pouvez configurer des affectations pour les champs du formulaire :

![Nœud manuel_Configuration du nœud_Configuration de l'interface_Bouton du formulaire_Définir les valeurs du formulaire](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Nœud manuel_Configuration du nœud_Configuration de l'interface_Bouton du formulaire_Fenêtre contextuelle de définition des valeurs du formulaire](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Après avoir ouvert la fenêtre contextuelle, vous pouvez affecter des valeurs à n'importe quel champ du formulaire. Une fois le formulaire soumis, cette valeur sera la valeur finale du champ. Cette fonctionnalité est particulièrement utile lors de l'examen de données. Vous pouvez utiliser plusieurs boutons « Soumettre et continuer le flux de travail » différents dans un formulaire, chaque bouton définissant des valeurs énumérées distinctes pour des champs similaires (comme le statut), ce qui permet de poursuivre l'exécution du flux de travail avec des valeurs de données différentes.

## Bloc des tâches à faire

Pour le traitement manuel, vous devez également ajouter une liste de tâches à faire sur une page afin d'afficher les tâches en attente. Cela permet au personnel concerné d'accéder et de gérer les tâches spécifiques du nœud manuel via cette liste.

### Ajouter un bloc

Vous pouvez sélectionner « Tâches à faire du flux de travail » parmi les blocs disponibles sur une page pour ajouter un bloc de liste de tâches à faire :

![Nœud manuel_Ajouter un bloc de tâches à faire](https://static-docs.nocobase.com/198b417454cd73b704267bf30fe5e647.png)

Exemple de bloc de liste de tâches à faire :

![Nœud manuel_Liste des tâches à faire](https://static-docs.nocobase.com/cfefb0d2c6a91c5c9dfa550d6b220f34.png)

### Détails de la tâche à faire

Ensuite, le personnel concerné peut cliquer sur la tâche à faire correspondante pour ouvrir la fenêtre contextuelle des tâches à faire et effectuer le traitement manuel :

![Nœud manuel_Détails de la tâche à faire](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Exemple

### Révision d'article

Supposons qu'un article soumis par un utilisateur régulier doive être approuvé par un administrateur avant de pouvoir être publié. Si le flux de travail est rejeté, l'article restera à l'état de brouillon (non public). Ce processus peut être mis en œuvre à l'aide d'un formulaire de mise à jour dans un nœud manuel.

Créez un flux de travail déclenché par « Créer un article » et ajoutez un nœud manuel :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Orchestration du flux de travail" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Dans le nœud manuel, configurez l'administrateur comme responsable. Dans la configuration de l'interface, ajoutez un bloc basé sur les données de déclenchement pour afficher les détails du nouvel article :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Configuration du nœud_Bloc de détails" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Dans la configuration de l'interface, ajoutez un bloc basé sur un formulaire de mise à jour d'enregistrement, sélectionnez la collection d'articles, afin que l'administrateur puisse décider d'approuver ou non. Après approbation, l'article correspondant sera mis à jour selon les autres configurations ultérieures. Après avoir ajouté le formulaire, un bouton « Soumettre et continuer le flux de travail » sera présent par défaut, que vous pouvez considérer comme l'approbation. Ajoutez ensuite un bouton « Soumettre et terminer le flux de travail » pour le cas de rejet :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Configuration du nœud_Formulaire et actions" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Lorsque le flux de travail continue, nous devons mettre à jour le statut de l'article. Il existe deux méthodes de configuration. La première consiste à afficher directement le champ de statut de l'article dans le formulaire, permettant à l'opérateur de le sélectionner. Cette méthode est plus adaptée aux situations nécessitant une saisie active dans le formulaire, comme la fourniture de commentaires :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Configuration du nœud_Champs du formulaire" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Pour simplifier la tâche de l'opérateur, une autre méthode consiste à configurer l'affectation des valeurs du formulaire sur le bouton « Soumettre et continuer le flux de travail ». Dans l'affectation, ajoutez un champ « Statut » avec la valeur « Publié ». Cela signifie que lorsque l'opérateur clique sur le bouton, l'article sera mis à jour à l'état « Publié » :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Configuration du nœud_Affectation du formulaire" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Ensuite, dans le menu de configuration situé en haut à droite du bloc de formulaire, sélectionnez la condition de filtre pour les données à mettre à jour. Ici, choisissez la collection « Articles », et la condition de filtre est « ID `est égal à` Variable de déclenchement / Données de déclenchement / ID » :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Configuration du nœud_Condition du formulaire" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Enfin, vous pouvez modifier les titres de chaque bloc, le texte des boutons pertinents et le texte d'aide des champs du formulaire pour rendre l'interface plus conviviale :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Configuration du nœud_Formulaire final" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Fermez le panneau de configuration et cliquez sur le bouton de soumission pour enregistrer la configuration du nœud. Le flux de travail est maintenant configuré. Après avoir activé ce flux de travail, il sera automatiquement déclenché lors de la création d'un nouvel article. L'administrateur pourra voir que ce flux de travail nécessite un traitement dans la liste des tâches à faire. En cliquant pour afficher, il pourra consulter les détails de la tâche à faire :

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Liste des tâches à faire" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Nœud manuel_Exemple_Révision d'article_Détails de la tâche à faire" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

L'administrateur peut, en se basant sur les détails de l'article, décider manuellement si celui-ci peut être publié. Si oui, en cliquant sur le bouton « Approuver », l'article passera à l'état « Publié ». Sinon, en cliquant sur le bouton « Rejeter », l'article restera à l'état de brouillon.

## Approbation de demande de congé

Supposons qu'un employé doive demander un congé, qui doit être approuvé par un superviseur pour prendre effet, et que les données de congé correspondantes de l'employé doivent être déduites. Qu'il soit approuvé ou rejeté, un nœud de requête HTTP sera utilisé pour appeler une API SMS afin d'envoyer un message de notification à l'employé (voir la section [Requête HTTP](#_HTTP_请求)). Ce scénario peut être mis en œuvre à l'aide d'un formulaire personnalisé dans un nœud manuel.

Créez un flux de travail déclenché par « Créer une demande de congé » et ajoutez un nœud manuel. Ce processus est similaire à celui de la révision d'article précédente, mais ici le responsable est le superviseur. Dans la configuration de l'interface, ajoutez un bloc basé sur les données de déclenchement pour afficher les détails de la nouvelle demande de congé. Ajoutez ensuite un autre bloc basé sur un formulaire personnalisé pour que le superviseur puisse décider d'approuver ou non. Dans le formulaire personnalisé, ajoutez un champ pour le statut d'approbation et un champ pour le motif du rejet :

<figure>
  <img alt="Nœud manuel_Exemple_Approbation de demande de congé_Configuration du nœud" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Contrairement au processus de révision d'article, étant donné que nous devons poursuivre le flux de travail en fonction du résultat de l'approbation du superviseur, nous ne configurons ici qu'un bouton « Soumettre et continuer le flux de travail » pour la soumission, sans utiliser de bouton « Soumettre et terminer le flux de travail ».

Parallèlement, après le nœud manuel, nous pouvons utiliser un nœud conditionnel pour déterminer si le superviseur a approuvé la demande de congé. Dans la branche d'approbation, ajoutez un traitement de données pour déduire les congés, et après la fusion des branches, ajoutez un nœud de requête pour envoyer une notification SMS à l'employé. Cela donne le flux de travail complet suivant :

<figure>
  <img alt="Nœud manuel_Exemple_Approbation de demande de congé_Orchestration du flux de travail" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

La condition dans le nœud conditionnel est configurée comme suit : « Nœud manuel / Données du formulaire personnalisé / La valeur du champ d'approbation est-elle "Approuvé" » :

<figure>
  <img alt="Nœud manuel_Exemple_Approbation de demande de congé_Condition" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Les données du nœud d'envoi de requête peuvent également utiliser les variables de formulaire correspondantes du nœud manuel pour différencier le contenu des SMS d'approbation et de rejet. La configuration de l'ensemble du flux de travail est ainsi terminée. Une fois le flux de travail activé, lorsqu'un employé soumet une demande de congé, le superviseur peut traiter l'approbation dans ses tâches à faire. L'opération est fondamentalement similaire au processus de révision d'article.