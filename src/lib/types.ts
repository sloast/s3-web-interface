export interface File_t {
    key: string,
    lastModified: Date,
    size: number,
    name: string,
    uploading?: boolean,
    error?: string,
}

export function fileToFile_t(file: File, key: string, filename?: string): File_t {
    return {
        key: key,
        lastModified: new Date(),
        size: file.size,
        name: filename ?? file.name,
    }
}

export const SCRIPT_FILE_EXTENSION = "sc7x"
