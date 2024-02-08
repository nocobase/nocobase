export interface RecordOptionsV2<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: RecordV2<ParentDataType>;
}

export class RecordV2<DataType = {}, ParentDataType = {}> {
  public data?: DataType;
  public parentRecord?: RecordV2<ParentDataType>;
  public isNew?: boolean;
  constructor(options: RecordOptionsV2<DataType, ParentDataType>) {
    const { data, parentRecord, isNew } = options;
    this.isNew = isNew;
    this.data = data;
    this.parentRecord = parentRecord;
  }

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: RecordV2<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
