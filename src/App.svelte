<script lang="ts">
  import FileList from "./lib/FileList.svelte";
  import Panel from "./lib/Panel.svelte";

  import { S3Client } from "@aws-sdk/client-s3"

  const client = new S3Client({ region: 'eu-west-2' })

  
</script>

<main
  class="p-4 w-full h-full relative flex flex-col justify-stretch gap-4 text-center bg-gradient-to-br from-slate-900 to-emerald-950 text-slate-100"
>
  <div class="flex-none flex flex-row justify-between">
    <h1 class="grow-0">Thing</h1>
    <select name="pick" id="pp">
      <label for="pp">Select Service:</label>
    </select>
  </div>

  <div class="grow flex flex-row justify-stretch content-stretch gap-4">
    <Panel>some content</Panel>
    <div class="border-r-4 border-slate-500/25 rounded-sm" />
    <Panel>
      <FileList></FileList>
    </Panel>
  </div>
</main>

<style>
</style>
