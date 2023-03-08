import inquirer from 'inquirer';
import { CollectionGroup } from '@nocobase/database';

export default class InquireQuestionBuilder {
  static buildInquirerQuestions(options: {
    requiredGroups: CollectionGroup[];
    optionalGroups: CollectionGroup[];
    optionalCollections: {
      name: string;
      title: string;
    }[];
    direction: 'dump' | 'restore';
  }) {
    const { requiredGroups, optionalGroups, optionalCollections, direction } = options;
    const questions = [this.buildInquirerPluginQuestion(requiredGroups, optionalGroups, direction)];

    if (optionalCollections.length > 0) {
      questions.push(this.buildInquirerCollectionQuestion(optionalCollections, direction));
    }

    return questions;
  }

  static buildInquirerPluginQuestion(requiredGroups, optionalGroups, direction: 'dump' | 'restore') {
    return {
      type: 'checkbox',
      name: 'collectionGroups',
      message: `Select the plugin collections to be ${direction === 'dump' ? 'dumped' : 'restored'}`,
      loop: false,
      pageSize: 20,
      choices: [
        new inquirer.Separator('== Required =='),
        ...requiredGroups.map((collectionGroup) => ({
          name: `${collectionGroup.function} (${collectionGroup.namespace})`,
          value: `${collectionGroup.namespace}.${collectionGroup.function}`,
          checked: true,
          disabled: true,
        })),

        new inquirer.Separator('== Optional =='),
        ...optionalGroups.map((collectionGroup) => ({
          name: `${collectionGroup.function} (${collectionGroup.namespace})`,
          value: `${collectionGroup.namespace}.${collectionGroup.function}`,
          checked: direction === 'dump',
        })),
      ],
    };
  }

  static buildInquirerCollectionQuestion(
    collections: {
      name: string;
      title: string;
    }[],
    direction: 'dump' | 'restore',
  ) {
    return {
      type: 'checkbox',
      name: 'userCollections',
      message: `Select the collection records to be ${direction === 'dump' ? 'dumped' : 'restored'}`,
      loop: false,
      pageSize: 30,
      choices: collections.map((collection) => {
        return {
          name: collection.title,
          value: collection.name,
          checked: direction === 'dump',
        };
      }),
    };
  }
}
