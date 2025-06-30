import { addService } from "./s3";
import type { File_t, Service } from "./types";

export const SERVICE_TITLE_FORMAT = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
});

export function scriptFileMetadata(service: Service, filename: string): File_t {
    const fileExtension = filename.replace(/^.*\./, '') || 'msx7'
    const key = `${service.prefix}.${fileExtension}`;
    const name = `${service.title}.${fileExtension}`;
    return {
        key: key,
        name,
        size: 0,
        lastModified: new Date(),
    }
}

export function newService(date?: Date): Service {
    if (!date) {
        const now = new Date(Date.now() - 2 * HOUR);
        date = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
            ),
        );
        date.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7));
        date.setUTCHours(10, 30, 0, 0);
        if (date < now) {
            date.setUTCDate(date.getUTCDate() + 7)
        }
    }

    return {
        prefix: date.getTime().toString(),
        date: date,
        title: SERVICE_TITLE_FORMAT.format(date),
    };
}

const HOUR = 60 * 60 * 1000;

export function nextService(services: Service[]): Service {
    // 2h before current time
    const now = new Date(Date.now() - 2 * HOUR);

    const service = newService()
    if (!services.some(e => e.prefix === service.prefix)) {
        addService(service)
        services.push(service)
    }

    const upcomingServices = services.filter(
        (service) => service.date > now,
    );
    return upcomingServices.reduce((next, service) =>
        service.date < next.date ? service : next,
    );
}