# Suivi de leads et gestion des statuts

## 1. Introduction

### 1.1 Objectifs du chapitre

Dans ce chapitre, nous allons découvrir comment mettre en place dans NocoBase la conversion d'opportunités CRM. Grâce au suivi des leads et à la gestion des statuts, vous gagnerez en efficacité et obtiendrez un contrôle plus fin du processus commercial.

### 1.2 Aperçu du résultat final

Dans le chapitre précédent, nous avons vu comment gérer la relation entre les leads, les sociétés, les contacts et les opportunités. Ici, nous nous concentrons sur le module Leads, en abordant principalement le suivi et la gestion des statuts. Regardez d'abord l'exemple suivant :
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Description de la structure de la collection Lead

### 2.1 Présentation de la collection Lead

Dans la fonctionnalité de suivi des leads, le champ « status » joue un rôle essentiel : il reflète l'avancement du lead (non qualifié, nouveau, en cours, à entretenir, en négociation, terminé) et conditionne aussi l'affichage et l'évolution de l'ensemble du formulaire. Le table block ci-dessous présente la structure des champs de la collection Lead :


| Field name     | Nom d'affichage du champ | Field interface  | Description                                                                                |
| -------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------------------------ |
| id             | **Id**                   | Integer          | Clé primaire                                                                               |
| account_id     | **account_id**           | Integer          | Clé étrangère ACCOUNT                                                                      |
| contact_id     | **contact_id**           | Integer          | Clé étrangère CONTACT                                                                      |
| opportunity_id | **opportunity_id**       | Integer          | Clé étrangère OPPORTUNITY                                                                  |
| name           | **Nom du lead**          | Single line text | Nom du prospect                                                                            |
| company        | **Société**              | Single line text | Nom de l'entreprise du prospect                                                            |
| email          | **E-mail**               | Email            | Adresse e-mail du prospect                                                                 |
| phone          | **Téléphone**            | Phone            | Téléphone de contact                                                                       |
| status         | **Statut**               | Single select    | Statut actuel du lead (non qualifié, nouveau, en cours, à entretenir, en négociation, terminé) |
| Account        | **Société**              | Many to one      | Lié à la collection Société                                                                |
| Contact        | **Contact**              | Many to one      | Lié à la collection Contact                                                                |
| Opportunity    | **Opportunité**          | Many to one      | Lié à la collection Opportunité                                                            |

## 3. Créer un table block Leads et un bloc Détail

### 3.1 Description

Tout d'abord, créons un table block « Leads » pour afficher les champs nécessaires. En parallèle, configurons un bloc Détail à droite de la page : lorsque vous cliquez sur un enregistrement, les détails correspondants s'affichent automatiquement à droite. Voir la configuration ci-dessous :
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Configurer les boutons d'action

### 4.1 Vue d'ensemble des boutons

