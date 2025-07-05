# album-suggest

Correlates the albums in Plex with the Plex Music directory and then users Last.FM and MusicBrainz to suggest additional albums using your scrobbling history with Last.FM

## Pre-requistes

1, Set-up scrobbling with Last.FM (https://plex.tv/users/other-services)
2, Install node

## Instalation

1, Run `npm install` to install the `node_modules`
2, Get an API Key from Last.FM (https://www.last.fm/api/authentication)
3, Get API key for your Plex server.

### Configure .env file

1, Create a `.env` file with the following values:
1, `LASTFM_APIKEY` and `LASTFM_USERNAME` containing your Last.FM API key and user name to scan.
1, `PLEX_SERVER_URL` to be the base URL of your Plex server, i.e. `PLEX_SERVER_URL=http://localhost:32400`
1, `PLEX_TOKEN` as the API token for your Plex server.
1, `LIBRARY_ID` to the ID of the Plex library containing your music. Open your music library in a browser and look for the number in the URL after `source`, i.e. `?source=3`
1, `MUSIC_DIR` to be the local share with your music. This must be accessible from the machine you run `album-suggest` on.
1, `PLEX_MUSIC_DIR` directory on your Plex server holding your music.

## Steps to run

1, Scan the albums in Plex using `npx tsx scan-albums`. This will generate some local configuration in `./config`.
1, Fetch information about the artists by running `npx tsx fetch-artists`
1, Suggest albums with `npx tsx suggest-albums`

For the tool to succeed the files need to be tagged correctly. It will tell you how many paths have issues and list them.
