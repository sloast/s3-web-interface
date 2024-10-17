<script lang="ts">
    import { S3Client } from "@aws-sdk/client-s3";

    import FileList from "./lib/FileList.svelte";
    import Panel from "./lib/Panel.svelte";
    import { LOGIN_URL, signIn, signOut } from "./lib/auth";

    import file_svg from "./assets/file.svg";

    import { onMount } from "svelte";
    import {
        setClient,
        listServices,
        getServiceFiles,
        getScriptFileMetadata,
        addService,
    } from "./lib/s3";

    import { type Service, newService, nextService } from "./lib/services";
    import type { File_t } from "./lib/types";
    import Uploader from "./lib/Uploader.svelte";
    import ScriptPanel from "./lib/ScriptPanel.svelte";
    import NewServiceModal from "./lib/modals/NewServiceModal.svelte";

    let services: Service[] = [];
    let current_service: Service;

    $: if (current_service) {
        onSetService();
    }

    let newServiceModal: NewServiceModal;

    let data_files: File_t[];
    let script_file: File_t | null = null;

    onMount(async () => {
        // Check if user is already signed in
        const client = await signIn();
        setClient(client);

        services = await listServices();
        current_service = nextService(services);
        services = [...services];
    });

    async function onSetService(): Promise<void> {
        try {
            data_files = await getServiceFiles(current_service);
            script_file = await getScriptFileMetadata(current_service);
        } catch (err) {
            console.warn("file load error", err);
            script_file = null;
        }
    }

    async function mkNewService() {
        const service = newService();
        try {
            addService(service);
            services = [service, ...services];
            current_service = service;
        } catch (err) {
            console.error(err);
        }
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
                class="border-2 p-3 rounded-l-lg border-emerald-800 hover:bg-emerald-500 hover:text-black transition-all duration-200 inline-block"
                >change uer</a
            ><button
                on:click={signOut}
                class="border-2 p-3 rounded-r-lg border-rose-800 hover:bg-rose-500 hover:text-black transition-all duration-200"
                >logout</button
            >
        </span>

        <button
            on:click={async () => {
                const result = await newServiceModal.show();
                if (result) {
                    current_service = result;
                }
            }}
            class="border-2 p-3 rounded-lg border-emerald-800 hover:bg-emerald-500 hover:text-black transition-all duration-200"
            >New Service</button
        >

        <select
            bind:value={current_service}
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
        <ScriptPanel {current_service} file={script_file}></ScriptPanel>
    </div>

    <NewServiceModal bind:this={newServiceModal} />
</main>