Pour répondre aux différents besoins, nous devons créer 11 boutons au total. Chaque bouton est affiché différemment (masqué, activé, désactivé) selon le statut de l'enregistrement, afin de guider l'utilisateur dans le bon flux métier.
![20250226173632](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 Configuration détaillée de chaque bouton

#### 4.2.1 Bouton Modifier

- Règle de liaison : lorsque le statut de l'enregistrement vaut «Completed» (terminé), désactivez automatiquement ce bouton pour empêcher des modifications inutiles.

#### 4.2.2 Bouton Non qualifié 1 (non activé)

- Style : libellé «Unqualified >».
- Action : au clic, exécute une opération de mise à jour qui passe le statut à «Unqualified», puis revient à la page parente et affiche un message de réussite «Unqualified».
- Règle de liaison : ne s'affiche que lorsque le statut est vide ; dès qu'une valeur est définie, le bouton est masqué.

#### 4.2.3 Bouton Non qualifié 2 (état activé)

- Style : libellé «Unqualified >» également.
- Action : sert à passer le statut à «Unqualified».
- Règle de liaison : masqué lorsque le statut est vide ; désactivé lorsque le statut est «Completed».

#### 4.2.4 Bouton Nouveau lead 1 (non activé)

- Style : libellé «New >».
- Action : met à jour l'enregistrement en passant le statut à «New», puis affiche le message «New».
- Règle de liaison : masqué si le statut est «New», «Working», «Nurturing» ou «Completed».

#### 4.2.5 Bouton Nouveau lead 2 (état activé)

- Style : libellé «New >» également.
- Action : sert également à passer le statut à «New».
- Règle de liaison : masqué lorsque le statut est «Unqualified» ou vide ; désactivé lorsque le statut est «Completed».

#### 4.2.6 Bouton En cours (non activé)

- Style : libellé «Working >».
- Action : au clic, passe le statut à «Working» et affiche le message «Working».
- Règle de liaison : masqué si le statut est «Working», «Nurturing» ou «Completed».

#### 4.2.7 Bouton En cours (état activé)

- Style : libellé «Working >» également.
- Action : sert à passer le statut à «Working».
- Règle de liaison : masqué lorsque le statut est «Unqualified», «New» ou vide ; désactivé lorsque le statut est «Completed».

#### 4.2.8 Bouton À entretenir (non activé)

- Style : libellé «Nurturing >».
- Action : au clic, passe le statut à «Nurturing» et affiche le message «Nurturing».
- Règle de liaison : masqué si le statut est «Nurturing» ou «Completed».

#### 4.2.9 Bouton À entretenir (état activé)

- Style : libellé «Nurturing >» également.
- Action : sert également à passer le statut à «Nurturing».
- Règle de liaison : masqué lorsque le statut est «Unqualified», «New», «Working» ou vide ; désactivé lorsque le statut est «Completed».

#### 4.2.10 Bouton Convertir

- Style : libellé «transfer», ouvre une fenêtre modale.
- Action : sert principalement à exécuter la conversion. Après mise à jour, une interface contenant un drawer, des Tabs et un formulaire s'affiche, pour faciliter la conversion.
- Règle de liaison : masqué lorsque le statut vaut «Completed», pour éviter une conversion en double.
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 Bouton Conversion terminée (état activé)

- Style : libellé «transfered», également ouvert dans une fenêtre modale.
- Action : sert uniquement à afficher les informations après conversion ; sans fonction d'édition.
- Règle de liaison : ne s'affiche que lorsque le statut vaut «Completed» ; masqué dans les autres états («Unqualified», «New», «Working», «Nurturing» ou vide).
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 Synthèse de la configuration des boutons

- Chaque fonctionnalité dispose d'un bouton dans un état non activé et dans un état activé.
- Grâce aux règles de liaison, l'affichage des boutons (masqué ou désactivé) est piloté dynamiquement par le statut de l'enregistrement, pour guider le commercial dans le bon flux de travail.

## 5. Règles de liaison du formulaire

### 5.1 Règle 1 : afficher uniquement le nom

- Tant que l'enregistrement n'est pas confirmé, ou que le statut est vide, on n'affiche que le nom.
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
**Identifiez les produits ou services nécessaires pour cette opportunité.**  
- Rassemblez des cas clients, références ou analyses concurrentielles  
- Confirmez les principales parties prenantes  
- Déterminez les ressources disponibles  
{{/if}}
```

Lorsque le statut vaut « En cours » :

```markdown
{{#if (eq $nRecord.status "处理中")}}
**Présentez votre solution aux parties prenantes.**  
- Communiquez la valeur de la solution  
- Précisez le calendrier et le budget  
- Convenez avec le client du moment et de la manière de conclure  
{{/if}}
```

Lorsque le statut vaut « À entretenir » :

```markdown
{{#if (eq $nRecord.status "跟进中")}}
**Définissez le plan de mise en œuvre du projet client.**  
- Concluez les accords nécessaires  
- Suivez les processus internes de remise  
- Obtenez les contrats signés  
{{/if}}
```

Lorsque le statut vaut « Conversion terminée » :

```markdown
{{#if (eq $nRecord.status "转化完成")}}
**Confirmez le plan de mise en œuvre et les étapes finales.**  
- Assurez-vous que tous les accords et signatures restants sont en place  
- Suivez la politique interne de remise  
- Vérifiez que les contrats sont signés et que la mise en œuvre suit le plan  
{{/if}}
```

## 7. Afficher les objets associés et les liens après conversion

### 7.1 Description des objets associés

Une fois la conversion terminée, nous voulons afficher les objets associés (société, contact, opportunité) avec un lien vers leur page de détail. Note : dans les autres fenêtres ou pages, la dernière partie du lien de détail (le nombre après filterbytk) représente l'identifiant de l'objet courant, par exemple :

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 Générer les liens associés avec Handlebars

Pour la société :

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Pour le contact :

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Pour l'opportunité :

```markdown
{{#if (eq $nRecord.status "已完成")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
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
