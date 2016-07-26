
var Markit = {};

Markit.InteractiveChartApi = function (symbol, duration) {
    this.symbol = symbol.toUpperCase();
    this.duration = duration;
    this.PlotChart();
};

Markit.InteractiveChartApi.prototype.PlotChart = function () {

    var params = JSON.stringify(this.getInputParams());

    //Make JSON request for timeseries data
    $.ajax({
        beforeSend: function () {
            $("#Charts").text("Loading chart...");
        },
        url: "index.php",
        data: {parameters:params},
        dataType: "json",
        type:"GET",
        context: this,
        success: function (json) {
            //Catch errors
            if (!json || json.Message) {
                console.error("Error: ", json.Message);
                return;
            }
            this.render(json);
        },
        error: function (response, txtStatus) {
            console.log(response, txtStatus)
        }
    });
};

Markit.InteractiveChartApi.prototype.getInputParams = function () {
    return {
        Normalized: false,
        NumberOfDays: this.duration,
        DataPeriod: "Day",
        Elements: [
            {
                Symbol: this.symbol,
                Type: "price",
                Params: ["ohlc"] //ohlc, c = close only
            }
        ]
    }
};

Markit.InteractiveChartApi.prototype._fixDate = function (dateIn) {
    var dat = new Date(dateIn);
    return Date.UTC(dat.getFullYear(), dat.getMonth(), dat.getDate());
};

Markit.InteractiveChartApi.prototype._getOHLC = function (json) {
    var dates = json.Dates || [];
    var elements = json.Elements || [];
    var chartSeries = [];

    if (elements[0]) {

        for (var i = 0, datLen = dates.length; i < datLen; i++) {
            var dat = this._fixDate(dates[i]);
            var pointData = [
                dat,
                elements[0].DataSeries['close'].values[i]
            ];
            chartSeries.push(pointData);
        }
        ;
    }
    return chartSeries;
};


Markit.InteractiveChartApi.prototype.render = function (data) {
    // split the data set into ohlc
    var ohlc = this._getOHLC(data);

    // create the chart
    $("#Charts").highcharts('StockChart', {

        rangeSelector: {
            buttons: [{
                type: 'week',
                count: 1,
                text: '1w'
            }, {
                type: 'month',
                count: 1,
                text: '1m'
            }, {
                type: 'month',
                count: 3,
                text: '3m'
            }, {
                type: 'month',
                count: 6,
                text: '6m'
            }, {
                type: 'ytd',
                text: 'YTD'
            }, {
                type: 'year',
                count: 1,
                text: '1y'
            }, {
                type: 'all',
                text: 'All'
            }],
            selected: 0,
            inputEnabled:false
            //enabled: false
        },

        charts:{
            zoomType: 'x',
            resetZoomButton: {
                position:{align:"right"}
            }
        },

        title: {
            text: this.symbol + ' Stock Price'
        },

        yAxis: {
            title: {
                text: 'Stock Value',
                textAlign: 'left'
            }
            ,min: 0

        },
        series: [{
            name: this.symbol,
            data: ohlc,
            type: 'area',
            threshold: null,
            tooltip: {
                valuePrefix: '$',
                valueDecimals: 2
            },
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            }
        }]
    });
};

//last query stock
var stockdata = {};
//
var favoritelist= [];

//initial
$(document).ready(function () {
    var stocks=window.localStorage.getItem("stockList");
    if(stocks){
        favoritelist=stocks.split(",");
    }
    //display favoriteList
    displayList();

    //query submit
    $('#search').bind('submit', function () {
       var currentStock=this.stock.value.toUpperCase();
        ajaxSubmit(this.stock.value.toUpperCase());
        return false;
    });

    //next disabled
    $("#next").attr("disabled", true);

    //initial facebook SDK
    window.fbAsyncInit = function () {
        FB.init({
            appId: '1711106775811128',
            xfbml: true,
            version: 'v2.5'
        });

    };

    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));


  window.onload=function(){$("#stock").val("");}

});

