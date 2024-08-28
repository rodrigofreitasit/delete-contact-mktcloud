<script runat="server">
Platform.Load("Core", "1.1.1");

var current_BU = "BU NAME";
var authURL = 'https://XXXXXXXXXXXXXXXXXXXX.auth.marketingcloudapis.com';
var clientId = "XXXXXXXXXXXXXXXXXXXX";
var clientSecret = "XXXXXXXXXXXXXXXXXXXX";
var contactRecordsToQueueCount = 100; // quantidade de contatos para deleção

var tokenMktCloud = getTokenMktCloud();

function getTokenMktCloud() {
    try {
        var urlToken = authURL + '/v2/token';
        var contentType = 'application/json';
        var payload = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        };
        var result = HTTP.Post(urlToken, contentType, Stringify(payload));
        var tokenResponse = Platform.Function.ParseJSON(result.Response[0]);
        var accessToken = tokenResponse.access_token;
        var restInstanceUrl = tokenResponse.rest_instance_url;
        return {
            accessToken: accessToken,
            restInstanceUrl: restInstanceUrl
        };
    } catch (e) {
        geraLog(current_BU, "DeleteContact_Process Error API Token", Stringify(e).replace(/(?:\\[rn]|[\r\n]+)+/g, ""));
    }
}

function geraLog(strBU, strSource, strLog) {
    var logErrorDE = DataExtension.Init("DE_Log_Exclusao");
    logErrorDE.Rows.Add({
        BU: strBU,
        Script: strSource,
        CreateDate: Now(),
        LogMessage: strLog
    });
}

function queueContactsToBeProcess(contactKeys, tokenMktCloud) {
    try {
        var url = tokenMktCloud.restInstanceUrl + '/contacts/v1/contacts/actions/delete?type=keys';
        var contentType = 'application/json';
        var payload = Stringify(contactKeys);
        var headerNames = ["Authorization"];
        var accessToken = "Bearer " + tokenMktCloud.accessToken;
        var headerValues = [accessToken];
        var result = HTTP.Post(url, contentType, payload, headerNames, headerValues);
        geraLog(current_BU, "DeleteContact_Process Successful", Stringify(result));
    } catch (e) {
        geraLog(current_BU, "DeleteContact_Process Error", Stringify(e).replace(/(?:\\[rn]|[\r\n]+)+/g, ""));
    }
}

if (tokenMktCloud) {
    var contactToProcess = DataExtension.Init("Contacts without Channel Addresses");
    var queuedRows = contactToProcess.Rows.Lookup(["MID"], ["XXXXX"], contactRecordsToQueueCount, "_CustomObjectKey");
    var contador = Math.ceil(queuedRows.length / 50); //Tamanho da fila, atenção para nao estourar o timeout do automation que é 30 minutos

    for (var i = 0; i < contador; i++) {
        var batch = queuedRows.splice(0, 50); // Tamanho do lote para ser deletado MAX 1 MILHAO, recomendado MAX 500mil
        var contactKeys = {
            values: [],
            DeleteOperationType: "ContactAndAttributes"
        };

        for (var j = 0; j < batch.length; j++) {
            contactKeys.values.push(batch[j].ContactKey);
        }

        queueContactsToBeProcess(contactKeys, tokenMktCloud);
    }
}
</script>
