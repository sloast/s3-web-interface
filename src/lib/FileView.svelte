<script lang="ts">
    import { getIcon } from "material-file-icons";
    import { SCRIPT_FILE_EXTENSION, type File_t } from "./types";
    import { formatBytes } from "./utils";
    import download_svg from "../assets/download.svg";
    import delete_svg from "../assets/delete.svg";
    import midyell_png from "../assets/midyell.png";

    export var file: File_t;
    export var onDownload: (file: File_t) => void;
    export var onDelete: (file: File_t) => void;

    const handleDownload = (): void => {
        onDownload(file);
    };

    const handleDelete = (): void => {
        onDelete(file);
    };
</script>

<div
    class="flex-none flex flex-row justify-stretch items-center gap-2 p-2 bg-white/10 rounded shadow"
>
    {#if file.name.endsWith(SCRIPT_FILE_EXTENSION)}
        <img class="h-8 w-8 shrink-0" src={midyell_png} alt="ms7 icon" />
    {:else}
        <div class="h-8 w-8 shrink-0">
            {@html getIcon(file.name).svg}
        </div>
    {/if}
    <div class="font-semibold text-lg basis-1/4 flex-1 text-left">
        {file.name}
    </div>
    {#if file.error}
        <div class="text-center grow text-lg text-rose-400">Error</div>
    {:else if file.uploading}
        <div class="text-center grow text-lg text-emerald-300">
            Uploading...
        </div>
    {:else}
        <div class="flex-1 text-slate-400/80 px-1">
            <span class="text-sm">
                {file.lastModified.toLocaleString()}
            </span>
        </div>
        <div class="flex-1 text-slate-400/80 px-1">
            <span class="text-sm">
                {formatBytes(file.size, 2)}
            </span>
        </div>
        <button
            on:click={handleDownload}
            class="border-emerald-500 border-2 text-white p-1 rounded hover:bg-emerald-600 transition-all shrink-0"
        >
            <img src={download_svg} alt="Download" class="h-6 w-6" />
        </button>
        <button
            on:click={handleDelete}
            class="border-rose-500 border-2 text-white p-1 rounded hover:bg-rose-600 transition-all shrink-0"
        >
            <img src={delete_svg} alt="Download" class="h-6 w-6" />
        </button>
    {/if}
</div>