//section - Stock Details
function ajaxSubmit(i) {
    stockdata["Symbol"] = i;
    $.ajax({
        url: 'index.php',
        data: {symbol: i},
        type: 'GET',
        dataType: 'json',
        success: [function (data) {
            if (data["Status"] == "SUCCESS") {
                //query - Success
                $("#Invalid").html("");

                //Tab - Current Stock
                // Stock Buttons
                var buttons=Array();
                buttons.push("<span style='margin-left: 2.0%;'><strong>Stock Details</strong></span>");

                // Button facebook favorite initial
                buttons.push("<div class='pull-right' style='margin-right: 2.0%'><button class='btn btn-default' style='padding: 0px' onclick='share()'><img src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/F_icon.svg/240px-F_icon.svg.png' style='height: 35px;width: 35px'/></button>&nbsp;");
                if (favoritelist.indexOf(stockdata["Symbol"])>=0) {
                    buttons.push("<button id='favorite' class='btn btn-default' onclick='favoriteStock()'><span class='glyphicon glyphicon-star' style='color:rgb(255, 255, 7);text-shadow:0 1px black, 0 -1px black, 1px 0 black, -1px 0 black;'></span></button></div>");
                } else {
                    buttons.push("<button id='favorite' class='btn btn-default' onclick='favoriteStock()'><span class='glyphicon glyphicon-star' style='color:rgb(255, 255, 255);text-shadow:0 1px black, 0 -1px black, 1px 0 black, -1px 0 black;'></span></button></div>");
                }
                $("#Buttons").html(buttons.join(""));

                // Stock Table
                var table = Array();
                table.push("<table class='table table-striped'>");

                table.push("<tr><th>Name</th><td>" + data["Name"] + "</td></tr>");
                stockdata["Name"] = data["Name"];

                table.push("<tr><th>Symbol</th><td>" + data["Symbol"] + "</td></tr>");

                table.push("<tr><th>Last Price</th><td>$ " + data["LastPrice"].toFixed(2) + "</td></tr>");
                stockdata["LastPrice"] = data["LastPrice"].toFixed(2);


                if (data["Change"].toFixed(2) > 0) {
                    table.push("<tr><th>Change (Change Percent)</th><td class='text-success'>" + data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/up.png'></td></tr>");
                    stockdata["Change"] = "<td class='text-success'>" + data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/up.png'></td>";
                } else if (data["Change"].toFixed(2) < 0) {
                    table.push("<tr><th>Change (Change Percent)</th><td class='text-danger'>" + data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/down.png'></td></tr>");
                    stockdata["Change"] = "<td class='text-danger'>" + data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/down.png'></td>";
                } else {
                    table.push("<tr><th>Change (Change Percent)</th><td>" + data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% )</td></tr>");
                    stockdata["Change"] = "<td>" + data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% )</td>";
                }
                stockdata["ChangeForFB"] = data["Change"].toFixed(2) + " (" + data["ChangePercent"].toFixed(2) + "%)";

                table.push("<tr><th>Time and Date</th><td>" + moment(data["Timestamp"]).format("DD MMMM YYYY, hh:mm:ss a") + "</td></tr>");

                var market_Cap1 = (data["MarketCap"] / 1000000000).toFixed(2);
                var market_Cap2 = (data["MarketCap"] / 1000000).toFixed(2);
                if (market_Cap1 >= 1.00) {
                    table.push("<tr><th>market Cap</th><td>" + market_Cap1 + " Billion</td></tr>");
                    stockdata["MarketCap"] = "<td>" + market_Cap1 + " Billion</td>";
                } else if (market_Cap2 >= 1.00) {
                    table.push("<tr><th>market Cap</th><td>" + market_Cap2 + " Million</td></tr>");
                    stockdata["MarketCap"] = "<td>" + market_Cap2 + " Million</td>";
                } else {
                    table.push("<tr><th>market Cap</th><td>" + data["MarketCap"].toFixed(2) + "</td></tr>");
                    stockdata["MarketCap"] = "<td>" + data["MarketCap"].toFixed(2) + "</td>";
                }

                table.push("<tr><th>Volume</th><td>" + data["Volume"] + "</td></tr>");

                if (data["ChangePercentYTD"].toFixed(2) > 0) {
                    table.push("<tr><th>Change YTD (Change Percent YTD)</th><td class='text-success'>" + data["ChangeYTD"].toFixed(2) + " ( " + data["ChangePercentYTD"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/up.png'></td></tr>");
                } else if (data["ChangePercentYTD"].toFixed(2) < 0) {
                    table.push("<tr><th>Change YTD (Change Percent YTD)</th><td class='text-danger'>" + data["ChangeYTD"].toFixed(2) + " ( " + data["ChangePercentYTD"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/down.png'></td></tr>");
                } else {
                    table.push("<tr><th>Change YTD (Change Percent YTD)</th><td>" + data["ChangeYTD"].toFixed(2) + " ( " + data["ChangePercentYTD"].toFixed(2) + "% )</td></tr>");
                }

                table.push("<tr><th>High Price</th><td>$ " + data["High"] + "</td></tr>");

                table.push("<tr><th>Low Price</th><td>$ " + data["Low"] + "</td></tr>");

                table.push("<tr><th>Opening Price</th><td>$ " + data["Open"] + "</td></tr>");

                table.push("</table>");

                $("#DataTable").html(table.join(""));

                //Yahoo charts API
                var chart = Array();
                chart.push("<img src='http://chart.finance.yahoo.com/t?lang=en-US&width=520&height=390&s=" + i + "' class='img-responsive'>");
                stockdata["Image"] = "http://chart.finance.yahoo.com/t?lang=en-US&width=220&height=240&s=" + i;


                $("#Chart").html(chart.join(""));

                //next enable
                $("#next").attr("disabled", false);
                $("#myCarousel").carousel(1);
                ajaxSubmit2(i);
            } else{
                $("#Invalid").html("Select a valid entry");
            }
        }, ajaxSubmit3(i) ],

        // Invalid Stock
        error: function () {
        }
    });
}

//Tab - News Feeds
function ajaxSubmit3(i) {;
    $.getJSON("index.php?q=" + i, function (data) {
        var news = [];
        $.each(data.d.results, function (i, item) {
            news.push("<div class='panel panel-body' style='background: linear-gradient(rgb(225,225,225),white);border: 1px solid rgb(222,222,222);'>")
            news.push("<a target='_blank' href='" + item["Url"] + "'>" + item["Title"] + "</a><br><br>");
            news.push(item["Description"] + "<br><br><br>");
            news.push("<label>Publisher: " + item["Source"] + "</label><br><br>");
            news.push("<label>Date: " + moment(item["Date"]).format("DD MMM YYYY HH:mm:ss") + "</label><br><br>");
            news.push("</div>");
        });
        $("#NewsFeed").html(news.join(""));
    });
}

//Tab - Historical Charts
function ajaxSubmit2(i) {
    var sym = i;
    var dur = 1095;
    new Markit.InteractiveChartApi(sym, dur);
}

$(function () {
    //Query AutoComplete
    $("#stock").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: 'index.php',
                data: {input: $("#stock").val()},
                type: 'GET',
                dataType: 'json',
                success: function (data) {
                    response($.map(data, function (item) {
                        return {
                            label: item.Symbol + " - " + item.Name + " ( " + item.Exchange + " ) ",
                            value: item.Symbol
                        }
                    }))
                },
                error: function (response, txtStatus) {
                 }
            });
        },
        focus: function () {
            return false;
        }
    });


    // Button "prev" - navigate to Stock Details section
    $("#prev").click(function () {
        $("#myCarousel").carousel(0);
    });

    // Button "next" - navigate to Favorite List section
    $("#next").click(function () {
        //initial Button "favorite"
        if (favoritelist.indexOf(stockdata["Symbol"])>=0) {
            $("#favorite").find("span").css("color","rgb(255, 255, 7)");
        } else {
            $("#favorite").find("span").css("color","rgb(255, 255, 255)");
        }

        $("#myCarousel").carousel(1);
    });

    // Button "refresh"
    $("#refresh").click(function () {
        refresh();
    });

    //Button "autoRefresh"
    //Initial
    $("#autoRefresh").bootstrapToggle("off");
    //Swich
    $('#autoRefresh').change(function () {
        if ($(this).prop('checked')) {
            time(this);
        }
    })
    //TimeSet
    function time(i) {
        if (!$(i).prop('checked')) return;
        refresh();
        setTimeout(time, 5000, i);
    }

    //Button "clear"
    $("#clear").click(function () {
        $("#stock").val("");
        $("#Invalid").html("");
        $("#myCarousel").carousel(0);
        $("#next").attr("disabled", true);
    });


    //Initial tooltip
    //$("[data-toggle='tooltip']").tooltip();
});


