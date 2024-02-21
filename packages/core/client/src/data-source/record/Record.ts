export interface RecordOptions<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: Record<ParentDataType>;
}

export class Record<DataType = {}, ParentDataType = {}> {
  public data?: DataType;
  public parentRecord?: Record<ParentDataType>;
  public isNew?: boolean;
  constructor(options: RecordOptions<DataType, ParentDataType>) {
    const { data, parentRecord, isNew } = options;
    this.isNew = isNew;
    this.data = data;
    this.parentRecord = parentRecord;
  }

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: Record<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
