import { CONFIG_DIR, SIMILAR_MATCH_MIN } from "./utils/configuration";
import { getArtistTopAlbumsByName, getRecentArtists, getSimilarArtistByName, LFSimilarArtist } from "./services/lastfm";
import { getReleaseGroupId, isStudio, MBReleaseGroup } from "./services/music-brainz";
import { ArtistInfo } from "./types";
import { loadUtf8JsonFile } from "./utils/utils";

interface SimilarCount {
    artist: LFSimilarArtist,
    count: number
}

(async () => {
    const artistInfos = await loadUtf8JsonFile(`${CONFIG_DIR}/artist-info.json`) as Record<string, ArtistInfo>;

    const releaseGroupIds = new Set<string>(Object.values(artistInfos).map(a => a.releaseGroupIds).flatMap(r => r));

    const recentArtists = await getRecentArtists();
    recentArtists.sort((a, b) => b.count - a.count);

    console.log();
    console.log("Play count");
    recentArtists.forEach(a => console.log(a.name, a.count));

    const similarCount = {} as Record<string, SimilarCount>;

    console.log();
    for (const artist of recentArtists) {
        console.log("Fetching similar artists for ", artist.name);

        var similar = /*artist.mbid ? await getSimilarArtistById(artist.mbid) : */await getSimilarArtistByName(artist.name);
        similar = similar.filter(s => s.match >= SIMILAR_MATCH_MIN);

        for (const s of similar) {
            if (similarCount[s.name] === undefined) {
                similarCount[s.name] = {
                    artist: s,
                    count: 1,
                }
            } else {
                similarCount[s.name].count += 1;
            }
        }
    }

    const moreThanOnce = Object.values(similarCount)
        .filter(s => s.count > 1)
        .sort((a, b) => (b.count * b.artist.match) - (a.count * a.artist.match));

    console.log();
    console.log('Checking', moreThanOnce.map(a => a.artist.name));

    const suggestions: { artist: string, albums: string[] }[] = [];

    for (const artist of moreThanOnce) {
        const topAlbums = await getArtistTopAlbumsByName(artist.artist.name);
        const albums: MBReleaseGroup[] = [];
        for (const album of topAlbums) {
            if (album.mbid === undefined) {
                continue;
            }
            const releaseGroup = await getReleaseGroupId(album.mbid);
            if (isStudio(releaseGroup) && !releaseGroupIds.has(releaseGroup?.id ?? '')) {
                albums.push(releaseGroup!);
            } else if (releaseGroupIds.has(releaseGroup?.id ?? '')) {
                console.log('Already have', releaseGroup?.title);
            }
        }
        suggestions.push({ artist: artist.artist.name, albums: albums.map(a => a.title) });
        console.log('For', suggestions[suggestions.length - 1].artist, 'found', suggestions[suggestions.length - 1].albums.length, 'new');
    }

    console.log();
    console.log('Suggestions:');
    suggestions.filter(s => s.albums.length > 0).forEach(s => console.log(s.artist, s.albums));

    // const topAlbums = await getArtistTopAlbumsByName(recentArtists[1].name);
    // console.log(topAlbums[0]);

    // const releaseGroup = await getReleaseGroupId(topAlbums[0].mbid);
    // console.log(releaseGroup);

    // console.log('Have album', releaseGroupIds.has(releaseGroup?.id ?? ''));

    // console.log('Studio Album', isStudio(releaseGroup));

    // console.log(response.recenttracks.track);
})();