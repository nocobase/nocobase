export interface RecordOptionsV3<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: RecordV3<ParentDataType>;
  /**
   * 当前记录所属的 collection name
   */
  collectionName?: string;
}

export class RecordV3<DataType = {}, ParentDataType = {}> {
  public data?: DataType;
  public parentRecord?: RecordV3<ParentDataType>;
  public isNew?: boolean;
  /**
   * 当前记录所属的 collection name
   */
  public collectionName?: string;
  constructor(options: RecordOptionsV3<DataType, ParentDataType>) {
    const { data, parentRecord, isNew, collectionName } = options;
    this.isNew = isNew;
    this.data = data;
    this.parentRecord = parentRecord;
    this.collectionName = collectionName;
  }

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: RecordV3<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
