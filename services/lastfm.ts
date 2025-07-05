import fs from "fs";
import fetch from "node-fetch";
import { getReleaseGroupId, isStudio, MBReleaseGroup } from "./music-brainz";
import { loadUtf8JsonFile } from "../utils/utils";
import { ArtistInfo } from "../types";
import { LASTFM_APIKEY, LASTFM_BASEURL, LASTFM_USERNAME, MAX_POP_ALBUMS, USER_AGENT_STRING } from "../utils/configuration";

const doRequest = async (method: string, params: Record<string, string | number>) => {
    // await applyThrottle();

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => searchParams.set(key, value.toString()))
    searchParams.set('method', method);
    searchParams.set('api_key', LASTFM_APIKEY);
    searchParams.set('format', 'json');
    console.log(searchParams.toString());
    const response = await fetch(`${LASTFM_BASEURL}?` + searchParams.toString(), {
        method: "GET",
        headers: {
            "User-Agent": USER_AGENT_STRING,
            "Accept": "application/json"
        },
    });
    const json = await response.json();
    return json;
}

type ImageSize = 'small' | 'medium' | 'large' | 'extralarge';
type UUID = string;
type NumberAsString = string;
type FloatAsString = string;
type BooleanFlag = '0' | '1';

interface LFImage {
    size; ImageSize;
    '#text': string;
}

interface LFRecentTrack {
    artist: { mbid: UUID, '#text': string },
    streamable: BooleanFlag,
    image: LFImage[],
    mbid: string,
    album: {
        mbid: UUID,
        '#text': string
    },
    name: string,
    url: string,
    date: { uts: number, '#text': string }
}

interface LFRecentTrackResponse {
    recenttracks: {
        track: LFRecentTrack[],
        '@attr': {
            totalPages: string;
        }
    }
}

interface LFArtistBio {
    links: any[];
    published: string,
    content: string,
}

export interface LFSimilarArtist {
    name: string,
    mbid: UUID,
    match: number,
    url: string,
    image: LFImage[],
    streamable: boolean,
}

interface LFArtistInfo {
    name: string,
    url: string,
    image: LFImage[],
    streamable: BooleanFlag,
    ontour: BooleanFlag,
    stats: { listeners: NumberAsString, playcount: NumberAsString },
    similar: { artist: LFSimilarArtist[] },
    tags: { tag: { name: string, url: string }[] },
    bio: LFArtistBio
}

interface LFSimilarArtistResponse {
    similarartists: {
        artist: {
            name: string,
            mbid: UUID,
            match: FloatAsString,
            url: string,
            image: LFImage[],
            streamable: BooleanFlag,
        }[]
    },
    '@attr': { artist: string }
}

export interface LFSimilarArtist {
    name: string,
    mbid: UUID,
    match: number,
    url: string,
    image: LFImage[],
    streamable: boolean,
}

const mapSimilarArtistResponse = (response: LFSimilarArtistResponse) => {
    return response.similarartists.artist.map(sa => (
        {
            name: sa.name,
            mbid: sa.mbid,
            match: parseFloat(sa.match),
            url: sa.url,
            image: sa.image,
            streamable: sa.streamable === '1',
        } as LFSimilarArtist
    ));
};

const getArtistInfo = async (artistName: string) => {
    const response = (await doRequest("artist.getInfo", { artist: artistName })) as LFSimilarArtistResponse;
    return mapSimilarArtistResponse(response);
}

export const getSimilarArtistByName = async (artistName: string, limit: number = 50) => {
    const response = (await doRequest("artist.getSimilar", { artist: artistName, limit })) as LFSimilarArtistResponse;
    return mapSimilarArtistResponse(response);
}

const getSimilarArtistById = async (id: string, limit: number = 50) => {
    const response = (await doRequest("artist.getSimilar", { mbid: id, limit })) as LFSimilarArtistResponse;
    return mapSimilarArtistResponse(response);
}

interface LFTopAlbumsResponse {
    topalbums: {
        album: {
            name: string,
            playcount: 10425,
            mbid: UUID,
            url: string,
            artist: {
                name: string,
                mbid: UUID,
                url: string
            },
            image: LFImage[]
        }[]
    },
    '@attr': {
        artist: string,
        page: string,
        perPage: string,
        totalPages: string,
        total: string,
    }
}

export const getArtistTopAlbumsByName = async (artistName: string, limit: number = (MAX_POP_ALBUMS * 2)) => {
    const response = (await doRequest("artist.getTopAlbums", { artist: artistName, limit })) as LFTopAlbumsResponse;
    return response.topalbums.album;
}

export const getArtistTopAlbumsById = async (id: string, limit: number = (MAX_POP_ALBUMS * 2)) => {
    const response = (await doRequest("artist.getTopAlbums", { mbid: id, limit })) as LFTopAlbumsResponse;
    return response.topalbums.album;
}

export const getRecentPageOfTracks = async (start: number, end: number, page: number): Promise<LFRecentTrackResponse> => {
    return (await doRequest("user.getRecentTracks", { user: LASTFM_USERNAME, from: start, to: end, limit: 200, page: page })) as LFRecentTrackResponse;
}

export const getRecentTracks = async (start: number, end: number, maxPages: number = 10): Promise<LFRecentTrack[]> => {
    const tracks: LFRecentTrack[] = [];
    for (var page = 1; page < maxPages; page++) {
        const response = await getRecentPageOfTracks(start, end, page);
        tracks.push(...response.recenttracks.track);
        const totalPages = parseInt(response.recenttracks['@attr'].totalPages) ?? 1;
        maxPages = Math.min(totalPages, maxPages);
    }
    return tracks;
}

interface LFArtistPlayCount { name: string, mbid: string, count: number };

export const countPlays = (tracks: LFRecentTrack[]): LFArtistPlayCount[] => {
    const artistPlays: Record<string, { name: string, mbid: string, count: number }> = {};
    tracks.map(t => t.artist).map(a => {
        const name = a["#text"];
        if (!artistPlays[name]) {
            artistPlays[name] = { name, mbid: a.mbid, count: 1 };
        } else {
            artistPlays[name].count += 1;
        }
        if (!artistPlays[name].mbid) {
            artistPlays[name].mbid = a.mbid;
        }
    });
    return Object.values(artistPlays);
};

const RECENT_MONTHS = 3;

export const getRecentArtists = async (): Promise<LFArtistPlayCount[]> => {
    const end = Math.trunc(new Date().getTime() / 1000);
    const start = end - (RECENT_MONTHS * 30 * 24 * 3600);
    const playedTracks = await getRecentTracks(start, end);

    const artistPlayCount = countPlays(playedTracks);

    const qualifyingArtists = artistPlayCount.filter(a => a.count > 2);
    return qualifyingArtists;
}