//Add row to Favorite List
function addRow() {
    var row = Array();
    row.push("<td><a href='#' onclick='jump(this)'>" +stockdata["Symbol"] + "</a></td>");
    row.push("<td>" + stockdata["Name"] + "</td>");
    row.push("<td>$ " + stockdata["LastPrice"] + "</td>");
    row.push(stockdata["Change"]);
    row.push(stockdata["MarketCap"]);
    row.push("<td><button class='btn btn-sm btn-default' onclick='deleteRow(this)'><span class='glyphicon glyphicon-trash'></span></button></td>");
    $("#FavoriteTable").append("<tr ip='" + stockdata["Symbol"] + "'>" + row.join("") + "</tr>");
}

//Delete row from Favorite List
function deleteStock(i) {
    var len = $("#FavoriteTable tr").length;
    for (var k = 1; k < len; k++) {
        var row = $("#FavoriteTable tr:eq(" + k + ")");
        if (row.attr("ip") == i) {
            row.remove();
            break;
        }
    }

}

//Button "favorite"
function favoriteStock() {
    var span = $("#favorite").find("span");

    var storage = window.localStorage;
    var index=favoritelist.indexOf(stockdata["Symbol"]);
    if (index>=0) {
        favoritelist.splice(index,1);
        storage.setItem("stockList",favoritelist);
        deleteStock(stockdata["Symbol"]);
        span.css("color","rgb(255,255,255)");
    } else {
        favoritelist.push(stockdata["Symbol"]);
        storage.setItem("stockList",favoritelist);
        addRow();
        span.css("color","rgb(255,255,7)");
    }

}

