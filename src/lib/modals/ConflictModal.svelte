<script lang="ts">
    import Modal from "./Modal.svelte";

    let isShown = false;
    let fileName: string = "filename";
    let completePromise: (value: ConflictResult) => void;

    interface ConflictResult {
        cont: boolean;
        filename: string;
    }

    export function show(filename: string): Promise<ConflictResult> {
        isShown = true;
        fileName = filename;
        return new Promise((resolve) => {
            completePromise = resolve;
        });
    }

    function handleResponse(response: boolean) {
        isShown = false;
        completePromise({
            cont: response,
            filename: fileName,
        });
    }
</script>

{#if isShown}
    <Modal>
        <h2 class="text-xl">
            Overwrite file <span class="font-bold text-indigo-400"
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
                on:click={() => handleResponse(true)}>Overwrite</button
            >
        </div>
    </Modal>
{/if}
