<script lang="ts">
    import Panel from "./Panel.svelte";
    import {
        deleteFile,
        downloadFile,
        SERVICE_SCRIPTS_BUCKET,
        uploadScript,
    } from "./s3";
    import { type Service } from "./services";
    import { fileToFile_t, SCRIPT_FILE_EXTENSION, type File_t } from "./types";
    import Uploader from "./Uploader.svelte";
    import ConflictModal from "./modals/ConflictModal.svelte";
    import DeleteModal from "./modals/DeleteModal.svelte";
    import FileView from "./FileView.svelte";
    import CustomModal from "./modals/CustomModal.svelte";

    export let current_service: Service;
    export let file: File_t | null = null;

    async function upload_file(f: File) {
        const file_name = `${current_service.title}.${SCRIPT_FILE_EXTENSION}`;

        const supplied_file_extension = f.name.split(".").pop() ?? "";
        if (supplied_file_extension !== SCRIPT_FILE_EXTENSION) {
            wrongFileExtensionModal.show({
                extension: supplied_file_extension,
            });
            return;
        }

        if (file) {
            const { cont } = await conflictModal.show(file_name);

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
    let wrongFileExtensionModal: CustomModal<{ extension: string }, void>;
    let wrongFileExtensionModal_t: any;
    $: wrongFileExtensionModal = wrongFileExtensionModal_t;
</script>

<Panel>
    <h1 class="text-4xl font-semibold">Script</h1>
    <div
        class="flex-initial bg-emerald-800/50 rounded-lg border-2 border-emerald-500"
    >
        {#if file !== null}
            <FileView
                {file}
                onDownload={(file) =>
                    downloadFile(SERVICE_SCRIPTS_BUCKET, file.key, file.name)}
                onDelete={async (f) => {
                    if (!(await deleteModal.show(f.name))) return;
                    await deleteFile(SERVICE_SCRIPTS_BUCKET, f.key);
                    file = null;
                }}
            />
        {:else}
            <div
                class="border-2 border-dashed border-slate-400 p-4 text-center text-slate-300 m-2"
            >
                No script uploaded
            </div>
        {/if}
    </div>
    <Uploader upload_function={upload_file} />
</Panel>

<ConflictModal bind:this={conflictModal} />
<DeleteModal bind:this={deleteModal} />
<CustomModal bind:this={wrongFileExtensionModal_t}>
    <h2 class="text-xl">
        Invalid file extension <span class="font-bold text-rose-400"
            >.{wrongFileExtensionModal.state().extension}</span
        >
        <br />
        <span class="text-base">
            Expected <span class="font-bold text-emerald-400"
                >.{SCRIPT_FILE_EXTENSION}</span
            >
        </span>
    </h2>

    <div class="flex flex-row justify-end">
        <button
            class="p-2 px-4 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-black rounded"
            on:click={() => wrongFileExtensionModal.close()}>sorry</button
        >
    </div>
</CustomModal>
