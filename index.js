var AWS = require('aws-sdk');
var uniqid = require("uniqid");

var handler = async (event) => {

	let id = (event.pathParameters || {}).idEnvio || false;

	var dynamodb = new AWS.DynamoDB({
		apiVersion: '2012-08-10',
		endpoint: 'http://​dynamodb​:8000',
		region: 'us-west-2',
		credentials: {
			accessKeyId: '2345',
			secretAccessKey: '2345'
		}
	});
	var docClient = new AWS.DynamoDB.DocumentClient({
		apiVersion: '2012-08-10',
		service: dynamodb
	});
	
	switch (event.httpMethod) {
		case 'GET':
			var params = {
			    TableName: 'Envio',
			    IndexName: 'EnviosPendientesIndex'
			};

			return await docClient.scan(params).promise()
				.then((data) => {
					console.log('The Scan call evaluated ' + data.ScannedCount + ' items');
					return {
                        statusCode: 200,
                        body: JSON.stringify(data.Items),
                    };
				})
				.catch((err) => {
					console.log('Unexpected error while scanning: ' + err);
					return {
                        statusCode: 500,
                        body: err.message,
                    };
				})
			break;
		case 'POST':
			if (! event.body) {
				console.log('Invalid request body');
				return{
                    statusCode: 400,
                    body: `{"error:": "Arguments missing"}`
                };
			}

			body = JSON.parse(event.body)

			if(!('destino' in body) || !('email' in body)){
				console.log('Invalid request body');
				return{
                    statusCode: 400,
                    body: `{"error:": "Arguments missing"}`
                };
			}

			var params = {
			    TableName: 'Envio',
			    Item: {
			    	id: uniqid(),
			        fechaAlta: new Date().toISOString(),
			        destino: body.destino,
                    email: body.email,
			        pendiente: new Date().toISOString()
			    }
			};

			return await docClient.put(params).promise()
				.then((data) => {
					console.log('Item saved successfully');
				    return {
                        statusCode: 200,
                        body: JSON.stringify(data),
                    };
				})
				.catch((err) => {
					console.log('Unexpected error while saving item: ' + err);
					return {
                        statusCode: 500,
                        body: err.message,
                    };
				})
			break;
		case 'PUT':
			if (! id){
				console.log('Id missing');
				return{
                    statusCode: 400,
                    body: `{"error:": "Id missing"}`
                };
			}

            var params = {
                TableName: 'Envio',
                Key: {
                    id: id,
                },
                UpdateExpression: 'REMOVE pendiente',
                ReturnValues: 'UPDATED_NEW',
            };

            return await docClient.update(params).promise()
                .then((data) => {
                    return {
                        statusCode: 200,
                        body: JSON.stringify(data),
                    };
                })
                .catch((err) => {
                    console.log('Unexpected error while updating item: ' + err);
                    return {
                        statusCode: 500,
                        body: err.message,
                    };
                });
		    break;
		default:
			console.log("Metodo no soportado", event.httpMethod)
			callback(null, {statusCode: 501});
	}

}

exports.handler = handler;