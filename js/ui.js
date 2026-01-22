function initPopover() {
    const popoverTriggers = document.querySelectorAll('.popover-trigger');

    popoverTriggers.forEach(trigger => {
        if (!trigger.dataset.popoverInitialized) {
            trigger.addEventListener('mouseover', showPopover);
            trigger.addEventListener('mouseout', hidePopover);
            trigger.dataset.popoverInitialized = true;
        }
    });

    function showPopover(event) {
        const popoverHTML = event.currentTarget.getAttribute('data-popover');
        const popover = document.createElement('div');
        popover.className = 'popover absolute bg-gray-800 text-white border border-gray-600 shadow-xl text-sm text-center rounded-md max-w-56 px-2 py-1 z-20';
        popover.innerHTML = popoverHTML;

        document.body.appendChild(popover);

        const rect = event.currentTarget.getBoundingClientRect();
        popover.style.left = `${rect.left + window.scrollX + rect.width / 2 - popover.offsetWidth / 2}px`;
        popover.style.top = `${rect.top + window.scrollY - popover.offsetHeight - 5}px`;

        event.currentTarget._popover = popover;
    }

    function hidePopover(event) {
        const popover = event.currentTarget._popover;
        if (popover && popover.parentNode === document.body) {
            document.body.removeChild(popover);
            event.currentTarget._popover = null;
        }
    }
}
function removeAllPopovers() {
    const popovers = document.querySelectorAll('.popover');
    popovers.forEach(popover => {
        popover.remove();
    });
}
function showTemporaryPopover(button, text) {
    const popover = document.createElement('div');
    popover.className = 'popover absolute bg-gray-800 text-white border border-gray-600 shadow-xl text-sm text-center rounded-md max-w-56 px-2 py-1 z-30';
    popover.innerHTML = text;

    document.body.appendChild(popover);

    const rect = button.getBoundingClientRect();
    popover.style.left = `${rect.left + window.scrollX + rect.width / 2 - popover.offsetWidth / 2}px`;
    popover.style.top = `${rect.top + window.scrollY - popover.offsetHeight - 5}px`;

    setTimeout(() => {
        popover.remove();
    }, 2000);
}
function sidebarHandleResize() {
    const overlay = document.getElementById('index_sidebarOverlay');
    window.innerWidth >= 1280 ? (overlay && overlay.classList.add('hidden'), openSidebar()) : closeSidebar();
}
function toggleSidebar() {
    const sidebar = document.getElementById('index_sidebar');
    window.innerWidth < 1024 ?
        sidebar.classList.contains('-translate-x-full') ? openSidebar() : closeSidebar() :
        sidebar.classList.contains('hidden') ? openSidebar() : closeSidebar();
}
function openSidebar() {
    const sidebar = document.getElementById('index_sidebar');
    const overlay = document.getElementById('index_sidebarOverlay');

    sidebar.classList.add('translate-x-0');
    sidebar.classList.remove('-translate-x-full', 'hidden');
    if (overlay && window.innerWidth < 1024) overlay.classList.remove('hidden');
}
function closeSidebar() {
    const sidebar = document.getElementById('index_sidebar');
    const overlay = document.getElementById('index_sidebarOverlay');

    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
    if (window.innerWidth >= 1024) sidebar.classList.add('hidden');
    overlay && overlay.classList.add('hidden');
}
function handleDropdowns(dropdownClicked) {
    const dropdown = dropdownClicked.nextElementSibling;
    document.querySelectorAll('.dropdown').forEach(otherDropdown => {
        if (otherDropdown !== dropdown) otherDropdown.classList.add('hidden');
    });
    dropdown.classList.toggle('hidden');
}
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dropdown => dropdown.classList.add('hidden'));
}
function createPopup({ title, content, icon = null, backgroundOpacity = true, showCloseButton = true, onClose = null }) {
    const existingPopup = document.querySelector('.popup-overlay');
    if (existingPopup) document.body.removeChild(existingPopup);

    const popupOverlay = document.createElement('div');
    const popup = document.createElement('div');
    const popupHeader = document.createElement('div');
    const popupTitle = document.createElement('h3');
    const popupContent = document.createElement('div');

    popupOverlay.className = `popup-overlay fixed inset-0 ${backgroundOpacity ? 'bg-gray-900 bg-opacity-80' : ''} flex items-center justify-center z-10 pointer-events-auto`;
    popup.className = `bg-gray-800 text-white rounded-xl max-w-full max-h-full mx-4 my-4 min-w-[300px] pointer-events-auto ${showCloseButton ? 'border-2 border-gray-700 shadow-2xl drop-shadow-2xl' : ''}`;
    popupHeader.className = 'flex justify-between items-center border-b border-gray-700 px-2 py-1';
    popupTitle.className = 'text-md font-semibold';
    popupContent.className = 'overflow-y-auto max-h-[80vh] max-w-[90vw] p-4'; // Added padding to make the content more readable

    popupTitle.innerText = title;
    popupContent.innerHTML = content;

    if (icon) popupHeader.innerHTML += `<i class="${icon} text-md mr-2"></i>`; // Adding a text color to the icon
    popupHeader.appendChild(popupTitle);

    const safeOnClose = typeof onClose === 'function' ? onClose : null;
    const close = () => {
        try {
            document.body.removeChild(popupOverlay);
        } catch (_) {
            // already removed
        }
        try {
            safeOnClose?.();
        } catch (e) {
            console.error('createPopup onClose error', e);
        }
    };

    if (showCloseButton) {
        const popupClose = document.createElement('button');
        popupClose.className = 'text-gray-500 hover:text-white'; // Fixed hover class to match the color scheme
        popupClose.setAttribute('aria-label', 'Close Popup');
        popupClose.innerHTML = '<i class="fas fa-times"></i>';
        popupClose.onclick = close;
        popupHeader.appendChild(popupClose);

        popupOverlay.addEventListener('click', (e) => { if (e.target === popupOverlay) close(); });
    }

    popup.append(popupHeader, popupContent);
    popupOverlay.appendChild(popup);
    document.body.appendChild(popupOverlay);
}
function closePopup() {
    document.querySelector('.popup-overlay')?.remove();
}
function createAlert(type, content, options = {}) {
    const icons = {
        success: 'fas fa-check-circle text-green-500',
        error: 'fas fa-exclamation-circle text-red-500',
        info: 'fas fa-info-circle text-blue-500',
        loading: 'fas fa-spinner fa-spin text-blue-500'
    };

    const titles = {
        success: 'Success',
        error: 'Error',
        info: 'Information',
        loading: 'Loading'
    };

    // If type is loading, set showCloseButton to false
    const showCloseButton = type !== 'loading' && options.blocking !== true;

    // Optional blocking countdown (used to hard-stop the app when API is unavailable)
    const countdownSeconds = Number.isFinite(options.countdownSeconds) ? options.countdownSeconds : null;
    const hasCountdown = options.blocking === true && countdownSeconds !== null && countdownSeconds > 0;

    const countdownHtml = hasCountdown ? `
        <div class="mt-4 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
            <div class="text-sm text-gray-300">You can refresh in <span id="alert_countdown" class="font-bold">${countdownSeconds}</span>s</div>
            <button id="alert_refresh" class="mt-3 w-full bg-gray-700 text-gray-300 py-2 rounded cursor-not-allowed opacity-60" disabled>
                Refresh
            </button>
        </div>
    ` : (options.blocking === true ? `
        <button id="alert_refresh" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded" onclick="location.reload()">
            Refresh
        </button>
    ` : '');

    createPopup({
        icon: icons[type],
        title: titles[type],
        content: `
            <div>
                <p>${content}</p>
                ${countdownHtml}
            </div>
        `,
        showCloseButton: showCloseButton
    });

    if (hasCountdown) {
        let remaining = countdownSeconds;
        const countdownEl = document.getElementById('alert_countdown');
        const refreshBtn = document.getElementById('alert_refresh');

        const tick = () => {
            remaining -= 1;
            if (countdownEl) countdownEl.textContent = String(Math.max(0, remaining));

            if (remaining <= 0) {
                clearInterval(timer);
                if (refreshBtn) {
                    refreshBtn.disabled = false;
                    refreshBtn.className = 'mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded';
                    refreshBtn.textContent = 'Refresh';
                    refreshBtn.onclick = () => location.reload();
                }
            }
        };

        const timer = setInterval(tick, 1000);
    }
}
function createNotification(title, message, type = 'success', duration = 3000) {
    const notificationContainer = document.getElementById('index_notification');
    const notification = document.createElement('div');

    // Notification styles
    let headerClasses = 'p-1 rounded-t-lg flex items-center justify-between';
    let contentClasses = 'p-2 rounded-b-lg bg-gray-950';
    
    if (type === 'success') headerClasses += ' bg-green-600 text-white border-green-700';
    else if (type === 'error') headerClasses += ' bg-red-600 text-white border-red-700';
    else if (type === 'warning') headerClasses += ' bg-yellow-600 text-black border-yellow-700';
    else if (type === 'info') headerClasses += ' bg-blue-600 text-white border-blue-700';

    let iconHTML = '';
    if (type === 'success') iconHTML = '<i class="fas fa-check-circle mr-2"></i>';
    else if (type === 'error') iconHTML = '<i class="fas fa-exclamation-circle mr-2"></i>';
    else if (type === 'warning') iconHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>';
    else if (type === 'info') iconHTML = '<i class="fas fa-info-circle mr-2"></i>';

    // Close button
    const closeButtonHTML = '<button class="text-white hover:text-gray-300 focus:outline-none" aria-label="Close"><i class="fas fa-times text-sm"></i></button>';

    // Creating header and content
    const header = `<div class="${headerClasses}">${iconHTML}<span class="font-bold">${title}</span>${closeButtonHTML}</div>`;
    const content = `<div class="${contentClasses}"><span class="font-medium text-sm">${message}</span></div>`;

    // Set notification classes and content
    notification.className = 'transform transition duration-500 ease-in-out opacity-0 -translate-y-4 rounded-lg shadow-lg';
    notification.innerHTML = `${header}${content}`;

    // Append the notification
    notificationContainer.appendChild(notification);

    // Force reflow for the transition to trigger
    void notification.offsetWidth;
    
    // Transition to visible state
    notification.classList.replace('opacity-0', 'opacity-100');
    notification.classList.replace('-translate-y-4', 'translate-y-0');

    // Close button functionality
    notification.querySelector('button').addEventListener('click', () => {
        hideNotification(notification);
    });

    // Automatic hide after duration
    setTimeout(() => hideNotification(notification), duration);

    function hideNotification(notif) {
        notif.classList.replace('opacity-100', 'opacity-0');
        notif.classList.replace('translate-y-0', '-translate-y-4');
        setTimeout(() => notif.remove(), 500);
    }
}
function hideMainButtons(hide = true) {
    if(hide) {
        if(appdata.fileManager.mainContent.data.isOwner) {
            document.getElementById("filemanager_mainbuttons_share").classList.add('hidden', 'lg:flex');
            document.getElementById("filemanager_mainbuttons_createFolder").classList.add('hidden', 'lg:flex');
            document.getElementById("filemanager_mainbuttons_uploadFiles").classList.add('hidden', 'lg:flex');
        } else {
            document.getElementById("filemanager_mainbuttons_import").classList.add('hidden', 'lg:flex');
        }
        document.getElementById("filemanager_mainbuttons_sort").classList.add('hidden', 'lg:flex');
        document.getElementById("filemanager_mainbuttons_filter").classList.add('hidden', 'lg:flex');
        document.getElementById("filemanager_mainbuttons_search").classList.add('hidden', 'lg:flex');
        document.getElementById("filemanager_mainbuttons_refresh").classList.add('hidden', 'lg:flex');
    } else {
        if(appdata.fileManager.mainContent.data.isOwner) {
            document.getElementById("filemanager_mainbuttons_share").classList.remove('hidden')
            document.getElementById("filemanager_mainbuttons_createFolder").classList.remove('hidden')
            document.getElementById("filemanager_mainbuttons_uploadFiles").classList.remove('hidden')
        } else {
            document.getElementById("filemanager_mainbuttons_import").classList.remove('hidden')
        }
        document.getElementById("filemanager_mainbuttons_sort").classList.remove('hidden')
        document.getElementById("filemanager_mainbuttons_filter").classList.remove('hidden')
        document.getElementById("filemanager_mainbuttons_search").classList.remove('hidden')
        document.getElementById("filemanager_mainbuttons_refresh").classList.remove('hidden')
    }
}
function updateSidebarAccounts() {
    const accountsContainer = document.getElementById('index_accountList');
    accountsContainer.innerHTML = ''; // Clear the current accounts

    Object.keys(appdata.accounts).forEach(accountKey => {
        const account = appdata.accounts[accountKey];

        const accountDiv = document.createElement('div');
        accountDiv.classList.add('relative', 'account_accountItem');
        accountDiv.setAttribute('data-email', account.email);
        if (account.clientActive) {
            accountDiv.classList.add('border-2', 'border-blue-500', 'rounded');
        }

        accountDiv.innerHTML = `
            <div class="dropdown-toggle flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors cursor-pointer">
                <div class="flex items-center gap-2 truncate">
                    <img src="${account.clientIcon ?? 'https://via.placeholder.com/24'}" alt="Avatar" class="h-7 w-7 rounded-full">
                    <span class="text-white truncate">${account.email}</span>
                </div>
                <i class="fas fa-angle-down text-white"></i>
            </div>
            <div class="dropdown hidden absolute bg-gray-700 text-white w-full mt-1 rounded shadow-lg z-10 border border-gray-600">
                <a href="/myprofile" class="block p-2 flex items-center gap-2 hover:bg-gray-600 hover:text-white"><i class="fas fa-user"></i> My Profile</a>
                <a href="/myfiles" class="block p-2 flex items-center gap-2 hover:bg-gray-600 hover:text-white"><i class="fas fa-folder"></i> My Files</a>
                <hr class="border-gray-600">
                ${!account.clientActive ? `<a href="javascript:void(0)" class="accountActive block p-2 flex items-center gap-2 hover:bg-gray-600 hover:text-white"><i class="fas fa-check-circle"></i> Make Active</a><hr class="border-gray-600">` : ''}
                <button type="button" class="logout block w-full text-left p-2 flex items-center gap-2 hover:bg-gray-600 hover:text-white"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        `;

        accountsContainer.appendChild(accountDiv);
    });
}
