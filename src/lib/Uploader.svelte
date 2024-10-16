<script lang="ts">
    import { onMount } from "svelte";

    export let upload_function: (file: File) => Promise<void>;
    export let multiple: boolean = false;

    let user_dragging_file: boolean = false;
    let dragging_over_box: boolean = false;

    let fileInput: HTMLInputElement;
    let dragToUploadBox: HTMLDivElement;

    function setupDragListeners(
        elem: EventTarget,
        cb: (dragging: boolean) => void,
    ) {
        elem.addEventListener("dragenter", () => cb(true));
        elem.addEventListener("dragleave", () => cb(false));
        elem.addEventListener("dragover", () => cb(true));
        elem.addEventListener("drop", () => cb(false));
    }

    setupDragListeners(window, (v) => {
        user_dragging_file = v;
    });

    async function handleDrop(event: DragEvent) {
        const files = event.dataTransfer?.files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await uploadFile(file);
            }
        }
    }

    async function handleFileUpload() {
        const selectedFiles = fileInput.files;
        if (selectedFiles) {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                await uploadFile(file);
            }
        }
    }

    async function uploadFile(file: File) {
        console.log(`File selected: ${file.name}`);
        await upload_function(file);
    }

    onMount(() => {
        setupDragListeners(dragToUploadBox, (v) => {
            dragging_over_box = v;
        });
    });
</script>

<div
    class="ants flex-auto flex m-2 justify-center items-center p-4 transition-all"
    on:dragover|preventDefault
    on:drop|preventDefault={handleDrop}
    on:click={() => fileInput.click()}
    on:keydown={(event) => {
        if (event.key === "Enter" || event.key === " ") fileInput.click();
    }}
    bind:this={dragToUploadBox}
    class:dragging={user_dragging_file}
    class:highlight={dragging_over_box}
    role="button"
    tabindex="0"
    aria-label="Drag files here to upload"
>
    <input
        bind:this={fileInput}
        type="file"
        {multiple}
        hidden
        on:change={handleFileUpload}
    />
    Drag {multiple ? "files" : "a file"} here to upload...
</div>

<style>
    @keyframes marching-ants {
        0% {
            background-position:
                0 0,
                0px 100%,
                0 0px,
                100% 0px;
        }
        100% {
            background-position:
                25px 0,
                25px 100%,
                0 25px,
                100% 25px;
        }
    }

    .ants {
        background-image: linear-gradient(90deg, #569491 50%, transparent 50%),
            linear-gradient(90deg, #569491 50%, transparent 50%),
            linear-gradient(180deg, #569491 50%, transparent 50%),
            linear-gradient(180deg, #569491 50%, transparent 50%);
        background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
        border-radius: 2px;
        background-size:
            25px 3px,
            25px 3px,
            3px 25px,
            3px 25px;
        background-position:
            0 0,
            25px 100%,
            0 25px,
            100% 0px;
        animation: marching-ants 1000ms infinite linear;
        animation-play-state: paused;
    }

    /* .ants:hover {
        animation-play-state: running;
    } */

    .dragging {
        animation-play-state: running;
    }

    .highlight, .ants:hover {
        @apply bg-slate-400/20;
    }

    .dragging:hover {
        @apply m-16
    }
</style>
