export interface UploadPreferences {
    parameters: {
        notifySubscribers: boolean
    }
    snippet: {
        title: string
        description: string
    }
    status: {
        license: 'youtube' | 'creativeCommon'
        privacy: 'private' | 'unlisted'
    }
}

export interface AppMetaData {
    app: {
        author: string
        name: string
        version: `${number}.${number}.${number}`
        repository: string
    }
}