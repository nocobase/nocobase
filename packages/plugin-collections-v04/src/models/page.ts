import _ from 'lodash';
import BaseModel from './base';
import { SaveOptions, Op } from 'sequelize';

interface PageImportOptions extends SaveOptions {
  parentId?: number;
}

/**
 * 暂时放在这里
 */
export class PageModel extends BaseModel {
  static async import(items: any, options: PageImportOptions = {}): Promise<any> {
    const { parentId } = options;
    if (!Array.isArray(items)) {
      items = [items];
    }
    for (const item of items) {
      let page = await this.findOne({
        ...options,
        where: {
          path: item.path,
        },
      });
      if (!page) {
        page = await this.create(
          {
            ...item,
            parent_id: parentId,
          },
          // @ts-ignore
          options
        );
      }
      if (Array.isArray(item.children)) {
        await this.import(item.children, {
          ...options,
          parentId: page.id,
        });
      }
    }
  }
}
