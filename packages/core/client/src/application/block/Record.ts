export interface RecordOptions<CurrentType = {}, ParentType = {}> {
  current?: CurrentType;
  parentRecord?: RecordV2<ParentType>;
  isNew?: boolean;
}

export class RecordV2<CurrentType = {}, ParentType = {}> {
  public current?: CurrentType;
  public parentRecord?: RecordV2<ParentType>;
  public isNew = false;
  constructor(options: RecordOptions<CurrentType, ParentType>) {
    const { current, parentRecord, isNew } = options;
    this.current = current;
    this.parentRecord = parentRecord;
    this.isNew = isNew;
  }

  setParentRecord(parentRecord: RecordV2<ParentType>) {
    this.parentRecord = parentRecord;
  }
}
