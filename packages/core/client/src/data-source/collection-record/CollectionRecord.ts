export interface CollectionRecordOptions<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: CollectionRecord<ParentDataType>;
}

export class CollectionRecord<DataType = {}, ParentDataType = {}> {
  public data?: DataType;
  public parentRecord?: CollectionRecord<ParentDataType>;
  public isNew?: boolean;
  constructor(options: CollectionRecordOptions<DataType, ParentDataType>) {
    const { data, parentRecord, isNew } = options;
    this.isNew = isNew;
    this.data = data;
    this.parentRecord = parentRecord;
  }

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: CollectionRecord<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
