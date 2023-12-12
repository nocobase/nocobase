export interface RecordOptions<DataType = {}, ParentDataType = {}> {
  data?: DataType;
  parentRecord?: RecordV2<ParentDataType>;
}

export class RecordV2<DataType = {}, ParentDataType = {}> {
  public data?: DataType;
  public parentRecord?: RecordV2<ParentDataType>;
  constructor(options: RecordOptions<DataType, ParentDataType>) {
    const { data, parentRecord } = options;
    this.data = data;
    this.parentRecord = parentRecord;
  }

  setParentRecord(parentRecord: RecordV2<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
