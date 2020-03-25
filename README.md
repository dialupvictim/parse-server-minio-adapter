# parse-server-minio-adapter

parse-server file adapter for [MinIO](https://min.io/)

# installation
`
yarn add /home/dima/IdeaProjects/parse-server-minio-adapter
`

*or*

`npm install --save /home/dima/IdeaProjects/parse-server-minio-adapter`

# usage with parse server

### config file

```
{
    "appId": "someAppId",
    "databaseURI": "mongodb://localhost/someDB",
    "javascriptKey": "exampleKey",
    "filesAdapter": {
            "module": "minio-files-adapter",
            "options": {
                "endPoint": "miniohost",
                "port": 9000,
                "useSSL": false,
                "accessKey": "samplekey",
                "secretKey": "samplekey"
            }
        }
}
```
