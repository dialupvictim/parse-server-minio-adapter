const Minio = require('minio');

const getValue = (object, key, defaultValue) => {
  if (!object[key]) {
    return defaultValue;
  }
  return object[key];
};

const getDataFromStream = (stream) => new Promise((resolve, reject) => {
  const buffers = [];
  stream.on('readable', () => {
    buffers.push(stream.read());
  });
  stream.on('end', () => resolve(Buffer.concat(buffers)));
  stream.on('error', (error) => reject(error));
});

class MinioAdapter {
  constructor(...args) {
    const [options] = args;
    this.client = new Minio.Client({
      endPoint: getValue(options, 'endPoint', 'localhost'),
      port: getValue(options, 'port', 9000),
      useSSL: getValue(options, 'useSSL', false),
      accessKey: getValue(options, 'accessKey', ''),
      secretKey: getValue(options, 'secretKey', ''),
    });
    this.bucketName = getValue(options, 'bucketName', 'parse-server');
    this.region = getValue(options, 'region', 'us-east-1');
    this.hasBucket = false;
  }

  makeBucket() {
    if (this.hasBucket) {
      return Promise.resolve();
    }
    return this.client.bucketExists(this.bucketName)
      .then((exists) => (!exists && this.client.makeBucket(this.bucketName, this.region)))
      .then(() => { this.hasBucket = true; });
  }

  createFile(filename, data) {
    return this.makeBucket()
      .then(() => this.client.putObject(this.bucketName, filename, data));
  }

  deleteFile(filename) {
    return this.makeBucket()
      .then(() => this.client.removeObject(this.bucketName, filename));
  }

  getFileData(filename) {
    return this.makeBucket()
      .then(() => this.client.getObject(this.bucketName, filename))
      .then((stream) => getDataFromStream(stream));
  }

  getFileStream(filename) {
    return this.makeBucket()
      .then(() => this.client.getObject(this.bucketName, filename));
  }

  getFileLocation(config, filename) {
    return `${config.mount}/files/${config.applicationId}/${filename}`;
  }
}

module.exports = MinioAdapter;
module.exports.default = MinioAdapter;
