var Geocoder = function(options) {
    var root = this;
    var defaults = { };

    var isRunning = false;
    var $start = $('.js-start');
    var $stop = $('.js-stop');
    var $apikey = $('.js-apikey');
    var $progress = $('.js-progress');
    var $input = $('.js-input');
    var $output = $('.js-output');

    this.start = function() {
        isRunning = true;
        updateUI();
        $output.val('');
        processInput();
    };

    this.stop = function() {
        isRunning = false;
        updateUI();
    };

    var processInput = function(){
        var postcodes = $input.val().split('\n');
        var apikey = $apikey.val();
        var n = postcodes.length;
        var i = 0;

        var geocodeNextPostcode = function(){
            updateProgress(i, n);

            getPostcodeResult(
                postcodes[i],
                apikey
            ).done(
                outputData
            ).always(function(){
                i += 1;
                if ( i < n ){
                    geocodeNextPostcode();
                } else {
                    root.stop();
                }
            });
        };

        geocodeNextPostcode();
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

        if ( ajaxCache.hasOwnProperty(cleanedPostcode) ) {
            // Return cached result immediately (no need to rate limit).
            dfd.resolve( ajaxCache[cleanedPostcode] );
        } else {
            $.ajax({
                url: 'https://mapit.mysociety.org/postcode/' + cleanedPostcode,
                dataType: 'json',
                data: {
                    api_key: apikey
                }
            }).done(function(data){
                ajaxCache[cleanedPostcode] = [
                    data.postcode,
                    data.wgs84_lat,
                    data.wgs84_lon
                ];
            }).fail(function(jqXHR){
                console.log( jqXHR.responseJSON.error );
                ajaxCache[cleanedPostcode] = [
                    postcode
                ];
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

    var outputData = function(columns) {
        $output.val( $output.val() + columns.join('\t') + '\n');
        $output.scrollTop( $output[0].scrollHeight );
    };

    var updateProgress = function(current, max) {
        var percent = 100 * current / max;
        $progress
            .html( Math.round(percent) + '%' )
            .attr( 'max', max )
            .val( current );
    };

    var updateUI = function() {
        if ( isRunning ) {
            $start.attr('disabled', true);
            $apikey.attr('disabled', true);
            $input.attr('disabled', true);
            $stop.attr('disabled', false);
            updateProgress(10, 20);
        } else {
            $start.attr('disabled', false);
            $apikey.attr('disabled', false);
            $input.attr('disabled', false);
            $stop.attr('disabled', true);
            updateProgress(0, 0);
        }
    };

    var setUpApiKeyInput = function(){
        var currentKey = window.localStorage.getItem('apikey');
        if ( currentKey ) {
            $apikey.val( currentKey );
        }
        $apikey.on('blur', function(){
            window.localStorage.setItem( 'apikey', $apikey.val() );
        })
    }

    var setUpPostcodeInput = function(){
        var currentPostcodes = window.localStorage.getItem('input');
        if ( currentPostcodes ) {
            $input.val( currentPostcodes );
        }
        $input.on('blur', function(){
            window.localStorage.setItem( 'input', $input.val() );
        });
    }

    var setUpOutput = function() {
        $output.on('click', function(){
            $(this).select();
        })
    }

    $.extend(defaults, options);
    updateUI();
    setUpApiKeyInput();
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
