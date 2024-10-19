<script lang="ts" generics="State extends {}, Result">
    import Modal from "./Modal.svelte";

    let isShown = false;
    export let state_: State = {} as State;
    let completePromise: (value?: Result) => void;

    export function show(initialState?: State): Promise<Result | undefined> {
        state_ = initialState ?? {} as State;
        isShown = true;
        return new Promise((resolve) => {
            completePromise = resolve;
        });
    }

    export function state(updates?: Partial<State>): State {
        if (updates) {
            state_ = { ...state_, ...updates };
        }

        return state_;
    }

    export function close(result?: Result) {
        isShown = false;
        completePromise(result);
    }
</script>

<svelte:options accessors/>
{#if isShown}
    <Modal>
        <slot />
    </Modal>
{/if}
