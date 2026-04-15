import dotenv from 'dotenv';
import { google } from "googleapis";
import { OAuth2Client } from 'google-auth-library';

import os from 'node:os'
import path from 'node:path';
import * as fs from 'node:fs/promises'
import * as readline from "node:readline";
import { createReadStream, existsSync } from 'node:fs';
import { stdin as input, stdout as output } from 'node:process';
import { ResumableUpload } from "./wizard";

import { AppMetaData, UploadPreferences } from './types/types';

const nodeEnv = process.env.NODE_ENV || 'production';
const envPath = nodeEnv === 'development' ? '.env.dev' : '.env';

dotenv.config({ path: envPath });

const md: AppMetaData = {
    app: {
        author: "warriordeere",
        name: "clipuploader",
        version: '0.3.0',
        repository: "https://github.com/warriordeere/clipuploader"
    }
}

console.log(`\x1b[35m[INFO] \x1b[0mStarting ${md.app.name} v${md.app.version} by ${md.app.author}`);

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

    if (existsSync(tokenStorage)) {
        const storedToken = JSON.parse(await fs.readFile(tokenStorage, 'utf-8'));
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

        await fs.writeFile(tokenStorage, JSON.stringify(tokens));

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

// adjusted from stackoverflow:
function fileSizeString(by: number, dec: number = 2) {
    if (!+by) return '0 Bytes'

    const k = 1024
    const dm = dec < 0 ? 0 : dec
    const sz = ['Bytes', 'KiB', 'MiB', 'GiB']

    const i = Math.floor(Math.log(by) / Math.log(k))

    return `${parseFloat((by / Math.pow(k, i)).toFixed(dm))} ${sz[i]}`
}

async function upload(auth: OAuth2Client) {
    const ytServ = google.youtube({ version: 'v3', auth });

    if (!process.env.UPLOAD_DIRECTORY_PATH) {
        return console.error("\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[31m Invalid value for 'UPLOAD_DIRECTORY_PATH'.\x1b[0m");
    }

    const uploadDir = path.join(homeDir, process.env.UPLOAD_DIRECTORY_PATH);

    try {
        const files = await fs.readdir(uploadDir);

        if (!files || files.length < 1) {
            return console.error(`\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[1m No file(s) to upload!\x1b[0m`);
        }

        console.log(`\x1b[35m[INFO] \x1b[0m Found ${files.length} file(s). Starting to upload... \x1b[0m`);

        for (const file of files) {

            const fp = path.join(uploadDir, file);
            const fm = await fs.stat(fp);

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

            if (!process.env.VIDEO_TITLE || process.env.VIDEO_TITLE === 'default') {
                meta.snippet.title = file;
            }
            else {
                meta.snippet.title = process.env.VIDEO_TITLE;
            }

            const date = new Date();
            const local = date.toLocaleDateString('en-US', dateLocale);
            const time = date.toLocaleTimeString();
            const app = `${md.app.name} v${md.app.version}`;

            const ddesc = {
                main: `Original file name: ${file}.\nFile Size: ${fileSizeString(fm.size)}\n`,
                dscl: `This file was uploaded automatically on ${local} at ${time}\n\n`,
                atr: `Uploadscript: ${app} from ${md.app.author} is open-source and on GitHub: ${md.app.repository}`
            }

            if (!process.env.VIDEO_DESCRIPTION || process.env.VIDEO_DESCRIPTION === 'default') {
                meta.snippet.description = ddesc.main + ddesc.dscl + ddesc.atr;
            }
            else {
                meta.snippet.description = process.env.VIDEO_DESCRIPTION + ddesc.dscl + ddesc.atr;
            }

            if (process.env.VIDEO_LICENSE) {
                meta.status.license = process.env.VIDEO_LICENSE as unknown as 'youtube' | 'creativeCommon';
            }

            if (process.env.VIDEO_PRIVACY) {
                meta.status.privacy = process.env.VIDEO_PRIVACY as unknown as 'private' | 'unlisted';
            }

            try {
                const resumableUpload = new ResumableUpload({
                    auth: auth,
                    media: {
                        body: createReadStream(fp),
                    },
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
                    part: 'snippet,status',
                    onUploadProgress: (progressEvent) => {
                        const { bytesRead, totalBytes } = progressEvent;
                        const percentage = (bytesRead / totalBytes) * 100;
                        const speed = bytesRead / (progressEvent.time / 1000); // bytes per second
                        const estimatedTime = (totalBytes - bytesRead) / speed; // seconds

                        console.log(`\x1b[35m[INFO] \x1b[0m Uploading ${fp}: ${percentage.toFixed(2)}% complete. Speed: ${fileSizeString(speed)}/s. Estimated time: ${Math.round(estimatedTime)}s.`);
                    }
                });

                const response = await resumableUpload.upload();

                const video_link = `\x1b[1m\x1b[1m\u001b]8;;https://www.youtube.com/watch?v=${response.data.id}\u001b\\video\u001b]8;;\u001b\\\x1b[0m`;

                console.log(`\x1b[35m[INFO] \x1b[0m Uploaded file: ${fp}`);
                console.log(`\x1b[32m[SUCCESS] \x1b[0m Video (${fp}) successfully published the ${video_link} at ${new Date(response.data.snippet?.publishedAt ? (response.data.snippet?.publishedAt) : (0)).toLocaleDateString('en-US', dateLocale)} to Channel @${response.data.snippet?.channelTitle}.`);

                if (process.env.ACTION_AFTER_UPLOAD === 'delete') {
                    await fs.unlink(fp);
                    console.log(`\x1b[32m[SUCCESS]\x1b[0m Original file permanently deleted!`);
                }
            } catch (e) {
                console.error(`\x1b[31m\x1b[1m[ERROR]\x1b[0m\x1b[1m ${e}\x1b[0m`);
            }
        }
    } catch (e) {
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