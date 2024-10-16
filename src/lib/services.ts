export interface Service {
    prefix: string;
    date: Date;
    title: string;
}

const serviceTitleFormat = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
});

export function newService(date?: Date): Service {
    if (!date) {
        const now = new Date();
        date = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
            ),
        );
        date.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7) + 7);
        date.setUTCHours(10, 30, 0, 0);
    }

    return {
        prefix: date.getTime().toString(),
        date: date,
        title: serviceTitleFormat.format(date),
    };
}

export function nextService(services: Service[]): Service {
    const now = new Date();
    const upcomingServices = services.filter(
        (service) => service.date > now,
    );
    if (upcomingServices.length === 0) {
        const service = newService();
        services.push(service)
        return service;
    }
    return upcomingServices.reduce((next, service) =>
        service.date < next.date ? service : next,
    );
}