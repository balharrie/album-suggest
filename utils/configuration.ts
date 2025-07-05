const dotenv = require('dotenv');
dotenv.config();

export const LASTFM_BASEURL = "https://ws.audioscrobbler.com/2.0/"
export const USER_AGENT_STRING = "album-suggest ( https://github.com/balharrie/album-suggest )";
export const MUSIC_BRAINZ_BASEURL = 'https://musicbrainz.org/ws/2';
export const LASTFM_APIKEY = process.env.LASTFM_APIKEY ?? '';
export const LASTFM_USERNAME = process.env.LASTFM_USERNAME ?? '';
export const MAX_POP_ALBUMS = parseInt(process.env.MAX_POP_ALBUMS ?? '5');
export const SIMILAR_MATCH_MIN = parseFloat(process.env.SIMILAR_MATCH_MIN ?? '0.46');
export const CONFIG_DIR = process.env.CONFIG_DIR ?? './config';
