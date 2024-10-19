
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const REGION = "eu-west-2";
const USER_POOL_ID = "eu-west-2_NraDuQCHk";
const APP_CLIENT_ID = "4kkranljmsf28lb2i0laaaip78";
const IDENTITY_POOL_ID = "eu-west-2:86e8cec3-3e3a-44b2-b4e1-b97200fefe7a";

const CURRENT_URL = window.location.origin + window.location.pathname;

const BASE_LOGIN_URL =
    "https://atm-users.auth.eu-west-2.amazoncognito.com/login";
const BASE_AUTH_URL =
    "https://atm-users.auth.eu-west-2.amazoncognito.com/oauth2/authorize";
const AUTH_URL_PARAMS = `?client_id=${APP_CLIENT_ID}&response_type=code&scope=email+openid+phone+profile&redirect_uri=${encodeURIComponent(CURRENT_URL)}`;
const AUTH_URL = BASE_AUTH_URL + AUTH_URL_PARAMS;
export const LOGIN_URL = BASE_LOGIN_URL + AUTH_URL_PARAMS;

interface Tokens {
    id_token: string;
    access_token: string;
    refresh_token: string;
}

const code = new URLSearchParams(window.location.search).get("code");
if (code) history.replaceState(null, "", CURRENT_URL);

const exchangeCodeForToken = async (code: string): Promise<Tokens> => {
    const response = await fetch(
        `https://atm-users.auth.eu-west-2.amazoncognito.com/oauth2/token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: APP_CLIENT_ID,
                code,
                redirect_uri: CURRENT_URL,
            }),
        },
    );

    const data = await response.json();

    if (data.error) {
        throw data.error;
    }

    const { id_token, access_token, refresh_token } = data;

    if (!id_token || !access_token || !refresh_token)
        throw "tokens missing";

    try {
        localStorage.setItem("id_token", id_token);
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
    } catch (err) {
        console.error(err);
    }

    return { id_token, access_token, refresh_token };
};

const getStoredTokens = (): Tokens | null => {
    const id_token = localStorage.getItem("id_token");
    const access_token = localStorage.getItem("access_token");
    const refresh_token = localStorage.getItem("refresh_token");

    if (!id_token || !access_token || !refresh_token) return null;

    return { id_token, access_token, refresh_token };
};

const getClient = async (tokens: Tokens): Promise<S3Client> => {

    const credentials = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: REGION }),
        identityPoolId: IDENTITY_POOL_ID,
        logins: {
            [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]:
                tokens.id_token,
        },
    });

    const test = await credentials();


    const client = new S3Client({
        region: REGION,
        credentials,
    });

    return client;
};

export const signIn = async (): Promise<S3Client> => {
    let tokens: Tokens | null = getStoredTokens();

    if (code) {
        try {
            tokens = await exchangeCodeForToken(code);
        } catch (err) {
            console.error(err);
            window.location.href = LOGIN_URL;
            throw "invalid auth code, redirecting";
        }
    }

    if (tokens) {
        try {
            return await getClient(tokens);
        } catch (error) {
            console.error("Error creating client:", error);
        }
    }

    window.location.href = AUTH_URL;
    throw "no auth code, redirecting";

    throw "login failed";
};

export const signOut = async (): Promise<void> => {
    window.location.href = LOGIN_URL;
};
