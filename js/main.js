// shortcuts are managed in dist/js/shortcuts.js
// (kept global so other features can register shortcuts later)
if (window.shortcuts && typeof window.shortcuts.init === 'function') {
    window.shortcuts.init();
}

// Drag and Drop behavior
document.addEventListener("dragenter", function(event) {
    event.preventDefault();
    event.stopPropagation();
});
document.addEventListener("dragover", function(event) {
    event.preventDefault();
    event.stopPropagation();
});
document.addEventListener("dragleave", function(event) {
    event.preventDefault();
    event.stopPropagation();
});
document.addEventListener("drop", async function(event) {
    event.preventDefault();
    event.stopPropagation();

    if(event.dataTransfer.files.length == 0) {
        return;
    }

    newRequestToUploadQueue(event.dataTransfer.files)
});

//All addEventListener
document.addEventListener('click', async function(event) {
    removeAllPopovers();
    const eventTarget = event.target;
    if (eventTarget.closest('#home_uploadFile')) {
        document.querySelector('.uploadInput').click();
    }
    if (eventTarget.closest('.copy-button')) {
        copyTextToClipboard(eventTarget.closest('.copy-button'))
    }
    if (eventTarget.closest('a') && eventTarget.closest('a').href) {
        const link = eventTarget.closest('a');

        // Respect standard browser behavior for opening links in a new tab/window
        // (ctrl/cmd/shift/alt clicks, middle click, or explicit target=_blank).
        // This does not change normal mobile tap navigation.
        const isModifiedClick = event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
        const isMiddleClick = event.button === 1;

        if (!link.classList.contains('item_open') && link?.href && new URL(link.href).origin === location.origin && link.target !== '_blank' && !isModifiedClick && !isMiddleClick) {
            event.preventDefault();
            if (eventTarget.classList.contains('linkSuccessCard')) {
                const element = eventTarget.closest('[data-id]');
                if (element?.dataset.id && appdata.uploads[element.dataset.id]) {
                    removeRequestUploadObject(appdata.uploads[element.dataset.id]);
                }
            }
            if (link.classList.contains('closePopup')) {
                closePopup();
            }
            document.getElementById('index_ads').classList.add('hidden');
            // Preserve querystring/hash during SPA navigation
            const u = new URL(link.href);
            loadUrl(u.pathname + u.search + u.hash, eventTarget);
            if (window.innerWidth < 1024) closeSidebar();
        }
    }    
    if (!eventTarget.closest('#index_sidebar') && !eventTarget.closest('#index_toggleSidebar') && window.innerWidth < 1024) {
        closeSidebar();
    }
    if (eventTarget.closest('#index_toggleSidebar')) {
        toggleSidebar();
    }
    if (eventTarget.closest('#index_closeSidebar')) {
        closeSidebar();
    }
    const dropdownClicked = eventTarget.closest('.dropdown-toggle');
    if (dropdownClicked) {
        handleDropdowns(dropdownClicked);
    } else {
        closeAllDropdowns();
    }
    if (eventTarget.closest('.index_addAccount')) {
        openAddAccountWindow()
    }
    if (eventTarget.closest('.accountActive')) {
        const email = eventTarget.closest('.account_accountItem').getAttribute('data-email');
        setAccountActive(email);
        loadUrl(window.location.pathname)
    }
    if (eventTarget.closest('.logout')) {
        createAlert('loading', 'Logging out...');
        var email = eventTarget.closest('.account_accountItem').getAttribute('data-email');
        delete appdata.accounts[email];
        await refreshAppdataAccountsAndSync();
        closePopup();
        updateSidebarAccounts();
        createAlert('success', `Logged out successfully from <span class="font-bold">${email}</span>`);
        loadUrl("/");
    }
    //myprofile
    if (eventTarget.closest('#myprofile_login_button')) {
        openAddAccountWindow()
    }
    if (eventTarget.closest('#myprofile_upgrade_button')) {
        loadUrl("/premium");
    }
    if (eventTarget.closest('#myprofile_renew_button')) {
        showSubscriptionDuration()
    }
    if (eventTarget.closest('#myprofile_switch_payg_button')) {
        showPayAsYouGoCredits()
    }
    if (eventTarget.closest('#myprofile_cancel_subscription_button')) {
        showSubscriptionCancellation()
    }
    if (eventTarget.closest('#myprofile_add_credits_button')) {
        showPayAsYouGoCredits()
    }
    if (eventTarget.closest('.myprofile_charts_button')) {
        profileOpenCharts(eventTarget.closest('.myprofile_charts_button'))
    }
    if (eventTarget.closest('#myprofile_account_tokenreset')) {
        createPopup({
            icon: 'fas fa-key text-yellow-500',
            title: 'Reset Token',
            content: `
                <div class="min-h-full space-y-6">
                    <div class="bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                This action will invalidate your current token and log you out immediately.
                            </p>
                        </div>
                    </div>

                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg text-center">
                        <p class="text-gray-300 mb-4">
                            You are about to reset your account identification token. A new login link will be sent to your email address.
                        </p>
                        
                        <div class="flex justify-center flex-col items-center">
                            <button id="myprofile_account_tokenreset_go" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold">
                                Reset Token
                            </button>
                            <div id="myprofile_account_tokenreset_loading" class="hidden mt-4">
                                <div class="animate-spin rounded-full h-8 w-8 border-t-4 border-yellow-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        });        
    }
    if (eventTarget.closest('#myprofile_account_tokenreset_go')) {
        try {
            document.getElementById('myprofile_account_tokenreset_go').classList.add('hidden');
            document.getElementById('myprofile_account_tokenreset_loading').classList.remove('hidden');
            var account = await getAccountActive();
            var response = await fetch(`https://${appdata.apiServer}.gofile.io/accounts/${account.id}/resettoken`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${account.token}`,
                    'Content-Type': 'application/json'
                }
            });
            var result = await response.json();
            if (result.status !== "ok") {
                throw new Error('Token reset failed. Please try again later.');
            }
            delete appdata.accounts[account.email];
            await refreshAppdataAccountsAndSync();
            updateSidebarAccounts();
            createAlert('success', `The token for account <span class="font-bold">${account.email}</span> has been successfully reset. You have been logged out, and a new login link has been sent to your email address.`);
        } catch (error) {
            createAlert('error', error.message);
        }
    }
    //premium
    if (eventTarget.closest('#premium_subscriptionDuration')) {
        showSubscriptionDuration()
    }
    if(eventTarget.closest('#showSubscriptionDuration_year')) {
        appdata.billing = {
            plan: "subscriptionAnnual",
            premiumType: "subscription",
            currency: "USD",
            amount: 90
        }
        showSubscriptionForm()
    }
    if (eventTarget.closest('#premium_payasyougo')) {
        showPayAsYouGoCredits()
    }
    if (eventTarget.closest('.showPayAsYouGoCredits_packages')) {
        var package = eventTarget.closest('.showPayAsYouGoCredits_packages')
        var packageAmount = parseInt(package.dataset.amount, 10)
        appdata.billing = {
            plan: "payAsYouGo",
            premiumType: "credit",
            currency: "USD",
            amount: packageAmount
        }
        showPayAsYouGoForm()
    }    
    //filemanager
    if (eventTarget.closest('#filemanager_maincontent_back')) {
        var parentLink = appdata.fileManager.mainContent.data.parentFolder || sessionStorage.getItem(appdata.fileManager.mainContent.data.id + "_parentFolder");
        loadUrl("/d/" + parentLink);
    }
    if (eventTarget.closest('#filemanager_mainbuttons_checkboxAll_input')) {
        processAllCheckboxes(eventTarget.checked, true)
    }
    if (eventTarget.closest('#filemanager_mainbuttons_import')) {
        await importContent(appdata.fileManager.mainContent.data)
    }
    if (eventTarget.closest('#filemanager_mainbuttons_share')) {
        shareContent(appdata.fileManager.mainContent.data)
    }
    if (eventTarget.closest('#filemanager_mainbuttons_download')) {
        var items = appdata.fileManager.contentsSelected
        if(Object.keys(items).length == 1) {
            downloadContent(Object.keys(items)[0])
        } else {
            createAlert('loading', 'Generating download link ...');
            var itemsString = Object.keys(items).join(',');
            try {
                await downloadBulkContents(appdata.fileManager.mainContent.data.id, itemsString)
            } catch (error) {
                createAlert('error', error.message);
            }
        }
        processAllCheckboxes(false, true)
    }
    if (eventTarget.closest('#filemanager_mainbuttons_copy')) {
        var items = JSON.parse(JSON.stringify(appdata.fileManager.contentsSelected));
        copyContent(items)
        processAllCheckboxes(false, false);
    }
    if (eventTarget.closest('#filemanager_mainbuttons_copyhere')) {
        await copyHere()
    }
    if (eventTarget.closest('#filemanager_mainbuttons_copycancel')) {
        cancelCopyMove()
    }
    if (eventTarget.closest('#filemanager_mainbuttons_move')) {
        var items = JSON.parse(JSON.stringify(appdata.fileManager.contentsSelected));
        moveContent(items)
        processAllCheckboxes(false, false)
    }
    if (eventTarget.closest('#filemanager_mainbuttons_movehere')) {
        await moveHere()
    }    
    if (eventTarget.closest('#filemanager_mainbuttons_movecancel')) {
        cancelCopyMove()
    }
    if (eventTarget.closest('#filemanager_mainbuttons_delete')) {
        var items = appdata.fileManager.contentsSelected
        var itemsString = Object.keys(items).join(',');
        deleteContents(itemsString)
    }
    if (eventTarget.closest('#filemanager_mainbuttons_createFolder')) {
        createPopup({
            icon: 'fas fa-folder-plus',
            title: 'Create Folder',
            content: `
                <form id="popup_createFolderForm" class="space-y-4">
                    <div class="space-y-1">
                        <p class="text-sm text-gray-400">Enter the name of the new folder</p>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-folder text-gray-400"></i>
                            </div>
                            <input 
                                type="text" 
                                id="popup_folderName" 
                                name="folderName" 
                                placeholder="Enter folder name..." 
                                required 
                                class="w-full pl-10 pr-3 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                                maxlength="255"
                            >
                        </div>
                        <p class="text-xs text-gray-400 text-left">
                            <i class="fas fa-info-circle mr-1"></i>
                            Maximum 255 characters allowed
                        </p>
                    </div>
                    <!-- Submit Button -->
                    <div class="flex justify-center pt-2">
                        <button 
                            type="submit" 
                            class="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <i class="fas fa-folder-plus mr-2"></i>
                            Create Folder
                        </button>
                    </div>
                </form>
            `
        });
        
        document.getElementById('popup_folderName').focus();
    }
    if (eventTarget.closest('#filemanager_mainbuttons_uploadFiles')) {
        document.querySelector('.uploadInput').click();
    }
    if (eventTarget.closest('.filemanager_mainbuttons_sort_value')) {
        let selectedSortField = eventTarget.closest('.filemanager_mainbuttons_sort_value').getAttribute('data-sort');
        if (appdata.fileManager.sortField === selectedSortField) {
            appdata.fileManager.sortDirection = appdata.fileManager.sortDirection === -1 ? 1 : -1;
        } else {
            appdata.fileManager.sortField = selectedSortField;
            if(appdata.fileManager.sortField == "name") {
                appdata.fileManager.sortDirection = 1;
            } else {
                appdata.fileManager.sortDirection = -1;
            }
        }
        
        // Store the values in localStorage
        localStorage.setItem('fileManagerSortField', appdata.fileManager.sortField);
        localStorage.setItem('fileManagerSortDirection', appdata.fileManager.sortDirection);

        await refreshFilemanager()
    }
    if (eventTarget.closest('#filemanager_mainbuttons_filter')) {
        createPopup({
            icon: 'fas fa-filter',
            title: 'Filter Folder Content',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Current Folder -->
                    <div class="flex items-center space-x-3 pb-4 border-b border-gray-600">
                        <i class="fas fa-folder text-yellow-400 text-2xl"></i>
                        <div>
                            <span class="text-gray-400 text-sm">Current folder:</span>
                            <h2 class="text-lg font-bold text-white">${appdata.fileManager.mainContent.data.name}</h2>
                        </div>
                    </div>
        
                    <!-- Active Filter Notice (if filter is active) -->
                    ${appdata.fileManager.contentFilter ? `
                        <div class="bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-4">
                            <div class="flex space-x-3">
                                <i class="fas fa-exclamation-triangle text-yellow-400 text-xl mt-1"></i>
                                <div class="space-y-2">
                                    <p class="text-gray-300 text-sm">
                                        Content is currently being filtered. To disable filtering, clear the input field and click "Apply Filter".
                                    </p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
        
                    <!-- Information Box -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl mt-1"></i>
                            <div class="space-y-2">
                                <p class="text-gray-300 text-sm">
                                    Filter lets you quickly find specific items within the current folder by showing only the items whose <strong>name</strong> or <strong>tags</strong> match your input.
                                </p>
                                <div class="flex items-center space-x-2 text-xs text-gray-400">
                                    <i class="fas fa-exclamation-circle"></i>
                                    <p>Unlike search, filtering only applies to the current folder and is not recursive.</p>
                                </div>
                            </div>
                        </div>
                    </div>

        
                    <!-- Filter Form -->
                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg">
                        <form id="popup_filterForm" class="space-y-4">
                            <div class="space-y-2">
                                <label for="popup_filterInput" class="block text-sm font-medium text-gray-300">
                                    Filter Term
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i class="fas fa-search text-gray-400"></i>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="popup_filterInput" 
                                        name="filterInput" 
                                        placeholder="Enter text to filter items..." 
                                        value="${appdata.fileManager.contentFilter}"
                                        class="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                            text-white placeholder-gray-400
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                            transition duration-200 ease-in-out"
                                    >
                                    ${appdata.fileManager.contentFilter ? `
                                        <button type="button" 
                                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                                            onclick="document.getElementById('popup_filterInput').value = ''">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
            
                            <div class="flex space-x-3 pt-4">
                                <button type="submit" 
                                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg
                                        transition duration-200 ease-in-out inline-flex items-center justify-center">
                                    <i class="fas fa-filter mr-2"></i>
                                    Apply Filter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `
        });
        document.getElementById('popup_filterInput').focus();
    }    
    if (eventTarget.closest('#filemanager_mainbuttons_search')) {
        const accountActive = await getAccountActive();
        if(accountActive.tier != "premium") {
            return createPopup({
                icon: 'fas fa-crown text-yellow-500',
                title: 'Premium Account Required',
                content: `
                    <div class="flex flex-col items-center space-y-6 p-6">
                        <div class="text-center space-y-3">
                            <p class="text-gray-300 text-lg">
                                Search is a Premium feature
                            </p>
                            <p class="text-gray-400 text-sm">
                                Upgrade to Premium to search through your files and folders and unlock all premium features!
                            </p>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
                            <a href="/premium" 
                                class="closePopup w-full sm:w-auto px-6 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                                <i class="fas fa-rocket mr-2"></i>
                                Upgrade to Premium
                            </a>
                            
                            <button onclick="closePopup()" 
                                class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                                <i class="fas fa-clock mr-2"></i>
                                Maybe Later
                            </button>
                        </div>
                    </div>
                `
            });                                      
        }
        createPopup({
            icon: 'fas fa-search',
            title: 'Search Files',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Current Location -->
                    <div class="flex items-center space-x-3 pb-4 border-b border-gray-600">
                        <i class="fas fa-folder text-yellow-400 text-2xl"></i>
                        <div>
                            <span class="text-gray-400 text-sm">Searching in:</span>
                            <h2 class="text-lg font-bold text-white">${appdata.fileManager.mainContent.data.name}</h2>
                        </div>
                    </div>
        
                    <!-- Information Box -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl mt-1"></i>
                            <div class="space-y-2">
                                <p class="text-gray-300 text-sm">
                                    Search recursively through all files and folders within the current directory.
                                    You can search by:
                                </p>
                                <ul class="text-sm text-gray-300 space-y-1 ml-4">
                                    <li class="flex items-center space-x-2">
                                        <i class="fas fa-dot-circle text-xs text-blue-400"></i>
                                        <span>File or folder names</span>
                                    </li>
                                    <li class="flex items-center space-x-2">
                                        <i class="fas fa-dot-circle text-xs text-blue-400"></i>
                                        <span>Tags (if available)</span>
                                    </li>
                                </ul>
                                <div class="flex items-center space-x-2 text-xs text-gray-400 mt-2">
                                    <i class="fas fa-code-branch"></i>
                                    <p>More search criteria coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
        
                    <!-- Search Form -->
                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg">
                        <form id="popup_searchForm" class="space-y-4">
                            <div class="space-y-2">
                                <label for="popup_searchInput" class="block text-sm font-medium text-gray-300">
                                    Search Term
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i class="fas fa-search text-gray-400"></i>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="popup_searchInput" 
                                        name="searchInput" 
                                        placeholder="Enter text to search..." 
                                        required
                                        class="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                            text-white placeholder-gray-400
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                            transition duration-200 ease-in-out"
                                    >
                                </div>
                            </div>

                            <!-- Created time range (optional) -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label for="popup_searchCreatedFrom" class="block text-sm font-medium text-gray-300">
                                        Created from
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="popup_searchCreatedFrom"
                                        name="searchCreatedFrom"
                                        class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                            text-white placeholder-gray-400
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                            transition duration-200 ease-in-out"
                                    >
                                </div>
                                <div class="space-y-2">
                                    <label for="popup_searchCreatedTo" class="block text-sm font-medium text-gray-300">
                                        Created to
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="popup_searchCreatedTo"
                                        name="searchCreatedTo"
                                        class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                            text-white placeholder-gray-400
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                            transition duration-200 ease-in-out"
                                    >
                                </div>
                            </div>
            
                            <div class="flex space-x-3 pt-4">
                                <button type="submit" 
                                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg
                                        transition duration-200 ease-in-out inline-flex items-center justify-center">
                                    <i class="fas fa-search mr-2"></i>
                                    Start Search
                                </button>
                            </div>
                        </form>
                    </div>
        
                    <!-- Loading State (Initially Hidden) -->
                    <div id="searchLoading" class="hidden">
                        <div class="flex items-center justify-center space-x-3 text-gray-400">
                            <i class="fas fa-circle-notch fa-spin"></i>
                            <span>Searching...</span>
                        </div>
                    </div>
                </div>
            `
        });        
        document.getElementById('popup_searchInput').focus();
    }
    if (eventTarget.closest('#filemanager_mainbuttons_refresh')) {
        await refreshFilemanager()
    }
    if (eventTarget.closest('.item_playallmedia')) {
        playAllContent()
    }
    if (eventTarget.closest('.item_closeallmedia')) {
        closeAllContent()
    }
    if (eventTarget.closest('.item_download')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        downloadContent(itemId)
    }
    if (eventTarget.closest('.item_import')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        var content;
        if (itemId == appdata.fileManager.mainContent.data.id) {
            content = appdata.fileManager.mainContent.data;
        } else if (appdata.fileManager.mainContent.data.children[itemId] != undefined) {
            content = appdata.fileManager.mainContent.data.children[itemId];
        }
    
        await importContent(content)
    }
    if (eventTarget.closest('.item_share')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        var content;
        if (itemId == appdata.fileManager.mainContent.data.id) {
            content = appdata.fileManager.mainContent.data;
        } else if (appdata.fileManager.mainContent.data.children[itemId] != undefined) {
            content = appdata.fileManager.mainContent.data.children[itemId];
        }
    
        shareContent(content)
    }
    if (eventTarget.closest('.item_open')) {
        if (!event.ctrlKey && !event.metaKey && event.button !== 1) {  // if neither Ctrl nor Cmd key is pressed and not middle click
            event.preventDefault();
            const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
            sessionStorage.setItem(itemId+"_parentFolder", appdata.fileManager.mainContent.data.id);
            openContent(itemId)
        }
    }    
    if (eventTarget.closest('.item_play') || eventTarget.closest('.item_thumbnail')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        playContent(itemId, true, true)
    }
    if (eventTarget.closest('.item_close')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        closeContent(itemId)
    }
    if (eventTarget.closest('.item_rename')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        renameContent(itemId)
    }
    if (eventTarget.closest('.item_copy')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        copyContent({ [itemId]: true })
    }
    if (eventTarget.closest('.item_move')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        moveContent({ [itemId]: true })
    }
    if (eventTarget.closest('.item_delete')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        deleteContents(itemId)
    }
    if (eventTarget.closest('.item_properties')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        showProperties(itemId)
    }
    if (eventTarget.closest('.item_settings')) {
        const itemId = event.target.closest('[data-item-id]').getAttribute('data-item-id');
        const setting = event.target.closest('[data-setting]').getAttribute('data-setting');
        showSettings(itemId, setting)
    }
    if (eventTarget.closest('.filemanager_mainbuttons_pagination_previous')) {
        await loadPage('filemanager');
        await setContentToMainContent(appdata.fileManager.mainContent.data.id, appdata.fileManager.contentFilter, appdata.fileManager.mainContent.metadata.page-1, appdata.fileManager.mainContent.metadata.pageSize, appdata.fileManager.sortField, appdata.fileManager.sortDirection)
        initFilemanager();
    }
    if (eventTarget.closest('.filemanager_mainbuttons_pagination_next')) {
        await loadPage('filemanager');
        await setContentToMainContent(appdata.fileManager.mainContent.data.id, appdata.fileManager.contentFilter, appdata.fileManager.mainContent.metadata.page+1, appdata.fileManager.mainContent.metadata.pageSize, appdata.fileManager.sortField, appdata.fileManager.sortDirection)
        initFilemanager();
    }
    if (eventTarget.closest('#filemanager_abuse_button')) {
        showAbuseReportPopup()
    }
    if (eventTarget.closest('#filemanager_abuse_remove_button')) {
        deleteContents(appdata.fileManager.mainContent.data.id )
    }
    if (eventTarget.closest('.requestUploadObjectCancel')) {
        var dataId = eventTarget.closest('[data-id]').getAttribute('data-id');
        if(appdata.uploads[dataId].state == "pending") {
            removeRequestUploadObject(appdata.uploads[dataId]);
        } else {
            Object.values(appdata.uploads[dataId].fileList).forEach(fileObject => {
                if (fileObject.state != "progress" && fileObject.state != "done") {
                    fileObject.state = "canceled"
                }
            });
            appdata.uploads[dataId].state = "canceled"
        }
    }
    if (eventTarget.closest('.closeSuccessCard')) {
        var dataId = eventTarget.closest('[data-id]').getAttribute('data-id');
        removeRequestUploadObject(appdata.uploads[dataId]);
    }
});
document.addEventListener('submit', async function(event) {
    event.preventDefault();
    const eventTarget = event.target;
    if (eventTarget.closest('#popup_loginForm')) {
        const inputEl = document.getElementById('popup_email');
        const raw = (inputEl?.value || "").trim();

        // Branch:
        // - If it's an email => send login link (existing behavior)
        // - If it's a token => login directly
        if (validateEmail(raw)) {
            createAlert('loading', 'Sending login link...');
            try {
                var sendLoginLinkResponse = await sendLoginLink(raw);
                createPopup({
                    icon: 'fas fa-check-circle text-green-500',
                    title: 'Login Link Sent',
                    content: `
                        <div class="min-h-full space-y-6">
                            <!-- Success Icon -->
                            <div class="text-center">
                                <div class="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-900 bg-opacity-20">
                                    <i class="fas fa-paper-plane text-green-400 text-4xl animate-bounce"></i>
                                </div>
                            </div>
                
                            <!-- Main Content -->
                            <div class="text-center space-y-3">
                                <h3 class="text-xl font-bold text-white">Check Your Inbox</h3>
                                <div class="bg-gray-800 rounded-lg p-3 mx-auto max-w-md">
                                    <p class="text-blue-400 font-mono text-sm break-all">${sendLoginLinkResponse}</p>
                                </div>
                                <p class="text-gray-300">We've sent you a secure login link to complete your authentication.</p>
                            </div>
                
                            <!-- Timeline Steps -->
                            <div class="space-y-4 max-w-md mx-auto">
                                <div class="flex items-center space-x-3 text-sm">
                                    <div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <i class="fas fa-check text-white"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-white font-medium">Email Sent</p>
                                        <p class="text-gray-400">Login link has been dispatched</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3 text-sm">
                                    <div class="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                                        <i class="fas fa-envelope text-blue-400"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-white font-medium">Open Email</p>
                                        <p class="text-gray-400">Check your inbox or spam folder</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3 text-sm">
                                    <div class="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                                        <i class="fas fa-mouse-pointer text-blue-400"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-white font-medium">Click Link</p>
                                        <p class="text-gray-400">Complete your login process</p>
                                    </div>
                                </div>
                            </div>
                
                            <!-- Help Section -->
                            <div class="text-center text-sm">
                                <p class="text-gray-400">
                                    Having trouble? 
                                    <button class="index_addAccount text-blue-400 hover:text-blue-300 font-medium">
                                        Resend Email
                                    </button> 
                                    or 
                                    <a href="/contact" class="closePopup text-blue-400 hover:text-blue-300 font-medium">
                                        Contact Support
                                    </a>
                                </p>
                            </div>
                        </div>
                    `
                });
            } catch (error) {
                createAlert('error', error.message);
            }
            return;
        }

        if (validateAccountToken(raw)) {
            createAlert('loading', 'Logging in...');
            try {
                const accountEmail = await getAccountByTokenAndSync(raw);
                closePopup();
                createAlert('success', `Logged in successfully as <span class="font-bold">${accountEmail}</span>.`);
                setAccountActive(accountEmail);
                loadUrl("/myprofile");
            } catch (error) {
                const kind = error?.kind || error?.cause?.kind;
                if (kind === 'invalid') {
                    createAlert('error', 'Invalid token. Please check it and try again.');
                } else {
                    createAlert('error', error.message);
                }
            }
            return;
        }

        createAlert('error', 'Please enter a valid email address or a valid token.');
    }
    if (eventTarget.closest('#filemanager_alert_passwordform')) {
        document.getElementById('filemanager_alert_passwordform_submit').classList.add('hidden');
        document.getElementById('filemanager_alert_passwordform_loading').classList.remove('hidden');
        if (typeof sha256 === 'undefined') {
            const scriptSha256 = document.createElement('script');
            scriptSha256.src = '/dist/js/sha256.min.js';
            scriptSha256.onload = () => {
                processPassword()
            };
            document.head.appendChild(scriptSha256);
        } else {
            processPassword();
        }

        async function processPassword() {
            const passwordInput = document.getElementById('filemanager_alert_passwordform_input');
            const password = passwordInput.value;
            sessionStorage['password|' + getUrlParts()[1]] = sha256(password);
            sessionStorage['password|' + appdata.fileManager.mainContent.data.id] = sha256(password);

            await refreshFilemanager()
        }
    }
    if (eventTarget.closest('#popup_createFolderForm')) {
        const folderName = document.getElementById('popup_folderName').value;
        createAlert('loading', 'Creating folder...');
        try {
            var response = await createFolderFetch(appdata.fileManager.mainContent.data.id, folderName)
        } catch (error) {
            return createAlert('error', error.message);
        }
        createAlert('success', `Folder <i class="fas fa-folder text-yellow-400 mr-1"></i><span class="font-bold">${folderName}</span> created successfully!`);
        await refreshFilemanager()
    }
    if (eventTarget.closest('#popup_filterForm')) {
        const filterInput = document.getElementById('popup_filterInput').value;
        appdata.fileManager.contentFilter = filterInput
        if(!appdata.fileManager.contentFilter) {
            updateURLParameter('filter', null);
        } else {
            updateURLParameter('filter', appdata.fileManager.contentFilter);
        }
        closePopup()
        await refreshFilemanager()
    }    
    if (eventTarget.closest('#popup_searchForm')) {
        const searchInput = document.getElementById('popup_searchInput').value;
        const createdFromValue = document.getElementById('popup_searchCreatedFrom')?.value;
        const createdToValue = document.getElementById('popup_searchCreatedTo')?.value;

        // Convert datetime-local values to unix seconds (optional)
        const createTimeFrom = createdFromValue ? Math.floor(new Date(createdFromValue).getTime() / 1000) : undefined;
        const createTimeTo = createdToValue ? Math.floor(new Date(createdToValue).getTime() / 1000) : undefined;

        createAlert('loading', 'Searching, please wait...');
    
        try {
            const response = await searchFetch(appdata.fileManager.mainContent.data.id, searchInput, createTimeFrom, createTimeTo);
            let content = '';
            const entries = Object.values(response.data);

            if (entries.length > 0) {
                content = `
                    <!-- Search Summary -->
                    <div class="mb-6 pb-4 border-b border-gray-700">
                        <div class="flex items-center justify-between">
                            <div class="text-gray-300">
                                <span class="font-medium">${entries.length}</span> results found
                            </div>
                        </div>
                    </div>
                    
                    <!-- Results Grid -->
                    <div class="space-y-4">
                `;

                entries.forEach(entry => {
                    const isFile = entry.type === 'file';
                    const iconClass = isFile ? getIconForMimeType(entry.mimetype) : 'fas fa-folder text-yellow-400';
                    const createTime = new Date(entry.createTime * 1000).toLocaleDateString();

                    content += `
                        <div class="group relative rounded-lg bg-gray-800 hover:bg-gray-750 transition-all duration-200 p-4">
                            <!-- Main Content -->
                            <div class="flex items-start space-x-4">
                                <!-- Icon Section -->
                                <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg ${isFile ? 'bg-gray-700' : 'bg-yellow-400/10'}">
                                    ${isFile ? `
                                        <i class="${iconClass} text-2xl"></i>
                                    ` : `
                                        <div class="relative">
                                            <i class="fas fa-folder text-yellow-400 text-2xl"></i>
                                            <span class="absolute -bottom-1 -right-1 flex items-center justify-center min-w-5 min-h-5 text-xs font-bold text-white bg-gray-600 rounded-full border-2 border-gray-800">
                                                ${entry.childrenCount}
                                            </span>
                                        </div>
                                    `}
                                </div>

                                <!-- Details Section -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center space-x-2">
                                        <a href="${isFile ? `/d/${entry.parentFolder}?filter=${entry.name}` : `/d/${entry.code}`}" 
                                        class="text-lg font-semibold text-blue-400 hover:text-blue-300 truncate"
                                        target="_blank">
                                            ${entry.name}
                                        </a>
                                        ${isFile ? `
                                            <span class="px-2 py-1 text-xs font-medium text-gray-300 bg-gray-700 rounded-full">
                                                ${entry.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}
                                            </span>
                                        ` : ''}
                                    </div>

                                    <!-- Metadata -->
                                    <div class="mt-1 text-sm text-gray-400">
                                        <div class="flex items-center space-x-4">
                                            <span class="flex items-center">
                                                <i class="fas fa-calendar mr-1.5 text-gray-500"></i>
                                                ${createTime}
                                            </span>
                                            <span class="flex items-center">
                                                <i class="fas fa-weight-hanging mr-1.5 text-gray-500"></i>
                                                ${isFile ? humanFileSize(entry.size, true) : humanFileSize(entry.totalSize, true)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });

                content += '</div>';
            } else {
                content = `
                    <div class="text-center py-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                            <i class="fas fa-search text-2xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-300 mb-2">No Results Found</h3>
                        <p class="text-gray-400">Try adjusting your search criteria or try a different search term.</p>
                    </div>
                `;
            }

            createPopup({
                icon: 'fas fa-search',
                title: 'Search Results',
                content: `<div id="searchResults" class="space-y-3">${content}</div>`
            });


        } catch (error) {
            createAlert('error', error.message);
        }
    }
    if (eventTarget.closest('#showSubscriptionForm_form')) {
        appdata.billing.email = document.getElementById('showSubscriptionForm_formEmail').value
        appdata.billing.firstName = document.getElementById('showSubscriptionForm_formFirstname').value
        appdata.billing.lastName = document.getElementById('showSubscriptionForm_formLastname').value
        appdata.billing.country = document.getElementById('showSubscriptionForm_formCountry').value
        showPremiumPayment()
    }
    if (eventTarget.closest('#showPayAsYouGoForm_form')) {
        appdata.billing.email = document.getElementById('showPayAsYouGoForm_formEmail').value
        appdata.billing.firstName = document.getElementById('showPayAsYouGoForm_formFirstname').value
        appdata.billing.lastName = document.getElementById('showPayAsYouGoForm_formLastname').value
        appdata.billing.country = document.getElementById('showPayAsYouGoForm_formCountry').value
        showPremiumPayment()
    }
    if (eventTarget.closest('#contact_form')) {
        // Get form values
        const form = event.target;
        const name = form.querySelector('input[type="text"]').value;
        const email = form.querySelector('input[type="email"]').value;
        const subject = form.querySelector('select').value;
        const message = form.querySelector('textarea').value;
    
        // Create request payload
        const payload = {
            name: name,
            email: email,
            subject: subject,
            message: message
        };
    
        try {
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            createAlert('loading', 'Sending message...');
    
            // Send API request
            const response = await fetch(`https://${appdata.apiServer}.gofile.io/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
    
            const data = await response.json();
            if (data.status === 'ok') {
                createPopup({
                    icon: 'fas fa-check-circle text-green-500',
                    title: 'Success',
                    content: `
                        <div class="flex flex-col items-center space-y-6 p-4">
                            <div class="relative w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                                <i class="fas fa-paper-plane text-2xl text-green-500"></i>
                            </div>
                            
                            <div class="text-center space-y-3 max-w-sm">
                                <h3 class="text-xl font-semibold text-gray-200">
                                    Message Received!
                                </h3>
                                <p class="text-gray-400 text-sm leading-relaxed">
                                    We have received your message and it will be processed shortly.
                                </p>
                            </div>
                            
                            <div class="flex justify-center w-full max-w-md mx-auto">
                                <button onclick="closePopup()" 
                                    class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium transition-all duration-200 flex items-center justify-center">
                                    <i class="fas fa-check mr-2"></i>
                                    Close
                                </button>
                            </div>
                        </div>
                    `
                });                
                loadUrl(window.location.pathname);
            } else {
                createAlert('error', 'Failed to send message');
            }            
        } catch (error) {
            createAlert('error', 'Error sending message: ' + error.message);
        } finally {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Send Message';
        }
    }
    if (eventTarget.closest('#popup_abuseForm')) {
        // Get form elements
        const type = document.getElementById('popup_abuse_type').value;
        const email = document.getElementById('popup_abuse_email').value;
        const description = document.getElementById('popup_abuse_description').value;
        const folderCode = appdata.fileManager.mainContent.data.code;
        const domain = window.location.hostname;
        const folderLink = `https://${domain}/d/${folderCode}`;
    
        // Validate form
        if (!type || !email || !description) {
            return;
        }
    
        // Check if report was already sent
        const reportHistory = JSON.parse(sessionStorage.getItem('abuseReports') || '[]');
        if (reportHistory.includes(folderCode)) {
            createPopup({
                icon: 'fas fa-exclamation-circle',
                title: 'Report Already Submitted',
                content: `
                    <div class="text-center space-y-4">
                        <div class="text-yellow-400 text-5xl mb-4">
                            <i class="fas fa-exclamation-circle"></i>
                        </div>
                        <p class="text-gray-300">
                            You have already submitted a report for this folder. Our team will review it as soon as possible.
                        </p>
                    </div>
                `
            });
            return;
        }
    
        // Show loading alert
        createAlert('loading', 'Submitting your report...');
    
        // Prepare email data
        const subject = `Report ${type} - ${email} - ${folderCode}`;
        const emailData = {
            name: 'Abuse Report',
            email: email,
            subject: subject,
            message: `Report details:\n- Folder: ${folderCode}\n- Folder Link: ${folderLink}\n- Type: ${type}\n- Reporter: ${email}\n\nDescription:\n${description}`
        };
    
        fetch(`https://${appdata.apiServer}.gofile.io/sendReport`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                email: email,
                description: description,
                folderCode: folderCode,
                contentId: appdata.fileManager.mainContent.data.id
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                // Store the report in session storage
                reportHistory.push(folderCode);
                sessionStorage.setItem('abuseReports', JSON.stringify(reportHistory));
        
                createPopup({
                    icon: 'fas fa-check-circle',
                    title: 'Report Submitted',
                    content: `
                        <div class="text-center space-y-4">
                            <div class="text-green-400 text-5xl mb-4">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <p class="text-gray-300">
                                Thank you for your report. Our team will review it as soon as possible.
                            </p>
                        </div>
                    `
                });
            } else {
                createAlert('error', 'Failed to submit report. Please try again later.');
            }
        })
        .catch(error => {
            createAlert('error', 'Failed to submit report. Please try again later.');
        });
    }
})
document.addEventListener('change', async function(event) {
    event.preventDefault();
    const eventTarget = event.target;
    if (eventTarget.closest('.uploadInput')) {
        newRequestToUploadQueue(eventTarget.files)
    }
    if (eventTarget.closest('.item_checkbox')) {
        await itemCheckboxChangeEvent(eventTarget, true, true)
    }
    if (eventTarget.closest('.filemanager_mainbuttons_pagination_pageinput')) {
        const newPage = parseInt(eventTarget.value);
        appdata.fileManager.mainContent.metadata.page = eventTarget.value
        refreshFilemanager()
    }
    if (eventTarget.id === 'upload_proxy_select') {
        const selectedOption = eventTarget.options[eventTarget.selectedIndex];
        const proxyValue = selectedOption.getAttribute('data-proxy-value');
        if (proxyValue) {
            appdata.fileManager.uploadProxy = proxyValue;
            localStorage.setItem('fileManagerUploadProxy', appdata.fileManager.uploadProxy);
            console.log('Upload proxy updated to:', proxyValue);
        }
    }

    // Profile preference: disable thumbnails in file manager (client-side only)
    if (eventTarget.id === 'myprofile_disable_thumbnails') {
        const accountActive = await getAccountActive();
        const key = `fileManagerDisableThumbnails|${accountActive.email}`;
        localStorage.setItem(key, eventTarget.checked ? 'true' : 'false');
    }
})
window.addEventListener('resize', sidebarHandleResize);

//Init the app
window.onload = async function() {
    //Tracking code
    var adScript = document.createElement('script');
    adScript.setAttribute('data-domain','gofile.io');
    adScript.setAttribute('src','https://s.gofile.io/js/script.js');
    document.head.appendChild(adScript);

    try {
        sidebarHandleResize();
        appdataInitAccountsFromLocalStorage();
        appdataInitFilemanagerFromLocalStorage()

        try {
            // Force account validation on boot. If API is unavailable, hard-block the app.
            await refreshAppdataAccountsAndSync(null, true, true);
        } catch (error) {
            if (error?.kind === 'transient') {
                createAlert(
                    'error',
                    'The Gofile API is currently unavailable. The app cannot be used right now. Please retry later.',
                    { blocking: true, countdownSeconds: 60 }
                );
                return;
            }
            throw error;
        }

        updateSidebarAccounts();
        if (location.pathname) {
            await loadUrl(location.pathname + location.search + location.hash);
        }
        window.prerenderReady = true
    } catch (error) {
        createAlert('error', error.message);
    }
};
