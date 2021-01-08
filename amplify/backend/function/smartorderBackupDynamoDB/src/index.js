let aws = require('aws-sdk');
const dynamodb = new aws.DynamoDB();

exports.handler = (event, context, callback) => {
    let tablesToBackup = event.tablesToBackup.split(",");
    let promises = tablesToBackup.map(backupTable);

    Promise.all(promises)
        .then(result => {
            callback();
        })
        .catch(reason => {
            callback(reason);
        });
};

function backupTable(tablename) {
    let timestamp = new Date().toISOString()
        .replace(/\..+/, '')
        .replace(/:/g, '')
        .replace(/-/g, '');

    let params = {
        TableName: tablename,
        BackupName: tablename + '-' + timestamp
    };
    return dynamodb.createBackup(params).promise();
}
