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
const orderHistoryMutation = require('./graphql/mutations');
const orderHistoryQuery = require('./graphql/queries');
const gql = require('graphql-tag');
const AWSAppSyncClient = require('aws-appsync').default;
require('es6-promise').polyfill();
require('isomorphic-fetch');
const InMemoryCache = require('@apollo/client').InMemoryCache;

const {PrintCustomerService} = require('./convertXML/print/print-customer');
const {PrintKitchenService} = require('./convertXML/print/print-kitchen');

const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

const SUCCESS = "success";
const FAIL = "fail";

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

app.get('/order-history', async function (req, res) {

    let params = {
        companyName: req.query.companyName,
        companyCode: {
            eq: req.query.companyCode
        },
        filter: {
            systemType: {
                eq: req.query.systemType
            },
            orderDateTime: {
                between: [req.query.fromDateTime, req.query.toDateTime]
            }
        }
    };

    let result = await graphqlQuery(orderHistoryQuery.fieldToReferenceForCompanyCodeIndex, params);
    let items = [];
    if (result.status === SUCCESS) {
        items = result.data.fieldToReferenceForCompanyCodeIndex.items.length === 0 ? [] : result.data.fieldToReferenceForCompanyCodeIndex.items;
        //next record
        while (result.data.fieldToReferenceForCompanyCodeIndex.nextToken) {
            params.nextToken = result.data.fieldToReferenceForCompanyCodeIndex.nextToken;
            result = await graphqlQuery(orderHistoryQuery.fieldToReferenceForCompanyCodeIndex, params);
            if (result.status === SUCCESS) {
                items = items.concat(result.data.fieldToReferenceForCompanyCodeIndex.items);
            }
        }

    }

    res.json({
        status: result.status,
        message: result.message,
        data: {
            total:items.length,
            items: result.status === SUCCESS ? items : {},
        }
    });
});

/**********************
 * End get method *
 **********************/

/****************************
 * Post method *
 ****************************/

app.post('/order-history', async function (req, res) {
    try {
        let dataInput = req.body.data;
        let convertXML = convertEpsonPrinterXML(dataInput);
        dataInput.printData = convertXML[0];
        dataInput.printXMLData = convertXML[1];
        let result = await graphqlMutation(orderHistoryMutation.createOrderHistory, {input: dataInput});
        res.json({
            status: result.status,
            message: result.message,
            data: {
                items: result.data.createOrderHistory ? [result.data.createOrderHistory] : []
            }
        });
    } catch (err) {
        res.json({
            status: FAIL,
            message: err,
            data: {}
        });
    }
});

/****************************
 * End post method *
 ****************************/

/**
 *
 * @param dataInput
 * @returns {[]}
 */
function convertEpsonPrinterXML(dataInput) {
    let result = [];
    let printData = [];
    let xml = [];
    const printCustomerService = new PrintCustomerService();
    let printJobIndex = 1;
    if (dataInput.orderData.doPrintFlag === "1") {
        let dataXmlCustomer = printCustomerService.createPrint(dataInput.orderData, dataInput.printJobId, printJobIndex);
        result.push(dataXmlCustomer);
        printJobIndex++;
    }
    const printKitchenService = new PrintKitchenService();
    if (dataInput.orderData.doOrderPrintFlag === "1") {
        let dataXmlKitchen = printKitchenService.createPrint(dataInput.orderData, dataInput.printJobId, printJobIndex);
        for (let i = 0; i < dataXmlKitchen.length; i++) {
            result.push(dataXmlKitchen[i]);
            printJobIndex++;
        }
    }
    for (let index = 0; index < result.length; index++) {
        xml.push(result[index].xml);
        delete result[index].xml;
        printData.push(result[index]);
    }
    return [printData, xml];
}

/**********************
 * Core Graphql methods
 **********************/

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

/****************************
 * End core Graphql methods
 ****************************/


app.listen(3000, function () {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
