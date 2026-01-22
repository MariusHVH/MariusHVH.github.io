function uuidv4() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function getUrlParts() {
    const path = window.location.pathname;
    return path.split('/').filter(part => part !== '');
}
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Gofile account tokens are generated as `codeGen(32)` on the backend.
// They are 32 chars, alphanumeric (case-insensitive).
function validateAccountToken(token) {
    if (!token || typeof token !== 'string') return false;
    const t = token.trim();
    return /^[a-z0-9]{32}$/i.test(t);
}
function humanFileSize(bytes, si, forcedUnit) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si ?
        ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] :
        ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    
    if (forcedUnit) {
        var index = units.indexOf(forcedUnit);
        if (index !== -1) {
            return (bytes / Math.pow(thresh, index + 1)).toFixed(1) + ' ' + forcedUnit;
        } else {
            console.warn('Invalid unit: Reverting to automatic calculation.');
        }
    }

    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}
function getAccountTrafficLastXDays(accountEmail, days) {
    var value = 0;
    var currentDate = new Date();
    for (var year in appdata.accounts[accountEmail].statsHistory ) {
      for (var month in appdata.accounts[accountEmail].statsHistory [year]) {
        for (var day in appdata.accounts[accountEmail].statsHistory [year][month]) {
          var dateToCompare = new Date(year, month - 1, day); // JavaScript Date months are 0-based
          var timeDiff = currentDate - dateToCompare;
          var daysFromData = timeDiff / (1000 * 3600 * 24); // Convert to days
          if (daysFromData < days) {
            value += appdata.accounts[accountEmail].statsHistory[year][month][day].trafficDirectGenerated+appdata.accounts[accountEmail].statsHistory[year][month][day].trafficReqDownloaded+appdata.accounts[accountEmail].statsHistory[year][month][day].trafficWebDownloaded
          }
        }
      }
    }
    return value +
    (appdata.accounts[accountEmail]?.statsCurrent?.trafficDirectGenerated ?? 0) +
    (appdata.accounts[accountEmail]?.statsCurrent?.trafficReqDownloaded ?? 0) +
    (appdata.accounts[accountEmail]?.statsCurrent?.trafficWebDownloaded ?? 0);
}
function getIpTrafficLastXDays(accountEmail, days) {
    var value = 0;
    var currentDate = new Date();
    
    // Check if ipTraffic exists for the account
    if (!appdata.accounts[accountEmail] || !appdata.accounts[accountEmail].ipTraffic) {
        return value;
    }
    
    for (var year in appdata.accounts[accountEmail].ipTraffic) {
        for (var month in appdata.accounts[accountEmail].ipTraffic[year]) {
            for (var day in appdata.accounts[accountEmail].ipTraffic[year][month]) {
                var dateToCompare = new Date(year, month - 1, day); // JavaScript Date months are 0-based
                var timeDiff = currentDate - dateToCompare;
                var daysFromData = timeDiff / (1000 * 3600 * 24); // Convert to days
                
                if (daysFromData < days) {
                    value += appdata.accounts[accountEmail].ipTraffic[year][month][day];
                }
            }
        }
    }
    
    return value;
}
function copyTextToClipboard(button) {
    const copyTargetSelector = button.getAttribute('data-copy-target');
    const copyPopoverText = button.getAttribute('data-copy-popover');
    let copyTargetElement;

    if (copyTargetSelector.startsWith('.')) {
        // If the target is a class, find the closest one from the parent of the button
        copyTargetElement = button.parentElement.querySelector(copyTargetSelector);
    } else {
        // Otherwise, query from the parent of the button
        copyTargetElement = button.parentElement.querySelector(copyTargetSelector);
    }
    if (copyTargetElement) {
        const textToCopy = copyTargetElement.value || copyTargetElement.textContent;
        navigator.clipboard.writeText(textToCopy).then(function() {
            showTemporaryPopover(button, copyPopoverText);
        }).catch(function(err) {
            console.error('Could not copy text: ', err);
        });
    }
}
function isItemPlayable(item) {
    return item.type === "file" && (
        item.mimetype.includes("video/") || 
        item.mimetype.includes("audio/") || 
        item.mimetype.includes("image/") || 
        item.mimetype.includes("text/") || 
        item.mimetype.includes("application/pdf")
    );
}
function getIconForMimeType(mimeType) {
    const mimeIcons = {
        'application/pdf': 'fas fa-file-pdf',
        'application/msword': 'fas fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word',
        'application/vnd.ms-excel': 'fas fa-file-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel',
        'application/vnd.ms-powerpoint': 'fas fa-file-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fas fa-file-powerpoint',
        'application/zip': 'fas fa-file-archive',
        'application/x-rar-compressed': 'fas fa-file-archive'
    };

    if (mimeIcons[mimeType]) {
        return mimeIcons[mimeType];
    } else if (mimeType.startsWith('image/')) {
        return 'fas fa-file-image';
    } else if (mimeType.startsWith('video/')) {
        return 'fas fa-file-video';
    } else if (mimeType.startsWith('audio/')) {
        return 'fas fa-file-audio';
    } else if (mimeType.startsWith('text/')) {
        return mimeType === 'text/csv' ? 'fas fa-file-csv' : 'fas fa-file-alt';
    } else {
        return 'fas fa-file';
    }
}
function updateURLParameter(param, value) {
    const url = new URL(window.location);
    if (value == undefined) {
        url.searchParams.delete(param);
    } else {
        url.searchParams.set(param, value);
    }
    window.history.replaceState({}, '', url);
}
function toggleAccordion(id) {
    const content = document.getElementById(`${id}-content`);
    const icon = document.getElementById(`${id}-icon`);
    
    // If the content is collapsed, expand it
    if (content.style.maxHeight === "0px") {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.style.transform = 'rotate(180deg)';
    } else {
        // If the content is expanded, collapse it
        content.style.maxHeight = "0px";
        icon.style.transform = 'rotate(0deg)';
    }
}
function getRelativeTimeString(timestamp) {
    const msPerDay = 86400000; // 24 * 60 * 60 * 1000
    const daysAgo = Math.floor((Date.now() - timestamp * 1000) / msPerDay);
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 30) return `${daysAgo} days ago`;
    if (daysAgo < 365) {
        const months = Math.floor(daysAgo / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(daysAgo / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
function loadQRCodeScript() {
    return new Promise((resolve, reject) => {
        // Check if QRCode is already defined
        if (window.QRCode) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; // or your preferred QR code library
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load QR Code library'));
        document.head.appendChild(script);
    });
}
