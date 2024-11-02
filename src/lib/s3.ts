
import {
    ListObjectsCommand,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    type S3Client,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";

import { SCRIPT_FILE_EXTENSION, type File_t,type Service } from "./types";

let client: S3Client;

export const SERVICE_DATA_BUCKET = "atm-service-data"
export const SERVICE_SCRIPTS_BUCKET = "atm-service-scripts"


export function setClient(client_: S3Client) {
    client = client_;
}

export const listObjects = async (bucket: string, prefix: string = "") => {
    try {
        const listObjectsCommand = new ListObjectsCommand({
            Bucket: bucket,
            Prefix: prefix,
        });
        const objectsData = await client.send(listObjectsCommand);
        const filelist =
            objectsData.Contents?.map((object) => object.Key).join("\n") ||
            "";

    } catch (err) {
        console.error("Error listing objects:", err);
    }
};

export const getServiceFiles = async (service: Service): Promise<File_t[]> => {
    const bucket = SERVICE_DATA_BUCKET;
    const prefix = `${service.prefix}/`;

    try {
        const listObjectsCommand = new ListObjectsCommand({
            Bucket: bucket,
            Prefix: prefix,
        });
        const objectsData = await client.send(listObjectsCommand);
        const files: File_t[] =
            objectsData.Contents?.map((object) => {
                const key = object.Key
                if (!key || !object.Size || !object.LastModified) return null

                return ({
                    key: key,
                    lastModified: object.LastModified,
                    size: object.Size,
                    name: key.replace(/^.*\//, "")
                })
            }).filter((f): f is File_t => f !== null) || [];

        return files;
    } catch (err) {
        console.error("Error getting service files:", err);
        return [];
    }
};

export const getObject = async (bucket: string, key: string): Promise<Blob> => {
    const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    const objectData = await client.send(getObjectCommand);
    const body = objectData.Body;

    if (!body) {
        throw new Error("No body in the response");
    }

    const response = new Response(objectData.Body);
    return await response.blob();
}

export const downloadFile = async (bucket: string, key: string, filename: string): Promise<void> => {
    try {
        const blob = await getObject(bucket, key);

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error downloading file:", err);
    }
}

export const deleteFile = async (bucket: string, key: string): Promise<void> => {
    try {
        const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        await client.send(deleteObjectCommand);
        console.log(`File deleted successfully from ${bucket}/${key}`);
    } catch (err) {
        console.error("Error deleting file:", err);
    }
}


export const uploadFile = async (bucket: string, key: string, file: File): Promise<void> => {
    const arrayBuffer = await file.arrayBuffer();
    const putObjectCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: arrayBuffer,
        ContentType: file.type,
    });

    try {
        await client.send(putObjectCommand);
        console.log(`File uploaded successfully to ${bucket}/${key}`);
    } catch (err) {
        console.error("Error uploading file:", err);
    }
}

export const uploadDataFile = async (service: Service, file: File, filename?: string): Promise<string> => {
    const filename_ = filename ?? file.name
    const bucket = SERVICE_DATA_BUCKET;
    const key = `${service.prefix}/${filename_}`
    await uploadFile(bucket, key, file)
    return key;
}

export const uploadScript = async (service: Service, script_file: File): Promise<string> => {
    const bucket = SERVICE_SCRIPTS_BUCKET;
    const key = service.prefix;
    await uploadFile(bucket, key, script_file);
    return key;
}

export async function getScriptFileMetadata(service: Service): Promise<File_t | null> {
    const bucket = SERVICE_SCRIPTS_BUCKET;
    const key = service.prefix;

    try {
        const headObjectCommand = new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const objectData = await client.send(headObjectCommand);

        if (!objectData.LastModified || !objectData.ContentLength) {
            throw new Error("Incomplete metadata");
        }

        return {
            key: key,
            lastModified: objectData.LastModified,
            size: objectData.ContentLength,
            name: `${service.title}.${SCRIPT_FILE_EXTENSION}`
        };
    } catch (err) {
        if ((err as Error)?.name === "NotFound") {
            return null;
        }

        throw err;
    }
}


// const listDirectories = async (bucket: string): Promise<string[]> => {
//     try {
//         const listObjectsCommand = new ListObjectsCommand({
//             Bucket: bucket,
//             Delimiter: "/",
//             Prefix: "",
//         });
//         const objectsData = await client.send(listObjectsCommand);
//         const directories =
//             objectsData.CommonPrefixes?.map(
//                 (prefix) => prefix.Prefix,
//             ).filter((prefix): prefix is string => !!prefix) || [];

//         return directories;
//     } catch (err) {
//         console.error("Error listing directories:", err);
//         return [];
//     }
// };

export const listServices = async (): Promise<Service[]> => {
    try {
        const getObjectCommand = new GetObjectCommand({
            Bucket: SERVICE_DATA_BUCKET,
            Key: "services.json",
        });
        const objectData = await client.send(getObjectCommand);
        const bodyContents = await streamToString(objectData.Body);

        const services: Service[] = JSON.parse(bodyContents);
        for (const service of services) {
            service.date = new Date(service.date);
        }

        return services;
    } catch (err) {
        console.error("Error loading services from file:", err);
        return [];
    }
};

export async function addService(service: Service): Promise<void> {
    const services = await listServices();
    if (services.some((s) => s.prefix === service.prefix)) {
        throw 'Service already exists at this time'
    }
    services.push(service)
    
    const putObjectCommand = new PutObjectCommand({
        Bucket: SERVICE_DATA_BUCKET,
        Key: "services.json",
        Body: JSON.stringify(services),
        ContentType: "application/json",
        CacheControl: 'no-cache'
    });
    await client.send(putObjectCommand);
}

export async function deleteService(service: Service): Promise<void> {
    const services = await listServices();
    const updatedServices = services.filter((s) => s.prefix !== service.prefix);

    const putObjectCommand = new PutObjectCommand({
        Bucket: SERVICE_DATA_BUCKET,
        Key: "services.json",
        Body: JSON.stringify(updatedServices),
        ContentType: "application/json",
        CacheControl: 'no-cache'
    });
    await client.send(putObjectCommand);

    await deleteFile(SERVICE_SCRIPTS_BUCKET, service.prefix);

    const serviceFiles = await getServiceFiles(service);
    for (const file of serviceFiles) {
        await deleteFile(SERVICE_DATA_BUCKET, file.key);
    }
}

function streamToString(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = "";

    return reader.read().then(function processText({
        done,
        value,
    }): string | Promise<string> {
        if (done) {
            return result;
        }
        result += decoder.decode(value, { stream: true });
        return reader.read().then(processText);
    });
}
