import { connect, mapReadPretty } from '@formily/react';
import { Upload } from '../upload/Upload';

export const Preview = connect(Upload.ReadPretty.File, mapReadPretty(Upload.ReadPretty.File));

export default Preview;
