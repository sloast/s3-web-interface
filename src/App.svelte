<script lang="ts">
    import FileList from "./lib/FileList.svelte";
    import Panel from "./lib/Panel.svelte";
    import { LOGIN_URL, signIn, signOut } from "./lib/auth";

    import { onMount } from "svelte";
    import {
        setClient,
        listServices,
        getServiceFiles,
        getScriptFileMetadata,
        deleteService,
    } from "./lib/s3";

    import { nextService } from "./lib/services";
    import type { File_t, Service } from "./lib/types";
    import ScriptPanel from "./lib/ScriptPanel.svelte";
    import NewServiceModal from "./lib/modals/NewServiceModal.svelte";
    import CustomModal from "./lib/modals/CustomModal.svelte";

    let services: Service[] = [];
    let current_service: Service;

    $: if (current_service) {
        onSetService();
    }

    let newServiceModal: NewServiceModal;
    let deleteServiceModal: CustomModal<
        {
            service?: Service;
            confirm?: boolean;
            inputText?: string;
            requiredText?: string;
            error?: string;
        },
        any
    >;

    let data_files: File_t[];
    let script_file: File_t | null = null;

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
        const service = await newServiceModal.show();
        if (!service) return;
        try {
            services = [service, ...services];
            current_service = service;
        } catch (err) {
            console.error(err);
        }
    }

    async function onDeleteService() {
        const service = deleteServiceModal.state_?.service;
        if (!service || !deleteServiceModal.state_) return;

        // no confirmation if more than 2w old
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        const serviceAge = Date.now() - service.date.getTime();
        if (serviceAge > WEEK) {
            await deleteService(service);
            services = services.filter((s) => s.prefix !== service.prefix);
            current_service = nextService(services);
            deleteServiceModal.close();
            return;
        }

        if (!deleteServiceModal.state_.confirm) {
            deleteServiceModal.state_.requiredText = "yes, do as i say";
            deleteServiceModal.state_.confirm = true;
            return;
        }

        if (
            deleteServiceModal.state_.confirm &&
            deleteServiceModal.state_.inputText !==
                deleteServiceModal.state_.requiredText
        ) {
            deleteServiceModal.state_.error = "Text doesn't match";
            return;
        }

        await deleteService(service);
        services = services.filter((s) => s.prefix !== service.prefix);
        current_service = nextService(services);
        deleteServiceModal.close();
    }

    new Promise<void>(async (res, _) => {
        // Check if user is already signed in
        const client = await signIn();
        setClient(client);

        console.log("signed in");

        services = await listServices();
        current_service = nextService(services);
        services = [...services];
        res();
    });
</script>

<main
    class="p-8 pb-4 w-full h-[100vh] relative flex flex-col justify-stretch gap-4 text-center
    bg-gradient-to-br from-slate-900 to-emerald-950
    text-slate-100 font-semibold"
>
    <div class="flex-none flex flex-row justify-stretch gap-8">
        <h1>
            <span class="text-emerald-400"></span><span
                class="grow-0 text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500"
                >&gt;&gt; Service Repository (WIP)</span
            >
        </h1>
        <div class="grow"></div>

        <a
            href={LOGIN_URL}
            class="border-2 rounded-lg text-slate-100 p-3 border-emerald-500 hover:bg-emerald-500 hover:text-black transition-all duration-200 inline-block"
            >Switch User</a
        >

        <div
            class="flex-initial flex flex-row gap-0 items-stretch p-0 rounded-lg border-2 border-emerald-500 overflow-hidden"
        >
            <button
                on:click={mkNewService}
                class="p-3 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all duration-200"
                >Add Service</button
            >
            <div class="border-l-2 border-emerald-800" />
            <button
                on:click={() => {
                    deleteServiceModal.show({ service: current_service });
                }}
                class="p-3 text-rose-500 hover:bg-rose-500 hover:text-black transition-all duration-200 m-[-2px] ml-0"
                >Delete Service
            </button>
        </div>

        <div class="flex-initial flex flex-row gap-0">
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
    </div>

    <div
        class="grow flex-1 flex flex-row justify-stretch content-stretch gap-8"
    >
        <Panel>
            <h1 class="text-4xl font-semibold">Resources</h1>
            <FileList files={data_files} {current_service}></FileList></Panel
        >
        <div class="border-r-4 border-slate-500/25 rounded-sm" />
        <ScriptPanel {current_service} file={script_file}></ScriptPanel>
    </div>

    <NewServiceModal bind:this={newServiceModal} />
    <CustomModal bind:this={deleteServiceModal}>
        <h1 class="text-lg">
            Delete service and <strong>all</strong> related files?
        </h1>
        {#if deleteServiceModal.state_?.confirm}
            <div>
                Type <span
                    class="font-bold text-rose-500 font-mono bg-slate-800 p-1"
                    >{deleteServiceModal.state_.requiredText}</span
                > into the box
            </div>
            <input
                type="text"
                bind:value={deleteServiceModal.state_.inputText}
                on:keypress={(ev) =>
                    ev.key === "Enter" ? onDeleteService() : null}
                class="rounded p-2 bg-emerald-700/25 border-b-2 border-emerald-500 font-mono"
            />
        {:else}
            <div>
                <span class="font-bold">Title: </span>{deleteServiceModal.state_
                    ?.service?.title}
                <br />
                <span class="font-bold"
                    >Date:
                </span>{deleteServiceModal.state_?.service?.date.toUTCString()}
            </div>
        {/if}
        {#if deleteServiceModal.state_?.error}
            <div class="font-bold text-rose-400">
                {deleteServiceModal.state_?.error}
            </div>
        {/if}
        <div class="flex flex-row justify-between">
            <button
                class="p-2 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-black rounded"
                on:click={() => deleteServiceModal.close()}>Cancel</button
            >
            <button
                class="p-2 border-2 border-rose-500 hover:bg-rose-500 hover:text-black rounded"
                on:click={onDeleteService}>Delete</button
            >
        </div>
    </CustomModal>
</main>
