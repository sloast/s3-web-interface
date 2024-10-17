<script lang="ts">
    import Modal from "./Modal.svelte";

    let isShown = false;
    let fileName: string = "filename";
    let completePromise: (value: boolean) => void;

    export function show(filename: string): Promise<boolean> {
        isShown = true;
        fileName = filename;
        return new Promise((resolve) => {
            completePromise = resolve;
        });
    }

    function handleResponse(response: boolean) {
        isShown = false;
        completePromise(response);
    }
</script>

{#if isShown}
    <Modal>
        <h2 class="text-xl">
            Delete file <span class="font-bold text-rose-400"
                >{fileName}</span
            >?
        </h2>
        <div class="flex flex-row justify-between">
            <button
                class="p-2 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-black rounded"
                on:click={() => handleResponse(false)}>Cancel</button
            >
            <button
                class="p-2 border-2 border-rose-500 hover:bg-rose-500 hover:text-black rounded"
                on:click={() => handleResponse(true)}>Delete</button
            >
        </div>
    </Modal>
{/if}
