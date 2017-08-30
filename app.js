'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var request = require('request');
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var watson  = require('watson-developer-cloud');

var app = express();
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());
var conversation = new Conversation({
  url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2016-10-21',
  version: 'v1'
});
var retrieve_and_rank = watson.retrieve_and_rank({
  username: 'c6ce8010-2d51-4240-8ea1-ca7fef98124a',
  password: 'Vts6xmWJ7FUw',
  version: 'v1'
});
var params = {
  cluster_id: 'sc095bfcdb_c4b4_4fc6_b182_7493ceac558e',
  collection_name: 'soho'
};
var qs = require('qs');
var solrClient = retrieve_and_rank.createSolrClient(params);
var ranker_id = '7ff701x33-rank-1608';
function rip(intent_update, output_rnr){
	var headers_conv = {
	    'Content-Type': 'application/json',
	    'Accept': 'application/json',
	    'Authorization': 'Basic YWFjZWU2MTgtOTEwMS00N2NhLWEzZGQtMzBhOGJmMWMxZGMyOnQ3SW1XSkxrODJ4bQ=='
	};
	var dataString = '{ "output": { "text": {  "values": [' + output_rnr + '], "selection_policy": "sequential" }  }  }';
	var options_conv = {
	    url: 'https://watson-api-explorer.mybluemix.net/conversation/api/v1/workspaces/7dfbc190-50cd-4db6-ae19-6c379a9e7f55/dialog_nodes/'+ intent_update + '?version=2017-05-26',
	    method: 'POST',
	    headers: headers_conv,
	    body: dataString
	};
	function callback_conv(error, response, body) {
	    if (!error && response.statusCode === 200) {
	        console.log(body);
	    }
	}
	request(options_conv, callback_conv);
}
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    return res.json(updateMessage(payload, data));
  });
});

function updateMessage(input, response) {
  if (!response.output) {
    response.output = {};
  } else {
  	// Check if the intent returned from Conversation service is add or multiply, perform the calculation and update the response
  	console.log("response in um before if:"+response);
  	if (response.intents.length > 0 && (response.intents[0].intent === 'add' || response.intents[0].intent === 'multiply' || response.intents[0].intent === 'rnr')) {
			response = getCalculationResult(response);
				
	}
	response.output.text[0] = response.output.text[0] + 'out of else in update msg '+ response.input.text;
	console.log("response in um after if:"+response);
  }
   return response;
 }

function getCalculationResult(response){
	var numbersArr = [];
	for (var i = 0; i < response.entities.length; i++) {
		if (response.entities[i].entity === 'sys-number') {
			numbersArr.push(response.entities[i].value);
		}
	}
	var result = '';
	if (response.intents[0].intent === 'add') {
		result = parseInt(numbersArr[0], 10) + parseInt(numbersArr[1], 10);
		rip(response.intents[0].intent, result);
	} else if (response.intents[0].intent === 'multiply') {
		result = parseInt(numbersArr[0], 10) * parseInt(numbersArr[1], 10);
		rip(response.intents[0].intent, result);
	}
    else if(response.intents[0].intent === 'rnr'){
	  	var question  = response.input.text;
    	var query     = qs.stringify({q: question, ranker_id: ranker_id, fl: 'contentHtml'});
   
   		solrClient.get('fcselect', query, function(err, searchResponse) {
	  		if(err) {
	   			 console.log('Error searching for documents: ' + err);
			}
	    	else {
	      		result = JSON.stringify(searchResponse.response.docs[0].contentHtml, null, 1);
	      		console.log('Rnr result: ' + result);
	      		console.log('befor con call:');
	     		rip(response.intents[0].intent, result);
	     		console.log('after con call:');
	     		
	        }
		});

	}
	response.output.text[0] = response.output.text[0] + result;
	return response;
}

module.exports = app;
