import fs from "fs";
import { scanAlbums } from "./operations/scan-albums";
import { loadUtf8JsonFile } from "./utils/utils";
import { CONFIG_DIR } from "./utils/configuration";

const dotenv = require('dotenv');
dotenv.config();


(async () => {
    const { artistInfo, pathsToFix, editions } = await scanAlbums({
        plexMusicDir: process.env.PLEX_MUSIC_DIR,
        musicDir: process.env.MUSIC_DIR
    });

    if (pathsToFix !== undefined) {
        console.log(`${pathsToFix.length} paths have tag issues`);
        if (pathsToFix.length > 0) {
            console.log(pathsToFix);
        }
    }

    if (artistInfo !== undefined) {
        console.log(`${Object.keys(artistInfo).length} artists found`);

        fs.writeFileSync(`${CONFIG_DIR}/artist-info.json`, JSON.stringify(artistInfo, undefined, 4));
    }

    if (editions !== undefined) {
        console.log(`${editions.length} editions`);

        const editionMapFile = `${CONFIG_DIR}/edition-map.json`;
        const editionMap = (fs.existsSync(editionMapFile) ? await loadUtf8JsonFile(editionMapFile) : {}) as Record<string, string>;

        var added = 0;
        for (const edition of editions) {
            if (editionMap[edition] === undefined) {
                editionMap[edition] = edition;
                added += 1;
            }
        }

        console.log(`${added} new editions`);
        if (added > 0) {
            fs.writeFileSync(editionMapFile, JSON.stringify(editionMap, undefined, 4));
        }
    }
})();
