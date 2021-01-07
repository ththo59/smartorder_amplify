const jwt = require("jsonwebtoken");
const SECRET_KEY = require("./config");

exports.handler = async function (event) {
    try {
        const verify = verifyJwt(event.authorizationToken, SECRET_KEY.SECRET_KEY);
        if (verify) {
            return allowPolicy(event.methodArn);
        }
        return denyAllPolicy();
    } catch (err) {
        return denyAllPolicy();
    }
};

/**
 *
 * @param authHeaders
 * @param listSecretKey
 * @returns {boolean}
 */
function verifyJwt(authHeaders, listSecretKey) {
    if (!authHeaders) {
        return false;
    }
    for (const secretKey of listSecretKey) {
        const verify = jwt.verify(authHeaders, secretKey, (err, decoded) => {
            if (err) {
                return false;
            } else {
                return true;
            }
        });
        if (verify) {
            return true;
        }
    }
    return false;
}

/**
 *
 * @returns {{policyDocument: {Version: string, Statement: [{Action: string, Resource: string, Effect: string}]}, principalId: string}}
 */
function denyAllPolicy() {
    return {
        principalId: "*",
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "*",
                    Effect: "Deny",
                    Resource: "*",
                },
            ],
        },
    };
}

/**
 *
 * @param methodArn
 * @returns {{policyDocument: {Version: string, Statement: [{Action: string, Resource: *, Effect: string}]}, principalId: string}}
 */
function allowPolicy(methodArn) {
    return {
        principalId: "apigateway.amazonaws.com",
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: "Allow",
                    Resource: methodArn,
                },
            ],
        },
    };
}

/**
 * THIS IS DEV BRANCH
 * UPDATE 2ND
 * UPDATE 3RD
 * UPDATE FROM GIT REMOTE
 * UPDATE FROM GIT REMOTE 2ND
 * UPDATE FROM GIT REMOTE 3RD _ SERVER DEV09
 */

