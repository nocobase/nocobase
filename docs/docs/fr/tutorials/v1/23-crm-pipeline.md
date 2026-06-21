# Visualisation du pipeline de vente CRM

## 1. Introduction

### 1.1 Préambule

Ce chapitre est la deuxième partie de la série de tutoriels [Comment mettre en place la conversion de leads CRM dans NocoBase](https://www.nocobase.com/cn/tutorials/how-to-implement-lead-conversion-in-nocobase). Dans le chapitre précédent, nous avons couvert les bases de la conversion de leads, notamment la création des collections nécessaires, la configuration des pages de gestion et la mise en œuvre de la conversion d'un lead en société, contact et opportunité. Ce chapitre se concentre sur le suivi des leads et la gestion des statuts.

🎉 [La solution CRM de NocoBase est officiellement en ligne, n'hésitez pas à l'essayer !](https://www.nocobase.com/cn/blog/crm-solution)

### 1.2 Objectifs du chapitre

Dans ce chapitre, nous allons apprendre à mettre en œuvre dans NocoBase la conversion de leads CRM. Grâce au suivi de leads et à la gestion des statuts, vous gagnerez en efficacité métier et obtiendrez un contrôle plus fin du processus commercial.

### 1.3 Aperçu du résultat final

Dans le chapitre précédent, nous avons vu comment gérer la relation entre les leads, les sociétés, les contacts et les opportunités. Nous nous concentrons ici sur le module Leads, en abordant le suivi et la gestion des statuts. Regardez d'abord l'exemple suivant :
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Description de la structure de la collection Lead

### 2.1 Présentation de la collection Lead

Dans la fonctionnalité de suivi des leads, le champ « status » joue un rôle essentiel : il reflète l'avancement du lead (non qualifié, nouveau, en cours, à entretenir, en négociation, terminé) et conditionne l'affichage et l'évolution de l'ensemble du formulaire. Le table block ci-dessous présente la structure des champs de la collection Lead :


| Field name     | Nom d'affichage du champ | Field interface  | Description                                                                                              |
| -------------- | ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------- |
| id             | **Id**                   | Integer          | Clé primaire                                                                                             |
| account_id     | **account_id**           | Integer          | Clé étrangère vers la table société ACCOUNT                                                              |
| contact_id     | **contact_id**           | Integer          | Clé étrangère vers la table contact CONTACT                                                              |
| opportunity_id | **opportunity_id**       | Integer          | Clé étrangère vers la table opportunité OPPORTUNITY                                                      |
| name           | **Nom du lead**          | Single line text | Nom du prospect                                                                                          |
| company        | **Société**              | Single line text | Nom de l'entreprise du prospect                                                                          |
| email          | **E-mail**               | Email            | Adresse e-mail du prospect                                                                               |
| phone          | **Téléphone**            | Phone            | Téléphone de contact                                                                                     |
| status         | **Statut**               | Single select    | Statut actuel du lead, par défaut « non qualifié » (non qualifié, nouveau, en cours, à entretenir, en négociation, terminé) |
| Account        | **Société**              | Many to one      | Lié à la société                                                                                         |
| Contact        | **Contact**              | Many to one      | Lié au contact                                                                                           |
| Opportunity    | **Opportunité**          | Many to one      | Lié à l'opportunité                                                                                      |

## 3. Créer un table block Leads et un bloc Détail

### 3.1 Description

Tout d'abord, créons un table block « Leads » pour afficher les champs nécessaires. En parallèle, configurons un bloc Détail à droite de la page : lorsque vous cliquez sur un enregistrement, les détails correspondants s'affichent automatiquement à droite. Voir la configuration ci-dessous :
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Configurer les boutons d'action

### 4.1 Vue d'ensemble des boutons

Pour répondre aux différents besoins, nous devons créer 10 boutons au total. Chaque bouton est affiché différemment (masqué, activé, désactivé) selon le statut de l'enregistrement, afin de guider l'utilisateur dans le bon flux métier.
![20250311083825](https://static-docs.nocobase.com/20250311083825.png)

### 4.2 Configuration détaillée des boutons


| Bouton                              | Style                                                | Action                                                              | Règle de liaison                                                                                                |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Bouton Modifier                     | Action d'édition                                     | —                                                                  | Désactivé automatiquement lorsque le statut vaut « Completed » (terminé), pour empêcher des modifications inutiles. |
| Bouton Non qualifié (état activé)   | « Unqualified > »                                    | Passe le statut à « Unqualified ».                                  | Affiché par défaut ; désactivé lorsque le statut vaut « Completed ».                                            |
| Bouton Nouveau lead (non activé)    | Action de mise à jour, « New > »                     | Passe le statut à « New », puis affiche le message « New ».         | Masqué si le statut n'est pas « Unqualified » (autrement dit, l'enregistrement est déjà à un statut ultérieur, donc l'état activé). |
| Bouton Nouveau lead (état activé)   | Action de mise à jour, « New > »                     | Passe le statut à « New ».                                          | Masqué lorsque le statut vaut « Unqualified » ; désactivé lorsque le statut vaut « Completed ».                 |
| Bouton En cours (non activé)        | Action de mise à jour, « Working > »                 | Passe le statut à « Working », puis affiche le message « Working ». | Masqué tant que le statut n'est pas « Unqualified » ou « New ».                                                 |
| Bouton En cours (état activé)       | Action de mise à jour, « Working > »                 | Passe le statut à « Working ».                                      | Masqué lorsque le statut vaut « Unqualified » ou « New » ; désactivé lorsque le statut vaut « Completed ».      |
| Bouton À entretenir (non activé)    | Action de mise à jour, « Nurturing > »               | Passe le statut à « Nurturing », puis affiche le message « Nurturing ». | Masqué tant que le statut n'est pas « Unqualified », « New » ou « Working ».                                    |
| Bouton À entretenir (état activé)   | Action de mise à jour, « Nurturing > »               | Passe le statut à « Nurturing ».                                    | Masqué lorsque le statut vaut « Unqualified », « New » ou « Working » ; désactivé lorsque le statut vaut « Completed ». |
| Bouton Convertir                    | Action d'édition, « transfer », icône « √ »          | Ouvre le formulaire de conversion ; à la soumission, passe le statut à « Completed ». | Masqué lorsque le statut vaut « Completed », pour empêcher une conversion en double.                            |
| Bouton Conversion terminée (état activé) | Action d'affichage, « transfered », icône « √ »    | Sert uniquement à afficher les informations après conversion ; sans fonction d'édition. | Affiché uniquement lorsque le statut vaut « Completed » ; masqué dans les autres états.                         |

- Exemple de règle de liaison :
  En cours (non activé)
  ![20250311084104](https://static-docs.nocobase.com/20250311084104.png)
  En cours (activé)
  ![20250311083953](https://static-docs.nocobase.com/20250311083953.png)
- Formulaire de conversion :
  Bouton Convertir (non activé)
  ![](https://static-docs.nocobase.com/20250226094223.png)
  Bouton Convertir (activé)
  ![](https://static-docs.nocobase.com/20250226094203.png)
- Message à la soumission de la conversion :
  ![20250311084638](https://static-docs.nocobase.com/20250311084638.png)

### 4.3 Synthèse de la configuration des boutons

- Chaque fonctionnalité dispose d'un bouton dans un état non activé et dans un état activé.
- Grâce aux règles de liaison, l'affichage des boutons (masqué ou désactivé) est piloté dynamiquement par le statut de l'enregistrement, pour guider le commercial dans le bon flux de travail.

## 5. Règles de liaison du formulaire

### 5.1 Règle 1 : afficher uniquement le nom

- Tant que l'enregistrement n'est pas confirmé, on n'affiche que le nom.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Règle 2 : optimiser l'affichage en statut « Nouveau lead »

- Lorsque le statut vaut « Nouveau lead », on masque le nom de la société et on affiche les coordonnées.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Règles Markdown et syntaxe Handlebars

### 6.1 Affichage de texte dynamique

Sur la page, nous utilisons la syntaxe Handlebars pour afficher dynamiquement des messages selon le statut de l'enregistrement. Voici des exemples de code pour chaque statut :

Lorsque le statut vaut « Non qualifié » :

```markdown
{{#if (eq $nRecord.status "未达标")}}
**Suivez les informations relatives à vos leads non qualifiés.**  
Si votre lead n'est pas intéressé par le produit ou a quitté la société concernée, il peut être considéré comme non qualifié.  
- Notez les enseignements à retenir pour plus tard  
- Conservez les détails de la prise de contact et les coordonnées  
{{/if}}
```

Lorsque le statut vaut « Nouveau lead » :

```markdown
{{#if (eq $nRecord.status "新线索")}}
**Collectez davantage d'informations sur ce lead.**  
- Comprenez les besoins et les centres d'intérêt du prospect
- Rassemblez les coordonnées de base et le contexte de l'entreprise
- Déterminez la priorité et la manière de poursuivre le suivi
{{/if}}
```

Lorsque le statut vaut « En cours » :

```markdown
{{#if (eq $nRecord.status "处理中")}}
**Prenez l'initiative du contact et évaluez les besoins.**  
- Établissez le contact par téléphone ou par e-mail
- Identifiez les problèmes et défis rencontrés par le client
- Évaluez la cohérence entre les besoins du client et vos produits/services
{{/if}}
```

Lorsque le statut vaut « À entretenir » :

```markdown
{{#if (eq $nRecord.status "跟进中")}}
**Approfondissez les besoins du client et entretenez la relation.**  
- Fournissez la documentation produit et des suggestions de solutions
- Répondez aux questions et levez les doutes
- Évaluez la probabilité de conversion
{{/if}}
```

Lorsque le statut vaut « Conversion terminée » :

```markdown
{{#if (eq $nRecord.status "转化完成")}}
**Le lead a été converti en client.**  
- Vérifiez la création des fiches Société et Contact correspondantes
- Créez la fiche Opportunité et planifiez le suivi
- Transmettez les documents et l'historique au commercial responsable
{{/if}}
```

## 7. Afficher les objets associés et les liens après conversion

### 7.1 Description des objets associés

Une fois la conversion terminée, nous voulons afficher les objets associés (société, contact, opportunité) avec un lien direct vers leur page de détail.
À ce moment-là, prenez n'importe quelle fenêtre de détail, par exemple celle de la société, et copiez le lien.
![20250311085502](https://static-docs.nocobase.com/20250311085502.png)
Note : dans les autres fenêtres ou pages, la dernière partie du lien de détail (le nombre après filterbytk) représente l'identifiant de l'objet courant, par exemple :

```text
{Base URL}/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{id}
```

### 7.2 Générer les liens associés avec Handlebars

Société :

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Société :**
[{{$nRecord.account.name}}](w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Contact :

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Contact :**
[{{$nRecord.contact.name}}](1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Opportunité :

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Opportunité :**
[{{$nRecord.opportunity.name}}](si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Masquer les objets associés tout en conservant la valeur

Pour assurer l'affichage correct des informations associées après conversion, vous devez régler le statut des champs « Société », « Contact » et « Opportunité » sur « Masqué (conserver la valeur) ». Ainsi, ces champs ne sont pas affichés dans le formulaire, mais leur valeur reste enregistrée et transmise.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Empêcher la modification du statut après conversion

Pour éviter une modification accidentelle du statut après la conversion, ajoutez à tous les boutons une condition : lorsque le statut vaut « Terminé », tous les boutons sont désactivés.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Conclusion

Une fois toutes ces étapes terminées, votre fonctionnalité de suivi et de conversion des leads est prête ! Avec les explications pas à pas de ce chapitre, vous comprenez mieux comment fonctionne, dans NocoBase, la liaison entre statut et formulaire. Bonne continuation et bon usage !
