/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


/* Amplify Params - DO NOT EDIT
	API_SMARTORDERAMPLIFY_GRAPHQLAPIENDPOINTOUTPUT
	API_SMARTORDERAMPLIFY_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const AWS = require('aws-sdk');

const accountPrinterMutation = require('./graphql/mutations');
const accountPrinterQuery = require('./graphql/queries');
const SUCCESS = 'success';
const FAIL = 'fail';

const gql = require('graphql-tag');
const AWSAppSyncClient = require('aws-appsync').default;
// import  { AUTH_TYPE } from 'aws-appsync';
require('es6-promise').polyfill();
require('isomorphic-fetch');
const InMemoryCache = require('@apollo/client').InMemoryCache;

const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

const url = process.env.API_SMARTORDERAMPLIFY_GRAPHQLAPIENDPOINTOUTPUT;
const region = process.env.REGION;

AWS.config.update({
  region,
  credentials: new AWS.Credentials(
      process.env.AWS_ACCESS_KEY_ID,
      process.env.AWS_SECRET_ACCESS_KEY,
      process.env.AWS_SESSION_TOKEN
  ),
});
const credentials = AWS.config.credentials;

function newClient() {
  return new AWSAppSyncClient({
    url,
    region,
    auth: {
      type: 'AWS_IAM',
      credentials,
    },
    disableOffline: true
  }, {
    cache: new InMemoryCache(), query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    }
  })
}


/**********************
 * Get method *
 **********************/

app.get('/account-printer', async function(req, res) {

  let params = {
    companyName : req.query.companyName,
    filter: {
      companyCode: {
        eq: req.query.companyCode
      }
    }
  };

  let result = await graphqlQuery(accountPrinterQuery.listAccountPrinters, params);
  let items = [];
  if (result.status === SUCCESS) {
    items = result.data.listAccountPrinters.items.length === 0 ? [] : result.data.listAccountPrinters.items;
    //next record
    while (result.data.listAccountPrinters.nextToken) {
      params.nextToken = result.data.listAccountPrinters.nextToken;
      result = await graphqlQuery(accountPrinterQuery.listAccountPrinters, params);
      if (result.status === SUCCESS) {
        items = items.concat(result.data.listAccountPrinters.items);
      }
    }
  }

  await res.json({
    status: result.status,
    message: result.message,
    data: {
      total: items.length,
      items: result.status === SUCCESS ? items : {},
    }
  });

});

/****************************
 * Insert method *
 ****************************/

app.post('/account-printer', async function(req, res) {
  let mutate = accountPrinterMutation.createAccountPrinter;
  let variables=   {
    input: req.body.data
  };
  let result = await graphqlMutation(mutate, variables);
  res.json({
    status: result.status,
    message: result.message,
    data: {
      items: result.data.createAccountPrinter
    }
  });

});

/****************************
 * Update method *
 ****************************/

app.put('/account-printer', async function(req, res) {
  let mutate = accountPrinterMutation.updateAccountPrinter;
  let variables=   {
    input: req.body.data
  };
  let result = await graphqlMutation(mutate, variables);
  res.json({
    status: result.status,
    message: result.message,
    data: {
      items: result.data.updateAccountPrinter
    }
  });
});


/****************************
 * Delete method *
 ****************************/

app.delete('/account-printer', async function(req, res) {
  let mutate = accountPrinterMutation.deleteAccountPrinter;
  let variables=   {
    input: req.body.data
  };
  let result = await graphqlMutation(mutate, variables);
  res.json({
    status: result.status,
    message: result.message,
    data: {
      items: result.data.updateAccountPrinter
    }
  });
});

/**
 *
 * @param mutate
 * @param vars
 * @returns {Promise<unknown>}
 */
function graphqlMutation(mutate, vars = {}) {
  return new Promise((resolve, reject) => {
    let client = newClient();
    client.hydrated().then(function (client) {
      const mutation = gql(mutate);
      client.mutate({
        mutation: mutation,
        variables: vars
      })
          .then(function logData(data) {
            resolve({
              status: SUCCESS,
              message: "",
              data: data.data
            });
          })
          .catch(function (error) {
            resolve({
              status: FAIL,
              message: error,
              data: {}
            });
          })
    });
  });
}

/**
 *
 * @param qry
 * @param vars
 * @returns {Promise<unknown>}
 */
function graphqlQuery(qry, vars = {}) {
  return new Promise((resolve, reject) => {
    let client = newClient();
    client.hydrated().then(function (client) {
      const query = gql(qry);
      client.query({
        query: query,
        variables: vars
      })
          .then(function logData(data) {
            resolve({
              status: SUCCESS,
              message: "",
              data: data.data
            });
          })
          .catch(function (error) {
            resolve({
              status: FAIL,
              message: error,
              data: {}
            });
          })
    });
  });
}

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
