<script lang="ts">
    import type { Service } from "./services";
    import { fileToFile_t, type File_t } from "./types";
    import { getIcon } from "material-file-icons";
    import Uploader from "./Uploader.svelte";
    import {
        deleteFile,
        downloadFile,
        SERVICE_DATA_BUCKET,
        uploadDataFile,
    } from "./s3";
    import Modal from "./Modal.svelte";
    import download_svg from "../assets/download.svg";
    import delete_svg from "../assets/delete.svg";
    import { formatBytes } from "./utils";
    import DeleteModal from "./DeleteModal.svelte";
    import ConflictModal from "./ConflictModal.svelte";

    export let files: File_t[] = [];
    export let current_service: Service;

    async function uploadFile(file: File) {
        let fileName = file.name;

        if (files.some((f) => f.name === fileName)) {
            const { cont, filename } = await conflictModal.show(file.name);

            if (filename) {
                fileName = filename;
            }

            if (cont) {
                files = files.filter((f) => f.name !== fileName);
            } else {
                return;
            }
        }

        (async () => {
            const filet = fileToFile_t(file, "", fileName);
            filet.uploading = true;
            files = [...files, filet];
            try {
                const key = await uploadDataFile(
                    current_service,
                    file,
                    fileName,
                );
                filet.key = key;
                filet.uploading = false;
                files = [...files];
            } catch (err) {
                filet.error = err?.toString() || "Error";
            }
        })();
    }

    let deleteModal: DeleteModal;
    let conflictModal: ConflictModal;
</script>

<div
    class="flex-1 bg-emerald-800/50 rounded-lg border-2 border-emerald-500 overflow-y-scroll relative"
>
    <div class="absolute inset-0 flex flex-col justify-stretch items-stretch">
        <div
            class=" flex-initial flex flex-col gap-2 justify-start items-stretch"
        >
            {#each files as file}
                <div
                    class="flex-none flex flex-row justify-stretch items-center gap-2 p-2 bg-white/10 rounded shadow"
                >
                    <div class="h-8">{@html getIcon(file.name).svg}</div>
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
                                    SERVICE_DATA_BUCKET,
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
                                if (!(await deleteModal.show(file.name)))
                                    return;
                                await deleteFile(SERVICE_DATA_BUCKET, file.key);
                                files = files.filter((f) => f.key !== file.key);
                            }}
                            class="border-rose-500 border-2 text-white p-1 rounded hover:bg-rose-600 transition-all"
                        >
                            <img
                                src={delete_svg}
                                alt="Download"
                                class="h-6 w-6"
                            />
                        </button>
                    {/if}
                </div>
            {/each}
        </div>
        <div class="flex-auto flex justify-stretch items-stretch p-2">
            <Uploader multiple upload_function={uploadFile}></Uploader>
        </div>
    </div>
</div>

<ConflictModal bind:this={conflictModal}></ConflictModal>
<DeleteModal bind:this={deleteModal}></DeleteModal>
