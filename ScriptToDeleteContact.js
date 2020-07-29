<script runat=server>
Platform.Load("Core", "1");
//Data Extension to log API Calls
var logDE = "[EXTERNAL KEY HERE]";
var log = DataExtension.Init(logDE);

//AUTHENTICATE
var url = '[BASE URI]/v2/token'; 
var contentType = 'application/json'; 
var payload = '{"grant_type": "client_credentials","client_id": "[CLIENT ID HERE]","client_secret": "[CLIENT SECRET HERE]","account_id":"[MID HERE]"}'; 

var accessTokenResult = HTTP.Post(url, contentType, payload); 
var accessToken = Platform.Function.ParseJSON(accessTokenResult["Response"][0]).access_token;

if(accessToken !='')
//EXECUTE
{
	try {
		//PUT THE EXTERNAL KEY OF THE DATA EXTENSION TO BE DELETED
		var deleteUrl = '[BASE URI]/contacts/v1/contacts/actions/delete?type=listReference';
		var payload1 = '{"deleteOperationType": "ContactAndAttributes","targetList": {"listType": {"listTypeID": 3},"listKey": "[PUT EXTERNALKEY HERE]"},"deleteListWhenCompleted": false,"deleteListContentsWhenCompleted": false}';
		var headerNames = ["Authorization"];
		var s1="Bearer ";
		var headerValues = [s1.concat(accessToken)];
		var result = HTTP.Post(deleteUrl, contentType, payload1, headerNames, headerValues);
		result = Stringify(result).replace(/[\n\r]/g, '');
		log.Rows.Add({"Message": "result: " + result});
	} 
	catch (e) {
		e = Stringify(e).replace(/[\n\r]/g, '')
		log.Rows.Add({"Message": "error: " + e});
	}
}
</script>
