export default interface IStorage {
  options: any;

  put: (file, data) => Promise<any>
}
