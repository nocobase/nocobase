/**
 * Observable database behavior used by shared integration contracts.
 *
 * A profile describes behavior, not dialect ancestry. Two databases may share
 * a value here without sharing a driver or a SQL implementation.
 */
export interface DatabaseIntegrationProfile {
  readonly numeric: {
    readonly nativeResults: boolean;
    /** Whether create mutations can return inserted rows without a reload. */
    readonly supportsInsertReturning?: boolean;
    readonly nativeAggregates: boolean;
    readonly bigintAverage: 'rounded' | 'fractional';
    readonly exactProjection: 'toChar' | 'castChar' | 'castVarchar';
    readonly integerResults: 'number' | 'string';
    readonly bigintBinding: 'supported' | 'unsupported';
    readonly bigintRange: 'full' | 'limited';
    readonly storagePrecision: 'exact' | 'approximate';
  };
  readonly character: {
    readonly charRead: 'padded' | 'trimmed';
    readonly lengthUnit: 'characters' | 'bytes' | 'utf16CodeUnits' | 'none';
    readonly collation: boolean;
    readonly characterSet: boolean;
  };
  readonly temporal: {
    readonly precisionProbeType: string;
    readonly fixtureTypes: readonly [string, string, string, string];
    readonly logicalTypes: {
      readonly day: 'date' | 'datetime' | 'text';
      readonly time: 'time' | 'string' | 'text';
      readonly local: 'text' | 'datetime';
      readonly instant: 'text' | 'datetime' | 'datetimeTz';
    };
    readonly inspectorDataTypes: {
      readonly day: 'date' | 'datetime';
      readonly clock: 'time' | 'string';
      readonly instant: 'text' | 'datetimeTz';
    };
    readonly sessionTimezone:
      'setConfig' | 'setTimeZone' | 'alterSession' | 'unsupported';
    readonly instantFilterInput: 'date' | 'mysqlDateTime' | 'iso';
    readonly isoLiteralFilters: boolean;
    readonly instantPrimaryKey: boolean;
  };
  readonly schema: {
    readonly defaultSchema: string;
    readonly declareSchema: boolean;
    readonly supportsSchemas: boolean;
    readonly uniqueConstraints: boolean;
    readonly foreignKeyActions: {
      readonly onDelete: 'restrict' | 'noAction';
      readonly onUpdate: 'cascade' | 'noAction';
    };
    readonly uniqueConstraintDropKeepsIndex: boolean;
    readonly nativeTextType: string;
    /**
     * Whether a TEXT column keeps a default in the table. OceanBase rejects one in any form, so a text field's
     * `defaultValue` is applied by the Repository alone there. `supported` when omitted.
     */
    readonly textDefaults?: 'supported' | 'unsupported';
    /**
     * Whether an existing TEXT column can be redefined. Oracle refuses to MODIFY a CLOB column with its type restated
     * (ORA-22859), which is how Knex compiles every column alteration. `supported` when omitted.
     */
    readonly textAlterations?: 'supported' | 'unsupported';
    readonly comments: 'complete' | 'unsupported';
    readonly booleanStorage: 'native' | 'integer' | 'decimal';
    readonly emptyStringIsNull: boolean;
    readonly integerResolution: 'integer' | 'decimal';
    readonly scalarTypes: readonly [string, string, string, string, string];
    readonly scalarInspection: {
      readonly affinity?: {
        readonly fixed: string;
        readonly boolean: string;
      };
      readonly quantity: {
        readonly dataType: 'integer' | 'decimal';
        readonly integerBits?: number;
        readonly unsigned?: boolean;
        readonly precision?: number;
        readonly scale?: number;
      };
      readonly ratioDataType?: 'float';
      readonly nativeTypes?: {
        readonly fixed: string;
        readonly label: string;
      };
    };
  };
  readonly json: {
    readonly filters: 'supported' | 'unsupported';
    readonly defaults?: 'supported' | 'unsupported';
  };
}
