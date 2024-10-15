

# Clipuploader
 Clipuploader is a tool utilazing node.js and the official google api to upload clips/videos from any set file path to YouTube.

# Features
- CLI Tool
- customizable via .env
- delete file after successfull upload
- set custom video description and title
- and more...

# Requirements
- Node.js v21.1.0
- a package manager of your choice (preferably npm)

# Setup And How To Use
 1. Install Node.js and npm ([Tutorial](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm))
 2. Download the repository and extract it somewhere
 3. Open the Commandline in the extracted folder
 4. Run `npm i`
 5. Modify the values of the entries in the `.env` file as you like 

> ⚠️ **Important:** <br>
> `CLIENT_ID` and `CLIENT_SECRET` are mandatory! To retrieve this OAuth values see this short [tutorial](#tutorial-setup-youtube-api).

 6. Run `npx ts-node script` to start uploading the files from the specified folder

# Tutorial: Setup YouTube API
1. Open the Google Cloud [website](https://console.cloud.google.com/).
2. Create a new Project
3. Enable the YouTube Data API v3 (`Navigation Menu > APIs and services > Libary > YouTube`)
4. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials)
5. Click on ``Create Credentials > OAuth client ID`` 
6. Select `Desktop app` as the application type and set a name
7. Copy the Client ID and the Client Secret in the .env file
8. Go to `OAuth consent screen` and add your google account to `Test users`

<br>

> **💡Additional Information:** <br>
> The first time you run the tool you'll be asked to authorize the app you just created. The Account you added as a test user above must be the same as the one you use to authorize the app via the link from the link. Once you finished that, you'll be redirected to a localhost page. You can now extract the code from the addressbar: ``http://localhost/?code=[THATS WHERE YOUR CODE WILL BE]&scope=https://www.googleapis.com/auth/youtube.upload``. Paste this code into the commandline and press ``Enter``.

# License

## MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause

### 1. Grant of License
Subject to the terms of the MIT License above, the Commons Clause modifies the MIT License as follows:

### 2. Commercial Use
The Software may not be used for commercial purposes. For the purposes of this License, "commercial use" means any use of the Software that is primarily intended for or directed towards commercial advantage or monetary compensation.

### 3. Redistribution
Redistribution of the Software is not permitted without explicit written permission from the author. This includes, but is not limited to, distribution of the Software as part of a software package or in any form that allows others to use or access the Software.

### 4. Attribution
Any use of the Software must include proper attribution to the original author.

### 5. No Warranty
The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the Software or the use or other dealings in the Software.

See the LICENSE file for the full text of these terms.

# Contact
**Developer:** 
> Warrior Deere <br>
> `warriordeere@proton.me`