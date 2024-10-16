
import {
    ListObjectsCommand,
    GetObjectCommand,
    PutObjectCommand,
    type S3Client,
} from "@aws-sdk/client-s3";

import { type Service } from "./services";
import type { File_t } from "./types";

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

export const uploadDataFile = async (service: Service, file: File): Promise<void> => {
    const bucket = SERVICE_DATA_BUCKET;
    const key = `${service.prefix}/${file.name}`
    await uploadFile(bucket, key, file)
}

export const uploadScript = async (service: Service, script_file: File): Promise<void> => {
    const bucket = SERVICE_SCRIPTS_BUCKET;
    const key = `${service.prefix}.${script_file.name.replace(/^.*\./, '') || 'msx7'}`;
    await uploadFile(bucket, key, script_file);
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
