import * as mm from "music-metadata";
import { getPlexAlbums, getPlexAlbumTracks } from "../services/plex";
import { ArtistInfo } from "../types";

import { loadUtf8JsonFile, toTitleCase } from "../utils/utils";

const ALBUM_ARTIST_ID = 'MUSICBRAINZ_ALBUMARTISTID';
const ALBUM_ID = 'MUSICBRAINZ_ALBUMID';
const RELEASE_GROUP_ID = 'MUSICBRAINZ_RELEASEGROUPID';

export const scanAlbums = async ({ musicDir, plexMusicDir }: { musicDir?: string, plexMusicDir?: string }): Promise<{
    artistInfo?: Record<string, ArtistInfo>,
    pathsToFix?: string[],
    editions?: string[],
}> => {
    if (musicDir === undefined || plexMusicDir === undefined) {
        console.log("No music directories supplied");
        return {};
    }

    const albums = await getPlexAlbums();
    console.log(`Got ${albums.length} albums from Plex`);

    const unique = new Set<string>();

    const pathsToFix: string[] = [];

    const artistInfo: Record<string, ArtistInfo> = {};

    for (const album of albums) {
        const tracks = await getPlexAlbumTracks(album.ratingKey);

        const filePath = `${musicDir}${tracks[0].file.substring(plexMusicDir.length)}`;
        const metadata = await mm.parseFile(filePath);

        const artistId = metadata.native.vorbis?.filter(t => t.id === ALBUM_ARTIST_ID).map(t => t.value).at(0) as string;
        const artistName = metadata.common.albumartist;// ?? metadata.common.artist;
        const artistNameSort = metadata.common.albumartistsort;
        const albumId = metadata.native.vorbis?.filter(t => t.id === ALBUM_ID).map(t => t.value).at(0) as string;
        const releaseGroupId = metadata.native.vorbis?.filter(t => t.id === RELEASE_GROUP_ID).map(t => t.value).at(0) as string;

        if (!artistName && !artistId) {
            pathsToFix.push(filePath);
        }

        if (artistId) {
            if (artistInfo[artistId] === undefined) {
                artistInfo[artistId] = {
                    id: artistId,
                    name: artistName,
                    nameSort: artistNameSort,
                    albumIds: [],
                    releaseGroupIds: []
                }
            }
            artistInfo[artistId].albumIds.push(albumId);
            artistInfo[artistId].releaseGroupIds.push(releaseGroupId);
        }

        const disambig = metadata.native.vorbis?.filter(i => i.id === 'MUSICBRAINZ_ALBUMCOMMENT').map(i => i.value?.toString()).filter(v => v?.length)?.[0];
        if (disambig?.length) {
            unique.add(toTitleCase(disambig));
        }
    }

    return { artistInfo, pathsToFix, editions: Array.from(unique) };
};