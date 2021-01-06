var aws = require('aws-sdk');
const dynamodb = new aws.DynamoDB();

exports.handler = (event, context, callback) => {
  var tablesToBackup = event.tablesToBackup.split(",");
  var promises = tablesToBackup.map(backupTable);

  Promise.all(promises)
      .then(result => { callback(); })
      .catch(reason => { callback(reason); });
};

function backupTable(tablename) {
  var timestamp = new Date().toISOString()
      .replace(/\..+/, '')
      .replace(/:/g, '')
      .replace(/-/g, '');

  var params = {
    TableName: tablename,
    BackupName: tablename + '-' + timestamp
  };
  return dynamodb.createBackup(params).promise();
}
