<script lang="ts">
    import { onMount } from "svelte";
    import Panel from "./Panel.svelte";
    import { deleteFile, downloadFile, SERVICE_SCRIPTS_BUCKET, uploadScript } from "./s3";
    import { scriptFileMetadata, type Service } from "./services";
    import { fileToFile_t, SCRIPT_FILE_EXTENSION, type File_t } from "./types";
    import Uploader from "./Uploader.svelte";
    import { formatBytes } from "./utils";
    import download_svg from "../assets/download.svg";
    import delete_svg from "../assets/delete.svg";
    import Modal from "./modals/Modal.svelte";
    import midyell_png from "../assets/midyell.png";
    import ConflictModal from "./modals/ConflictModal.svelte";
    import DeleteModal from "./modals/DeleteModal.svelte";

    export let current_service: Service;
    export let file: File_t | null = null;

    async function upload_file(f: File) {
        const file_name = `${current_service.title}.${SCRIPT_FILE_EXTENSION}`;

        if (file) {
            const {cont} = await conflictModal.show(file_name);

            if (!cont) {
                return;
            }
        }

        (async () => {
            file = fileToFile_t(f, current_service.prefix, file_name);
            file.uploading = true;
            try {
                const key = await uploadScript(current_service, f);
                file.key = key;
                file.uploading = false;
            } catch (err) {
                file.error = err?.toString() || "Error";
            }
        })();
    }

    let deleteModal: DeleteModal;
    let conflictModal: ConflictModal;
</script>

<Panel>
    <h1>Script</h1>
    <div
        class="flex-initial bg-emerald-800/50 rounded-lg border-2 border-emerald-500"
    >
        {#if file !== null}
            <div
                class="flex-none flex flex-row justify-stretch items-center gap-2 p-2 bg-white/10 rounded shadow"
            >
                <img class="w-8 h-8" src={midyell_png} />
                <div class="font-semibold text-lg">{file.name}</div>
                {#if file.error}
                    <div class="text-center grow text-lg text-rose-400">
                        Error
                    </div>
                {:else if file.uploading}
                    <div class="text-center grow text-lg text-emerald-300">
                        Uploading...
                    </div>
                {:else}
                    <div class="flex-1">
                        <div class="text-sm text-gray-500">
                            {file.lastModified.toLocaleString()}
                        </div>
                        <div class="text-sm text-gray-500">
                            {formatBytes(file.size, 2)}
                        </div>
                    </div>
                    <button
                        on:click={() =>
                            downloadFile(
                                SERVICE_SCRIPTS_BUCKET,
                                file.key,
                                file.name,
                            )}
                        class="border-emerald-500 border-2 text-white p-1 rounded hover:bg-emerald-600 transition-all"
                    >
                        <img
                            src={download_svg}
                            alt="Download"
                            class="h-6 w-6"
                        />
                    </button>
                    <button
                        on:click={async () => {
                            if (!(await deleteModal.show(file.name))) return;
                            await deleteFile(SERVICE_SCRIPTS_BUCKET, file.key);
                            file = null;
                        }}
                        class="border-rose-500 border-2 text-white p-1 rounded hover:bg-rose-600 transition-all"
                    >
                        <img src={delete_svg} alt="Download" class="h-6 w-6" />
                    </button>
                {/if}
            </div>
        {:else}
            <div
                class="border-2 border-dashed border-slate-400 p-4 text-center text-slate-300 m-2"
            >
                No script uploaded
            </div>
        {/if}
    </div>
    <Uploader upload_function={upload_file}></Uploader>
</Panel>

<ConflictModal bind:this={conflictModal}></ConflictModal>
<DeleteModal bind:this={deleteModal}></DeleteModal>
