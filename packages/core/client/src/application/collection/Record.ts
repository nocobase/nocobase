export interface RecordOptions<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: RecordV2<ParentDataType>;
  /**
   * 当前记录所属的 collection name
   */
  collectionName?: string;
}

export class RecordV2<DataType = {}, ParentDataType = {}> {
  public data?: DataType;
  public parentRecord?: RecordV2<ParentDataType>;
  public isNew?: boolean;
  /**
   * 当前记录所属的 collection name
   */
  public collectionName?: string;
  constructor(options: RecordOptions<DataType, ParentDataType>) {
    const { data, parentRecord, isNew, collectionName } = options;
    this.isNew = isNew;
    this.data = data;
    this.parentRecord = parentRecord;
    this.collectionName = collectionName;
  }

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: RecordV2<ParentDataType>) {
    this.parentRecord = parentRecord;
  }

  isEmpty() {
    return !this.data;
  }
}
