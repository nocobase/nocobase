
import { DataBlockModel } from './dataBlockModel';
import { ArrayResource } from '../resources/arrayResource';
import { IModelComponentProps } from './baseModel';

// TODO: 未完成

export class TableBlockModel<TDataItem = any> extends DataBlockModel {
  public resource: ArrayResource<TDataItem>;

  constructor(
    uid: string,
    initialProps: IModelComponentProps = {},
    initialResource?: ArrayResource<TDataItem>
  ) {
    super(uid, initialProps);
    this.resource = initialResource || new ArrayResource<TDataItem>();
  }

  async reload(): Promise<TDataItem[] | null> {
    return this.resource.reload();
  }

  async reset(): Promise<TDataItem[] | null> {
    this.resource.pagination.page = 1;
    this.resource.filter = {};
    this.resource.sort = [];
    return this.resource.load();
  }

  async applyFilter(filter: Record<string, any>): Promise<TDataItem[] | null> {
    this.resource.setFilter(filter);
    return this.resource.load();
  }

  async applySort(field: string, direction: 'asc' | 'desc'): Promise<TDataItem[] | null> {
    this.resource.setSort({
      field,
      direction
    });
    return this.resource.load();
  }

  getSelectedRows(): TDataItem[] {
    return this.props.selectedRows || [];
  }

  setSelectedRows(rows: TDataItem[]): void {
    this.setProps('selectedRows', rows);
  }

  getData(): TDataItem[] | null {
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
      onSelectRow: (row: TDataItem) => {
        this.setSelectedRows([row]);
      },
      actions: this.actions,
      fields: this.fields,
    };
  }
} 