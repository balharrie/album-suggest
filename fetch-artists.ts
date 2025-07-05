import fs from "fs";
import { getArtistInfo } from "./services/music-brainz";
import { ArtistInfo } from "./types";
import { loadUtf8JsonFile } from "./utils/utils";
import { CONFIG_DIR } from "./utils/configuration";

(async () => {

    const artistInfos = await loadUtf8JsonFile(`${CONFIG_DIR}/artist-info.json`) as Record<string, ArtistInfo>;

    for (const id of Object.keys(artistInfos)) {
        const info = await getArtistInfo(id);

        console.log(`${info.id} ${info.name}`);
        const dir = `${CONFIG_DIR}/artists/${info.id}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        await fs.writeFileSync(`${dir}/artist.json`, JSON.stringify(info, undefined, 4));
    }
})();