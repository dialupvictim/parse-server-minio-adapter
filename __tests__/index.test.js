const Parse = require('parse/node');
const MinioAdapter = require('../index');

const minioConfig = {
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
};

const parseConfig = {
  appId: 'prof-card-backend',
  jsKey: '11c9d2576b7852d5cd92117043e24d49',
  serverURL: 'http://localhost:1337/parse',
};

describe('Create and connect', () => {
  test('Create', () => {
    const adapter = new MinioAdapter({});
    expect(adapter.bucketName).toBe('parse-server');
    expect(adapter.region).toBe('us-east-1');
    expect(adapter.hasBucket).toBeFalsy();
  });

  it('Fail to connect', () => {
    const adapter = new MinioAdapter({});
    expect.assertions(1);
    return adapter.makeBucket().catch(({ code }) => expect(code).toEqual('AccessDenied'));
  });

  it('Connect and create bucket', () => {
    const adapter = new MinioAdapter(minioConfig);
    expect.assertions(2);
    return adapter.makeBucket()
      .then((result) => {
        expect(result).toBeUndefined();
        expect(adapter.hasBucket).toBeTruthy();
      });
  });
});

describe('Create, read, delete', () => {
  const fileName = 'mytest';
  const dataString = 'I like testing minio. Мне нравится тестить минио';
  const data = Buffer.from(dataString);
  it('Create file', () => {
    expect.assertions(1);
    const adapter = new MinioAdapter(minioConfig);
    return adapter.createFile(fileName, data)
      .then((eTag) => expect(eTag).not.toBeUndefined());
  });

  it('Get file', () => {
    expect.assertions(1);
    const adapter = new MinioAdapter(minioConfig);
    return adapter.getFileData(fileName)
      .then((result) => expect(result.toString()).toEqual(dataString));
  });

  it('Delete file', () => {
    expect.assertions(1);
    const adapter = new MinioAdapter(minioConfig);
    return adapter.deleteFile(fileName)
      .then((result) => expect(result).toBeUndefined());
  });

  it('Get file URL', () => {
    const adapter = new MinioAdapter(minioConfig);
    const config = {
      mount: 'http://test.com',
      applicationId: 'testParseApp',
    };
    const fileName = 'someFile.txt';
    expect(adapter.getFileLocation(config, fileName)).toEqual(
      `${config.mount}/files/${config.applicationId}/${fileName}`,
    );
  });
});

describe('Tests with Parse API', () => {
  const dataString = 'I like testing minio with Parse. Мне нравится тестить минио с парс.';
  const base64DataString = 'SSBsaWtlIHRlc3RpbmcgbWluaW8gd2l0aCBQYXJzZS4g0JzQvdC1INC90YDQsNC'
    + 'y0LjRgtGB0Y8g0YLQtdGB0YLQuNGC0Ywg0LzQuNC90LjQviDRgSDQv9Cw0YDRgS4=';
  it('Create file', () => {
    Parse.initialize(parseConfig.appId, parseConfig.jsKey);
    Parse.serverURL = parseConfig.serverURL;

    const GameScore = Parse.Object.extend('GameScore');
    const gameScore = new GameScore();

    const data = Array.from(Buffer.from(dataString));
    const file = new Parse.File('logo', data);
    return file.save()
      .then(() => gameScore.set('logo', file))
      .then(() => gameScore.save());
  });

  it('Fetch file', () => {
    expect.assertions(1);
    Parse.initialize(parseConfig.appId, parseConfig.jsKey);
    Parse.serverURL = parseConfig.serverURL;
    const gameScoreQuery = new Parse.Query('GameScore');
    return gameScoreQuery.first()
      .then((gameScore) => {
        const file = gameScore.get('logo');
        return file && file.getData();
      })
      .then((data) => expect(data).toEqual(base64DataString));
  });

  it('Big file test', () => {
    expect.assertions(1);
    const dataSize = 15000000;
    const data = Buffer.alloc(dataSize, 32);
    Parse.initialize(parseConfig.appId, parseConfig.jsKey);
    Parse.serverURL = parseConfig.serverURL;
    const file = new Parse.File('logo', Array.from(data));
    return file.save()
      .then((result) => expect(result).not.toBeUndefined());
  });
});
