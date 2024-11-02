<script lang="ts">
    import { fileToFile_t, type File_t, type Service } from "./types";
    import Uploader from "./Uploader.svelte";
    import {
        deleteFile,
        downloadFile,
        SERVICE_DATA_BUCKET,
        uploadDataFile,
    } from "./s3";

    import DeleteModal from "./modals/DeleteModal.svelte";
    import ConflictModal from "./modals/ConflictModal.svelte";
    import FileView from "./FileView.svelte";

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
                <FileView
                    {file}
                    onDownload={() =>
                        downloadFile(SERVICE_DATA_BUCKET, file.key, file.name)}
                    onDelete={async () => {
                        if (!(await deleteModal.show(file.name))) return;
                        await deleteFile(SERVICE_DATA_BUCKET, file.key);
                        files = files.filter((f) => f.key !== file.key);
                    }}
                />
            {/each}
        </div>
        <div class="flex-auto flex justify-stretch items-stretch p-2">
            <Uploader multiple upload_function={uploadFile} />
        </div>
    </div>
</div>

<ConflictModal bind:this={conflictModal} />
<DeleteModal bind:this={deleteModal} />
