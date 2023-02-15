# geocodeit

## Use it online

👉 https://zarino.github.io/geocodeit/

Paste postcodes into the top textarea (one per line), then put your
[MapIt API key](https://mapit.mysociety.org) in, and press Start.

Geocodeit will call the MapIt API at most once per second, and caches
every response so it can avoid repeating calls for the same postcode.

Cleaned postcodes, latitudes, and longitudes are output into the lower
textarea, separated by tabs, so that you can copy and paste the entire
contents into a spreadsheet program.

## Running locally

Requirements:

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
- [Bundler](https://bundler.io/#getting-started)

Install all dependencies and get a local server running immediately, in one command:

    script/server

The site will be available at both <http://localhost:4000> and <http://0.0.0.0:4000>.

If you want to serve locally over SSL (recommended) then generate self-signed SSL certificates with:

    script/generate-ssl-certificates

Once the SSL certificates are in place, `script/server` will serve the site over HTTPS, at both <https://localhost:4000> and <https://0.0.0.0:4000>. (You will need to tell your web browser to accept the self-signed certificate.)

You can build the site to `_site` (without serving it) with:

    script/build
