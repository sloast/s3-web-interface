<script lang="ts">
  import FileList from "./lib/FileList.svelte";
  import Panel from "./lib/Panel.svelte";

  import { S3Client } from "@aws-sdk/client-s3";
  import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
  import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
  import { onMount } from "svelte";

  const REGION = "eu-west-2";
  const USER_POOL_ID = "your_user_pool_id";
  const APP_CLIENT_ID = "your_app_client_id";
  const IDENTITY_POOL_ID = "your_identity_pool_id";

  interface User {
    username: String;
  }

  let username = "";
  let password = "";
  let user: User | null = null;
  let client: S3Client | null;

  const signIn = async () => {
    try {
      const response = await fetch(
        `https://cognito-idp.${REGION}.amazonaws.com/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
          },
          body: JSON.stringify({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: APP_CLIENT_ID,
            AuthParameters: {
              USERNAME: username,
              PASSWORD: password,
            },
          }),
        },
      );

      const data = await response.json();
      const idToken = data.AuthenticationResult.IdToken;

      client = new S3Client({
        region: REGION,
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region: REGION }),
          identityPoolId: IDENTITY_POOL_ID,
          logins: {
            [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken,
          },
        }),
      });

      user = { username };
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const signOut = () => {
    user = null;
    client = null;
  };

  onMount(() => {
    // Check if user is already signed in
  });
</script>

<main
  class="p-4 w-full h-full relative flex flex-col justify-stretch gap-4 text-center bg-gradient-to-br from-slate-900 to-emerald-950 text-slate-100"
>
  {#if user}
    <div>
      <p>Welcome, {user.username}</p>
      <button on:click={signOut}>Sign Out</button>
    </div>
  {:else}
    <div>
      <input type="text" bind:value={username} placeholder="Username" />
      <input type="password" bind:value={password} placeholder="Password" />
      <button on:click={signIn}>Sign In</button>
    </div>
  {/if}

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
