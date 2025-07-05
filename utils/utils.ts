import fs from "fs";

export const loadUtf8JsonFile = async (filename: string): Promise<unknown> => {
    const fileContent = await fs.promises.readFile(filename, "utf-8");
    return JSON.parse(fileContent);
}

export const toTitleCase = (str: any) => {
    return str.toLowerCase().split(' ').map((word: any) => {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
};
