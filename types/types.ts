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