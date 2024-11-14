
import * as msal from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: "beede72e-0de3-4ae5-a317-1621ee24a5c7",
        authority: "https://login.microsoftonline.com/e17d1063-88c2-4368-9d08-203b84a1bb40",
        redirectUri: "http://localhost:3000",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: true
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const loginRequest = {
    scopes: ["openid", "profile", "email"]
};

async function signIn() {
    try {
        const currentAccounts = msalInstance.getAllAccounts();
        
        if (currentAccounts.length === 0) {
            const loginResponse = await msalInstance.loginPopup(loginRequest);
            handleResponse(loginResponse);
        } else {
            selectAccount();
        }
    } catch (error) {
        console.error("Error during sign in:", error);
    }
}

async function signOut() {
    try {
        const currentAccount = msalInstance.getActiveAccount();
        if (currentAccount) {
            await msalInstance.logoutPopup({
                account: currentAccount,
                postLogoutRedirectUri: "http://localhost:3000"
            });
        }
    } catch (error) {
        console.error("Error during sign out:", error);
    }
}

function selectAccount() {
    const currentAccounts = msalInstance.getAllAccounts();
    
    if (currentAccounts.length === 0) {
        return;
    } else if (currentAccounts.length === 1) {
        msalInstance.setActiveAccount(currentAccounts[0]);
        return currentAccounts[0];
    }

    console.log("Multiple accounts detected, using first account");
    msalInstance.setActiveAccount(currentAccounts[0]);
    return currentAccounts[0];
}

async function getTokenSilent() {
    try {
        const currentAccount = msalInstance.getActiveAccount();
        if (!currentAccount) {
            throw new Error("No active account");
        }

        const tokenResponse = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: currentAccount
        });
        
        return tokenResponse.accessToken;
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
            return tokenResponse.accessToken;
        }
        throw error;
    }
}

function handleResponse(response) {
    if (response !== null) {
        msalInstance.setActiveAccount(response.account);
        console.log("Logged in successfully:", response.account);
        return response.account;
    }
    return null;
}


async function callMsGraph() {
    try {
        const token = await getTokenSilent();
        
        const response = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        return await response.json();
    } catch (error) {
        console.error("Error calling MS Graph:", error);
        throw error;
    }
}

signIn().then(console.log).catch(console.error);
callMsGraph().then(console.log).catch(console.error);