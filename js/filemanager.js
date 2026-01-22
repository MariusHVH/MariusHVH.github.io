function appdataInitFilemanagerFromLocalStorage() {
    // Initialize sort settings
    if (localStorage.getItem('fileManagerSortField')) {
        appdata.fileManager.sortField = localStorage.getItem('fileManagerSortField');
    }
    if (localStorage.getItem('fileManagerSortDirection')) {
        appdata.fileManager.sortDirection = localStorage.getItem('fileManagerSortDirection');
    }
    
    // Initialize copy/move
    if (localStorage.getItem('fileManagerToCopy')) {
        appdata.fileManager.toCopy = localStorage.getItem('fileManagerToCopy');
    }
    if (localStorage.getItem('fileManagerToMove')) {
        appdata.fileManager.toMove = localStorage.getItem('fileManagerToMove');
    }

    // Initialize upload proxy
    if (localStorage.getItem('fileManagerUploadProxy')) {
        appdata.fileManager.uploadProxy = localStorage.getItem('fileManagerUploadProxy');
    }
}
async function itemCheckboxChangeEvent(eventTarget, processDomGeneral, processDomCopyMove) {
    const itemId = eventTarget.closest('[data-item-id]').getAttribute('data-item-id');
    if (eventTarget.checked) {
        appdata.fileManager.contentsSelected[itemId] = true;
    } else {
        delete appdata.fileManager.contentsSelected[itemId];
    }

    if (appdata.pressedKeys[16] == true && appdata.fileManager.lastContentSelected.processing == false && appdata.fileManager.lastContentSelected.id) {
        appdata.fileManager.lastContentSelected.processing = true;

        // Must get position of lastContentSelected
        var lastIndex = Array.prototype.indexOf.call(document.querySelectorAll(".item_checkbox"), document.querySelector(`[data-item-id='${appdata.fileManager.lastContentSelected.id}']`).querySelector(".item_checkbox"));

        // Must get position of current clicked box
        var index = Array.prototype.indexOf.call(document.querySelectorAll(".item_checkbox"), document.querySelector(`[data-item-id='${itemId}']`).querySelector(".item_checkbox"));

        while (index != lastIndex) {
            document.querySelectorAll(".item_checkbox")[index].checked = appdata.fileManager.lastContentSelected.checked;
            document.querySelectorAll(".item_checkbox")[index].dispatchEvent(new Event('change', { bubbles: true }));
            // Get loop direction
            if (index > lastIndex) {
                index--;
            }
            else {
                index++;
            }
        }

        appdata.fileManager.lastContentSelected.processing = false;
    } else {
        appdata.fileManager.lastContentSelected.id = itemId;
        appdata.fileManager.lastContentSelected.checked = eventTarget.checked;
    }

    if(processDomGeneral == true) {
        if(Object.keys(appdata.fileManager.contentsSelected).length == document.querySelectorAll(".item_checkbox").length) {
            document.getElementById("filemanager_mainbuttons_checkboxAll_input").checked = true
        } else {
            document.getElementById("filemanager_mainbuttons_checkboxAll_input").checked = false
        }

        if(Object.keys(appdata.fileManager.contentsSelected).length == 0) {
            document.getElementById("filemanager_mainbuttons_checkboxAll_count").classList.add('hidden')
            document.getElementById("filemanager_mainbuttons_download").classList.add('hidden')
            document.getElementById("filemanager_mainbuttons_copy").classList.add('hidden')
            document.getElementById("filemanager_mainbuttons_move").classList.add('hidden')
            document.getElementById("filemanager_mainbuttons_delete").classList.add('hidden')
    
            if(appdata.fileManager.toCopy == null && appdata.fileManager.toMove == null) {
                hideMainButtons(false)
            }
        } else {
            var accountActive = await getAccountActive()
            hideMainButtons(true)
    
            document.getElementById("filemanager_mainbuttons_checkboxAll_count").classList.remove('hidden')
            document.getElementById("filemanager_mainbuttons_checkboxAll_countvalue").innerText = Object.keys(appdata.fileManager.contentsSelected).length;
            document.getElementById("filemanager_mainbuttons_download").classList.remove('hidden')
            if (appdata.fileManager.mainContent.data.isOwner == true) {
                document.getElementById("filemanager_mainbuttons_copy").classList.remove('hidden')
                document.getElementById("filemanager_mainbuttons_move").classList.remove('hidden')
                document.getElementById("filemanager_mainbuttons_delete").classList.remove('hidden')
            }
            if(accountActive.isCleaner) {
                document.getElementById("filemanager_mainbuttons_delete").classList.remove('hidden')
            }
        }
    }

    //Cancel the copy/move if it exist
    if(processDomCopyMove == true && (appdata.fileManager.toCopy != null || appdata.fileManager.toMove != null)) {
        cancelCopyMove()
    }
}
async function initFilemanager() {
    var accountActive = await getAccountActive()
    var ipTrafficLast30Days = getIpTrafficLastXDays(accountActive.email, 29)
    document.getElementById("filemanager_loading").classList.add("hidden");

    appdata.fileManager.contentsSelected = {};

    if (appdata.fileManager.mainContent.status == "error-notFound") {
        // Avoid mutating document.head.innerHTML (can reparse head and break scripts/styles)
        // Instead, create/update the prerender status meta tag safely.
        let statusMeta = document.querySelector('meta[name="prerender-status-code"]');
        if (!statusMeta) {
            statusMeta = document.createElement('meta');
            statusMeta.setAttribute('name', 'prerender-status-code');
            document.head.appendChild(statusMeta);
        }
        statusMeta.setAttribute('content', '404');

        document.getElementById("filemanager_alert").classList.remove("hidden");
        document.getElementById("filemanager_alert").classList.replace("border-blue-500", "border-red-500");
        document.getElementById('filemanager_alert_icon').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>';
        document.getElementById('filemanager_alert_message').innerHTML = '<span class="font-semibold">This content does not exist</span>';
        document.getElementById('filemanager_alert').innerHTML += `
            <div class="flex flex-col items-center justify-center text-sm text-gray-400 mt-2">
                <p>The content you are looking for could not be found. Possible reasons include:</p>
                <ul class="list-disc pl-5 mt-2">
                    <li>The content has been inactive for an extended period and has been automatically removed.</li>
                    <li>The content has been deleted by the owner.</li>
                </ul>
            </div>`;
        return;
    }
    if (appdata.fileManager.mainContent.data.canAccess == false && appdata.fileManager.mainContent.data.public == false) {
        document.getElementById("filemanager_alert").classList.remove("hidden");
        document.getElementById("filemanager_alert").classList.replace("border-blue-500", "border-yellow-500");
        document.getElementById('filemanager_alert_icon').innerHTML = '<i class="fas fa-globe text-yellow-500 text-2xl mr-3"></i>';
        document.getElementById('filemanager_alert_message').innerHTML = '<span class="font-semibold">This content is not publicly accessible</span>';
        document.getElementById('filemanager_alert').innerHTML += `
            <div class="flex flex-col items-center justify-center text-sm text-gray-400 mt-2">
                <p>To make this content publicly accessible, the owner must change its visibility settings.</p>
            </div>`;
        return;
    }

    if (appdata.fileManager.mainContent.data.canAccess == false && appdata.fileManager.mainContent.data.expire) {
        document.getElementById("filemanager_alert").classList.remove("hidden");
        document.getElementById("filemanager_alert").classList.replace("border-blue-500", "border-yellow-500");
        document.getElementById('filemanager_alert_icon').innerHTML = '<i class="fas fa-clock text-yellow-500 text-2xl mr-3"></i>';
        document.getElementById('filemanager_alert_message').innerHTML = '<span class="font-semibold">This content has expired</span>';
        document.getElementById('filemanager_alert').innerHTML += `
            <div class="flex flex-col items-center justify-center text-sm text-gray-400 mt-2">
                <p>The content you are trying to access has reached its expiration date set by the owner.</p>
                <p>Please contact the owner to regain access or for more information.</p>
            </div>`;
        return;
    }

    if (appdata.fileManager.mainContent.data.canAccess == false && appdata.fileManager.mainContent.data.password == true) {
        if (appdata.fileManager.mainContent.data.passwordStatus == "passwordRequired") {
            document.getElementById("filemanager_alert").classList.remove("hidden");
            document.getElementById('filemanager_alert_icon').innerHTML = '<i class="fas fa-lock text-blue-500 text-2xl mr-3"></i>';
            document.getElementById('filemanager_alert_message').innerHTML = '<span class="font-semibold">This content is password protected</span>';
            document.getElementById("filemanager_alert_passwordform").classList.remove("hidden");
            return;
        } else if (appdata.fileManager.mainContent.data.passwordStatus == "passwordWrong") {
            document.getElementById("filemanager_alert").classList.remove("hidden");
            document.getElementById('filemanager_alert_icon').innerHTML = '<i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>';
            document.getElementById('filemanager_alert_message').innerHTML = '<span class="font-semibold">Incorrect password. Please try again.</span>';
            document.getElementById("filemanager_alert_passwordform").classList.remove("hidden");
            return;
        }
    }

    var type = appdata.fileManager.mainContent.data.isRootRecycle ? "recycle" : "standard";

    //#filemanager_description
    if (appdata.fileManager.mainContent.data.description != undefined) {
        document.getElementById("filemanager_description").classList.remove("hidden");

        // Check if marked is already loaded
        if (typeof marked !== 'undefined') {
            document.getElementById("filemanager_description_value").innerHTML = marked.parse(appdata.fileManager.mainContent.data.description);
        } else {
            // Load marked.min.js if not already loaded
            var script = document.createElement('script');
            script.src = '/dist/js/marked.min.js';
            script.onload = function() {
                document.getElementById("filemanager_description_value").innerHTML = marked.parse(appdata.fileManager.mainContent.data.description);
            };
            document.head.appendChild(script);
        }
    }

    //#filemanager_maincontent
    document.getElementById("filemanager_maincontent").classList.remove("hidden");
    document.getElementById("filemanager_maincontent").setAttribute('data-item-id',appdata.fileManager.mainContent.data.id)
    if (type == "standard") {
        if(appdata.fileManager.mainContent.data.parentFolder || sessionStorage.getItem(appdata.fileManager.mainContent.data.id+"_parentFolder")) {
            document.getElementById("filemanager_maincontent_back").classList.remove("hidden");
        }
        document.getElementById("filemanager_maincontent_icon").innerHTML = '<i class="fas fa-folder-open text-yellow-400 text-2xl mr-2"></i>';
        document.getElementById("filemanager_maincontent_name").innerText = appdata.fileManager.mainContent.data.name
        document.getElementById("filemanager_maincontent_createtime").classList.remove("hidden");
        document.getElementById("filemanager_maincontent_createtimevalue").innerText = new Date(appdata.fileManager.mainContent.data.createTime * 1000).toLocaleString();

        document.getElementById("filemanager_maincontent_dropdown").classList.remove("hidden");
        document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_playallmedia").classList.remove("hidden");
        document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_download").classList.remove("hidden");
        if(appdata.fileManager.mainContent.data.isOwner) {
            document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_share").classList.remove("hidden");
            document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_rename").classList.remove("hidden");
            if(!appdata.fileManager.mainContent.data.isRoot) {
                document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_copy").classList.remove("hidden");
                document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_move").classList.remove("hidden");
            }
        } else {
            document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_import").classList.remove("hidden");
        }
        if(appdata.fileManager.mainContent.data.isOwner || accountActive.isCleaner) {
            document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_delete").classList.remove("hidden");
        }
        document.getElementById("filemanager_maincontent_dropdown").querySelector(".item_properties").classList.remove("hidden");
    } else if (type == "recycle") {
        document.getElementById("filemanager_maincontent_icon").innerHTML = '<i class="fas fa-trash text-gray-400 text-2xl mr-2"></i>';
        document.getElementById("filemanager_maincontent_name").innerText = 'Recycle bin';
    }
    if(appdata.fileManager.mainContent.data.isOwner) {
        ['public', 'password', 'expire', 'tags'].forEach(prop => {
            if (appdata.fileManager.mainContent.data[prop]) {
                document.querySelector(`#filemanager_maincontent_properties_${prop}`).classList.remove('hidden');
            }
        });
    }
    if (appdata.fileManager.mainContent.data.directLinks && Object.keys(appdata.fileManager.mainContent.data.directLinks).length > 0) {
        const directLinksCount = Object.keys(appdata.fileManager.mainContent.data.directLinks).length;
        const directLinkText = `${directLinksCount} direct link${directLinksCount > 1 ? 's' : ''}`;
        document.querySelector('#filemanager_maincontent_properties_directlink_value').textContent = directLinkText;
        document.querySelector('#filemanager_maincontent_properties_directlink').classList.remove('hidden');
    }

    document.getElementById("filemanager_maincontent_itemscount").innerText = appdata.fileManager.mainContent.data.childrenCount

    //#filemanager_mainbuttons
    document.getElementById("filemanager_mainbuttons").classList.remove("hidden");
    if(appdata.fileManager.mainContent.data.childrenCount > 0) {
        document.getElementById("filemanager_mainbuttons_checkboxAll").classList.remove("hidden");
    }
    if (type == "standard") {
        document.getElementById("filemanager_mainbuttons_sort").classList.remove("hidden");
        document.getElementById("filemanager_mainbuttons_filter").classList.remove("hidden");
        document.getElementById("filemanager_mainbuttons_search").classList.remove("hidden");
        document.getElementById("filemanager_mainbuttons_refresh").classList.remove("hidden");
        if(appdata.fileManager.mainContent.data.isOwner) {
            document.getElementById("filemanager_mainbuttons_share").classList.remove("hidden");
            document.getElementById("filemanager_mainbuttons_createFolder").classList.remove("hidden");
            document.getElementById("filemanager_mainbuttons_uploadFiles").classList.remove("hidden");
        } else {
            document.getElementById("filemanager_mainbuttons_import").classList.remove("hidden");
        }

        if(appdata.fileManager.toCopy != null) {
            document.getElementById('filemanager_mainbuttons_copyhere_countvalue').innerText = appdata.fileManager.toCopy.split(",").length
            document.getElementById('filemanager_mainbuttons_copyhere').classList.remove('hidden');
            document.getElementById('filemanager_mainbuttons_copycancel').classList.remove('hidden');
            hideMainButtons(true)
        }
        if(appdata.fileManager.toMove != null) {
            document.getElementById('filemanager_mainbuttons_movehere_countvalue').innerText = appdata.fileManager.toMove.split(",").length
            document.getElementById('filemanager_mainbuttons_movehere').classList.remove('hidden');
            document.getElementById('filemanager_mainbuttons_movecancel').classList.remove('hidden');
            hideMainButtons(true)
        }
        
        // Update the sort icons according to appdata.fileManager.sortField and appdata.fileManager.sortDirection
        document.querySelectorAll('.sort-icon').forEach(icon => icon.innerHTML = '');
        document.querySelectorAll('.filemanager_mainbuttons_sort_value').forEach(link => {
            if (link.dataset.sort === appdata.fileManager.sortField) {
                const icon = link.querySelector('.sort-icon');
                if (appdata.fileManager.sortDirection === 1) {
                    icon.innerHTML = '<i class="fas fa-sort-up"></i>';
                } else {
                    icon.innerHTML = '<i class="fas fa-sort-down"></i>';
                }
            }
        });

        if (appdata.fileManager.contentFilter != "") {
            const element = document.getElementById("filemanager_mainbuttons_filter");
            element.classList.replace("bg-gray-600", "bg-yellow-600");
            element.classList.replace("hover:bg-gray-700", "hover:bg-yellow-700");
        }
    }

    //#filemanager_itemslist
    var ipTrafficLimit = 1000000000000
    if(accountActive.tier != "premium" && ipTrafficLast30Days > ipTrafficLimit) {
        document.getElementById('traffic_used').textContent = humanFileSize(ipTrafficLast30Days, true)
        document.getElementById('traffic_limit').textContent = humanFileSize(ipTrafficLimit, true)
        document.getElementById("filemanager_itemslist_traffic_exceeded").classList.remove("hidden");
    }
    if(appdata.fileManager.contentFilter != "") {
        document.getElementById("filemanager_itemslist_filtered").classList.remove("hidden");
    }
    if(appdata.fileManager.mainContent.data.childrenCount == 0) {
        document.getElementById("filemanager_itemslist_empty").classList.remove("hidden");
    } else {
        let hasFrozenItem = false;
        Object.entries(appdata.fileManager.mainContent.data.children).forEach(([key, item]) => {
            if(item.isFrozen) {
                hasFrozenItem = true;
            }
            buildFilemanagerItemHTML(item, accountActive);
        });
        if(hasFrozenItem) {
            document.getElementById("filemanager_itemslist_frozen").classList.remove("hidden");
        }
    }
    
    document.getElementById("filemanager_itemslist").classList.remove("hidden");
    if(appdata.fileManager.mainContent.data.childrenCount == 1 && isItemPlayable(Object.entries(appdata.fileManager.mainContent.data.children)[0][1]) && Object.entries(appdata.fileManager.mainContent.data.children)[0][1].overloaded != true && Object.entries(appdata.fileManager.mainContent.data.children)[0][1].isFrozen != true) {
        playContent(Object.entries(appdata.fileManager.mainContent.data.children)[0][1].id)
    }

    if(appdata.fileManager.mainContent.metadata.totalPages > 1) {
        document.getElementById("filemanager_topbuttons_pagination").classList.remove("hidden");
        document.querySelectorAll(".filemanager_mainbuttons_pagination_details2").forEach(el => el.classList.remove("hidden"));
    }
    document.getElementById("filemanager_mainbuttons_pagination").classList.remove("hidden");
    document.querySelectorAll(".filemanager_mainbuttons_pagination_details").forEach(el => el.classList.remove("hidden"));
    document.querySelectorAll(".filemanager_mainbuttons_pagination_pagecurrent").forEach(element => {
        element.innerText = appdata.fileManager.mainContent.metadata.page;
    });
    document.querySelectorAll(".filemanager_mainbuttons_pagination_pagecount").forEach(element => {
        element.innerText = appdata.fileManager.mainContent.metadata.totalPages;
    });
    document.querySelectorAll(".filemanager_mainbuttons_pagination_itemcount").forEach(element => {
        element.innerText = appdata.fileManager.mainContent.metadata.pageSize;
    });
    document.querySelectorAll(".filemanager_mainbuttons_pagination_itemtotal").forEach(element => {
        element.innerText = appdata.fileManager.mainContent.data.childrenCount;
    });
    document.querySelectorAll('.filemanager_mainbuttons_pagination_pageinput').forEach(input => input.value = appdata.fileManager.mainContent.metadata.page);

    if(!appdata.fileManager.mainContent.data.isOwner && appdata.fileManager.mainContent.data.canAccess == true) {
        document.getElementById("filemanager_abuse").classList.remove("hidden")
        if(accountActive.isCleaner) {
            document.getElementById("filemanager_abuse_remove_button").classList.remove("hidden")
        }
    }

    if(appdata.fileManager.mainContent.metadata.page > 1) {
        document.querySelectorAll(".filemanager_mainbuttons_pagination_previous").forEach(el => el.classList.remove("hidden"));
        updateURLParameter('page', appdata.fileManager.mainContent.metadata.page);
    } else {
        updateURLParameter('page', null);
    }
    if(appdata.fileManager.contentFilter == "") {
        updateURLParameter('filter', null);
    }
    if(appdata.fileManager.mainContent.metadata.page < appdata.fileManager.mainContent.metadata.totalPages) {document.querySelectorAll(".filemanager_mainbuttons_pagination_next").forEach(el => el.classList.remove("hidden"))}
    if(appdata.fileManager.mainContent.data?.type === "folder" && appdata.fileManager.mainContent.data?.public) {
        const newUrl = new URL(`https://${location.hostname}/d/${appdata.fileManager.mainContent.data.code}`);
        newUrl.search = location.search;
        history.replaceState({}, '', newUrl);
    }

    launchAds()
}
async function refreshFilemanager() {
    await loadPage('filemanager');
    await setContentToMainContent(appdata.fileManager.mainContent.data.id, appdata.fileManager.contentFilter, appdata.fileManager.mainContent.metadata.page, appdata.fileManager.mainContent.metadata.pageSize, appdata.fileManager.sortField, appdata.fileManager.sortDirection)
    initFilemanager();
}
function buildFilemanagerItemHTML(item, account) {
    const playableMedia = isItemPlayable(item);
    const iconClass = item.type === "file" ? getIconForMimeType(item.mimetype) : 'fas fa-folder text-yellow-400';

    // Client-side preference: disable thumbnails (stored in localStorage per account)
    const disableThumbsKey = account?.email ? `fileManagerDisableThumbnails|${account.email}` : null;
    const disableThumbnails = disableThumbsKey ? localStorage.getItem(disableThumbsKey) === 'true' : false;

    const html = `
        <div class="border-b border-gray-600" data-item-id="${item.id}">
            <div class="flex items-center justify-between p-1 space-x-2">
                <div class="flex items-center overflow-auto">
                    <div class="min-w-4">
                        <input type="checkbox" class="item_checkbox text-blue-500 mr-2">
                    </div>
                    <div class="min-w-8">
                    ${item.type === "file" ? 
                        `<div class="relative inline-flex">
                            <i class="${iconClass} text-blue-400 text-2xl mr-2"></i>
                            ${item.isFrozen ? 
                                `<div class="absolute inline-flex items-center justify-center w-auto min-w-5 h-5 text-xs font-bold text-white bg-slate-400 border border-gray-900 rounded-full -bottom-1 -start-1">
                                    <i class="fas fa-snowflake"></i>
                                </div>` 
                                : ''
                            }
                        </div>` :
                        `<div class="relative inline-flex">
                            <i class="fas fa-folder text-yellow-400 text-2xl mr-2"></i>
                            <div class="absolute inline-flex items-center justify-center w-auto min-w-5 h-5 text-xs font-bold text-white ${item.canAccess ? 'bg-gray-500' : 'bg-red-500'} border border-gray-900 rounded-full -bottom-1 -start-1">
                                ${item.canAccess ? item.childrenCount : '<i class="fas fa-lock"></i>'}
                            </div>
                        </div>`}
                    </div>
                    <div class="truncate">
                        <a href="${item.type === 'folder' ? `/d/${item.id}` : 'javascript:void(0);'}" class="item_open font-semibold text-sm text-white hover:underline">${item.name}</a>
                        <div class="flex flex-col text-xs text-gray-400 mt-1">
                            <div class="min-w-24"><span>${new Date(item.createTime * 1000).toLocaleString()}</span></div>
                            ${item.type === "file" ? `<div class="min-w-24"><span>${humanFileSize(item.size, true)}</span></div>` : ''}
                            ${item.type === "file" && item.isOwner ? `<div class="min-w-24"><span>${item.downloadCount} downloads</span></div>` : ''}
                        </div>
                        ${item.isOwner ? `
                        <div class="text-xs text-white flex flex-row mt-1">
                            ${item.public ? '<span class="bg-gray-500 text-white rounded px-1 py-0.5 mr-1"><i class="fas fa-globe mr-1"></i>public</span>' : ''}
                            ${item.password ? '<span class="bg-gray-500 text-white rounded px-1 py-0.5 mr-1"><i class="fas fa-lock mr-1"></i>protected</span>' : ''}
                            ${item.expire ? '<span class="bg-gray-500 text-white rounded px-1 py-0.5 mr-1"><i class="fas fa-hourglass-end mr-1"></i>expire</span>' : ''}
                            ${item.tags ? '<span class="bg-gray-500 text-white rounded px-1 py-0.5 mr-1"><i class="fas fa-tag mr-1"></i>tags</span>' : ''}
                            ${(item.directLinks && Object.keys(item.directLinks).length > 0) ? `<span class="bg-gray-500 text-white rounded px-1 py-0.5 mr-1"><i class="fas fa-link mr-1"></i>${Object.keys(item.directLinks).length} direct link${Object.keys(item.directLinks).length > 1 ? 's' : ''}</span>` : ''}
                        </div>
                        ` : ''}
                        ${(!disableThumbnails && item.thumbnail) ? `<div class="thumbnail mt-2">
                            <img class="item_thumbnail max-h-36" src="${item.thumbnail}" alt="Thumbnail" loading="lazy">
                        </div>` : ''}
                    </div>
                </div>
                <div>
                    <div class="flex flex-row space-x-2">
                        ${item.type === "folder" ? 
                            `<button class="item_open border border-gray-600 text-white text-sm px-2 py-1 rounded shadow hover:bg-gray-700 flex items-center">
                                    <i class="fas fa-folder-open mr-1"></i>
                                    <span class="hidden lg:inline">Open</span>
                            </button>` : ''}
                        ${playableMedia ? 
                            `<button class="item_play border border-gray-600 text-white text-sm px-2 py-1 rounded shadow hover:bg-gray-700 flex items-center">
                                    <i class="fas fa-play mr-1"></i>
                                    <span class="hidden lg:inline">Play</span>
                            </button>
                            <button class="item_close hidden border border-gray-600 text-white text-sm px-2 py-1 rounded shadow hover:bg-gray-700 flex items-center">
                                    <i class="fas fa-times mr-1"></i>
                                    <span class="hidden lg:inline">Close</span>
                            </button>` : ''}
                        <button class="item_download border border-gray-600 text-white text-sm px-2 py-1 rounded shadow hover:bg-gray-700 flex items-center">
                            <i class="fas fa-download mr-1"></i>
                            <span class="hidden lg:inline">Download</span>
                        </button>
                        <div class="relative">
                            <button class="dropdown-toggle border border-gray-600 text-sm px-2 py-1 rounded hover:bg-gray-700">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown absolute z-10 right-0 bg-gray-700 mt-1 rounded shadow border w-52 border-gray-600 hidden">
                                ${item.type === "folder" ? `<a href="/d/${item.id}" class="item_open p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-folder-open"></i>Open</a>` : ''}
                                <a href="javascript:void(0)" class="item_download p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-download"></i>Download</a>
                                ${(!item.isOwner) ? `<a href="javascript:void(0)" class="item_import p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-file-import"></i>Import</a>` : ''}
                                ${(item.isOwner && item.type === "folder") ? `<a href="javascript:void(0)" class="item_share p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-share-alt"></i>Share</a>` : ''}
                                ${playableMedia ? `<a href="javascript:void(0)" class="item_play p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-play"></i>Play</a>
                                <a href="javascript:void(0)" class="item_close p-2 flex items-center gap-2 hover:bg-gray-600 hidden"><i class="fas fa-times"></i>Close</a>` : ''}
                                <hr class="border-gray-600">
                                ${item.isOwner ? `
                                    <a href="javascript:void(0)" class="item_rename p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-pencil-alt"></i>Rename</a>
                                    <a href="javascript:void(0)" class="item_copy p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-copy"></i>Copy</a>
                                    <a href="javascript:void(0)" class="item_move p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-arrows-alt"></i>Move</a>
                                ` : ''}
                                ${(item.isOwner || account.isCleaner) ? '<a href="javascript:void(0)" class="item_delete p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-trash"></i>Delete</a>' : ''}
                                <hr class="border-gray-600">
                                <a href="javascript:void(0)" class="item_properties p-2 flex items-center gap-2 hover:bg-gray-600"><i class="fas fa-info-circle"></i>Properties</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('filemanager_itemslist').insertAdjacentHTML('beforeend', html);
}
async function getContent(contentId, contentFilter = "", page = 1, pageSize = 1000, sortField = "createTime", sortDirection = -1) {
    try {
        const accountActive = await getAccountActive();
        const url = new URL(`https://${appdata.apiServer}.gofile.io/contents/${contentId}`);
        const params = new URLSearchParams({ contentFilter, page, pageSize, sortField, sortDirection});

        const password = sessionStorage.getItem(`password|${contentId}`);
        if (password) params.append('password', password);

        url.search = params.toString();

        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${accountActive.token}`,
                'X-Website-Token': appdata.wt
            }
        });

        if (!response.ok) throw new Error(response.status);

        const fetchResult = await response.json();
        if (fetchResult.status !== "ok" && fetchResult.status !== "error-notFound") {
            throw new Error(fetchResult.status);
        }

        if(fetchResult.data.password && fetchResult.data.passwordStatus == "passwordWrong") {
            sessionStorage.removeItem(`password|${contentId}`);
        }

        return fetchResult;
    } catch (error) {
        throw new Error("getContent " + error.message);
    }
}
async function deleteContents(contentsId, proof, confirmed = false) {
    const contentIds = contentsId.split(',');
    const numContents = contentIds.length;
    
    if (!confirmed) {
        // Build list of item names to display
        const MAX_DISPLAY = 5;
        const itemsInfo = [];
        let isDeletingCurrentFolder = false;
        
        for (const id of contentIds) {
            if (id === appdata.fileManager.mainContent.data.id) {
                // Deleting the currently viewed folder
                isDeletingCurrentFolder = true;
                const childrenCount = appdata.fileManager.mainContent.data.childrenCount || 0;
                itemsInfo.push({
                    name: appdata.fileManager.mainContent.data.name,
                    type: 'folder',
                    isCurrentFolder: true,
                    childrenCount: childrenCount
                });
            } else if (appdata.fileManager.mainContent.data.children && appdata.fileManager.mainContent.data.children[id]) {
                const item = appdata.fileManager.mainContent.data.children[id];
                itemsInfo.push({
                    name: item.name,
                    type: item.type,
                    isCurrentFolder: false,
                    childrenCount: item.childrenCount || 0
                });
            } else {
                // Fallback if item info not available
                itemsInfo.push({
                    name: id,
                    type: 'unknown',
                    isCurrentFolder: false,
                    childrenCount: 0
                });
            }
        }
        
        // Build the items list HTML
        const displayItems = itemsInfo.slice(0, MAX_DISPLAY);
        const remainingCount = itemsInfo.length - MAX_DISPLAY;
        
        let itemsListHtml = '<ul class="text-left text-sm space-y-1 mt-2">';
        for (const item of displayItems) {
            const icon = item.type === 'folder' 
                ? '<i class="fas fa-folder text-yellow-400 mr-2"></i>' 
                : '<i class="fas fa-file text-blue-400 mr-2"></i>';
            const truncatedName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
            itemsListHtml += `<li class="flex items-center text-gray-300">${icon}<span class="truncate">${truncatedName}</span></li>`;
        }
        if (remainingCount > 0) {
            itemsListHtml += `<li class="text-gray-400 italic">... and ${remainingCount} more item${remainingCount > 1 ? 's' : ''}</li>`;
        }
        itemsListHtml += '</ul>';
        
        // Special warning for deleting current folder
        let extraWarningHtml = '';
        if (isDeletingCurrentFolder && numContents === 1) {
            const folderInfo = itemsInfo[0];
            extraWarningHtml = `
                <div class="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-3 mt-4">
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-folder-open text-yellow-500 text-lg mt-0.5"></i>
                        <div class="text-sm">
                            <p class="text-yellow-300 font-semibold">You are deleting this entire folder</p>
                            <p class="text-gray-300 mt-1">
                                This folder contains <strong class="text-white">${folderInfo.childrenCount}</strong> item${folderInfo.childrenCount !== 1 ? 's' : ''}. 
                                All contents inside will be permanently deleted.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        createPopup({
            icon: 'fas fa-exclamation-triangle text-red-500',
            title: 'Confirm Deletion',
            content: `
                <div class="min-h-full space-y-6">
                    <div class="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-exclamation-triangle text-red-500 text-xl mt-0.5"></i>
                            <div>
                                <p class="text-gray-300 text-sm">
                                    You are about to delete <strong class="text-white">${numContents}</strong> item${numContents > 1 ? 's' : ''}:
                                </p>
                                ${itemsListHtml}
                            </div>
                        </div>
                    </div>
                    ${extraWarningHtml}

                    <div class="text-center">
                        <p class="text-gray-300 mb-4">This action cannot be undone. Are you sure you want to proceed?</p>
                        
                        <div class="flex justify-center gap-4">
                            <button onclick="closePopup()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button id="popup_confirmdelete" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold">
                                Confirm Deletion
                            </button>
                        </div>
                    </div>
                </div>
            `
        });
        document.getElementById('popup_confirmdelete').addEventListener('click', function() {
            deleteContents(contentsId, proof, true);
        });
        return;
    }
    
    try {
        createAlert('loading', 'Deleting contents...');
        await deleteContentsFetch(contentsId, proof);
        createAlert('success', `${numContents} content item(s) deleted successfully.`);
        if(contentsId.split(',').length == 1 && contentsId.split(',')[0] == appdata.fileManager.mainContent.data.id && appdata.fileManager.mainContent.data.isOwner && appdata.fileManager.mainContent.data.parentFolder) {
            await loadPage('filemanager');
            await setContentToMainContent(appdata.fileManager.mainContent.data.parentFolder, "", 1, 1000, appdata.fileManager.sortField, appdata.fileManager.sortDirection)
            initFilemanager();
        }
        await refreshFilemanager()
    } catch (error) {
        if (error.message.includes("error-proofNeeded")) {
            createPopup({
                icon: 'fas fa-exclamation-triangle',
                title: 'Proof Required',
                content: `
                    <div class="min-h-full">
                        <p class="mb-4">Please provide a justification for the content deletion:</p>
                        <textarea id="deletion_proof" rows="4" class="w-full p-2 rounded bg-gray-700"></textarea>
                        <div class="space-y-6 text-center">
                            <button id="popup_submitproof" class="py-1 px-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out text-center text-white font-semibold mt-4">
                                Submit Proof
                            </button>
                        </div>
                    </div>
                `
            });
            document.getElementById('popup_submitproof').addEventListener('click', function() {
                const justification = document.getElementById('deletion_proof').value;
                if (justification.trim()) {
                    deleteContents(contentsId, justification, true);
                } else {
                    createAlert('error', 'Proof cannot be empty.');
                }
            });
        } else {
            createAlert('error', error.message);
        }
    }
}
async function deleteContentsFetch(contentsId, proof) {
    try {
        const accountActive = await getAccountActive();
        const response = await fetch('https://'+appdata.apiServer+'.gofile.io/contents', {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${accountActive.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contentsId: contentsId,
                proof: proof,
            })
        });
        if (!response.ok) {
            throw new Error(response.status);
        }
        const result = await response.json();

        if (result.status === 'ok') {
            return result
        } else {
            throw new Error(result.status);
        }
    } catch (error) {
        throw new Error("deleteContent "+error.message);
    }
}
async function setContentToMainContent(contentId, contentFilter, page = 1, pageSize = 1000, sortField = appdata.fileManager.sortField, sortDirection = -1) {
    try {
        var getContentResult = await getContent(contentId, contentFilter, page, pageSize, sortField, sortDirection)
        if (getContentResult.status != "ok" && getContentResult.status != "error-notFound"){
            throw new Error(getContentResult.status);
        }
        appdata.fileManager.mainContent = getContentResult
        console.log(appdata.fileManager.mainContent)
    } catch (error) {
        throw new Error("setContentToMainContent "+error.message);
    }
}
async function downloadContent(contentId) {
    var contentType
    if(contentId == appdata.fileManager.mainContent.data.id) {
        contentType = appdata.fileManager.mainContent.data.type
    } else if (appdata.fileManager.mainContent.data.children[contentId] != undefined){
        contentType = appdata.fileManager.mainContent.data.children[contentId].type
    }
    
    if(contentType == "folder") {
        try {
            createAlert('loading', 'Creating download link ...');
            await getContent(contentId) //Need to launch getContent here to trigger the authDownload for the folder
            await downloadBulkContents(contentId)
        } catch (error) {
            createAlert('error', error.message);
        }
    } else {
        if(appdata.fileManager.mainContent.data.children[contentId].isFrozen) {
            return showFrozenContentAlert(appdata.fileManager.mainContent.data.children[contentId]);
        } else if(appdata.fileManager.mainContent.data.children[contentId].overloaded) {
            return showHighTrafficAlert(appdata.fileManager.mainContent.data.children[contentId]);
        }
        var tempLink = document.createElement("a");
        tempLink.setAttribute("href", appdata.fileManager.mainContent.data.children[contentId].link);
        tempLink.click();
    }
}
function openContent(contentId) {
    var contentType
    if(contentId == appdata.fileManager.mainContent.data.id) {
        contentType = appdata.fileManager.mainContent.data.type
    } else if (appdata.fileManager.mainContent.data.children[contentId] != undefined){
        contentType = appdata.fileManager.mainContent.data.children[contentId].type
    }

    if(contentType == "folder") {
        loadUrl("/d/"+contentId)
    } else {
        downloadContent(contentId)
    }
}
function playAllContent() {
    document.querySelectorAll('.item_play').forEach(button => {
        const closestElement = button.closest('[data-item-id]');
        if (closestElement) {
            const uuid = closestElement.getAttribute('data-item-id');
            playContent(uuid);
        }
    });
    document.querySelector('.item_closeallmedia').classList.remove('hidden');
    document.querySelector('.item_playallmedia').classList.add('hidden');
}
async function playContent(contentId, scroll, autoplay = false) {
    const item = appdata.fileManager.mainContent.data.children[contentId];
    if (!item || item.type !== "file") {
        return createAlert("error", "Not a file");
    }

    if(item.isFrozen) {
        return showFrozenContentAlert(appdata.fileManager.mainContent.data.children[contentId]);
    }
    else if(item.overloaded) {
        return showHighTrafficAlert(item);
    }

    if (item.mimetype.startsWith('text/') && item.size > 1024 * 1024) { // 1MB in bytes
        return createAlert("error", "Text content is too large to display");
    }

    let element = document.querySelector(`[data-item-id='${contentId}']`);
    if (!element) {
        return createAlert("error", "Element not found");
    }

    // Remove any existing media player div
    element.querySelector('.item-mediaplayer')?.remove();

    const mediaPlayerDiv = document.createElement('div');
    mediaPlayerDiv.className = 'item-mediaplayer mt-2 max-h-screen w-full flex flex-col items-center justify-center';

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500';
    mediaPlayerDiv.appendChild(loadingSpinner);
    element.appendChild(mediaPlayerDiv);

    let mediaElement;

    if (item.mimetype.startsWith('image/')) {
        mediaElement = new Image();
        mediaElement.src = item.link;
        mediaElement.alt = item.name;
        mediaElement.loading = 'lazy';
        mediaElement.className = 'max-h-[90vh] max-w-full';
        if (mediaElement) mediaPlayerDiv.appendChild(mediaElement);
        mediaElement.onload = () => {
            loadingSpinner.remove();
            if(scroll) {
                mediaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };
    } else if (item.mimetype.startsWith('video/') || item.mimetype.startsWith('audio/')) {
        mediaElement = document.createElement(item.mimetype.startsWith('video/') ? 'video' : 'audio');
        mediaElement.controls = true;
        mediaElement.autoplay = autoplay; // Set autoplay based on parameter
        if (item.mimetype.startsWith('video/') && item.thumbnail) mediaElement.poster = item.thumbnail;
        
        const source = document.createElement('source');
        source.src = item.link;
        // source.type = item.mimetype;
        
        // Add error handling for codec support on the source element
        source.addEventListener('error', () => {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'text-red-500 text-sm mt-2 text-center';
            errorContainer.innerHTML = `
                Your browser doesn't support playing this ${mediaElement.tagName.toLowerCase()} format.<br>
                You can download it to play locally.
            `;
            mediaPlayerDiv.appendChild(errorContainer);
        });
    
        mediaElement.className = 'max-h-[90vh] max-w-full min-w-80';
        mediaElement.appendChild(source);
    
        // Wait for metadata to be loaded before scrolling
        mediaElement.addEventListener('loadedmetadata', () => {
            if(scroll) {
                mediaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    
        // Remove loading spinner and append media element
        loadingSpinner.remove();
        mediaPlayerDiv.appendChild(mediaElement);
    } else if (item.mimetype.startsWith('text/')) {
    
        const loadPrismResources = async () => {
            if (!document.querySelector('link[href="/plugins/prism/prism.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/plugins/prism/prism.css';
                document.head.appendChild(link);
                await new Promise(resolve => link.onload = resolve);
            }

            if (!document.querySelector('script[src="/plugins/prism/prism.js"]')) {
                const script = document.createElement('script');
                script.src = '/plugins/prism/prism.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
        };

        try {
            const response = await fetch(item.link, { credentials: 'include' });
            const text = await response.text();
            await loadPrismResources();

            mediaElement = document.createElement('pre');
            mediaElement.className = 'language-text max-h-screen max-w-full';
            mediaElement.textContent = text;
            Prism.highlightElement(mediaElement);
            loadingSpinner.remove();
            if (mediaElement) mediaPlayerDiv.appendChild(mediaElement);
            if(scroll) mediaPlayerDiv.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            loadingSpinner.remove();
            createAlert("error", "Failed to load text content");
        }
    } else if (item.mimetype === 'application/pdf') {
        mediaElement = document.createElement('iframe');
        mediaElement.src = `/plugins/pdfjs/web/viewer.html?file=${item.link}`;
        mediaElement.className = 'w-full h-[90vh]';
        mediaElement.style.border = 'none';
        loadingSpinner.remove();
        if (mediaElement) mediaPlayerDiv.appendChild(mediaElement);
        if(scroll) mediaPlayerDiv.scrollIntoView({ behavior: 'smooth' });
    }

    element.querySelectorAll('.item_play, .thumbnail').forEach(elem => {
        elem.classList.add('hidden');
    });
    
    element.querySelectorAll('.item_close').forEach(closeButton => {
        closeButton.classList.remove('hidden');
    });
}
function closeAllContent() {
    document.querySelectorAll('.item_close').forEach(button => {
        const closestElement = button.closest('[data-item-id]');
        if (closestElement) {
            const uuid = closestElement.getAttribute('data-item-id');
            closeContent(uuid);
        }
    });
    document.querySelector('.item_playallmedia').classList.remove('hidden');
    document.querySelector('.item_closeallmedia').classList.add('hidden');
}
function closeContent(contentId) {
    let element = document.querySelector(`[data-item-id='${contentId}']`);
    if (element === null) {
        createAlert("error", "Element not found");
        return;
    }

    // Find and remove all media player divs
    element.querySelectorAll('.item-mediaplayer').forEach(mediaPlayer => {
        mediaPlayer.remove();
    });

    // Find and hide all close buttons
    element.querySelectorAll('.item_close').forEach(closeButton => {
        closeButton.classList.add('hidden');
    });

    // Find and show all play buttons
    element.querySelectorAll('.item_play').forEach(playButton => {
        playButton.classList.remove('hidden');
    });

    // Find and show all thumbnails
    element.querySelectorAll('.thumbnail').forEach(thumbnail => {
        thumbnail.classList.remove('hidden');
    });
}
async function downloadBulkContents(contentId, childrenIds) {
    try {
        const accountActive = await getAccountActive();
        if(accountActive.tier != "premium") {
            return createPopup({
                icon: 'fas fa-crown text-yellow-500',
                title: 'Premium Account Required',
                content: `
                    <div class="flex flex-col items-center space-y-6 p-6">
                        <div class="text-center space-y-3">
                            <p class="text-gray-300 text-lg">
                                Bulk download is a Premium feature
                            </p>
                            <p class="text-gray-400 text-sm">
                                Upgrade to Premium to download multiple files at once and unlock all premium features!
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

        let data = {
            contentIdsToZip: childrenIds,
            expireTime: Math.floor(Date.now() / 1000) + (5 * 60),
            isReqLink: true
        };
          
        if (sessionStorage['password|' + appdata.fileManager.mainContent.data.id]) {
            data.password = sessionStorage['password|' + appdata.fileManager.mainContent.data.id];
        }
          
        let createDirectLinkResult = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${contentId}/directlinks`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accountActive.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!createDirectLinkResult.ok) {
            throw new Error(createDirectLinkResult.status);
        }

        let result = await createDirectLinkResult.json();

        if (result.status !== "ok") {
            throw new Error(result.status);
        }
        
        var tempLink = document.createElement("a");
        tempLink.setAttribute("href", result.data.directLink);
        tempLink.click();
        closePopup()
        
    } catch (error) {
        throw new Error("downloadBulkContents "+error.message);
    }
}
async function createFolderFetch(parentFolderId, folderName, public) {
    try {
        const accountActive = await getAccountActive();
        const response = await fetch('https://'+appdata.apiServer+'.gofile.io/contents/createfolder', {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${accountActive.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                parentFolderId: parentFolderId,
                folderName: folderName,
                public: public
            })
        });
        if (!response.ok) {
            throw new Error(response.status);
        }
        const result = await response.json();

        if (result.status === 'ok') {
            return result
        } else {
            throw new Error(result);
        }
    } catch (error) {
        throw new Error("createFolder "+error.message);
    }
}
async function searchFetch(contentId, searchedString, createTimeFrom, createTimeTo) {
    try {
        const accountActive = await getAccountActive();
        const url = new URL(`https://${appdata.apiServer}.gofile.io/contents/search`);
        url.searchParams.set('contentId', contentId);
        url.searchParams.set('searchedString', searchedString);

        // Optional createTime range (unix seconds)
        if (createTimeFrom !== undefined && createTimeFrom !== null && createTimeFrom !== '') {
            url.searchParams.set('createTimeFrom', createTimeFrom);
        }
        if (createTimeTo !== undefined && createTimeTo !== null && createTimeTo !== '') {
            url.searchParams.set('createTimeTo', createTimeTo);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accountActive.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(response.status);
        }

        const result = await response.json();

        if (result.status === 'ok') {
            return result;
        } else {
            throw new Error(result);
        }
    } catch (error) {
        throw new Error("searchFetch " + error.message);
    }
}
async function renameContent(contentId) {
    var contentName;
    if(contentId == appdata.fileManager.mainContent.data.id) {
        contentName = appdata.fileManager.mainContent.data.name;
    } else if (appdata.fileManager.mainContent.data.children[contentId] != undefined) {
        contentName = appdata.fileManager.mainContent.data.children[contentId].name;
    }
    
    createPopup({
        icon: 'fas fa-edit',
        title: 'Rename Content',
        content: `
            <form id="popup_renameForm" class="space-y-4">
                <div class="space-y-1">
                    <p class="text-sm text-gray-400">Enter the new name for this item</p>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-pencil-alt text-gray-400"></i>
                        </div>
                        <input id="popup_newContentName" type="text" 
                            class="w-full pl-10 pr-3 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200" 
                            value="${contentName}" required>
                    </div>
                </div>
                <div class="flex justify-center pt-2">
                    <button type="submit" id="popup_submitrename" class="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <i class="fas fa-save mr-2"></i>
                        Rename
                    </button>
                </div>
            </form>
        `
    });
    
    document.getElementById('popup_newContentName').focus();
    document.getElementById('popup_newContentName').setSelectionRange(contentName.length, contentName.length);

    document.getElementById('popup_renameForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const newContentName = document.getElementById('popup_newContentName').value.trim();
        if (newContentName) {
            try {
                createAlert('loading', 'Renaming content...');
                const result = await renameContentFetch(contentId, newContentName);
                createAlert('success', `Content renamed successfully to "${newContentName}".`);
                await refreshFilemanager()
            } catch (error) {
                createAlert('error', error.message);
            }
        } else {
            createAlert('error', 'Content name cannot be empty.');
        }
    });
}
async function renameContentFetch(contentId, contentName) {
    try {
        const accountActive = await getAccountActive();
        const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${contentId}/update`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${accountActive.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                attribute: "name",
                attributeValue: contentName
            })
        });
        if (!response.ok) {
            throw new Error(response.status);
        }
        const result = await response.json();

        if (result.status === 'ok') {
            return result;
        } else {
            throw new Error(result);
        }
    } catch (error) {
        throw new Error("renameContent " + error.message);
    }
}
function showProperties(contentId) {
    var content;
    if (contentId == appdata.fileManager.mainContent.data.id) {
        content = appdata.fileManager.mainContent.data;
    } else if (appdata.fileManager.mainContent.data.children[contentId] !== undefined) {
        content = appdata.fileManager.mainContent.data.children[contentId];
    }

    const isFile = content.type !== 'folder';
    const iconClass = isFile ? getIconForMimeType(content.mimetype) : 'fas fa-folder text-yellow-400';
    const createTime = new Date(content.createTime * 1000).toLocaleString(); // Convert seconds to human-readable date

    createPopup({
        icon: `${iconClass}`,
        title: `${isFile ? 'File' : 'Folder'} Details`,
        content: `
        <div class="min-h-full space-y-4" data-item-id="${content.id}">
            <!-- Header with Icon and Name -->
            <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                <i class="${iconClass} text-4xl"></i>
                <h2 class="text-xl font-bold text-white">${content.name}</h2>
            </div>
    
            <!-- General Information -->
            <div class="pb-4 border-b border-gray-600">
                <div class="flex items-center mb-2">
                    <i class="fas fa-info-circle text-blue-400 text-3xl"></i>
                    <h3 class="font-bold text-white ml-2">General Information</h3>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center space-x-3 text-gray-300">
                        <i class="fas fa-tag"></i>
                        <span class="font-medium">Type:</span>
                        <p>${content.type}</p>
                    </div>
                    <div class="flex items-center space-x-3 text-gray-300">
                        <i class="fas fa-calendar-alt"></i>
                        <span class="font-medium">Created:</span>
                        <p>${createTime}</p>
                    </div>
                    <div class="flex items-center space-x-3 text-gray-300">
                        <i class="fas fa-id-badge"></i>
                        <span class="font-medium">ID:</span>
                        <span id="content_id" class="font-semibold text-white">${content.id}</span>
                        <button class="popover-trigger copy-button bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded inline-flex items-center" data-popover="Copy the ID." data-copy-target="#content_id" data-copy-popover="ID copied!">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
    
            <!-- Specific Information -->
            <div class="pb-4 border-b border-gray-600">
                <div class="flex items-center mb-2">
                    <i class="fas fa-file-alt text-orange-400 text-3xl"></i>
                    <h3 class="font-bold text-white ml-2">${isFile ? 'File Information' : 'Folder Information'}</h3>
                </div>
                <div class="space-y-2 text-sm">
                    ${isFile ? `
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-file-alt"></i>
                            <span class="font-medium">Size:</span>
                            <p>${humanFileSize(content.size, true)}</p>
                        </div>
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-download"></i>
                            <span class="font-medium">Downloads:</span>
                            <p>${content.downloadCount}</p>
                        </div>
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-file-code"></i>
                            <span class="font-medium">MIME Type:</span>
                            <p>${content.mimetype}</p>
                        </div>
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-hashtag"></i>
                            <span class="font-medium">MD5:</span>
                            <span id="content_md5" class="font-semibold text-white">${content.md5}</span>
                            <button class="popover-trigger copy-button bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded inline-flex items-center" data-popover="Copy the MD5." data-copy-target="#content_md5" data-copy-popover="MD5 copied!">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-server"></i>
                            <span class="font-medium">Servers:</span>
                            <p>${content.servers}</p>
                        </div>
                    ` : `
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-folder"></i>
                            <span class="font-medium">Children:</span>
                            <p>${content.childrenCount}</p>
                        </div>
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-link"></i>
                            <span class="font-medium">Short Link:</span>
                            <span id="content_shortlink" class="font-semibold text-white">https://${window.location.host}/d/${content.code}</span>
                            <button class="popover-trigger copy-button bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded inline-flex items-center mr-1" data-popover="Copy the link." data-copy-target="#content_shortlink" data-copy-popover="Link copied!">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button id="content_share" class="popover-trigger bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded inline-flex items-center" data-popover="Share this folder">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    `}
                </div>
            </div>
    
            ${content.isOwner ? `
            <!-- Settings Information -->
            <div class="pb-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-cogs text-green-400 text-3xl"></i>
                    <h3 class="font-bold text-white ml-2">Settings</h3>
                </div>
                <div class="space-y-3 text-sm">
                    <div class="flex items-center justify-between text-gray-300">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-link"></i>
                            <span class="font-medium">Direct Links:</span>
                            <p>${content.directLinks ? Object.keys(content.directLinks).length : 0}</p>
                        </div>
                        <button class="item_settings bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded inline-flex items-center" data-setting="directLinks">
                            <i class="fas fa-cogs mr-1"></i> Configure
                        </button>
                    </div>
                    ${isFile ? '' : `
                        <div class="flex items-center justify-between text-gray-300">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-globe"></i>
                                <span class="font-medium">Public:</span>
                                <p>${content.public ? 'Yes' : 'No'}</p>
                            </div>
                            <button class="item_settings bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded inline-flex items-center" data-setting="public">
                                <i class="fas fa-cogs mr-1"></i> Configure
                            </button>
                        </div>
                        <div class="flex items-center justify-between text-gray-300">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-lock"></i>
                                <span class="font-medium">Password Protected:</span>
                                <p>${content.password ? 'Yes' : 'No'}</p>
                            </div>
                            <button class="item_settings bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded inline-flex items-center" data-setting="password">
                                <i class="fas fa-cogs mr-1"></i> Configure
                            </button>
                        </div>
                        <div class="flex items-center justify-between text-gray-300">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-align-left"></i>
                                <span class="font-medium">Description:</span>
                                <p>${(content.description && content.description.length > 30) ? content.description.substring(0, 30) + '...' : content.description || 'N/A'}</p>
                            </div>
                            <button class="item_settings bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded inline-flex items-center" data-setting="description">
                                <i class="fas fa-cogs mr-1"></i> Configure
                            </button>
                        </div>
                        <div class="flex items-center justify-between text-gray-300">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-clock"></i>
                                <span class="font-medium">Expires:</span>
                                <p>${content.expire ? new Date(content.expire * 1000).toLocaleString() : 'N/A'}</p>
                            </div>
                            <button class="item_settings bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded inline-flex items-center" data-setting="expire">
                                <i class="fas fa-cogs mr-1"></i> Configure
                            </button>
                        </div>
                        <div class="flex items-center justify-between text-gray-300">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-tags"></i>
                                <span class="font-medium">Tags:</span>
                                <p>${(content.tags && content.tags.length > 30) ? content.tags.substring(0, 30) + '...' : content.tags || 'N/A'}</p>
                            </div>
                            <button class="item_settings bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded inline-flex items-center" data-setting="tags">
                                <i class="fas fa-cogs mr-1"></i> Configure
                            </button>
                        </div>
                    `}
                </div>
            </div>
            ` : ''}
        </div>
        `
    });
    document.getElementById('content_share')?.addEventListener('click', () => shareContent(content));
    initPopover();
}
async function showSettings(contentId, setting) {
    var content;
    if (contentId === appdata.fileManager.mainContent.data.id) {
        content = appdata.fileManager.mainContent.data;
    } else if (appdata.fileManager.mainContent.data.children[contentId] !== undefined) {
        content = appdata.fileManager.mainContent.data.children[contentId];
    }

    const accountActive = await getAccountActive();
    const isFile = content.type !== 'folder';
    const iconClass = isFile ? getIconForMimeType(content.mimetype) : 'fas fa-folder text-yellow-400';

    if (setting === "directLinks") {
        if(accountActive.tier != "premium") {
            return createPopup({
                icon: 'fas fa-crown text-yellow-500',
                title: 'Premium Account Required',
                content: `
                    <div class="flex flex-col items-center space-y-6 p-6">
                        <div class="text-center space-y-3">
                            <p class="text-gray-300 text-lg">
                                Direct Links is a Premium feature
                            </p>
                            <p class="text-gray-400 text-sm">
                                Upgrade to Premium to create direct download links for your content and share them effortlessly with others!
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
        const directLinks = content.directLinks || {};
    
        function generateLinkHTML(directLinks) {
            return Object.entries(directLinks).map(([id, linkInfo]) => {
                const baseUrl = linkInfo.directLink;
                const inlineUrl = baseUrl.includes('?') ? `${baseUrl}&inline=true` : `${baseUrl}?inline=true`;

                return `
                    <div class="mb-6">
                        <div class="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-700">
                            <i class="fas fa-link text-blue-400"></i>
                            <div class="flex-grow">

                                <!-- Normal Download Link (default visible) -->
                                <div class="direct-link-row flex items-center space-x-2" data-id="${id}" data-type="normal">
                                    <input type="text" value="${baseUrl}" readonly 
                                        class="popup_setting_directlink_value bg-gray-900 border border-gray-700 text-blue-400 px-3 py-2 rounded-lg flex-grow text-sm font-mono">
                                    <button class="popover-trigger copy-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md inline-flex items-center transition duration-200 text-sm"
                                        data-copy-target=".popup_setting_directlink_value"
                                        data-popover="Copy Download Link"
                                        data-copy-popover="Download link copied!">
                                        <i class="fas fa-copy mr-1.5"></i> Copy
                                    </button>
                                </div>

                                <!-- Inline View Link (hidden by default) -->
                                <div class="direct-link-row flex items-center space-x-2 hidden" data-id="${id}" data-type="inline">
                                    <input type="text" value="${inlineUrl}" readonly 
                                        class="popup_setting_directlink_value bg-gray-900 border border-gray-700 text-blue-400 px-3 py-2 rounded-lg flex-grow text-sm font-mono">
                                    <button class="popover-trigger copy-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md inline-flex items-center transition duration-200 text-sm"
                                        data-copy-target=".popup_setting_directlink_value"
                                        data-popover="Copy Inline Link"
                                        data-copy-popover="Inline link copied!">
                                        <i class="fas fa-copy mr-1.5"></i> Copy
                                    </button>
                                </div>

                                <!-- Toggle: Inline Mode -->
                                <div class="mt-3 flex items-center space-x-2">
                                    <label class="relative inline-flex items-center cursor-pointer select-none">
                                        <input type="checkbox" class="sr-only peer inline-toggle" data-id="${id}">
                                        <div class="w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-green-600 transition-colors duration-200 ease-in-out"></div>
                                        <div class="dot absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></div>
                                    </label>
                                    <span class="text-sm text-gray-400">
                                        Serve as inline
                                    </span>
                                    <i class="fas fa-question-circle popover-trigger text-gray-500 text-xs"
                                    data-popover="This option will add ?inline=true to the URL. The file will be displayed in the browser instead of being downloaded, if it's a media file"></i>
                                </div>

                            </div>
                        </div>

                        <!-- Your existing editable content -->
                        <div data-id="${id}" class="editable-content space-y-4">
                            ${generateStaticContent(linkInfo)}
                        </div>

                        <!-- Your existing buttons -->
                        <div class="flex space-x-2 mt-4 pt-3 border-t border-gray-700">
                            <button data-id="${id}" class="modify-direct-link bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded-md inline-flex items-center transition duration-200 text-sm">
                                <i class="fas fa-edit mr-1.5"></i> Modify
                            </button>
                            <button data-id="${id}" class="apply-direct-link hidden bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md inline-flex items-center transition duration-200 text-sm">
                                <i class="fas fa-check mr-1.5"></i> Apply
                            </button>
                            <button data-id="${id}" class="cancel-direct-link hidden bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded-md inline-flex items-center transition duration-200 text-sm">
                                <i class="fas fa-times mr-1.5"></i> Cancel
                            </button>
                            <button data-id="${id}" class="delete-direct-link bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md inline-flex items-center transition duration-200 text-sm">
                                <i class="fas fa-trash-alt mr-1.5"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    
        function generateStaticContent(linkInfo) {
            function formatValues(values) {
                return values.map(value => 
                    `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                        ${value}
                    </span>`
                ).join(' ');
            }
        
            return `
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-clock text-yellow-400"></i>
                            <span class="font-medium text-gray-300">Expire Time:</span>
                        </div>
                        <i class="fas fa-question-circle popover-trigger text-gray-400" 
                           data-popover="Setting an expiration date makes the link inactive after the specified time."></i>
                        <div class="w-2/3">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">
                                ${new Date(linkInfo.expireTime * 1000).toLocaleString()}
                            </span>
                        </div>
                    </div>
        
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-network-wired text-green-400"></i>
                            <span class="font-medium text-gray-300">Source IPs:</span>
                        </div>
                        <i class="fas fa-question-circle popover-trigger text-gray-400" 
                           data-popover="If set, the link will only work from the specified source IPs. Multiple IPs can be set, separated by spaces."></i>
                        <div class="w-2/3">
                            ${linkInfo.sourceIpsAllowed.length ? formatValues(linkInfo.sourceIpsAllowed) : 
                            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">Any</span>'}
                        </div>
                    </div>
        
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-globe text-blue-400"></i>
                            <span class="font-medium text-gray-300">Domains:</span>
                        </div>
                        <i class="fas fa-question-circle popover-trigger text-gray-400" 
                           data-popover="If set, the link will work only from the specified domains. We use CORS and Referer checks. Note: This solution is not foolproof but greatly limits the potential for unauthorized use. Multiple domains can be set, separated by spaces."></i>
                        <div class="w-2/3">
                            ${linkInfo.domainsAllowed.length ? formatValues(linkInfo.domainsAllowed) : 
                            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">Any</span>'}
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-ban text-red-400"></i>
                            <span class="font-medium text-gray-300">Blocked Domains:</span>
                        </div>
                        <i class="fas fa-question-circle popover-trigger text-gray-400" 
                           data-popover="If set, the link will not work from the specified domains. We use CORS and Referer checks. Multiple domains can be set, separated by spaces."></i>
                        <div class="w-2/3">
                            ${linkInfo.domainsBlocked && linkInfo.domainsBlocked.length ? formatValues(linkInfo.domainsBlocked) : 
                            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">None</span>'}
                        </div>
                    </div>
        
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-key text-purple-400"></i>
                            <span class="font-medium text-gray-300">Auth:</span>
                        </div>
                        <i class="fas fa-question-circle popover-trigger text-gray-400" 
                           data-popover="If set, HTTP Basic authentication will be required to use the link. Format: login:password. Multiple credentials can be set, separated by spaces."></i>
                        <div class="w-2/3">
                            ${linkInfo.auth.length ? formatValues(linkInfo.auth) : 
                            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-200">None</span>'}
                        </div>
                    </div>
                </div>
            `;
        }
    
        function generateEditableContent(linkInfo) {
            const expireDate = new Date(linkInfo.expireTime * 1000);
            const adjustedExpireTime = new Date(expireDate.getTime() - expireDate.getTimezoneOffset() * 60000);
    
            return `
                <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-clock text-yellow-400"></i>
                            <span class="font-medium text-gray-300">Expire Time:</span>
                        </div>
                        <div class="w-2/3">
                            <input type="datetime-local" 
                                value="${adjustedExpireTime.toISOString().slice(0, 16)}" 
                                class="edit-expireTime bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg w-full">
                        </div>
                    </div>
    
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-network-wired text-green-400"></i>
                            <span class="font-medium text-gray-300">Source IPs:</span>
                        </div>
                        <div class="w-2/3">
                            <input type="text" 
                                value="${linkInfo.sourceIpsAllowed.join(' ')}" 
                                class="edit-sourceIpsAllowed bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg w-full"
                                placeholder="Enter IPs separated by spaces">
                        </div>
                    </div>
    
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-globe text-blue-400"></i>
                            <span class="font-medium text-gray-300">Domains:</span>
                        </div>
                        <div class="w-2/3">
                            <input type="text" 
                                value="${linkInfo.domainsAllowed.join(' ')}" 
                                class="edit-domainsAllowed bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg w-full"
                                placeholder="Enter domains separated by spaces">
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-ban text-red-400"></i>
                            <span class="font-medium text-gray-300">Blocked Domains:</span>
                        </div>
                        <div class="w-2/3">
                            <input type="text" 
                                value="${linkInfo.domainsBlocked && linkInfo.domainsBlocked.length ? linkInfo.domainsBlocked.join(' ') : ''}" 
                                class="edit-domainsBlocked bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg w-full"
                                placeholder="Enter blocked domains separated by spaces">
                        </div>
                    </div>
    
                    <div class="flex items-center space-x-2">
                        <div class="w-1/3 flex items-center space-x-2">
                            <i class="fas fa-key text-purple-400"></i>
                            <span class="font-medium text-gray-300">Auth:</span>
                        </div>
                        <div class="w-2/3">
                            <input type="text" 
                                value="${linkInfo.auth.join(' ')}" 
                                class="edit-auth bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg w-full"
                                placeholder="Enter credentials (login:password) separated by spaces">
                        </div>
                    </div>
                </div>
            `;
        }
    
        const directLinksHTML = generateLinkHTML(directLinks);
    
        createPopup({
            icon: 'fas fa-link',
            title: 'Direct Link Settings',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Icon and Name -->
                    <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                        <i class="${iconClass} text-4xl"></i>
                        <h2 class="text-xl font-bold text-white">${content.name}</h2>
                    </div>
    
                    <!-- Description -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                Direct links provide a streamlined method for users to download content without visiting the website. 
                                You can create multiple direct links with different options for the same content.
                            </p>
                        </div>
                    </div>
    
                    <!-- Direct Links List -->
                    <div class="space-y-4">
                        ${directLinksHTML ? directLinksHTML : 
                        '<div class="text-center py-8 text-gray-400"><i class="fas fa-link text-4xl mb-3"></i><p>No direct links available.</p></div>'}
                    </div>
    
                    <!-- Create New Link Button -->
                    <div class="flex justify-center">
                        <button id="create_direct_link" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md inline-flex items-center transition duration-200">
                            <i class="fas fa-plus-circle mr-2"></i> Create New Direct Link
                        </button>
                    </div>
                </div>
            `
        });
    
        document.querySelectorAll('.delete-direct-link').forEach(button => {
            button.addEventListener('click', async function() {
                const directLinkId = this.getAttribute('data-id');
                createAlert('loading', 'Deleting direct link...');
                try {
                    const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/directlinks/${directLinkId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${accountActive.token}` }
                    });
                    if (response.ok) {
                        await refreshFilemanager()
                        showSettings(contentId, "directLinks");
                    } else {
                        createAlert('error', 'Failed to delete the direct link.');
                    }
                } catch (error) {
                    createAlert('error', 'An error occurred while deleting the direct link.');
                }
            });
        });
    
        document.getElementById('create_direct_link').addEventListener('click', async function() {
            createAlert('loading', 'Creating direct link...');
            try {
                const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/directlinks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accountActive.token}`
                    },
                    body: JSON.stringify({}) // Add any required body parameters here
                });
    
                if (response.ok) {
                    await refreshFilemanager()
                    showSettings(contentId, "directLinks");
                } else {
                    createAlert('error', 'Failed to create the direct link.');
                }
            } catch (error) {
                createAlert('error', 'An error occurred while creating the direct link.');
            }
        });
    
        document.querySelectorAll('.modify-direct-link').forEach(button => {
            button.addEventListener('click', function() {
                const directLinkId = this.getAttribute('data-id');
                const container = document.querySelector(`.editable-content[data-id="${directLinkId}"]`);
                const linkInfo = directLinks[directLinkId];
    
                container.innerHTML = generateEditableContent(linkInfo);
    
                toggleButtonStates(directLinkId, { modify: 'hidden', apply: '', cancel: '', delete: 'hidden' });
            });
        });
    
        document.querySelectorAll('.apply-direct-link').forEach(button => {
            button.addEventListener('click', async function() {
                const directLinkId = this.getAttribute('data-id');
                const container = document.querySelector(`.editable-content[data-id="${directLinkId}"]`);
    
                const expireTimeValue = container.querySelector('.edit-expireTime').value;
                const sourceIpsAllowedValue = container.querySelector('.edit-sourceIpsAllowed').value.trim();
                const domainsAllowedValue = container.querySelector('.edit-domainsAllowed').value.trim();
                const domainsBlockedValue = container.querySelector('.edit-domainsBlocked').value.trim();
                const authValue = container.querySelector('.edit-auth').value.trim();
    
                const expireTime = new Date(expireTimeValue).getTime() / 1000;
                const sourceIpsAllowed = sourceIpsAllowedValue ? sourceIpsAllowedValue.split(' ').map(ip => ip.trim()) : undefined;
                const domainsAllowed = domainsAllowedValue ? domainsAllowedValue.split(' ').map(domain => domain.trim()) : undefined;
                const domainsBlocked = domainsBlockedValue ? domainsBlockedValue.split(' ').map(domain => domain.trim()) : undefined;
                const auth = authValue ? authValue.split(' ').map(auth => auth.trim()) : undefined;
    
                createAlert('loading', 'Applying changes...');
                try {
                    const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/directlinks/${directLinkId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accountActive.token}`
                        },
                        body: JSON.stringify({ expireTime, sourceIpsAllowed, domainsAllowed, domainsBlocked, auth })
                    });
    
                    if (response.ok) {
                        await refreshFilemanager()
                        showSettings(contentId, "directLinks");
                    } else {
                        createAlert('error', 'Failed to modify the direct link.');
                    }
                } catch (error) {
                    createAlert('error', 'An error occurred while modifying the direct link.');
                }
            });
        });
    
        document.querySelectorAll('.cancel-direct-link').forEach(button => {
            button.addEventListener('click', function() {
                const directLinkId = this.getAttribute('data-id');
                const container = document.querySelector(`.editable-content[data-id="${directLinkId}"]`);
                const linkInfo = directLinks[directLinkId];
    
                container.innerHTML = generateStaticContent(linkInfo);
    
                toggleButtonStates(directLinkId, { modify: '', apply: 'hidden', cancel: 'hidden', delete: '' });
                initPopover();
            });
        });

        document.querySelectorAll('.inline-toggle').forEach(toggle => {
            toggle.addEventListener('change', function () {
                const id = this.getAttribute('data-id');
                const isInline = this.checked;

                // Show/hide the two rows
                document.querySelectorAll(`.direct-link-row[data-id="${id}"]`).forEach(row => {
                    if (row.dataset.type === 'normal') {
                        row.classList.toggle('hidden', isInline);
                    } else {
                        row.classList.toggle('hidden', !isInline);
                    }
                });

                // Re-init popovers on the newly visible button (important!)
                const visibleButton = document.querySelector(`.direct-link-row[data-id="${id}"]:not(.hidden) .copy-button`);
                if (visibleButton && window.initPopover) {
                    window.initPopover(); // rebind popovers if you have a global init function
                }
            });
        });
    
        function toggleButtonStates(id, states) {
            document.querySelector(`.modify-direct-link[data-id="${id}"]`).classList.toggle('hidden', states.modify === 'hidden');
            document.querySelector(`.apply-direct-link[data-id="${id}"]`).classList.toggle('hidden', states.apply === 'hidden');
            document.querySelector(`.cancel-direct-link[data-id="${id}"]`).classList.toggle('hidden', states.cancel === 'hidden');
            document.querySelector(`.delete-direct-link[data-id="${id}"]`).classList.toggle('hidden', states.delete === 'hidden');
        }
    } else if (setting === "public") {
        createPopup({
            icon: 'fas fa-globe',
            title: 'Public Setting',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Icon and Name -->
                    <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                        <i class="${iconClass} text-4xl"></i>
                        <h2 class="text-xl font-bold text-white">${content.name}</h2>
                    </div>
    
                    <!-- Description -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                Control who can access your content. Public content is accessible to anyone with the link, 
                                while private content is only accessible to you.
                            </p>
                        </div>
                    </div>
    
                    <!-- Current Status Card -->
                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg">
                        <div class="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-700">
                            <i class="${content.public ? 'fas fa-eye text-green-400' : 'fas fa-eye-slash text-red-400'}"></i>
                            <h3 class="text-lg font-medium text-white">Current Status</h3>
                        </div>
    
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <span class="text-gray-300">Visibility:</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${content.public ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}">
                                        ${content.public ? 'Public' : 'Private'}
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2 text-sm text-gray-400">
                                    <i class="fas fa-users"></i>
                                    <span>${content.public ? 'Anyone with the link can access' : 'Only you can access'}</span>
                                </div>
                            </div>
    
                            <!-- Toggle Button -->
                            <div class="flex justify-center mt-6">
                                <button id="popup_setting_public" 
                                    class="bg-blue-600 hover:bg-blue-700 
                                    text-white px-2 py-1 rounded-md inline-flex items-center transition duration-200">
                                    <i class="${content.public ? 'fas fa-eye-slash' : 'fas fa-eye'} mr-2"></i>
                                    ${content.public ? 'Make Private' : 'Make Public'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
        });
    
        document.getElementById('popup_setting_public').addEventListener('click', async function() {
            const newPublicState = !content.public;
            createAlert('loading', `Making content ${newPublicState ? 'public' : 'private'}...`);
            try {
                const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/update`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accountActive.token}`
                    },
                    body: JSON.stringify({
                        attribute: "public",
                        attributeValue: newPublicState
                    })
                });
                
                if (response.ok) {
                    await refreshFilemanager()
                    showSettings(contentId, "public");
                } else {
                    createAlert('error', 'Failed to update visibility settings. Please try again.');
                }
            } catch (error) {
                createAlert('error', 'An error occurred while updating visibility settings.');
            }
        });
    } else if (setting === "password") {
        createPopup({
            icon: 'fas fa-key',
            title: 'Password Setting',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Icon and Name -->
                    <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                        <i class="${iconClass} text-4xl"></i>
                        <h2 class="text-xl font-bold text-white">${content.name}</h2>
                    </div>
    
                    <!-- Description -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                Protect your content with a password. Users will need to enter this password to access the content. 
                                Leave the password field empty to remove password protection.
                            </p>
                        </div>
                    </div>
    
                    <!-- Current Status Card -->
                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg">
                        <div class="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-700">
                            <i class="${content.password ? 'fas fa-lock text-yellow-400' : 'fas fa-lock-open text-gray-400'}"></i>
                            <h3 class="text-lg font-medium text-white">Current Status</h3>
                        </div>
    
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <span class="text-gray-300">Protection:</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${content.password ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-700 text-gray-300'}">
                                        ${content.password ? 'Password Protected' : 'No Password'}
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2 text-sm text-gray-400">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>${content.password ? 'Password required for access' : 'Anyone can access'}</span>
                                </div>
                            </div>
    
                            <!-- Password Form -->
                            <form id="popup_password-form" class="mt-6 space-y-4">
                                <div class="relative">
                                    <label for="popup_password" class="block text-sm font-medium text-gray-300 mb-2">
                                        ${content.password ? 'Change Password' : 'Set Password'}
                                    </label>
                                    <div class="relative">
                                        <input type="password" 
                                            id="popup_password" 
                                            name="password" 
                                            class="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 
                                            focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                            placeholder="${content.password ? '••••••••' : 'Enter new password'}"
                                        >
                                        <button type="button" 
                                            id="toggle-password" 
                                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
    
                                <div class="flex justify-center pt-4">
                                    <button type="submit" 
                                        class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md 
                                        inline-flex items-center transition duration-200">
                                        <i class="fas fa-save mr-2"></i>
                                        ${content.password ? 'Update Password' : 'Set Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `
        });
    
        // Toggle password visibility
        document.getElementById('toggle-password').addEventListener('click', function() {
            const passwordInput = document.getElementById('popup_password');
            const toggleIcon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        });
    
        // Handle form submission
        document.getElementById('popup_password-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            const newPassword = document.getElementById('popup_password').value;
            createAlert('loading', 'Updating password setting...');
            try {
                const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/update`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accountActive.token}`
                    },
                    body: JSON.stringify({
                        attribute: "password",
                        attributeValue: newPassword
                    })
                });
        
                if (response.ok) {
                    await refreshFilemanager();
                    showSettings(contentId, "password");
                } else {
                    createAlert('error', 'Failed to update the password. Please try again.');
                }
            } catch (error) {
                createAlert('error', 'An error occurred while updating the password.');
            }
        });
    } else if (setting === "description") {
        createPopup({
            icon: 'fas fa-pen',
            title: 'Description Setting',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Icon and Name -->
                    <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                        <i class="${iconClass} text-4xl"></i>
                        <h2 class="text-xl font-bold text-white">${content.name}</h2>
                    </div>
    
                    <!-- Description Info Box -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                Add a description to provide context or additional information to viewers. 
                                The text supports markdown syntax for formatting. Leave empty to disable the description.
                            </p>
                        </div>
                    </div>
    
                    <!-- Description Editor Card -->
                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg">
                        <div class="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-700">
                            <i class="fas fa-edit text-purple-400"></i>
                            <h3 class="text-lg font-medium text-white">Description Editor</h3>
                        </div>
    
                        <form id="popup_description-form" class="space-y-4">
                            <!-- Current Status -->
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-2">
                                    <span class="text-gray-300">Status:</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${content.description ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'}">
                                        ${content.description ? 'Description Set' : 'No Description'}
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2 text-sm text-gray-400">
                                    <i class="fas fa-paragraph"></i>
                                    <span>${content.description ? 'Description visible to viewers' : 'No description shown'}</span>
                                </div>
                            </div>
    
                            <!-- Textarea with better styling -->
                            <div class="relative">
                                <label for="popup_description" class="block text-sm font-medium text-gray-300 mb-2">
                                    Description Content
                                </label>
                                <textarea 
                                    id="popup_description" 
                                    name="description"
                                >${content.description || ''}</textarea>
                            </div>
                            <!-- Submit Button -->
                            <div class="flex justify-center pt-4">
                                <button type="submit" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md 
                                    inline-flex items-center transition duration-200">
                                    <i class="fas fa-save mr-2"></i>
                                    Save Description
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `
        });

        // Function to initialize EasyMDE
        const initializeEditor = () => {
            const easyMDE = new EasyMDE({
                element: document.getElementById('popup_description'),
                spellChecker: false,
                autofocus: true,
                theme: 'dark',
                status: ['lines', 'words'],
                minHeight: '200px',
                maxHeight: '400px',
                toolbar: [
                    'bold', 'italic', 'heading', '|',
                    'quote', 'unordered-list', 'ordered-list', '|',
                    'link', 'image', '|',
                    'preview', 'side-by-side', 'fullscreen', '|',
                    'guide'
                ],
                previewRender: (text) => marked.parse(text),
            });
        
            // Add custom CSS after initialization
            const customCSS = `
                .EasyMDEContainer {
                    background-color: #1f2937;
                }
                .EasyMDEContainer .CodeMirror {
                    background-color: #1f2937;
                    color: #e5e7eb;
                    border: 1px solid #4b5563;
                    border-radius: 0.375rem;
                }
                .EasyMDEContainer .CodeMirror-cursor {
                    border-color: #e5e7eb;
                }
                .EasyMDEContainer .CodeMirror-selected {
                    background: #4b5563 !important;
                }
                .EasyMDEContainer .CodeMirror-line::selection,
                .EasyMDEContainer .CodeMirror-line > span::selection,
                .EasyMDEContainer .CodeMirror-line > span > span::selection {
                    background: #4b5563;
                }
                .editor-toolbar {
                    background-color: #1f2937;
                    border: 1px solid #4b5563;
                    border-radius: 0.375rem;
                    margin-bottom: 8px;
                }
                .editor-toolbar button {
                    color: #e5e7eb !important;
                }
                .editor-toolbar button:hover {
                    background: #374151;
                    border-color: #4b5563;
                }
                .editor-toolbar.fullscreen {
                    background: #1f2937;
                }
                .editor-preview {
                    background: #1f2937;
                    color: #e5e7eb;
                }
                .editor-preview pre {
                    background: #374151;
                    border: 1px solid #4b5563;
                }
                .editor-preview table td,
                .editor-preview table th {
                    border: 1px solid #4b5563;
                }
                .editor-statusbar {
                    color: #9ca3af;
                }
                .editor-toolbar.disabled-for-preview button:not(.no-disable) {
                    background: #374151;
                }
                .editor-preview-side {
                    background: #1f2937;
                    border-color: #4b5563;
                }
                .editor-toolbar.fullscreen::before,
                .editor-toolbar.fullscreen::after {
                    background: transparent;
                }
                .CodeMirror-focused {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
                }
                .editor-toolbar button.active {
                    background: #3b82f6;
                    color: white !important;
                }
            `;
        
            const styleElement = document.createElement('style');
            styleElement.textContent = customCSS;
            document.head.appendChild(styleElement);
        
            return easyMDE;
        };

        // Check if EasyMDE is already loaded
        if (typeof EasyMDE !== 'undefined') {
            const editor = initializeEditor();
        } else {
            // Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/easymde/dist/easymde.min.css';
            document.head.appendChild(cssLink);

            // Load JavaScript
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/easymde/dist/easymde.min.js';
            script.onload = function() {
                const editor = initializeEditor();
            };
            document.head.appendChild(script);
        }
        
        // Modify the form submission to use EasyMDE's value
        document.getElementById('popup_description-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            const editor = document.querySelector('.EasyMDEContainer').querySelector('.CodeMirror').CodeMirror.getValue();
            createAlert('loading', 'Updating description setting...');
            try {
                const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/update`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accountActive.token}`
                    },
                    body: JSON.stringify({
                        attribute: "description",
                        attributeValue: editor
                    })
                });
        
                if (response.ok) {
                    await refreshFilemanager();
                    createAlert('success', `Description successfully updated for <i class="${iconClass}"></i> <strong>${content.name}</strong>`);
                } else {
                    createAlert('error', 'Failed to update the description. Please try again.');
                }
            } catch (error) {
                createAlert('error', 'An error occurred while updating the description.');
            }
        });
    } else if (setting === "expire") {
        const expirationSet = content.expire ? true : false;
        const defaultExpirationDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    
        createPopup({
            icon: 'fas fa-clock',
            title: 'Expiration Setting',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Icon and Name -->
                    <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                        <i class="${iconClass} text-4xl"></i>
                        <h2 class="text-xl font-bold text-white">${content.name}</h2>
                    </div>
    
                    <!-- Info Box -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                Set an expiration date and time for your content. After this time, the content will be automatically deleted.
                                Remove the expiration to keep the content indefinitely.
                            </p>
                        </div>
                    </div>
    
                    <!-- Expiration Settings Card -->
                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg">
                        <div class="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-700">
                            <i class="fas fa-hourglass-half text-orange-400"></i>
                            <h3 class="text-lg font-medium text-white">Expiration Status</h3>
                        </div>
    
                        <!-- Current Status -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-300">Status:</span>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                    ${expirationSet ? 'bg-orange-900 text-orange-200' : 'bg-gray-700 text-gray-300'}">
                                    ${expirationSet ? 'Expiration Set' : 'No Expiration'}
                                </span>
                            </div>
                            <div class="flex items-center space-x-2 text-sm text-gray-400">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${expirationSet ? `Expires: ${new Date(content.expire * 1000).toLocaleString()}` : 'No expiration date set'}</span>
                            </div>
                        </div>
    
                        <!-- Form -->
                        <form id="popup_expire-form" class="space-y-4">
                            ${expirationSet ? `
                                <div class="flex justify-center">
                                    <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md 
                                        inline-flex items-center transition duration-200">
                                        <i class="fas fa-trash-alt mr-2"></i>
                                        Remove Expiration
                                    </button>
                                </div>
                            ` : `
                                <div class="relative">
                                    <label for="popup_expire" class="block text-sm font-medium text-gray-300 mb-2">
                                        Set Expiration Date & Time
                                    </label>
                                    <input type="datetime-local" 
                                        id="popup_expire" 
                                        name="expire" 
                                        class="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 
                                        focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        value="${defaultExpirationDateTime}"
                                    >
                                </div>
                                <div class="flex justify-center pt-4">
                                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md 
                                        inline-flex items-center transition duration-200">
                                        <i class="fas fa-save mr-2"></i>
                                        Set Expiration
                                    </button>
                                </div>
                            `}
                        </form>
                    </div>
                </div>
            `
        });
    
        document.getElementById('popup_expire-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            try {
                const expireTimestamp = expirationSet ? null : Math.floor(new Date(document.getElementById('popup_expire').value).getTime() / 1000);
                createAlert('loading', 'Updating expiration setting...');

                const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/update`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accountActive.token}`
                    },
                    body: JSON.stringify({
                        attribute: "expiry",
                        attributeValue: expireTimestamp
                    })
                });
    
                if (response.ok) {
                    await refreshFilemanager();
                    createAlert('success', `Expiration ${expireTimestamp ? 'set' : 'removed'} successfully for <i class="${iconClass}"></i> <strong>${content.name}</strong>`);
                } else {
                    throw new Error('Failed to update expiration');
                }
            } catch (error) {
                createAlert('error', 'Failed to update the expiration setting. Please try again.');
            }
        });
    } else if (setting === "tags") {
        createPopup({
            icon: 'fas fa-tags',
            title: 'Tags Setting',
            content: `
                <div class="min-h-full space-y-6">
                    <!-- Header with Icon and Name -->
                    <div class="flex items-center space-x-4 pb-4 border-b border-gray-600">
                        <i class="${iconClass} text-4xl"></i>
                        <h2 class="text-xl font-bold text-white">${content.name}</h2>
                    </div>
    
                    <!-- Info Box -->
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                Tags help organize and classify your content. Add multiple tags by separating them with commas.
                                Tags can be used with the filter and search functions.
                            </p>
                        </div>
                    </div>
    
                    <!-- Tags Editor Card -->
                    <div class="bg-gray-800 bg-opacity-50 border border-gray-700 p-4 rounded-xl shadow-lg">
                        <div class="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-700">
                            <i class="fas fa-tags text-yellow-400"></i>
                            <h3 class="text-lg font-medium text-white">Tags Editor</h3>
                        </div>
    
                        <form id="popup_tags-form" class="space-y-4">
                            <!-- Current Status -->
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-2">
                                    <span class="text-gray-300">Status:</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${content.tags ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-700 text-gray-300'}">
                                        ${content.tags ? 'Tags Set' : 'No Tags'}
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2 text-sm text-gray-400">
                                    <i class="fas fa-tag"></i>
                                    <span>${content.tags ? 'Tags applied' : 'No tags applied'}</span>
                                </div>
                            </div>
    
                            <!-- Tags Input -->
                            <div class="relative">
                                <label for="popup_tags" class="block text-sm font-medium text-gray-300 mb-2">
                                    Tag List
                                </label>
                                <input type="text" 
                                    id="popup_tags" 
                                    name="tags" 
                                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-md border border-gray-600 
                                    focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200 
                                    placeholder-gray-400 text-sm"
                                    placeholder="Enter tags separated by commas (e.g., important, work, personal)"
                                    value="${content.tags || ''}"
                                >
                            </div>
    
                            <!-- Submit Button -->
                            <div class="flex justify-center pt-4">
                                <button type="submit" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md 
                                    inline-flex items-center transition duration-200">
                                    <i class="fas fa-save mr-2"></i>
                                    Save Tags
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `
        });
    
        document.getElementById('popup_tags-form').addEventListener('submit', async function(event) {
            event.preventDefault();
            const newTags = document.getElementById('popup_tags').value;
            createAlert('loading', 'Updating tags setting...');
            
            try {
                const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/${content.id}/update`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accountActive.token}`
                    },
                    body: JSON.stringify({
                        attribute: "tags",
                        attributeValue: newTags
                    })
                });
    
                if (response.ok) {
                    await refreshFilemanager();
                    createAlert('success', `Tags successfully updated for <i class="${iconClass}"></i> <strong>${content.name}</strong>`);
                } else {
                    throw new Error('Failed to update tags');
                }
            } catch (error) {
                createAlert('error', 'Failed to update the tags. Please try again.');
            }
        });
    }
    initPopover();
}
async function copyContent(items) {
    const accountActive = await getAccountActive();
    if(accountActive.tier != "premium") {
        return createPopup({
            icon: 'fas fa-crown text-yellow-500',
            title: 'Premium Account Required',
            content: `
                <div class="flex flex-col items-center space-y-6 p-6">
                    <div class="text-center space-y-3">
                        <p class="text-gray-300 text-lg">
                            Copy/Move is a Premium feature
                        </p>
                        <p class="text-gray-400 text-sm">
                            Upgrade to Premium to copy or move your content between folders and unlock all premium features!
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

    var itemsString = Object.keys(items).join(',');
    appdata.fileManager.toCopy = itemsString;
    localStorage.setItem('fileManagerToCopy', appdata.fileManager.toCopy);
    
    document.getElementById('filemanager_mainbuttons_copyhere_countvalue').innerText = Object.keys(items).length;
    document.getElementById('filemanager_mainbuttons_copyhere').classList.remove('hidden');
    document.getElementById('filemanager_mainbuttons_copycancel').classList.remove('hidden');

    createPopup({
        icon: 'fas fa-copy',
        title: 'Copy Items',
        content: `
            <div class="min-h-full space-y-6">
                <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                        <p class="text-gray-300 text-sm">
                            <strong class="text-white">${Object.keys(items).length}</strong> items selected for copying.
                        </p>
                    </div>
                </div>

                <div class="text-center">
                    <p class="text-gray-300">
                        Navigate to the destination folder and click the <strong class="text-yellow-500">"Copy Here"</strong> button in the toolbar to complete the action.
                    </p>
                </div>
                
                <div class="flex justify-center">
                    <button onclick="closePopup()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Got it
                    </button>
                </div>
            </div>
        `
    });
}
async function moveContent(items) {
    const accountActive = await getAccountActive();
    if(accountActive.tier != "premium") {
        return createPopup({
            icon: 'fas fa-crown text-yellow-500',
            title: 'Premium Account Required',
            content: `
                <div class="flex flex-col items-center space-y-6 p-6">
                    <div class="text-center space-y-3">
                        <p class="text-gray-300 text-lg">
                            Copy/Move is a Premium feature
                        </p>
                        <p class="text-gray-400 text-sm">
                            Upgrade to Premium to copy or move your content between folders and unlock all premium features!
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

    var itemsString = Object.keys(items).join(',');
    appdata.fileManager.toMove = itemsString
    localStorage.setItem('fileManagerToMove', appdata.fileManager.toMove);

    document.getElementById('filemanager_mainbuttons_movehere_countvalue').innerText = Object.keys(items).length
    document.getElementById('filemanager_mainbuttons_movehere').classList.remove('hidden');
    document.getElementById('filemanager_mainbuttons_movecancel').classList.remove('hidden');

    createPopup({
        icon: 'fas fa-arrows-alt',
        title: 'Move Items',
        content: `
            <div class="min-h-full space-y-6">
                <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                        <p class="text-gray-300 text-sm">
                            <strong class="text-white">${Object.keys(items).length}</strong> items selected for moving.
                        </p>
                    </div>
                </div>

                <div class="text-center">
                    <p class="text-gray-300">
                        Navigate to the destination folder and click the <strong class="text-yellow-500">"Move Here"</strong> button in the toolbar to complete the action.
                    </p>
                </div>
                
                <div class="flex justify-center">
                    <button onclick="closePopup()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Got it
                    </button>
                </div>
            </div>
        `
    });
}
async function importContent(content) {
    const accountActive = await getAccountActive();
    if(accountActive.tier != "premium") {
        return createPopup({
            icon: 'fas fa-crown text-yellow-500',
            title: 'Premium Account Required',
            content: `
                <div class="flex flex-col items-center space-y-6 p-6">
                    <div class="text-center space-y-3">
                        <p class="text-gray-300 text-lg">
                            Import is a Premium feature
                        </p>
                        <p class="text-gray-400 text-sm">
                            Upgrade to Premium to import content into your account and unlock all premium features!
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

    const isFile = content.type !== 'folder';
    const iconClass = isFile ? getIconForMimeType(content.mimetype) : 'fas fa-folder text-yellow-400';
    const itemType = isFile ? 'file' : 'folder';
    
    createPopup({
        icon: 'fas fa-file-import',
        title: 'Import Content',
        content: `
            <div class="text-center px-6">
                <div class="mb-6">
                    <i class="${iconClass} ${itemType === 'folder' ? 'text-yellow-400' : 'text-blue-400'} text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">Import ${itemType}</h3>
                    <p class="text-gray-300 mb-3">
                        You're about to import the ${itemType} 
                        <span class="font-semibold ${itemType === 'folder' ? 'text-yellow-400' : 'text-blue-400'}">
                            <i class="${iconClass} ${itemType === 'folder' ? 'text-yellow-400' : 'text-blue-400'} mr-1"></i>${content.name}
                        </span> 
                        and all its content into your Gofile account.
                    </p>
                    <p class="text-sm text-gray-400">
                        The ${itemType} and its content will be imported into your root folder. You can move it later if needed.
                    </p>
                </div>
                
                <div class="border-t border-gray-700 pt-6">
                    <button id="popup_confirmimport" class="transition-all duration-200 py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-2">
                        <i class="fas fa-check text-sm"></i>
                        Confirm Import
                    </button>
                </div>
            </div>
        `
    });
        
    document.getElementById('popup_confirmimport').addEventListener('click', async function() {
        createAlert('loading', `Importing <i class="${iconClass}"></i> <span class="font-semibold">${content.name}</span>, please wait...`);
        try {
            await importContentFetch(content.id);
            createPopup({
                icon: 'fas fa-check-circle text-green-500',
                title: 'Successfully Imported!',
                content: `
                    <div class="flex flex-col items-center space-y-6 p-6">
                        <div class="text-center space-y-3">
                            <p class="text-gray-300 text-lg">
                                ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} successfully imported!
                            </p>
                            <div class="flex items-center justify-center gap-2 my-3">
                                <i class="${iconClass} ${itemType === 'folder' ? 'text-yellow-400' : 'text-blue-400'} text-2xl"></i>
                                <span class="font-semibold text-gray-300">${content.name}</span>
                            </div>
                            <p class="text-gray-400 text-sm">
                                The ${itemType} has been imported to your root folder and is now ready to use.
                            </p>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
                            <a href="/myfiles" 
                                class="closePopup w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                                <i class="fas fa-folder-open mr-2"></i>
                                View My Files
                            </a>
                            
                            <button onclick="closePopup()" 
                                class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-gray-300 transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                                <i class="fas fa-times mr-2"></i>
                                Close
                            </button>
                        </div>
                    </div>
                `
            });            
        } catch (error) {
            createAlert('error', error.message);
        }
    });
}
async function shareContent(content) {
    const isFile = content.type !== 'folder';
    const iconClass = isFile ? getIconForMimeType(content.mimetype) : 'fas fa-folder text-yellow-400';
    const itemType = isFile ? 'file' : 'folder';
    const shareUrl = `https://${window.location.host}/d/${content.code}`;

    // If content is not public, show warning popup
    if (!content.public) {
        createPopup({
            icon: 'fas fa-shield-alt text-yellow-500',
            title: 'Private Content',
            content: `
                <div class="flex flex-col items-center space-y-6 p-4">
                    <div class="relative w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-2">
                        <i class="fas fa-lock text-2xl text-yellow-500"></i>
                    </div>
                    
                    <div class="text-center space-y-3 max-w-sm">
                        <h3 class="text-xl font-semibold text-gray-200">
                            Make this ${itemType} public?
                        </h3>
                        <p class="text-gray-400 text-sm leading-relaxed">
                            This ${itemType} is currently private. To share it with others, you'll need to make it public first. This will allow anyone with the link to access it.
                        </p>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md mx-auto">
                        <button onclick="showSettings('${content.id}', 'public')" 
                            class="group w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all duration-300 flex items-center justify-center">
                            <i class="fas fa-cog mr-2 group-hover:rotate-90 transition-transform duration-300"></i>
                            Change Visibility
                        </button>
                        
                        <button onclick="closePopup()" 
                            class="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 transition-all duration-200 flex items-center justify-center">
                            Cancel
                        </button>
                    </div>
                </div>
            `
        });
        return;
    }

    // Show sharing popup
    createPopup({
        icon: 'fas fa-share-alt text-blue-500',
        title: 'Share Content',
        content: `
            <div class="flex flex-col items-center space-y-6 p-4">
                <div class="relative w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                    <i class="${iconClass} text-2xl text-blue-500"></i>
                </div>
                
                <div class="text-center space-y-4 w-full max-w-md">
                    <div class="space-y-2">
                        <h3 class="text-xl font-semibold text-gray-200">${content.name}</h3>
                        <p class="text-sm text-gray-400">Share this ${itemType} with anyone using the link below</p>
                    </div>
                    
                    <div class="bg-gray-800 rounded-lg p-1 w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
                        <div class="flex gap-2">
                            <input type="text" value="${shareUrl}" 
                                id="shareUrlInput"
                                class="flex-1 min-w-0 bg-gray-900 rounded-lg px-2 sm:px-4 py-2.5 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none overflow-x-auto" 
                                readonly>
                            <button class="popover-trigger copy-button shrink-0 bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded flex items-center justify-center"
                                data-popover="Copy the share link"
                                data-copy-target="#shareUrlInput"
                                data-copy-popover="Link copied! 🎉">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    ${content.password ? `
                        <div class="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-left">
                            <div class="flex items-start space-x-3">
                                <div class="shrink-0 mt-0.5">
                                    <i class="fas fa-lock text-yellow-500"></i>
                                </div>
                                <div class="space-y-1">
                                    <h4 class="font-medium text-yellow-500">Password Protected</h4>
                                    <p class="text-sm text-gray-400 leading-relaxed">
                                        This ${itemType} is password protected. Anyone with the link will need to enter the correct password to access the content.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
    
                <div class="w-full max-w-md">
                    <div class="flex items-center justify-between mb-4">
                        <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                        <span class="px-4 text-sm text-gray-400">QR Code</span>
                        <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                    </div>
                    
                    <div class="flex justify-center">
                        <div id="qrcode-share-${content.id}" class="p-4 bg-white rounded-lg">
                            <!-- QR code will be generated here -->
                        </div>
                    </div>
                </div>

                <div class="w-full max-w-md pt-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                        <span class="px-4 text-sm text-gray-400">Share on social media</span>
                        <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                    </div>

                    <div class="flex flex-wrap justify-center gap-4">
                        <!-- Facebook -->
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" 
                            target="_blank"
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-[#4267B2] to-[#233977] hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fab fa-facebook-f text-white text-lg"></i>
                        </a>

                        <!-- WhatsApp -->
                        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}" 
                            target="_blank"
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fab fa-whatsapp text-white text-lg"></i>
                        </a>

                        <!-- X (formerly Twitter) -->
                        <a href="https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}" 
                            target="_blank"
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-black to-[#141414] hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fa-brands fa-x-twitter text-white text-lg"></i>
                        </a>

                        <!-- LinkedIn -->
                        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" 
                            target="_blank"
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-[#0077b5] to-[#004569] hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fab fa-linkedin-in text-white text-lg"></i>
                        </a>

                        <!-- Pinterest -->
                        <a href="https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}" 
                            target="_blank"
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-[#E60023] to-[#AB001B] hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fab fa-pinterest-p text-white text-lg"></i>
                        </a>

                        <!-- Telegram -->
                        <a href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}" 
                            target="_blank"
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-[#0088cc] to-[#005580] hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fab fa-telegram-plane text-white text-lg"></i>
                        </a>

                        <!-- Reddit -->
                        <a href="https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}" 
                            target="_blank"
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF4500] to-[#CC3700] hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fab fa-reddit-alien text-white text-lg"></i>
                        </a>

                        <!-- Email -->
                        <a href="mailto:?body=${encodeURIComponent(shareUrl)}" 
                            class="w-11 h-11 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 hover:opacity-90 flex items-center justify-center transform hover:scale-105 transition-all duration-200 shadow-lg">
                            <i class="fas fa-envelope text-white text-lg"></i>
                        </a>
                    </div>
                </div>
                
                <button onclick="closePopup()" 
                    class="mt-4 px-6 py-2.5 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 transition-all duration-200 flex items-center justify-center">
                    Done
                </button>
            </div>
        `
    });
    try {
        await loadQRCodeScript();
        
        const qrContainer = document.getElementById(`qrcode-share-${content.id}`);
        if (qrContainer) {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: shareUrl,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        const qrContainer = document.getElementById(`qrcode-share-${content.id}`);
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="text-red-500 text-sm">
                    <i class="fas fa-exclamation-circle"></i>
                    Failed to generate QR code
                </div>
            `;
        }
    }
    initPopover();
}
async function copyHere() {
    const itemCount = appdata.fileManager.toCopy.split(",").length;
    createAlert('loading', `Copying <strong class="text-yellow-500">${itemCount}</strong> item(s), please wait...`);
    try {
        await copyContentFetch(appdata.fileManager.toCopy, appdata.fileManager.mainContent.data.id );
        createAlert('success', `<strong class="text-green-500">${itemCount}</strong> item(s) copied successfully.`);
        cancelCopyMove()
        await refreshFilemanager();
    } catch (error) {
        createAlert('error', error.message);
    }
}
async function moveHere() {
    const itemCount = appdata.fileManager.toMove.split(",").length;
    createAlert('loading', `Moving <strong class="text-yellow-500">${itemCount}</strong> item(s), please wait...`);
    try {
        await moveContentFetch(appdata.fileManager.toMove, appdata.fileManager.mainContent.data.id);
        createAlert('success', `<strong class="text-green-500">${itemCount}</strong> item(s) moved successfully.`);
        cancelCopyMove();
        await refreshFilemanager();
    } catch (error) {
        createAlert('error', error.message);
    }
}
async function copyContentFetch(contentsId, folderDestId) {
    try {
        const accountActive = await getAccountActive();
        const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/copy`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${accountActive.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contentsId: contentsId,
                folderId: folderDestId
            })
        });
        
        if (!response.ok) {
            throw new Error(response.status);
        }
        const result = await response.json();

        if (result.status === 'ok') {
            return result;
        } else {
            throw new Error(result);
        }
    } catch (error) {
        throw new Error("copyContent " + error.message);
    }
}
async function moveContentFetch(contentsId, folderDestId) {
    try {
        const accountActive = await getAccountActive();
        const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/move`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${accountActive.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contentsId: contentsId,
                folderId: folderDestId
            })
        });
        
        if (!response.ok) {
            throw new Error(response.status);
        }
        const result = await response.json();

        if (result.status === 'ok') {
            return result;
        } else {
            throw new Error(result);
        }
    } catch (error) {
        throw new Error("moveContent " + error.message);
    }
}
async function importContentFetch(contentsId) {
    try {
        const accountActive = await getAccountActive();
        
        // Create the base request body
        const requestBody = {
            contentsId: contentsId
        };

        // Check if password exists in sessionStorage
        const passwordKey = `password|${appdata.fileManager.mainContent.data.id}`;
        const storedPassword = sessionStorage.getItem(passwordKey);
        
        // If password exists, add it to the request body
        if (storedPassword) {
            requestBody.password = storedPassword;
        }

        const response = await fetch(`https://${appdata.apiServer}.gofile.io/contents/import`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${accountActive.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(response.status);
        }
        const result = await response.json();

        if (result.status === 'ok') {
            return result;
        } else {
            throw new Error(result);
        }
    } catch (error) {
        throw new Error("importContent " + error.message);
    }
}
function cancelCopyMove() {
    appdata.fileManager.toCopy = null
    localStorage.removeItem('fileManagerToCopy'); // Remove from localStorage
    document.getElementById('filemanager_mainbuttons_copyhere').classList.add('hidden');
    document.getElementById('filemanager_mainbuttons_copycancel').classList.add('hidden');
    
    appdata.fileManager.toMove = null
    localStorage.removeItem('fileManagerToMove'); // Remove from localStorage
    document.getElementById('filemanager_mainbuttons_movehere').classList.add('hidden');
    document.getElementById('filemanager_mainbuttons_movecancel').classList.add('hidden');
    
    hideMainButtons(false)
}
async function processAllCheckboxes(checked, processDomCopyMove) {
    const checkboxes = document.querySelectorAll('.item_checkbox');
    const lastIndex = checkboxes.length - 1;
    if (checked) {
        for (const [index, checkbox] of checkboxes.entries()) {
            checkbox.checked = true;
            await itemCheckboxChangeEvent(checkbox, index === lastIndex, processDomCopyMove);
        }
    } else {
        for (const [index, checkbox] of checkboxes.entries()) {
            checkbox.checked = false;
            await itemCheckboxChangeEvent(checkbox, index === lastIndex, processDomCopyMove);
        }
    }
}
function showHighTrafficAlert(contentData) {
    return createPopup({
        icon: 'fas fa-server text-yellow-500',
        title: 'High Traffic Alert',
        content: `
            <div class="flex flex-col p-5 space-y-5">
                <!-- File Info -->
                <div class="flex items-center gap-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-sm">
                    <i class="${getIconForMimeType(contentData.mimetype)} text-2xl text-gray-300"></i>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-semibold text-gray-200 truncate">
                            ${contentData.name}
                        </h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-700/50 rounded">
                                Server ${contentData.serverSelected}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Message -->
                <div class="text-center space-y-2">
                    <p class="text-sm text-gray-300">
                        We're experiencing higher than normal traffic at the moment.
                    </p>
                    <p class="text-sm text-gray-400">
                        This file is temporarily unavailable on the free tier.
                    </p>
                </div>
        
                <!-- Suggestion -->
                <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p class="text-sm text-yellow-400 text-center">
                        <i class="fas fa-lightbulb mr-2"></i>
                        Upgrade to Premium for priority access and dedicated server resources
                    </p>
                </div>
                
                <!-- Actions -->
                <div class="flex gap-3 pt-2">
                    <button 
                        onclick="refreshFilemanager(); closePopup();"
                        class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700/70 hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        <i class="fas fa-clock mr-2"></i>Try Again Later
                    </button>
                    
                    <a 
                        href="/premium"
                        class="closePopup flex-1 px-4 py-2.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        <i class="fas fa-crown mr-2"></i>Upgrade to Premium
                    </a>
                </div>
            </div>
        `
    });
}
function showFrozenContentAlert(contentData) {
    // Convert timestamp to readable date
    const frozenDate = new Date(contentData.isFrozenTimestamp * 1000);
    const formattedDate = frozenDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    const formattedTime = frozenDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return createPopup({
        icon: 'fas fa-snowflake text-blue-400',
        title: 'Archived Content',
        content: `
            <div class="flex flex-col p-5 space-y-6">
                <!-- File Preview Section -->
                <div class="flex items-center gap-4 p-5 bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-lg">
                    <div class="p-3 bg-gray-700/50 rounded-lg">
                        <i class="${getIconForMimeType(contentData.mimetype)} text-3xl text-gray-200"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs text-gray-400 mb-1">File Name</p>
                        <h3 class="text-base font-medium text-gray-200 truncate">
                            ${contentData.name}
                        </h3>
                    </div>
                </div>
    
                <!-- Combined Information Section -->
                <div class="p-4 bg-gray-800/80 border border-gray-700/50 rounded-lg space-y-4">
                    <div class="text-sm text-blue-300 pl-6 space-y-3">
                        <div>
                            <p class="text-xs text-gray-400">Storage Location</p>
                            <p>${contentData.servers[0]}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-400">Expiration Date</p>
                            <p>
                                ${formattedDate} at ${formattedTime}
                                <span class="block text-xs text-gray-400 mt-1">
                                    (${getRelativeTimeString(contentData.isFrozenTimestamp)})
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
    
                <!-- Information Section -->
                <div class="bg-gray-800/40 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="fas fa-info-circle text-blue-400"></i>
                        <h4 class="text-gray-200 font-medium">About Cold Storage</h4>
                    </div>
                    <div class="text-sm text-gray-300 space-y-3 pl-6">
                        <p>
                            This file has been automatically moved to our cold storage system due to inactivity. This helps us maintain optimal server performance while securely preserving data.
                        </p>
                        <p class="text-gray-400">
                            ✓ Files in cold storage are safely preserved
                            <br>✓ Premium users can retrieve archived content
                            <br>✓ Storage duration varies based on system capacity
                        </p>
                        <p>
                            To reactivate and download this content, the file must be imported into your account. Importing a file will restore it to active storage, making it accessible from your account.
                        </p>
                    </div>
                </div>
    
                <!-- Buttons -->
                <div class="flex gap-3 pt-2">
                    <button 
                        onclick="closePopup();"
                        class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700/70 hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        Cancel
                    </button>
                    
                    <button 
                        onclick="document.querySelector('#filemanager_mainbuttons_import').click(); closePopup();"
                        class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        <i class="fas fa-file-import mr-2"></i>Import Content
                    </button>
                </div>
            </div>
        `
    });
}
function isMediaInFolder() {
    for (const key of Object.keys(appdata.fileManager.mainContent.data.children)) {
        const child = appdata.fileManager.mainContent.data.children[key];
        if (child.mimetype && (child.mimetype.includes('video/') || child.mimetype.includes('image/'))) {
            return true;
        }
    }
    return false;
}

function isNSFWInFolder() {
    const nsfwKeywords = [
        'adult', 
        'brazzers', 
        'vixen', 
        '18+', 
        'hot', 
        'threesome', 
        'love', 
        'cum', 
        'short',
        'uncensored'
    ];
    
    for (const key of Object.keys(appdata.fileManager.mainContent.data.children)) {
        const child = appdata.fileManager.mainContent.data.children[key];
        if (child.name) {
            const nameLower = child.name.toLowerCase();
            if (nsfwKeywords.some(keyword => nameLower.includes(keyword))) {
                return true;
            }
        }
    }
    return false;
}
