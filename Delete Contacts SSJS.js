<script runat="server">
Platform.Load("Core", "1.1.1");

var BUSINESS_UNIT     = "BU NAME";
var AUTH_URL          = "https://XXXXXXXXXXXXXXXXXXXX.auth.marketingcloudapis.com";
var CLIENT_ID         = "XXXXXXXXXXXXXXXXXXXX";
var CLIENT_SECRET     = "XXXXXXXXXXXXXXXXXXXX";
var BATCH_SIZE        = 50;   // SFMC recommends max 500k per call; keep low to avoid Automation timeout (30 min)
var CONTACT_LIMIT     = 100;  // total contacts to queue per execution

function getToken() {
    var payload = {
        grant_type:    "client_credentials",
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET
    };

    var result = HTTP.Post(AUTH_URL + "/v2/token", "application/json", Stringify(payload));
    var parsed = Platform.Function.ParseJSON(result.Response[0]);

    return {
        accessToken:     parsed.access_token,
        restInstanceUrl: parsed.rest_instance_url
    };
}

function writeLog(source, message) {
    var logDE = DataExtension.Init("DE_Log_Exclusao");
    logDE.Rows.Add({
        BU:          BUSINESS_UNIT,
        Script:      source,
        CreateDate:  Now(),
        LogMessage:  message
    });
}

function deleteContactBatch(contactKeys, token) {
    var url          = token.restInstanceUrl + "/contacts/v1/contacts/actions/delete?type=keys";
    var headerNames  = ["Authorization"];
    var headerValues = ["Bearer " + token.accessToken];
    var payload      = Stringify(contactKeys);

    var result = HTTP.Post(url, "application/json", payload, headerNames, headerValues);
    writeLog("DeleteContact_Process Successful", Stringify(result));
}

try {
    var token = getToken();
} catch (e) {
    writeLog("DeleteContact_Process Error API Token", Stringify(e).replace(/(?:\\[rn]|[\r\n]+)+/g, ""));
}

if (token) {
    try {
        var contactDE  = DataExtension.Init("Contacts without Channel Addresses");
        var rows       = contactDE.Rows.Lookup(["MID"], ["XXXXX"], CONTACT_LIMIT, "_CustomObjectKey");
        var totalBatches = Math.ceil(rows.length / BATCH_SIZE);

        for (var i = 0; i < totalBatches; i++) {
            var batch = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            var contactKeys = {
                values:              [],
                DeleteOperationType: "ContactAndAttributes"
            };

            for (var j = 0; j < batch.length; j++) {
                contactKeys.values.push(batch[j].ContactKey);
            }

            deleteContactBatch(contactKeys, token);
        }
    } catch (e) {
        writeLog("DeleteContact_Process Error", Stringify(e).replace(/(?:\\[rn]|[\r\n]+)+/g, ""));
    }
}
</script>
