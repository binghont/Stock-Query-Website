<?php
header("Content-type: text/json; charset=utf-8");
if ($_GET) {
    if (!empty($_GET["symbol"])) {
        StockDetails($_GET["symbol"]);
    } else if (!empty($_GET["q"])) {
        NewsFeed($_GET["q"]);
    } else if (!empty($_GET["input"])) {
        autoComplete($_GET["input"]);
    } else {
        HighStock($_GET["parameters"]);
    }
}

function autoComplete($data)
{
    echo file_get_contents("http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input=" . $data);
}

function HighStock($data)
{
    echo file_get_contents("http://dev.markitondemand.com/Api/v2/InteractiveChart/json?parameters=" . $data);
}

function StockDetails($data)
{
    echo file_get_contents("http://dev.markitondemand.com/MODApis/Api/v2/Quote/json?symbol=" . $data);
}

function NewsFeed($data)
{
    //echo file_get_contents("https://ajax.googleapis.com/ajax/services/search/news?v=1.0&userip=INSERT-USER-IP&q=" . $data);
    $accountKey = 'PfnwWMG89uc8DnxDpWhYQGS1KLIINmMMDDp3mJsevJA';
    $ServiceRootURL ='https://api.datamarket.azure.com/Bing/Search/v1/';
    $WebSearchURL = $ServiceRootURL . 'News?$format=json&Query=';
    $context = stream_context_create(array(
        'http' => array(
            'request_fulluri' => true,
            'header'  => "Authorization: Basic " . base64_encode($accountKey . ":" . $accountKey)
        )
    ));

    $request = $WebSearchURL . urlencode( '\'' . $data . '\'');
    echo file_get_contents($request, 0, $context);

}
?>