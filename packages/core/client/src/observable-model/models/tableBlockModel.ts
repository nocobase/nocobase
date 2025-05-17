import { DataBlockModel } from './dataBlockModel';
import { IModelComponentProps } from './baseModel';
import { ActionModel } from './actionModel';
import { observable } from '@formily/reactive';
import { ArrayResource } from '../resources/arrayResource';

// TODO: 未完成

export class TableBlockModel<TData = any> extends DataBlockModel {
  public rowActions: Map<string, ActionModel>;
  declare public resource: ArrayResource<TData>;

  constructor(uid: string, defaultProps?: IModelComponentProps, resource?: ArrayResource<TData>) {
    super(uid, defaultProps, resource);
    this.rowActions = observable(new Map<string, ActionModel>());
  }

  setRowActions(actions: ActionModel[]) {
    this.rowActions.clear();
    actions.forEach(action => this.rowActions.set(action.uid, action));
  }

  addRowAction(action: ActionModel) {
    this.rowActions.set(action.uid, action);
  }

  getRowAction(uid: string): ActionModel | undefined {
    return this.rowActions.get(uid);
  }

  removeRowAction(uid: string): boolean {
    return this.rowActions.delete(uid);
  }

  getRowActions(): ActionModel[] {
    return Array.from(this.rowActions.values());
  }

  async reload(): Promise<any[] | null> {
    return this.resource.reload();
  }

  async reset(): Promise<any[] | null> {
    this.resource.pagination.page = 1;
    this.resource.filter = {};
    this.resource.sort = [];
    return this.resource.load();
  }

  async applyFilter(filter: Record<string, any>): Promise<any[] | null> {
    this.resource.setFilter(filter);
    return this.resource.load();
  }

  async applySort(field: string, direction: 'asc' | 'desc'): Promise<any[] | null> {
    this.resource.setSort({
      field,
      direction
    });
    return this.resource.load();
  }

  getSelectedRows(): any[] {
    return this.props.selectedRows || [];
  }

  setSelectedRows(rows: any[]): void {
    this.setProps('selectedRows', rows);
  }

  getData(): any[] | null {
    return this.resource.data;
  }

  getProps() {
    return {
      ...super.getProps(),
      dataSource: this.resource.data || [],
      pagination: {
        current: this.resource.pagination.page,
        pageSize: this.resource.pagination.pageSize,
        total: this.resource.pagination.total,
        onChange: (page: number, pageSize?: number) => {
          this.resource.setPagination(page, pageSize);
          this.resource.load();
        },
        onShowSizeChange: (_: number, size: number) => {
          this.resource.setPageSize(size);
          this.resource.load();
        }
      },
      selectedRows: this.getSelectedRows(),
      onSelectRow: (row: any) => {
        this.setSelectedRows([row]);
      },
      actions: this.actions,
      fields: this.fields,
    };
  }
} 