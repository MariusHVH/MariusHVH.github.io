// --- SPA framework (router + partial loader) ---
// Notes:
// - Preserve querystring/hash in navigation
// - Abort/ignore stale HTML partial fetches to prevent race conditions
// - Ensure dynamically injected scripts are only loaded once

let activeNavigationId = 0;
let activeNavigationController = null; // aborts async work when navigation changes
let activePageFetchController = null;
const scriptLoadPromises = Object.create(null);

function getCurrentSpaUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
}

function toSpaUrl(input) {
    if (!input) return '/';
    try {
        const u = new URL(input, window.location.origin);
        return u.pathname + u.search + u.hash;
    } catch {
        // Assume it's already a path ("/x?y#z")
        return input;
    }
}

function ensureScriptLoaded(src) {
    if (!src) return Promise.resolve();
    if (scriptLoadPromises[src]) return scriptLoadPromises[src];

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && existing.dataset.loaded === 'true') {
        scriptLoadPromises[src] = Promise.resolve();
        return scriptLoadPromises[src];
    }

    scriptLoadPromises[src] = new Promise((resolve, reject) => {
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            resolve();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        document.head.appendChild(script);
    });

    return scriptLoadPromises[src];
}

window.addEventListener('popstate', () => {
    loadUrl(getCurrentSpaUrl());
});

const loadUrl = async (url, eventTarget) => {
    const targetUrl = toSpaUrl(url);
    const navigationId = ++activeNavigationId;

    // Abort any previous navigation-scoped async operations
    try {
        activeNavigationController?.abort();
    } catch (_) {}
    activeNavigationController = new AbortController();

    // Expose navigation context for other modules (optional use)
    window.__spaNavigation = {
        id: navigationId,
        signal: activeNavigationController.signal
    };

    // Reset appdata.fileManager.mainContent
    appdata.fileManager.mainContent = {};

    // Check if the current URL is different from the requested URL (include query/hash)
    if (getCurrentSpaUrl() !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
    }

    // Update canonical and og:url meta tags with special handling for /home
    const parsedUrl = new URL(targetUrl, window.location.origin);
    const canonicalPath = parsedUrl.pathname === '/home' ? '/' : parsedUrl.pathname;
    updateMetaTags({
        canonical: `https://gofile.io${canonicalPath}`,
        ogUrl: `${window.location.origin}${canonicalPath}`
    });

    const parts = getUrlParts();

    // Payment success return URL handler (used by external checkout redirects too)
    try {
        window.handleBillingSuccessFromUrl?.();
    } catch (e) {
        console.error('handleBillingSuccessFromUrl failed', e);
    }

    if (parts.length > 0 && parts[0] === 'home') {
        loadUrl('/');
        return;
    }

    if (parts.length === 0) {
        // Render home without forcing the URL to become /home
        updateMetaTags({
            title: 'Gofile - Cloud Storage Made Simple',
            description: "Secure, fast and free cloud storage solution. Upload and share files instantly with Gofile's simple cloud storage platform.",
            keywords: 'cloud storage, file sharing, file upload, secure storage, free storage',
            ogTitle: 'Gofile - Cloud Storage Made Simple',
            ogDescription: 'Secure, fast and free cloud storage solution. Upload and share files instantly.'
        });
        await loadPage('home', navigationId);
    } else if (['login', 'myprofile', 'myfiles', 'd', 'contact', 'moderation', 'admin', 'test', 'speedtest'].includes(parts[0])) {
        await executeSpecificCode(parts, eventTarget, navigationId);
    } else if (parts[0] === 'desktopapp') {
        updateMetaTags({
            title: 'Gofile Desktop App - Downloads',
            description: 'Download the Gofile Desktop App (alpha). Available for Premium accounts only. Upload, download, and sync folders with Gofile from your computer.',
            keywords: 'gofile desktop app, gofile app, sync, upload, download, premium',
            ogTitle: 'Gofile Desktop App - Downloads',
            ogDescription: 'Download the Gofile Desktop App (alpha) for Windows, macOS, and Linux. Premium accounts only.'
        });
        await loadPage('desktopapp', navigationId);
    } else {
        await loadPage(parts[0], navigationId);
    }
};

