var Geocoder = function() {
    var root = this;

    var mapitAreaTypesToStore = [
        "CTY",
        "DIS",
        "LBO",
        "MTD",
        "LGD",
        "UTA",
        "NIE",
        "SPC",
        "WAC",
        "WMC" 
    ];

    var isRunning = false;
    var $start = $('.js-start');
    var $stop = $('.js-stop');
    var $apikey = $('.js-apikey');
    var $progress = $('.js-progress');
    var $input = $('.js-input');
    var $outputTextarea = $('.js-output-textarea');
    var $outputTable = $('.js-output-table');

    this.start = function() {
        isRunning = true;
        $start.attr('disabled', true);
        $input.attr('disabled', true);
        $stop.attr('disabled', false);
        $outputTextarea.val('');
        $outputTable.empty();
        processInput();
    };

    this.stop = function() {
        isRunning = false;
        $start.attr('disabled', false);
        $input.attr('disabled', false);
        $stop.attr('disabled', true);
        updateProgress(0, 0);
    };

    var processInput = function(){
        var postcodes = $input.val().split('\n');
        var apikey = $apikey.val();
        var n = postcodes.length;
        var i = 0;

        var settings = getSettings();
        var outputCols = getOutputCols();

        var geocodeNextPostcode = function(){
            updateProgress(i, n);

            getPostcodeResult(
                postcodes[i],
                apikey
            ).done(function(rowData){
                outputRow(rowData, outputCols);
            }).always(function(){
                i += 1;
                if ( i < n && isRunning ){
                    geocodeNextPostcode();
                } else {
                    root.stop();
                }
            });
        };

        if ( settings["outputHeaders"] ) {
            outputRow(false, outputCols);
        }

        if ( isRunning ) {
            geocodeNextPostcode();
        }
    };

    var getOutputCols = function(){
        var outputCols = [];
        var settings = getSettings();

        if ( settings["postcode"] ) {
            outputCols.push("postcode");
        }

        if ( settings["latlon"] ) {
            outputCols.push("wgs84_lat");
            outputCols.push("wgs84_lon");
        }

        if ( settings["os"] ) {
            outputCols.push("northing");
            outputCols.push("easting");
        }

        if ( settings["local-authorities"] ) {
            outputCols.push("cty_name");
            outputCols.push("cty_gss");
            outputCols.push("dis_name");
            outputCols.push("dis_gss");
            outputCols.push("lbo_name");
            outputCols.push("lbo_gss");
            outputCols.push("mtd_name");
            outputCols.push("mtd_gss");
            outputCols.push("lgd_name");
            outputCols.push("lgd_gss");
            outputCols.push("uta_name");
            outputCols.push("uta_gss");
        }

        if (settings["parliamentary-constituencies"] ) {
            outputCols.push("nie_name");
            outputCols.push("nie_oid");
            outputCols.push("spc_name");
            outputCols.push("spc_gss");
            outputCols.push("wac_name");
            outputCols.push("wac_gss");
            outputCols.push("wmc_name");
            outputCols.push("wmc_gss");
        }

        return outputCols;
    };

    var getSettings = function(){
        return JSON.parse( window.localStorage.getItem('settings') ) || {};
    };

    var setSettings = function(settings){
        return window.localStorage.setItem('settings', JSON.stringify(settings));
    };

    var getPostcodeResult = function(postcode, apikey){
        var dfd = $.Deferred();
        var cleanedPostcode = cleanPostcode(postcode);
        var ajaxCache = window.localStorage.getItem('ajaxCache');

        // Nothing cached yet! Let’s set up a new empty cache.
        if ( ajaxCache === null ) {
            ajaxCache = {};
        } else {
            ajaxCache = JSON.parse( ajaxCache );
        }

        if ( cleanedPostcode === '' ) {
            // Return an empty string if an empty string was passed in.
            dfd.resolve( [''] );
        } else if ( ajaxCache.hasOwnProperty(cleanedPostcode) ) {
            // Return cached result if it exists (no need to rate limit).
            dfd.resolve( ajaxCache[cleanedPostcode] );
        } else {
            $.ajax({
                url: 'https://mapit.mysociety.org/postcode/' + cleanedPostcode,
                dataType: 'json',
                data: {
                    api_key: apikey
                }
            }).done(function(data){
                var rowData = {
                    "postcode": data.postcode,
                    "wgs84_lat": data.wgs84_lat,
                    "wgs84_lon": data.wgs84_lon,
                    "easting": data.easting,
                    "northing": data.northing,
                    "areas": {}
                };
                $.each(data.areas, function(mapitAreaId, area){
                    if ( mapitAreaTypesToStore.indexOf(area.type) !== -1 ) {
                        rowData["areas"][area.type] = {
                            "name": area.name,
                            "codes": area.codes
                        };
                    }
                });
                ajaxCache[cleanedPostcode] = rowData;
            }).fail(function(jqXHR){
                console.log( jqXHR.responseJSON.error );
                ajaxCache[cleanedPostcode] = {
                    "postcode": postcode
                };
            }).always(function(){
                // Save API response for next time.
                window.localStorage.setItem( 'ajaxCache', JSON.stringify(ajaxCache) );
                // Wait 1 second before returning, to respect MapIt rate limit.
                setTimeout(
                    function(){
                        dfd.resolve( ajaxCache[cleanedPostcode] );
                    },
                    1000
                );
            });
        }

        return dfd.promise();
    };

    var cleanPostcode = function(postcode){
        return postcode.toUpperCase().replace(/[^A-Z0-9]/, '');
    };

    // Gets data from first param, column order from second param.
    // Pass false as first param to output a "header" row.
    var outputRow = function(rowData, outputCols) {
        var settings = getSettings();

        if ( rowData ) {
            var flattenedRowData = flattenRowData(rowData);
            var cells = $.map(outputCols, function(col){
                return flattenedRowData[col] || "";
            });
        } else {
            var cells = outputCols;
        }

        if ( settings["outputFormat_text"] ) {
            $outputTextarea.show();
            $outputTable.hide();
            $outputTextarea.val( $outputTextarea.val() + cells.join('\t') + '\n');
            $outputTextarea.scrollTop( $outputTextarea[0].scrollHeight );
        } else {
            $outputTable.show();
            $outputTextarea.hide();
            if ( rowData ) {
                $row = $('<tr>');
                $.each(cells, function(i, text){
                    $('<td>').text(text).appendTo($row);
                });
                if ( ! $outputTable.find('tbody').length ) {
                    var $tbody = $('<tbody>').appendTo($outputTable);
                }
                $outputTable.find('tbody').append($row);
            } else {
                $row = $('<tr>');
                $.each(cells, function(i, text){
                    $('<th>').text(text).appendTo($row);
                });
                $row.wrap('<thead>').parent().appendTo($outputTable);
            }
            $outputTable.parent().scrollTop( $outputTable.parent()[0].scrollHeight );
        }
    };

    // rowData is a multi-dimensional object, eg:
    // { postcode: "x", areas: { MTD: { name: "y", codes: { gss: "z", … } }, WMC: {…} } }
    // but output columns are defined as a flat list, eg:
    // [ "postcode", "mtd_name", "mtd_gss", … ]
    // So this function converts the multi-dimensional data, into a single dimension,
    // making it easy to pluck out just the columns we want later on.
    var flattenRowData = function(rowData){
        return {
            "postcode": rowData["postcode"],
            "wgs84_lat": rowData["wgs84_lat"],
            "wgs84_lon": rowData["wgs84_lon"],
            "easting": rowData["easting"],
            "northing": rowData["northing"],
            "cty_name": rowData["areas"] && rowData["areas"]["CTY"] ? rowData["areas"]["CTY"]["name"] : undefined,
            "cty_gss": rowData["areas"] && rowData["areas"]["CTY"] ? rowData["areas"]["CTY"]["codes"]["gss"] : undefined,
            "dis_name": rowData["areas"] && rowData["areas"]["DIS"] ? rowData["areas"]["DIS"]["name"] : undefined,
            "dis_gss": rowData["areas"] && rowData["areas"]["DIS"] ? rowData["areas"]["DIS"]["codes"]["gss"] : undefined,
            "lbo_name": rowData["areas"] && rowData["areas"]["LBO"] ? rowData["areas"]["LBO"]["name"] : undefined,
            "lbo_gss": rowData["areas"] && rowData["areas"]["LBO"] ? rowData["areas"]["LBO"]["codes"]["gss"] : undefined,
            "mtd_name": rowData["areas"] && rowData["areas"]["MTD"] ? rowData["areas"]["MTD"]["name"] : undefined,
            "mtd_gss": rowData["areas"] && rowData["areas"]["MTD"] ? rowData["areas"]["MTD"]["codes"]["gss"] : undefined,
            "lgd_name": rowData["areas"] && rowData["areas"]["LGD"] ? rowData["areas"]["LGD"]["name"] : undefined,
            "lgd_gss": rowData["areas"] && rowData["areas"]["LGD"] ? rowData["areas"]["LGD"]["codes"]["gss"] : undefined,
            "uta_name": rowData["areas"] && rowData["areas"]["UTA"] ? rowData["areas"]["UTA"]["name"] : undefined,
            "uta_gss": rowData["areas"] && rowData["areas"]["UTA"] ? rowData["areas"]["UTA"]["codes"]["gss"] : undefined,
            "nie_name": rowData["areas"] && rowData["areas"]["NIE"] ? rowData["areas"]["NIE"]["name"] : undefined,
            "nie_oid": rowData["areas"] && rowData["areas"]["NIE"] ? rowData["areas"]["NIE"]["codes"]["osni_oid"] : undefined,
            "spc_name": rowData["areas"] && rowData["areas"]["SPC"] ? rowData["areas"]["SPC"]["name"] : undefined,
            "spc_gss": rowData["areas"] && rowData["areas"]["SPC"] ? rowData["areas"]["SPC"]["codes"]["gss"] : undefined,
            "wac_name": rowData["areas"] && rowData["areas"]["WAC"] ? rowData["areas"]["WAC"]["name"] : undefined,
            "wac_gss": rowData["areas"] && rowData["areas"]["WAC"] ? rowData["areas"]["WAC"]["codes"]["gss"] : undefined,
            "wmc_name": rowData["areas"] && rowData["areas"]["WMC"] ? rowData["areas"]["WMC"]["name"] : undefined,
            "wmc_gss": rowData["areas"] && rowData["areas"]["WMC"] ? rowData["areas"]["WMC"]["codes"]["gss"] : undefined
        };
    };

    var updateProgress = function(current, max) {
        var percent = 100 * current / max;
        $progress
            .html( Math.round(percent) + '%' )
            .attr( 'max', max )
            .val( current );
    };

    var setUpPostcodeInput = function(){
        var currentPostcodes = window.localStorage.getItem('input');
        if ( currentPostcodes ) {
            $input.val( currentPostcodes );
        }
        $input.on('blur', function(){
            window.localStorage.setItem( 'input', $input.val() );
        });
    }

    var setUpSettingsInput = function(){
        var currentSettings = getSettings();

        var defaultSettings = {
            "apikey": "",
            "outputFormat_text": true,
            "outputFormat_table": false,
            "outputHeaders": true,
            "postcode": true,
            "latlon": true,
            "os": false,
            "local-authorities": false,
            "parliamentary-constituencies": false
        }

        var settings = $.extend(defaultSettings, currentSettings);

        setSettings(settings);

        $.each(settings, function(id, value){
            var $el = $('#' + id);
            if ( $el.is('[type="checkbox"], [type="radio"]') ) {
                $el.attr('checked', value)
            } else {
                $el.val(value);
            }
        });

        $('.js-settings').on('change blur', function(){
            var settings = {};

            $(this).find('input[id]').each(function(){
                var $el = $(this);
                if ( $el.is('[type="checkbox"], [type="radio"]') ) {
                    settings[ $el.attr('id') ] = $el.prop('checked') ? true : false;
                } else {
                    settings[ $el.attr('id') ] = $el.val();
                }
            });

            setSettings(settings);
        });
    }

    var setUpOutput = function() {
        $outputTextarea.on('click', function(){
            $(this).select();
        });
    }

    setUpSettingsInput();
    setUpPostcodeInput();
    setUpOutput();
}

var geocodeit = new Geocoder();

$('.js-start').on('click', function(){
    geocodeit.start();
});

$('.js-stop').on('click', function(){
    geocodeit.stop();
});
