<script lang="ts">
    import type { Service } from "../services";
    import Modal from "./Modal.svelte";

    let isShown = false;
    let fileName: string = "filename";
    let completePromise: (value: Service | null) => void;

    export function show(): Promise<Service | null> {
        isShown = true;
        return new Promise((resolve) => {
            completePromise = resolve;
        });
    }

    function handleResponse(response: Service | null) {
        isShown = false;
        completePromise(response);
    }
</script>

{#if isShown}
    <Modal>
        <h2 class="text-xl">
            Create new service
        </h2>
        <div class="flex flex-row justify-between">
            <button
                class="p-2 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-black rounded"
                on:click={() => handleResponse(null)}>Cancel</button
            >
            <button
                class="p-2 border-2 border-rose-500 hover:bg-rose-500 hover:text-black rounded"
                on:click={() => handleResponse(null)}>Delete</button
            >
        </div>
    </Modal>
{/if}
