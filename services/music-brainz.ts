import fs from "fs";
import fetch from "node-fetch";
import { MUSIC_BRAINZ_BASEURL, USER_AGENT_STRING } from "../utils/configuration";

const THROTTLE_TIME = 1000;

var lastCallTime = 0;
var isEnableDebugLog = false;

export const enableDebugLog = () => {
    isEnableDebugLog = true;
}

const applyThrottle = async () => {
    const now = Date.now();
    const waitTime = Math.max(0, THROTTLE_TIME - (now - lastCallTime));

    if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastCallTime = Date.now();
}

const doGet = async (url: string, searchParams: URLSearchParams) => {
    await applyThrottle();

    if (isEnableDebugLog) {
        console.log(url, searchParams);
    }
    const response = await fetch(`${MUSIC_BRAINZ_BASEURL}/${url}?` + searchParams.toString(), {
        method: "GET",
        headers: {
            "User-Agent": USER_AGENT_STRING,
            "Accept": "application/json"
        },
    });
    const json = await response.json();
    if (isEnableDebugLog) {
        console.log(json);
    }
    return json;
};

export const getArtistInfo = async (id) => {
    await applyThrottle();

    const searchParams = new URLSearchParams();
    searchParams.set('inc', 'release-groups');
    const json = await doGet(`artist/${id}`, searchParams);
    return mapArtistInfo(json as Record<string, any>);
}

export const getReleaseGroupId = async (rel_id): Promise<MBReleaseGroup | undefined> => {
    await applyThrottle();

    const searchParams = new URLSearchParams();
    searchParams.set('inc', 'release-groups');
    const json = await doGet(`release/${rel_id}`, searchParams) as Record<string, object>;
    return json['release-group'] ? mapReleaseGroup(json['release-group']) : undefined;
}

type ArtistType = 'Person' | 'Group' | 'Orchestra' | 'Choir' | 'Character' | 'Other';

type DateString = string; // 'yyyy-mm-dd'

type UUID = string;

type ISOCountryCode = string;

interface MBArtistLifeSpan {
    ended: boolean;
    begin: DateString;
    end: DateString
}

interface MBArtistGeography {
    id: UUID;
    sortName: string;
    name: string;
    type: null;
    typeId: null;
    disambiguation: string;
    iso31662Codes: string[]
}

const mapArtistGeography = (from: Record<string, any>): MBArtistGeography | undefined => {
    if (!from) {
        return undefined;
    }
    return {
        id: from['id'],
        sortName: from['sort-name'],
        name: from['name'],
        type: from['type'],
        typeId: from[''],
        disambiguation: from['disambiguation'],
        iso31662Codes: from['iso-3166-2-codes'],
    };
}

type PrimaryReleaseGroupType = 'Album' | 'Single' | 'EP' | 'Broadcast' | 'Other';
type SecondaryReleaseGroupType = 'Soundtrack' | 'Spokenword' | 'Interview' | 'Audiobook' | 'Audio drama' | 'Live' | 'Remix' | 'DJ-mix' | 'Mixtape/Street' | 'Demo' | 'Field recording';

export interface MBReleaseGroup {
    id: UUID;
    title: string;
    firstReleaseDate: string;
    primaryTypeId: UUID;
    primaryType: PrimaryReleaseGroupType;
    secondaryTypes: SecondaryReleaseGroupType[];
    secondaryTypeIds: UUID[];
    disambiguation: string;
}

const mapReleaseGroup = (from: Record<string, any>): MBReleaseGroup => {
    return {
        id: from['id'],
        title: from['title'],
        firstReleaseDate: from['first-release-date'],
        primaryTypeId: from['primary-type-id'],
        primaryType: from['primary-type'],
        secondaryTypes: from['secondary-types'],
        secondaryTypeIds: from['secondary-type-ids'],
        disambiguation: from['disambiguation'],
    };
}

interface MBArtistInfo {
    id: UUID;
    name: string;
    disambiguation: string;
    country: ISOCountryCode;
    gender: string;
    genderId: UUID;
    sortName: string;
    type: ArtistType;
    ipis: string[];
    lifeSpan: MBArtistLifeSpan;
    isnis: string[];
    releaseGroups: MBReleaseGroup[];
    typeId: string;
    area?: MBArtistGeography;
    beginArea?: MBArtistGeography;
    endArea?: MBArtistGeography;
}

const mapArtistInfo = (from: Record<string, any>): MBArtistInfo => {
    return {
        id: from['id'],
        name: from['name'],
        disambiguation: from['disambiguation'],
        country: from['country'],
        gender: from['gender'],
        genderId: from['gender-id'],
        sortName: from['sort-name'],
        type: from['type'],
        ipis: from['ipis'],
        lifeSpan: from['life-span'],
        isnis: from['isnis'],
        releaseGroups: from['release-groups'].map(rg => mapReleaseGroup(rg)),
        typeId: from['type-id'],
        area: mapArtistGeography(from['area']),
        beginArea: mapArtistGeography(from['begin-area']),
        endArea: mapArtistGeography(from['end-area']),
    };
}

const BAD_SEC = new Set([
    "Compilation", "Live", "Remix", "Soundtrack", "DJ-Mix",
    "Mixtape/Street", "EP", "Single", "Interview", "Audiobook"
]);

export const isStudio = (releaseGroup?: MBReleaseGroup): boolean =>
    releaseGroup !== undefined && releaseGroup.primaryType === 'Album' &&
    !releaseGroup.secondaryTypes.some(type => BAD_SEC.has(type));
