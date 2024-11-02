<script lang="ts">
    import { addService } from "../s3";
    import { newService } from "../services";
    import { type Service } from "../types";
    import CustomModal from "./CustomModal.svelte";

    let modal: CustomModal<{}, Service>;
    let t_modal: any;
    $: modal = t_modal;

    const nextSunday: Service = newService();

    let service: Service = nextSunday;
    let error: string | undefined;

    let dateInput: HTMLInputElement;
    let timeInput: HTMLInputElement;
    let titleInput: HTMLInputElement;

    export async function show(): Promise<Service | undefined> {
        service = nextSunday;
        error = undefined;

        const result = await modal.show();
        return result;
    }

    function onDateChanged() {
        const date = new Date(dateInput.value);
        const [hours, minutes] = timeInput.value.split(":").map(Number);
        date.setUTCHours(hours, minutes);

        service = newService(date);
    }

    function onTitleChanged() {
        service.title = titleInput.value;
    }

    async function submit() {
        error = undefined;
        try {
            await addService(service);

            modal.close(service);
        } catch (err) {
            error = err?.toString?.();
        }
    }
</script>

<CustomModal bind:this={t_modal}>
    <h2 class="text-xl">
        New Service
        <br />
    </h2>

    <div class="flex flex-row justify-start items-center gap-2">
        Date:
        <input
            type="date"
            value={nextSunday.date.toISOString().split("T")[0]}
            bind:this={dateInput}
            on:change={onDateChanged}
            class="rounded p-2 bg-emerald-700/25 border-b-2 border-emerald-500"
        />
        <span> at </span>
        <input
            type="time"
            value={nextSunday.date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
            })}
            bind:this={timeInput}
            on:change={onDateChanged}
            class="rounded p-2 bg-emerald-700/25 border-b-2 border-emerald-500"
        />
    </div>

    <div class="flex flex-row justify-stretch items-center gap-4 w-96">
        Title:
        <input
            type="text"
            value={service.title}
            bind:this={titleInput}
            on:change={onTitleChanged}
            class="grow rounded p-2 bg-emerald-700/25 border-b-2 border-emerald-500"
            on:keypress={(ev) => (ev.key === "Enter" ? submit() : null)}
        />
    </div>

    {#if error}
        <div class="font-bold text-rose-400">
            {error}
        </div>
    {/if}

    <div class="flex flex-row justify-between gap-8">
        <button
            class="p-2 px-4 border-2 border-blue-500 hover:bg-blue-500 hover:text-black rounded"
            on:click={() => {
                modal.close();
            }}>Cancel</button
        >
        <button
            class="p-2 px-4 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-black rounded"
            on:click={submit}>Submit</button
        >
    </div>
</CustomModal>
