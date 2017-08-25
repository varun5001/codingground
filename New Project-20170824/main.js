var request = require('request');

var headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/plain',
    'Authorization': 'Basic YzZjZTgwMTAtMmQ1MS00MjQwLThlYTEtY2E3ZmVmOTgxMjRhOlZ0czZ4bVdKN0ZVdw=='
};

var options = {
    url: 'https://watson-api-explorer.mybluemix.net/retrieve-and-rank/api/v1/solr_clusters/sc095bfcdb_c4b4_4fc6_b182_7493ceac558e/solr/soho/fcselect?ranker_id=7ff701x33-rank-1608&q=how%20do%20i%20set%20up%20quantum%20view&wt=json',
    method: 'POST',
    headers: headers
};

var rnr_result = '';

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        //console.log(typeof(body));
        rnr_result = JSON.parse(body);
        //console.log(typeof(rnr_result));
        console.log("Number Of Results:" + rnr_result.response.numFound);
        //console.log("JSON Object:" + rnr_result);
        console.log("Maximum Feature Score:" + rnr_result.response.maxScore);
    }
}


//var json_object = JSON.stringify(rnr_result);
console.log("JSON Object:" + rnr_result);
request(options, callback);
