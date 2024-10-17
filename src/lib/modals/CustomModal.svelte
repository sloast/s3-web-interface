<script lang="ts">
    import Modal from "./Modal.svelte";

    let isShown = false;
    let state_: object = {};
    let completePromise: (value: any) => void;

    export function show(initialState?: object): Promise<any> {
        isShown = true;
        state_ = initialState ?? {};
        return new Promise((resolve) => {
            completePromise = resolve;
        });
    }

    export function state(updates?: object): any {
        if (updates) {
            state_ = { ...state_, ...updates };
        }

        return state_;
    }

    export function close(result?: any) {
        isShown = false;
        completePromise(result);
    }
</script>

{#if isShown}
    <Modal>
        <slot />
    </Modal>
{/if}