const loadPage = async (part, navigationId) => {
    // This function does not propagate error in catch, because it manages the error behavior internally.
    const mainElement = document.querySelector('#index_main');
    mainElement.innerHTML = `
        <div class="w-full h-full flex items-center justify-center">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
    `;

    // Abort any previous in-flight partial fetch to avoid race conditions
    try {
        activePageFetchController?.abort();
    } catch (_) {}
    activePageFetchController = new AbortController();

    // If navigation changes, abort any in-flight partial fetch too.
    if (activeNavigationController?.signal) {
        if (activeNavigationController.signal.aborted) {
            try { activePageFetchController.abort(); } catch (_) {}
        } else {
            activeNavigationController.signal.addEventListener('abort', () => {
                try { activePageFetchController.abort(); } catch (_) {}
            }, { once: true });
        }
    }

    try {
        const response = await fetch(`/contents/${part}.html`, { signal: activePageFetchController.signal });
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.text();

        // If the user navigated again while this was loading, ignore this response
        if (navigationId && navigationId !== activeNavigationId) return;

        mainElement.innerHTML = data;
    } catch (error) {
        // Navigation triggered an abort; do nothing because the next navigation will render.
        if (error?.name === 'AbortError') return;

        mainElement.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-800 text-white">
                <i class="fas fa-exclamation-triangle text-red-500 text-6xl"></i>
                <p class="mt-4 text-xl font-semibold">Oops! Something went wrong.</p>
                <p class="text-gray-400 mt-2">${error.message}</p>
            </div>
        `;
    }
    initPopover();
};

const executeSpecificCode = async (parts, eventTarget, navigationId) => {
    const mainElement = document.querySelector('#index_content main');

    // If we got called but navigation already moved on, stop early.
    if (navigationId && navigationId !== activeNavigationId) return;

    try {
        switch (parts[0]) {
            case 'login':
                if (parts[1]) {
                    createAlert('loading', 'Fetching account details...');
                    try {
                        const result = await getAccountByTokenAndSync(parts[1]);
                        closePopup();
                        createAlert('success', `Logged in successfully as <span class="font-bold">${result}</span>.`);
                        setAccountActive(result);
                        loadUrl("/myprofile");
                    } catch (error) {
                        throw new Error("executeSpecificCode " + error.message);
                    }
                } else {
                    loadPage('home', navigationId);
                    openAddAccountWindow();
                }
                break;

            case 'myprofile':
                if (eventTarget) {
                    var account_accountItem = eventTarget.closest('.account_accountItem');
                    if (account_accountItem) {
                        var email = account_accountItem.getAttribute('data-email');
                        setAccountActive(email);
                    }
                }
                await loadPage('myprofile', navigationId);
                if (navigationId && navigationId !== activeNavigationId) return;
                await initProfilePage();
                break;

            case 'myfiles':
                if (eventTarget && eventTarget.closest('.account_accountItem')) {
                    var email = eventTarget.closest('.account_accountItem').getAttribute('data-email');
                    setAccountActive(email);
                }
                var account = await getAccountActive();
                // We force a replaceState here to avoid issue using the back history to /myfiles that will always redirect to /d/
                window.history.replaceState({}, '', '/d/' + account.rootFolder);
                loadUrl('/d/' + account.rootFolder);
                break;

            case 'd':
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    var pageValue = parseInt(urlParams.get('page'));
                    var filterValue = urlParams.get('filter');

                    if (isNaN(pageValue)) {
                        pageValue = 1;
                    }

                    closePopup();
                    appdata.fileManager.contentFilter = filterValue || ""; // Use filter value if exists, empty string if not
                    await loadPage('filemanager', navigationId);
                    if (navigationId && navigationId !== activeNavigationId) return;
                    await setContentToMainContent(parts[1], appdata.fileManager.contentFilter, pageValue, 1000, appdata.fileManager.sortField, appdata.fileManager.sortDirection);
                    if (navigationId && navigationId !== activeNavigationId) return;
                    initFilemanager();
                    updateFileManagerMetaTags();
                } catch (error) {
                    loadUrl("/");
                    throw new Error("executeSpecificCode " + error.message);
                }
                break;

            case 'contact':
                await loadPage('contact', navigationId);
                if (navigationId && navigationId !== activeNavigationId) return;
                await initContactPage();
                break;

            case 'moderation':
                try {
                    await loadPage('moderation', navigationId);
                    await ensureScriptLoaded('/dist/js/moderation.js');
                    if (navigationId && navigationId !== activeNavigationId) return;
                    var reportData = await fetchReportData();
                    if (navigationId && navigationId !== activeNavigationId) return;
                    generateReportHTML(reportData);
                } catch (error) {
                    throw new Error("executeSpecificCode " + error.message);
                }
                break;

            case 'admin':
                try {
                    await loadPage('admin', navigationId);
                    await ensureScriptLoaded('/dist/js/admin.js');
                } catch (error) {
                    throw new Error("executeSpecificCode " + error.message);
                }
                break;

            case 'test':
                try {
                    await loadPage('test', navigationId);
                    if (navigationId && navigationId !== activeNavigationId) return;
                    await initTestPage();
                } catch (error) {
                    throw new Error("executeSpecificCode " + error.message);
                }
                break;

            case 'speedtest':
                try {
                    await loadPage('speedtest', navigationId);
                    await ensureScriptLoaded('/dist/js/speedtest.js');
                } catch (error) {
                    throw new Error("executeSpecificCode " + error.message);
                }
                break;

            default:
                mainElement.innerHTML = `<p>Unknown path: ${parts[0]}/${parts.slice(1).join('/')}</p>`;
        }
    } catch (error) {
        createAlert('error', error.message);
    }
};

const updateMetaTags = (options = {}) => {
    const {
        title,
        description,
        keywords,
        canonical,
        ogTitle,
        ogDescription,
        ogUrl,
        ogImage
    } = options;

    // Update regular meta tags
    if (title) {
        document.title = title;
    }

    const updateTag = (selector, content) => {
        if (content) {
            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute('content', content);
            }
        }
    };

    updateTag('meta[name="description"]', description);
    updateTag('meta[name="keywords"]', keywords);

    // Update Open Graph tags
    updateTag('meta[property="og:title"]', ogTitle || title);
    updateTag('meta[property="og:description"]', ogDescription || description);
    updateTag('meta[property="og:url"]', ogUrl);
    updateTag('meta[property="og:image"]', ogImage);

    // Update canonical URL
    if (canonical) {
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            canonicalLink.setAttribute('href', canonical);
        }
    }
};

const updateFileManagerMetaTags = () => {
    const content = appdata.fileManager.mainContent;
    let ogTitle, ogDescription;

    // Handle error case - folder not found
    if (content.status === 'error-notFound') {
        ogTitle = 'Folder not found';
        ogDescription = 'The requested folder does not exist or has been deleted.';
        return updateMetaTags({ ogTitle, ogDescription });
    }

    // Handle other cases where content.data exists
    if (content.status === 'ok') {
        const folderData = content.data;

        // Handle case where user cannot access the folder
        if (!folderData.canAccess) {
            ogTitle = 'Protected Content';
            ogDescription = 'This content requires special permissions to access.';
            return updateMetaTags({ ogTitle, ogDescription });
        }

        // Handle empty folder
        if (folderData.childrenCount === 0) {
            ogTitle = `Folder ${folderData.name}`;
            ogDescription = 'This folder is empty.';
            return updateMetaTags({ ogTitle, ogDescription });
        }

        // Handle multiple files
        if (folderData.childrenCount > 1) {
            ogTitle = `Folder ${folderData.name}`;
            ogDescription = `${folderData.childrenCount} files`;
            return updateMetaTags({ ogTitle, ogDescription });
        }

        // Handle single file
        if (folderData.childrenCount === 1) {
            const file = Object.values(folderData.children)[0];
            ogTitle = `${file.name}`;
            ogDescription = `${humanFileSize(file.size, true)}`;
            return updateMetaTags({ ogTitle, ogDescription });
        }
    }
};
