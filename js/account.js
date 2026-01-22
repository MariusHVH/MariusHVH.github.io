function appdataInitAccountsFromLocalStorage() {
    const appdataAccount = localStorage.getItem('appdataAccount');
    if (appdataAccount) {
        Object.assign(appdata.accounts, JSON.parse(appdataAccount));
    }
}
function appdataAccountsSaveToLocalStorage() {
    localStorage.setItem('appdataAccount', JSON.stringify(appdata.accounts));
}
function setAccountActive(email) {
    let accountAlreadyActive = false;
    Object.keys(appdata.accounts).forEach(accountKey => {
        if (appdata.accounts[accountKey].email === email) {
            if (appdata.accounts[accountKey].clientActive) {
                accountAlreadyActive = true;
            }
            appdata.accounts[accountKey].clientActive = true;
        } else {
            appdata.accounts[accountKey].clientActive = false;
        }
    });
    if (!accountAlreadyActive) {
        appdataAccountsSaveToLocalStorage();
        updateSidebarAccounts();
        createNotification("Account",`Account <span class="font-bold">${email}</span> is now set as active`, "info", 5000);
    }
}
async function getAccountActive() {
    let activeAccount = null;
    if (Object.keys(appdata.accounts).length === 0) {
        // Create a guest account when no accounts exist
        try {
            const response = await fetch('https://' + appdata.apiServer + '.gofile.io/accounts', { method: 'POST' });
            
            if (!response.ok) {
                throw new Error(response.status);
            }
            
            const result = await response.json();
    
            if (result.status !== 'ok') {
                throw new Error(result.status);
            }
    
            const token = result.data.token;
            await getAccountByTokenAndSync(token);
        } catch (error) {
            throw new Error("getAccountActive "+error.message);
        }
    }

    // Find and track the active account, if any
    Object.keys(appdata.accounts).forEach(accountKey => {
        if (appdata.accounts[accountKey].clientActive) {
            if (activeAccount) {
                // Deactivate this one if there's already an active account
                appdata.accounts[accountKey].clientActive = false;
            } else {
                activeAccount = appdata.accounts[accountKey];
            }
        }
    });

    // If no active account was found, activate the first account
    if (!activeAccount && Object.keys(appdata.accounts).length > 0) {
        const firstAccountKey = Object.keys(appdata.accounts)[0];
        appdata.accounts[firstAccountKey].clientActive = true;
        activeAccount = appdata.accounts[firstAccountKey];
    }

    document.cookie = "accountToken=" + activeAccount.token + ";path=/;domain=gofile.io;SameSite=Lax;Secure;";
    return activeAccount;
}
function openAddAccountWindow() {
    createPopup({
        icon: 'fas fa-user-plus',
        title: 'Add Account',
        content: `
            <div class="min-h-full space-y-6">
                <!-- Header Section -->
                <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                    <div class="bg-blue-600 p-3 rounded-full">
                        <i class="fas fa-user-plus text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white">Login to Your Account</h2>
                        <p class="text-gray-400 text-sm">Securely access your storage space</p>
                    </div>
                </div>
    
                <!-- Information Box -->
                <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                        <p class="text-gray-300 text-sm">
                            Enter your email to receive a secure login link, or paste your token to login instantly.
                        </p>
                    </div>
                </div>
    
                <!-- Login Form -->
                <form id="popup_loginForm" class="space-y-4">
                    <div class="space-y-2">
                        <label for="popup_email" class="block text-sm font-medium text-gray-300">
                            Email address or token
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-envelope text-gray-400"></i>
                            </div>
                            <input 
                                type="text" 
                                id="popup_email" 
                                name="emailOrToken" 
                                placeholder="your.email@example.com or 32-char token" 
                                required 
                                autocomplete="off"
                                autocapitalize="none"
                                spellcheck="false"
                                class="w-full pl-10 pr-3 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                                       transition duration-200 text-white placeholder-gray-400"
                            >
                        </div>
                    </div>
    
                    <button 
                        type="submit" 
                        class="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 
                               transition duration-300 ease-in-out text-center text-white 
                               font-semibold flex items-center justify-center space-x-2"
                    >
                        <i class="fas fa-sign-in-alt"></i>
                        <span>Continue</span>
                    </button>
                </form>
    
                <!-- Footer Information -->
                <div class="border-t border-gray-600 pt-4 mt-4">
                    <div class="flex items-start space-x-3 text-sm text-gray-400">
                        <i class="fas fa-shield-alt text-gray-500 mt-1"></i>
                        <div class="space-y-2">
                            <p>Multi-account support enabled:</p>
                            <ul class="list-disc list-inside pl-2 space-y-1">
                                <li>Connect multiple accounts seamlessly</li>
                                <li>Switch between accounts instantly</li>
                                <li>Manage separate storage spaces</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `
    });     
    document.getElementById('popup_email').focus();
}
async function sendLoginLink(email) {
    if (!validateEmail(email)) {
        return createAlert('error','Invalid email address. Please check and try again.');
    }

    try {
        const response = await fetch('https://'+appdata.apiServer+'.gofile.io/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        if (!response.ok) {
            throw new Error(response.status);
        }
        const result = await response.json();

        if (result.status === 'ok') {
            return email
        } else {
            throw new Error(result.status);
        }
    } catch (error) {
        throw new Error("sendLoginLink "+error.message);
    }
}
async function getAccountByTokenAndSync(token) {
    try {
        const response = await fetch('https://' + appdata.apiServer + '.gofile.io/accounts/website', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = new Error(`HTTP_${response.status}`);
            err.httpStatus = response.status;
            // Classify: 4xx (except 429) => invalid token/account, 5xx/429 => transient
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                err.kind = 'invalid';
            } else {
                err.kind = 'transient';
            }
            throw err;
        }

        const result = await response.json();

        if (result.status !== 'ok') {
            const err = new Error(`API_${result.status}`);
            err.apiStatus = result.status;
            // If API responded with a non-ok status, we treat it as a definite invalid token/account.
            err.kind = 'invalid';
            throw err;
        }

        // Rewrite email for guest account as it's not supposed to be an email
        if (/^guest\d+@gofile\.io$/.test(result.data.email)) {
            result.data.email = result.data.email.replace(/@.*/, '');
        }

        // Get clientIcon and clientActive in memory if they exist to set them again after appdata.accounts[result.data.email] has been updated
        const clientIcon = appdata.accounts[result.data.email]?.clientIcon || blockies.create({
            seed: result.data.email,
            size: 16,
        }).toDataURL();
        const clientActive = appdata.accounts[result.data.email]?.clientActive || false;

        appdata.accounts[result.data.email] = {
            ...result.data,
            clientUpdatedAt: Math.floor(Date.now() / 1000),
            clientIcon,
            clientActive
        };

        appdataAccountsSaveToLocalStorage();
        return result.data.email;
    } catch (error) {
        // Preserve useful info from the original error so callers can differentiate
        // between "invalid token" and transient connectivity issues.
        const err = new Error("getAccountByTokenAndSync " + (error?.message || String(error)));
        err.cause = error;
        if (error?.httpStatus) err.httpStatus = error.httpStatus;
        if (error?.apiStatus) err.apiStatus = error.apiStatus;
        if (error?.kind) err.kind = error.kind;

        // Fetch network errors are often TypeError("Failed to fetch") in browsers
        if (error?.name === 'TypeError') {
            err.kind = 'transient';
        }

        throw err;
    }
}
async function refreshAppdataAccountsAndSync(specificEmail = null, force = false, throwOnTransient = false) {
    const now = Math.floor(Date.now() / 1000);
    const emailsToRefresh = specificEmail ? [specificEmail] : Object.keys(appdata.accounts);

    let hadTransientError = false;

    for (const email of emailsToRefresh) {
        if (force || now - appdata.accounts[email]?.clientUpdatedAt > 10) {
            const token = appdata.accounts[email]?.token;

            try {
                await getAccountByTokenAndSync(token);
            } catch (error) {
                const kind = error?.kind || error?.cause?.kind;

                if (kind === 'invalid') {
                    // Definite invalid token/account -> remove.
                    delete appdata.accounts[email];
                    appdataAccountsSaveToLocalStorage();
                } else {
                    // API unavailable / transient error -> keep the account.
                    hadTransientError = true;
                    if (appdata.accounts[email]) {
                        appdata.accounts[email].clientUpdatedAt = now;
                        appdataAccountsSaveToLocalStorage();
                    }
                }
            }
        }
    }

    try {
        await getAccountActive();
    } catch (error) {
        // If we can't even create/select an account, the app is not usable.
        const err = new Error("refreshAppdataAccountsAndSync " + error.message);
        err.kind = 'transient';
        throw err;
    }

    appdataAccountsSaveToLocalStorage();

    if (hadTransientError && throwOnTransient) {
        const err = new Error('Gofile API is currently unreachable.');
        err.kind = 'transient';
        throw err;
    }
}
async function getCountriesList() {
    createAlert('loading', 'Loading countries list, please wait...');
    try {
        const response = await fetch('https://api.gofile.io/getCountries');
        const data = await response.json();
        
        if (data.status === 'ok' && Array.isArray(data.data)) {
            return data.data.map(country => 
                `<option value="${country.code}">${country.name}</option>`
            ).join('');
        }
        
        throw new Error('Invalid response format from countries API');
    } catch (error) {
        console.error('Error fetching countries:', error);
        throw new Error('Failed to load countries list. Please try again later.');
    }
}
