const dotenv = require('dotenv');
dotenv.config();

const plexAlbumListUrl: string = `${process.env.PLEX_SERVER_URL}/library/sections/${process.env.LIBRARY_ID}/albums`;
const plexAlbumDetailsUrl: string = `${process.env.PLEX_SERVER_URL}/library/metadata/`;
const plexToken: string | undefined = process.env.PLEX_TOKEN;

interface PlexTrack {
    type: 'track',
    title: string,
    albumKey: string,
    album: string,
    file: string,
    container: string,
}

interface PlexAlbum {
    type: 'album',
    guid: string,
    ratingKey: string,
    artist: string,
    title: string
}

export const getPlexAlbums = async (): Promise<PlexAlbum[]> => {
    try {
        const response = await fetch(`${plexAlbumListUrl}?X-Plex-Token=${plexToken}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        const json = await response.json();
        return json.MediaContainer.Metadata.map((album: any) => ({
            type: 'album',
            guid: album.guid,
            ratingKey: album.ratingKey,
            artist: album.parentTitle,
            title: album.title,
        }));
    } catch (error) {
        console.error('Error fetching Plex album metadata:', error);
        return [];
    }
}

export const getPlexAlbumTracks = async (ratingKey: string): Promise<PlexTrack[]> => {
    try {
        const response = await fetch(`${plexAlbumDetailsUrl}${ratingKey}/children?X-Plex-Token=${plexToken}&checkFIles=1`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        const json = await response.json();
        // console.log(json.MediaContainer.Metadata);
        return json.MediaContainer.Metadata.map((track: any) => ({
            type: 'track',
            guid: track.guid,
            albumKey: ratingKey,
            album: track.parentTitle,
            title: track.title,
            file: track.Media[0].Part[0].file,
            container: track.Media[0].Part[0].container
        }));
    } catch (error) {
        console.error('Error fetching Plex track metadata:', error);
        return [];
    }
}
