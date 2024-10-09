import fs from 'fs'
import { readdir } from 'node:fs/promises'
import os from 'os'
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import * as readline from "node:readline";
import { stdin as input, stdout as output } from 'node:process';
import { google } from "googleapis";
import path from 'path';
import { UploadPreferences } from './types/types';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });

const tokenStorage = `${process.env.TOKEN_STORAGE_FILE_NAME}.json`;

const homeDir = os.homedir();
const dateLocale: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
}

async function authClientAccess(): Promise<OAuth2Client> {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET
    const redirect = 'http://localhost'

    if (!clientId || !clientSecret) {
        console.error("\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[31m Important Environment variable missing.\x1b[0m");
    }

    const AuthClient = new OAuth2Client(clientId, clientSecret, redirect);

    if (fs.existsSync(tokenStorage)) {
        const storedToken = JSON.parse(fs.readFileSync(tokenStorage, 'utf-8'));
        AuthClient.setCredentials(storedToken);
    }
    else {
        const authUrl = AuthClient.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/youtube.upload']
        });

        console.log(`\x1b[35m[INFO] \x1b[33mAuthorization required. Please \x1b[1m\x1b[1m\u001b]8;;${authUrl}\u001b\\authorize\u001b]8;;\u001b\\\x1b[0m\x1b[33m the app and paste the code below.\x1b[0m`);

        const code = await userInput('Enter Code:');
        const { tokens } = await AuthClient.getToken(code);

        AuthClient.setCredentials(tokens);

        fs.writeFileSync(tokenStorage, JSON.stringify(tokens));

        console.log('\x1b[35m[INFO] \x1b[0mToken successfully stored!');
    }

    return AuthClient;

}

function userInput(task: string): Promise<string> {

    const rl = readline.createInterface({ input, output });

    return new Promise((resolve) => {
        rl.question(task, (r) => {
            resolve(r);
        })
    })
}

async function upload(auth: OAuth2Client) {
    const ytServ = google.youtube({ version: 'v3', auth });

    if (!process.env.UPLOAD_DIRECTORY_PATH) {
        return console.error("\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[31m Invalid value for 'UPLOAD_DIRECTORY_PATH'.\x1b[0m");
    }

    const uploadDir = path.join(homeDir, process.env.UPLOAD_DIRECTORY_PATH);


    try {
        const files = await readdir(uploadDir);

        if (!files || files.length < 1) {
            console.error(`\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[1m No file(s) to upload!\x1b[0m`);
        }

        console.log(`\x1b[35m[INFO] \x1b[0m Found ${files.length} file(s). Starting to upload... \x1b[0m`);

        files.forEach(
            async (file) => {

                const fp = path.join(uploadDir, file);

                console.log(`\x1b[35m[INFO] \x1b[0m Uploading file: ${fp} \x1b[0m`);

                const meta: UploadPreferences = {
                    parameters: {
                        notifySubscribers: false,
                    },
                    snippet: {
                        title: 'default',
                        description: 'default',
                    },
                    status: {
                        license: 'youtube',
                        privacy: 'private',
                    },
                }

                if (process.env.VIDEO_NOTIFY_SUBSCRIBERS) {
                    meta.parameters.notifySubscribers = process.env.VIDEO_NOTIFY_SUBSCRIBERS as unknown as boolean;
                }

                if (process.env.VIDEO_TITLE === 'default') {
                    meta.snippet.title = file;
                }

                if (process.env.VIDEO_DESCRIPTION) {
                    meta.snippet.description =
                        `Original file name: ${file}.\nAutomatically uploaded at ${new Date().toLocaleDateString('en-US', dateLocale)}\n\nThe tool (clipuploader v0.1) used to upload this video was created by warriordeere and is open-source. You can find it on GitHub: https://github.com/warriordeere/clipuploader`;
                }

                if (process.env.VIDEO_LICENSE) {
                    meta.status.license = process.env.VIDEO_LICENSE as unknown as 'youtube' | 'creativeCommon';
                }

                if (process.env.VIDEO_PRIVACY) {
                    meta.status.privacy = process.env.VIDEO_PRIVACY as unknown as 'private' | 'unlisted';
                }

                await ytServ.videos.insert({
                    part: ['snippet', 'status'],
                    notifySubscribers: meta.parameters.notifySubscribers,
                    requestBody: {
                        snippet: {
                            title: meta.snippet.title,
                            description: meta.snippet.description,
                        },
                        status: {
                            privacyStatus: meta.status.privacy,
                            license: meta.status.license
                        },
                    },
                    media: {
                        body: fs.createReadStream(fp),
                    },
                })
                    .then(
                        (r) => {
                            console.log(`\x1b[35m[INFO] \x1b[0m Uploaded file: ${fp}`);
                            console.log(`\x1b[32m[SUCCESS] \x1b[0m Video (${fp}) successfully published (https://www.youtube.com/watch?v=${r.data.id}) at ${new Date(r.data.snippet?.publishedAt ? (r.data.snippet?.publishedAt) : (0)).toLocaleDateString(undefined, dateLocale)} to Channel @${r.data.snippet?.channelTitle} (https://www.youtube.com/channel/${r.data.snippet?.channelId}).`);
                        })
                    .catch((e) => {
                        console.error(`\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[1m ${e}\x1b[0m`);
                    });
            }
        );
    }
    catch (e) {
        console.error(`\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[1m ${e}\x1b[0m`);
    }

}

(async () => {
    try {
        const auth = await authClientAccess();
        await upload(auth);
    } catch (e: any) {
        throw new Error(`\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[1m ${e}\x1b[0m`);
    }
})();