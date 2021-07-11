import { BaseModel } from '../models';

export default async function (model: BaseModel) {
  model.generateNameIfNull();
}
