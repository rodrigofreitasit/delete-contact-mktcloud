<script runat = "server" >
Platform.Load("Core", "1.1.1");
var current_BU = "BU NAME";
var authURL = 'https://XXXXXXXXXXXXXXXXXXXX.auth.marketingcloudapis.com'
var tokenMktCloud = tokenMktCloud();

function tokenMktCloud() {
    try {
        var urlToken = authURL + '/v2/token';
        var ContentType = 'application/json';
        var payload = {
            client_id: "XXXXXXXXXXXXXXXXXXXX",
            client_secret: "XXXXXXXXXXXXXXXXXXXX",
            grant_type: 'client_credentials'
        };
        var Result = HTTP.Post(urlToken, ContentType, Stringify(payload));
        var tokenResponse = Platform.Function.ParseJSON(Result.Response[0]);
        var accessToken = tokenResponse.access_token;
        var rest_instance_url = tokenResponse.rest_instance_url;
        return {
            "accessToken": accessToken,
            "rest_instance_url": rest_instance_url
        }
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
        var Url = tokenMktCloud.rest_instance_url + '/contacts/v1/contacts/actions/delete?type=keys';
        var ContentType = 'application/json';
        var Payload = Stringify(contactKeys);
        var HeaderNames = ["Authorization"];
        var s1 = "Bearer ";
        var access_Token = tokenMktCloud.accessToken;
        var HeaderValues = [s1.concat(access_Token)]; // Token caso precise
        var Result = HTTP.Post(Url, ContentType, Payload, HeaderNames, HeaderValues); //Chamada API
        geraLog(current_BU, "DeleteContact_Process Successful", Stringify(Result));
    } catch (e) {
        geraLog(current_BU, "DeleteContact_Process Error", SStringify(e).replace(/(?:\\[rn]|[\r\n]+)+/g, ""));
    }
}

if (tokenMktCloud) {
    var contactToProcess = DataExtension.Init("Contacts without Channel Addresses");
    var contactRecordsToQueueCount = 100; // quantidade de contatos para deleção
    var queuedRows = contactToProcess.Rows.Lookup(["MID"], ["XXXXX"], contactRecordsToQueueCount, "_CustomObjectKey");
    var contador = Math.round(queuedRows.length / 50); //Tamanho da fila, atenção para nao estourar o timeout do automation que é 30minutos
    for (var i = 0; i < contador; i++) {
        var batch = queuedRows.splice(0, 50); // Tamanho do lote para ser deletado MAX 1 MILHAO, recomendado MAX 500mil
        var contactKeys = {
            values: [],
            DeleteOperationType: "ContactAndAttributes"
        };
        for (var j = 0; j < batch; j++) {
            contactKeys.values.push(batch[j].ContactKey)
        }
        queueContactsToBeProcess(contactKeys, tokenMktCloud);
    }
} 
</script>