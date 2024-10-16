<script lang="ts">
    import { S3Client } from "@aws-sdk/client-s3";

    import FileList from "./lib/FileList.svelte";
    import Panel from "./lib/Panel.svelte";
    import { LOGIN_URL, signIn, signOut } from "./lib/auth";

    import { onMount } from "svelte";
    import {
        listObjects,
        setClient,
        listServices,
        getServiceFiles,
    } from "./lib/s3";

    import { type Service, newService, nextService } from "./lib/services";
    import type { File_t } from "./lib/types";
    import Uploader from "./lib/Uploader.svelte";

    let services: Service[] = [];
    let current_service: Service;

    let data_files: File_t[];

    onMount(async () => {
        // Check if user is already signed in
        const client = await signIn();
        setClient(client);

        services = await listServices();
        current_service = nextService(services);
        services = [...services];
        onSetService();
    });

    async function onSetService(): Promise<void> {
        data_files = await getServiceFiles(current_service);
    }

    async function mkNewService() {
        const service = newService();
        services = [service, ...services];
        current_service = service;
        onSetService();
    }
</script>

<main
    class="p-8 pb-4 w-full h-[100vh] relative flex flex-col justify-stretch gap-4 text-center
    bg-gradient-to-br from-slate-900 to-emerald-950
    text-slate-100 font-semibold"
>
    <div class="flex-none flex flex-row justify-stretch gap-8">
        <h1>
            <span class="text-emerald-400"></span><span
                class="grow-0 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500"
                >&gt;&gt; Service Repository (WIP)</span
            >
        </h1>
        <div class="grow"></div>
        <span class="text-slate-400 font-semibold">
            <a
                href={LOGIN_URL}
                class="border-2 p-3 rounded-l-lg inline-block border-emerald-800 hover:bg-emerald-500 hover:text-black transition-all duration-200"
                >change uer</a
            ><button
                on:click={signOut}
                class="border-2 p-3 rounded-r-lg border-l-0 border-emerald-800 hover:bg-emerald-500 hover:text-black transition-all duration-200"
                >logout</button
            >
        </span>

        <button on:click={mkNewService}>New Service</button>

        <select
            bind:value={current_service}
            on:change={onSetService}
            name="pick"
            id="service-select"
            class="p-3 rounded-lg border-2 border-transparent focus:border-emerald-500 hover:border-emerald-500 bg-emerald-900 transition-all duration-200"
        >
            {#each services as service}
                <option value={service}>{service.title}</option>
            {/each}
        </select>
    </div>

    <div
        class="grow flex-1 flex flex-row justify-stretch content-stretch gap-8"
    >
        <Panel>
            <h1>Resources</h1>
            <FileList files={data_files} {current_service}></FileList></Panel
        >
        <div class="border-r-4 border-slate-500/25 rounded-sm" />
        <Panel>
            <h1>Script</h1>
            <Uploader upload_function={async (file)=>{}}></Uploader>
        </Panel>
    </div>
</main>
