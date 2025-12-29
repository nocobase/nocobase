import S3Storage from '../../storages/s3';

describe('S3 Storage URL Generation', () => {
  it('should generate URL correctly for standard AWS S3 (virtual host)', () => {
    const storage = new S3Storage({
      options: {
        bucket: 'my-bucket',
        region: 'us-east-1',
      },
      baseUrl: 'https://my-bucket.s3.us-east-1.amazonaws.com',
      path: 'uploads',
    } as any);

    const file = {
      filename: 'image.png',
      path: 'uploads',
    } as any;

    const url = storage.getFileURL(file);
    expect(url).toBe('https://my-bucket.s3.us-east-1.amazonaws.com/uploads/image.png');
  });

  it('should generate URL correctly for Path Style (e.g. MinIO) when bucket is missing in baseUrl', () => {
    const storage = new S3Storage({
      options: {
        bucket: 'my-bucket',
        endpoint: 'http://localhost:9000',
      },
      baseUrl: 'http://localhost:9000',
      path: 'uploads',
    } as any);

    const file = {
      filename: 'image.png',
      path: 'uploads',
    } as any;

    const url = storage.getFileURL(file);
    expect(url).toBe('http://localhost:9000/my-bucket/uploads/image.png');
  });

  it('should generate URL correctly for Path Style when bucket is already in baseUrl', () => {
    const storage = new S3Storage({
      options: {
        bucket: 'my-bucket',
        endpoint: 'http://localhost:9000',
      },
      baseUrl: 'http://localhost:9000/my-bucket',
      path: 'uploads',
    } as any);

    const file = {
      filename: 'image.png',
      path: 'uploads',
    } as any;

    const url = storage.getFileURL(file);
    expect(url).toBe('http://localhost:9000/my-bucket/uploads/image.png');
  });

  it('should generate URL correctly when baseUrl is undefined (Path Style)', () => {
    const storage = new S3Storage({
      options: {
        bucket: 'my-bucket',
        endpoint: 'http://localhost:9000',
      },
      // baseUrl undefined
      path: 'uploads',
    } as any);

    const file = {
      filename: 'image.png',
      path: 'uploads',
    } as any;

    const url = storage.getFileURL(file);
    // urlJoin will join bucket/path/filename
    expect(url).toBe('my-bucket/uploads/image.png');
  });
});