//Button "delete"
function deleteRow(i) {
    var row = $(i).parent().parent();
    favoritelist.splice(favoritelist.indexOf(row.attr("ip")),1);
    window.localStorage.setItem("stockList",favoritelist);
    row.remove();

}

//Display Favorite List when refresh window
function displayList() {
    for (var i = 0; i < favoritelist.length; i++) {
        var row = Array();
        row.push("<td><a href='#' onclick='jump(this)'>" + favoritelist[i] + "</a></td>");
        row.push("<td></td><td></td><td></td><td></td>")
        row.push("<td><button class='btn btn-sm btn-default' onclick='deleteRow(this)'><span class='glyphicon glyphicon-trash'></span></button></td>");
        $("#FavoriteTable").append("<tr ip='" +  favoritelist[i] + "'>" + row.join("") + "</tr>");
    }
    refresh(1);
}

//Navigate stock in Favorite List to Stock Details section
function jump(i) {
    ajaxSubmit($(i).parent().parent().attr("ip"));
}

//Refresh row in Favorite List - ajax
function refreshRow(i,opt) {
    $.ajax({
        url: 'index.php',
        data: {symbol: $("#FavoriteTable tr:eq(" + i + ") td:eq(0)").text()},
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            if(opt==1) {
                $("#FavoriteTable tr:eq(" + i + ") td:eq(1)").html(data["Name"]);
            }

            $("#FavoriteTable tr:eq(" + i + ") td:eq(2)").html("$ " + data["LastPrice"].toFixed(2));

            if (data["Change"].toFixed(2) > 0) {
                $("#FavoriteTable tr:eq(" + i + ") td:eq(3)").attr("class", "text-success");
                $("#FavoriteTable tr:eq(" + i + ") td:eq(3)").html(data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/up.png'>");
            } else if (data["Change"].toFixed(2) < 0) {
                $("#FavoriteTable tr:eq(" + i + ") td:eq(3)").attr("class", "text-danger");
                $("#FavoriteTable tr:eq(" + i + ") td:eq(3)").html(data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% ) <img src='http://cs-server.usc.edu:45678/hw/hw8/images/down.png'>");
            } else {
                $("#FavoriteTable tr:eq(" + i + ") td:eq(3)").attr("class", "");
                $("#FavoriteTable tr:eq(" + i + ") td:eq(3)").html(data["Change"].toFixed(2) + " ( " + data["ChangePercent"].toFixed(2) + "% )</td>");
            }

            if(opt==1){
                var market_Cap1 = (data["MarketCap"] / 1000000000).toFixed(2);
                var market_Cap2 = (data["MarketCap"] / 1000000).toFixed(2);
                if (market_Cap1 >= 1.00) {
                    $("#FavoriteTable tr:eq(" + i + ") td:eq(4)").html( market_Cap1+" Billion");
                } else if (market_Cap2 >= 1.00) {
                    $("#FavoriteTable tr:eq(" + i + ") td:eq(4)").html( market_Cap2+" Million");
                } else {
                    $("#FavoriteTable tr:eq(" + i + ") td:eq(4)").html( data["MarketCap"].toFixed(2));
                }
            }
        }
    });

}

//Refresh Favorite List
function refresh(opt) {
    var len = $("#FavoriteTable tr").length;
    for (var i = 1; i < len; i++) {
        refreshRow(i,opt);

    }
}

//Button "facebook"
function share() {
    FB.ui({
            method: 'feed',
            name: 'Current Stock Price of ' + stockdata["Name"] + ' is $' + stockdata["LastPrice"],
            link: 'http://dev.markitondemand.com/',
            description: 'Stock Information of ' + stockdata["Name"] + ' (' + stockdata["Symbol"] + ')',
            caption: 'LAST TRADE PRICE: $ ' + stockdata["LastPrice"] + ', CHANGE: ' + stockdata["ChangeForFB"],
            picture: stockdata["Image"]
        },
        function (response) {
            if (response && response.post_id) {
                alert('Posted Successfully');
            } else {
                alert('Not Posted');
            }
        }
    );
}