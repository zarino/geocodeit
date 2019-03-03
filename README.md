## geocodeit

👉 https://zarino.github.io/geocodeit/

Paste postcodes into the top textarea (one per line), then put your
[MapIt API key](https://mapit.mysociety.org) in, and press Start.

Geocodeit will call the MapIt API at most once per second, and caches
every response so it can avoid repeating calls for the same postcode.

Cleaned postcodes, latitudes, and longitudes are output into the lower
textarea, separated by tabs, so that you can copy and paste the entire
contents into a spreadsheet program.

## Developer setup

    cd geocodeit
    gem install bundler
    bundle install
    bundle exec jekyll serve --baseurl ''
