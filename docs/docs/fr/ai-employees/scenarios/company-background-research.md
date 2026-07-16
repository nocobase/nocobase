---
title: "Workflow + IA pour les employés afin de compléter l'automatisation de la recherche sur les antécédents de l'entreprise"
description: "Grâce aux formulaires d'informations sur l'entreprise, aux dossiers d'enquête sur les antécédents, aux flux de travail et aux employés de l'IA, un processus d'enquête sur les antécédents de l'entreprise peut être automatiquement déclenché, conservé et pris en charge pour un examen manuel."
keywords: "NocoBase, employés IA, flux de travail, recherche sur les antécédents de l'entreprise, diligence raisonnable, automatisation, pratiques commerciales"
---

# Workflow + IA pour les employés afin de compléter l'automatisation de la recherche sur les antécédents de l'entreprise

Dans NocoBase, vous pouvez transformer la recherche sur les antécédents de l'entreprise en un flux de tâches automatisé et traçable. Le personnel commercial travaille toujours sur la page d'informations familière de l'entreprise, tandis que le personnel chargé du flux de travail et de l'IA est chargé de compléter les informations de base, d'enregistrer le processus de traitement et de sauvegarder chaque rapport généré.

![](https://static-docs.nocobase.com/202607121806356.png)

Ce scénario convient pour résoudre un problème courant : les informations générales sur l'entreprise ne sont pas un champ statique qui se termine après avoir été saisie une seule fois. L'information publique changera, des événements réglementaires se produiront et le statut de la coopération sera constamment ajusté à mesure que les affaires progressent. Si vous comptez uniquement sur un enregistrement supplémentaire manuel de façon régulière, il sera facile de le rater ; si vous laissez directement l'IA couvrir les informations de l'entreprise, il sera difficile d'expliquer « comment ce jugement a été obtenu ». L'approche ici consiste à séparer et à sauvegarder les données actuelles et le processus de recherche : le dossier de l'entreprise enregistre la version utilisée par le personnel de l'entreprise, et le dossier de vérification des antécédents enregistre le statut, le résultat et l'historique de chaque enquête IA.

## Regardons d'abord les deux tableaux

Le formulaire d'informations sur l'entreprise fournit les informations de base sur l'objet de recherche, et le formulaire de dossier d'enquête sur les antécédents est chargé d'entreprendre chaque tâche de recherche. L'un enregistre les informations actuellement disponibles et l'autre enregistre le processus de traitement et les résultats historiques.

### `companies` : Tableau d’informations sur la société

| Domaines principaux               | effet                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Company name           | Les principales informations d'identification de l'objet de recherche.                                   |
| Website                | Fournissez des indices sur le site officiel pour réduire les erreurs de jugement causées par des entreprises portant le même nom ou la même abréviation.                   |
| Address                | Aider à déterminer les régions, les entités et la portée de l'entreprise.                                 |
| Company type           | Marquez les relations commerciales telles que les clients, les fournisseurs, les partenaires, etc. pour faciliter le jugement ultérieur et les priorités de suivi. |
| Background information | Enregistrez le rapport d'information sur l'entreprise que vous utilisez actuellement et utilisez Markdown pour afficher le contenu structuré. |

### `background_check_tasks` : Formulaire d'enregistrement de vérification des antécédents

| Domaines principaux                  | effet                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Company ID / Company name | Enregistrez à quelle entreprise cette enquête est destinée pour faciliter l’exécution des tâches et l’examen historique.                                 |
| Status                    | Le flux des tâches de marquage de `pending` vers `processing` et `completed` constitue également la base pour éviter les déclenchements répétés. |
| Research report           | Enregistrez cette fois le rapport de recherche complet généré par l’IA.                                                   |
| Summary                   | Enregistrez le résumé d'IA du processus de recherche, les points de risque et les informations à compléter.                                     |
| Previous background       | Enregistrez l'ancienne version avant de réécrire, en prenant en charge le suivi historique et la comparaison des anciens et des nouveaux rapports.                                   |

![](https://static-docs.nocobase.com/202607121807627.png)

## Entrez le processus de recherche à partir des informations sur l'entreprise

La liste des entreprises est l’entrée la plus familière pour les hommes d’affaires. Vous pouvez voir le nom de l'entreprise, le site Web officiel, le type d'entreprise, la personne de contact, l'e-mail et d'autres informations sur la page. Après avoir pénétré dans une entreprise, le personnel de l'entreprise peut consulter le rapport d'antécédents actuel ou lancer une nouvelle enquête sur les antécédents.

Après avoir accédé à la page d'édition, les « Informations générales » sont affichées à l'aide du composant d'édition Markdown. Le contenu généré par l’IA n’est pas un bref résumé, mais un rapport structuré qui peut être lu, copié et continué à être maintenu. Le personnel de l'entreprise peut toujours le modifier manuellement, mais chaque résultat généré par l'IA laissera un historique correspondant dans l'enregistrement de vérification des antécédents.

![](https://static-docs.nocobase.com/202607121807450.png)

De cette façon, la page ressemble toujours à une interface ordinaire de maintenance des données d'entreprise, et la méthode de traitement sous-jacente est devenue « données actuelles + historique de recherche ». La table des entreprises enregistre la version actuelle et la table des tâches enregistre la chaîne de processus et de preuves.

## Trois méthodes de déclenchement

![](https://static-docs.nocobase.com/202607121807495.png)

La recherche de fond ne doit pas uniquement reposer sur un bouton manuel. Dans les affaires réelles, vous souhaiterez peut-être compléter automatiquement les informations après avoir ajouté une nouvelle entreprise, vous devrez peut-être également constituer régulièrement des enregistrements historiques et vous pouvez également prendre l'initiative de ré-enquêter avant de signer un contrat ou de le réviser.

Le workflow `New company background check` gère la recherche automatique après l'ajout ou la mise à jour d'une entreprise. Il écoute les événements de données de la table de la société et est déclenché lorsque le nom de la société existe et que les informations de base sont vides. L'IA ne sera pas appelée immédiatement après le déclenchement, mais vérifiera d'abord s'il existe des tâches inachevées pour la même entreprise ; sinon, un nouvel enregistrement de vérification des antécédents sera créé.

![](https://static-docs.nocobase.com/202607121807374.png)

Le flux de travail `Timing company background check` est responsable de la complétion continue des données historiques. Il s'exécute toutes les 30 minutes, interroge les entreprises dont les informations générales sont encore vides et parcourt les lots. Dans la boucle, nous vérifions également si la tâche existe déjà, puis décidons s'il convient de créer une nouvelle tâche. De cette manière, la tâche planifiée peut être exécutée de manière répétée sans créer plusieurs enregistrements traités simultanément en raison d'analyses répétées.

![](https://static-docs.nocobase.com/202607121807404.png)

Le flux de travail `Manual company background check` est lié au bouton « Exécuter la vérification des antécédents » sur la page de détails de l'entreprise, qui permet au personnel de l'entreprise de lancer de manière proactive une enquête avant de visiter, de signer un contrat ou de réviser. Le déclenchement manuel et le déclenchement automatique utilisent le même ensemble de liens de suivi : un enregistrement de vérification des antécédents est d'abord créé, puis le workflow d'exécution des tâches prend en charge l'enquête de l'IA.

![](https://static-docs.nocobase.com/202607121807793.png)

Ces trois entrées résolvent des problèmes à différents moments et sont finalement fusionnées dans le même formulaire de dossier d'enquête sur les antécédents. Les nouveaux déclencheurs, les déclencheurs planifiés et les déclencheurs manuels sont uniquement responsables de l'enregistrement du « besoin d'enquêter », et l'exécution spécifique, la gestion du statut et la réécriture des résultats sont transmises aux flux de travail suivants pour un traitement unifié.

## Transformez la recherche en IA en tâches

`Do company background check` est le flux de travail qui effectue réellement la recherche. Il écoute l'enregistrement `pending` dans la table des enregistrements de vérification des antécédents. Une fois que le processus automatique, planifié ou manuel précédent crée une tâche, ce workflow sera déclenché de manière asynchrone.

Une fois exécuté, le workflow demande d'abord si l'entreprise existe toujours. Si l'entreprise n'existe pas, la tâche sera clôturée et la description sera rédigée ; si l'entreprise existe, le statut de la tâche passera à `processing`, puis l'employé AI sera appelé pour générer le rapport. Le mot d'ordre de l'employé d'IA nécessite la sortie de deux parties : un rapport Markdown qui peut être écrit directement dans le champ d'arrière-plan de l'entreprise et un résumé pour examen manuel.

![](https://static-docs.nocobase.com/202607121808833.png)

Une fois que l'IA a renvoyé des résultats structurés, le flux de travail écrit d'abord le rapport, le résumé et l'ancien contenu d'arrière-plan dans l'enregistrement de vérification des antécédents, puis réécrit le nouveau rapport dans l'enregistrement de l'entreprise. Cet ordre évite le problème « uniquement les derniers résultats, aucun enregistrement de processus » : la page d'entreprise conserve le dernier contenu disponible, et les enregistrements de tâches conservent le contexte avant cette génération et cette réécriture.

![](https://static-docs.nocobase.com/202607121808662.png)

Après l'attribution des tâches, le traitement par lots deviendra également plus naturel. Le flux de travail planifié n'a pas besoin d'attendre la fin des recherches de chaque entreprise, mais est uniquement responsable de la création de plusieurs enregistrements à traiter ; chaque enregistrement déclenche indépendamment l'enquête IA. Plusieurs entreprises peuvent avancer en parallèle, et si une certaine tâche échoue ou expire, les autres entreprises ne seront pas bloquées.

## Rendre les résultats de l'IA révisables

Les rapports générés par l'IA sont organisés selon une structure fixe : profil de l'entreprise, activité principale, historique de développement et contexte financier, position sur le marché et perspective concurrentielle, jugement de suivi des ventes et liens de citation. Le personnel commercial peut voir non seulement la « conclusion », mais également les conseils sur les risques et les informations supplémentaires fournies par l'IA dans le résumé.

La page de détails du dossier d'enquête sur les antécédents affiche « Rapport de recherche » et « Antécédents précédents » dans les onglets et propose une opération « Copier ». De cette façon, vous pouvez copier rapidement ce rapport lors d'une discussion, d'une révision ou d'une communication externe, et vous pouvez également vérifier les modifications par rapport à l'ancienne version.

Les détails de l'enregistrement configurent également deux tâches de travail IA. dans:

- Améliorez le rapport de recherche de fond : régénérez le rapport après avoir ajouté des informations via le dialogue et réécrivez les résultats dans les archives de l'entreprise.
- Comparez les anciens et les nouveaux rapports de recherche de base : lisez les anciens et les nouveaux rapports et laissez l'IA expliquer les différences substantielles provoquées par cette mise à jour.

Cela permet à l’IA de ne pas s’arrêter à « générer du texte une fois » mais de participer au processus de maintenance continue, de révision et de comparaison de versions.

![](https://static-docs.nocobase.com/202607121808444.png)

## Comment combiner le flux de travail

Globalement, cet ensemble de flux de travail peut être divisé en quatre couches.

La première couche est responsable de la création des tâches. `New company background check` est destiné aux entreprises nouvellement ajoutées ou mises à jour, `Timing company background check` est destiné à la complétion des données historiques et `Manual company background check` est destiné à l'initiative manuelle. Ils vérifieront tous s'il existe des enregistrements inachevés avant de créer une tâche, réduisant ainsi le traitement en double à partir de la source.

La deuxième couche est responsable de l'exécution des tâches. `Do company background check` écoute l'enregistrement de vérification des antécédents, avance la tâche en attente au traitement, appelle l'employé d'IA et rédige le rapport, le résumé et les champs d'antécédents actuels de l'entreprise une fois terminé.

La troisième couche est chargée de fournir des capacités de réécriture contrôlée aux employés d’IA. En tant que flux de travail basé sur des outils, `Update company background` restreint l'IA à écrire uniquement les enregistrements spécifiés selon des paramètres clairs afin d'éviter de surcharger les autorisations de modification des données.

La quatrième couche est responsable du nettoyage exceptionnel. `Clean overtime processing background check` s'exécute toutes les 30 minutes pour nettoyer les tâches non terminées qui n'ont pas été terminées depuis plus de 15 minutes afin d'éviter un traitement à long terme des tâches après une interruption anormale.

![](https://static-docs.nocobase.com/202607121808799.png)

## Vers quels scénarios peut-on migrer ?

Ce que montre cette scène n'est pas une forme isolée ou un bouton IA séparé, mais une combinaison de plusieurs fonctionnalités de NocoBase : la table de données est responsable du transport des objets métier et des enregistrements historiques, la page est responsable de l'affichage et du déclenchement par le personnel de l'entreprise, le flux de travail est responsable de la planification et de la réécriture, et le personnel de l'IA est responsable de la génération de résultats structurés révisables.

Des modèles similaires peuvent être migrés vers des scénarios tels que l'admission des fournisseurs, la diligence raisonnable des clients, l'examen préliminaire des risques contractuels, la notation de la qualité des prospects, le suivi de l'opinion publique et la sélection préliminaire des objectifs d'investissement et de financement. Tant qu'il existe plusieurs exigences dans l'entreprise telles que « les données doivent être complétées en permanence », « les résultats de l'IA doivent être laissés de côté » et « les versions historiques ne peuvent pas être écrasées », un processus automatisé exécutable, traçable et évolutif peut être construit de la même manière.

## Documentation de référence

- [Flux de travail NocoBase](/workflow/)
- [Employé NocoBase AI](/ai-employees/)
- [Nœud employé NocoBase Workflow AI ](/ai-employees/workflow/nodes/employee/configuration)
- [Outil de personnalisation des employés NocoBase AI ](/ai-employees/features/tools)
