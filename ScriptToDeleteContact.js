<script runat="server">
Platform.Load("Core", "1.1.1");

var AUTH_URL      = "[BASE URI]";
var CLIENT_ID     = "[CLIENT ID HERE]";
var CLIENT_SECRET = "[CLIENT SECRET HERE]";
var ACCOUNT_ID    = "[MID HERE]";
var LOG_DE_KEY    = "[EXTERNAL KEY HERE]";
var LIST_KEY      = "[PUT EXTERNALKEY HERE]";

function writeLog(message) {
    var logDE = DataExtension.Init(LOG_DE_KEY);
    logDE.Rows.Add({ Message: message });
}

function getToken() {
    var payload = {
        grant_type:    "client_credentials",
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        account_id:    ACCOUNT_ID
    };

    var result = HTTP.Post(AUTH_URL + "/v2/token", "application/json", Stringify(payload));
    var parsed = Platform.Function.ParseJSON(result.Response[0]);

    return parsed.access_token;
}

function deleteContactsByList(accessToken) {
    var deleteUrl    = AUTH_URL + "/contacts/v1/contacts/actions/delete?type=listReference";
    var headerNames  = ["Authorization"];
    var headerValues = ["Bearer " + accessToken];
    var payload = {
        deleteOperationType:             "ContactAndAttributes",
        targetList: {
            listType: { listTypeID: 3 },
            listKey:  LIST_KEY
        },
        deleteListWhenCompleted:         false,
        deleteListContentsWhenCompleted: false
    };

    var result = HTTP.Post(deleteUrl, "application/json", Stringify(payload), headerNames, headerValues);
    writeLog("result: " + Stringify(result).replace(/[\n\r]/g, ""));
}

try {
    var accessToken = getToken();

    if (accessToken) {
        deleteContactsByList(accessToken);
    }
} catch (e) {
    writeLog("error: " + Stringify(e).replace(/[\n\r]/g, ""));
}
</script>
