import inquirer from 'inquirer';
import { CollectionGroup } from '@nocobase/database';

export default class InquireQuestionBuilder {
  static buildInquirerDataTypeQuestions(options: { direction: 'dump' | 'restore'; dataTypes?: Set<string> }) {
    const choices: any = [
      {
        name: 'meta data',
        value: 'meta',
        checked: true,
        disabled: true,
      },
    ];

    if (options.direction === 'dump') {
      choices.push({
        name: 'config data',
        value: 'config',
        checked: true,
      });
      choices.push({
        name: 'business data',
        value: 'business',
        checked: true,
      });
    }

    if (options.direction === 'restore') {
      if (options.dataTypes.has('config')) {
        choices.push({
          name: 'config data',
          value: 'config',
          checked: true,
        });
      }

      if (options.dataTypes.has('business')) {
        choices.push({
          name: 'business data',
          value: 'business',
          checked: true,
        });
      }
    }

    return {
      type: 'checkbox',
      name: 'dataTypes',
      message:
        options.direction === 'dump' ? 'Select the data types to be dumped' : 'Select the data types to be restored',
      loop: false,
      pageSize: 20,
      choices,
    };
  }

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
