<script lang="ts">
    import type { Service } from "./services";
    import { type File_t } from "./types";
    import { getIcon } from "material-file-icons";
    import Uploader from "./Uploader.svelte";
    import { uploadDataFile } from "./s3";

    export let files: File_t[] = [];
    export let current_service: Service;
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
                    <div class="flex-1">
                        <div class="text-sm text-gray-500">
                            Last modified: {new Date(
                                file.lastModified,
                            ).toLocaleString()}
                        </div>
                        <div class="text-sm text-gray-500">
                            Size: {file.size} bytes
                        </div>
                    </div>
                    <button
                        class="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
                    >
                        Download
                    </button>
                </div>
            {/each}
        </div>
        <Uploader multiple upload_function={async (file) => {await uploadDataFile(current_service, file)}}></Uploader>
    </div>
</div>
