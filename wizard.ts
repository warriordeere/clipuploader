import { OAuth2Client } from "google-auth-library";
import { youtube_v3, google } from "googleapis";

export class ResumableUpload {
    private auth: OAuth2Client;
    private media: { body: NodeJS.ReadableStream };
    private requestBody: youtube_v3.Schema$Video;
    private part: string;
    private onUploadProgress: (progressEvent: { bytesRead: number, totalBytes: number, time: number }) => void;

    constructor(options: {
        auth: OAuth2Client,
        media: { body: NodeJS.ReadableStream },
        requestBody: youtube_v3.Schema$Video,
        part: string,
        onUploadProgress: (progressEvent: { bytesRead: number, totalBytes: number, time: number }) => void
    }) {
        this.auth = options.auth;
        this.media = options.media;
        this.requestBody = options.requestBody;
        this.part = options.part;
        this.onUploadProgress = options.onUploadProgress;
    }

    async upload() {
        const youtube = google.youtube('v3');
        const res = youtube.videos.insert({

            auth: this.auth,
            part: this.part,
            requestBody: this.requestBody,
            media: this.media,
        }, {
            onUploadProgress: (event) => {
                const progressEvent = {
                    bytesRead: event.bytesRead,
                    totalBytes: event.totalBytes,
                    time: event.time
                };
                this.onUploadProgress(progressEvent);
            }
        });

        return res;
    }
}