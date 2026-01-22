// Minimal keyboard shortcut manager
// - Keeps track of pressed keys in appdata.pressedKeys
// - Lets features register shortcuts with guards to avoid conflicts

(function () {
    if (window.shortcuts) return; // avoid double init

    const registry = [];
    let initialized = false;

    function isEditableTarget(target) {
        if (!target || !target.closest) return false;

        // If focus is on a control like checkbox/radio/button, we still want shortcuts to work.
        // We only want to block shortcuts when the user is typing text.
        const input = target.closest('input');
        if (input) {
            const type = (input.getAttribute('type') || 'text').toLowerCase();
            const textTypes = new Set([
                'text', 'search', 'email', 'password', 'number', 'tel', 'url',
                'date', 'datetime-local', 'month', 'time', 'week'
            ]);
            if (textTypes.has(type)) return true;
        }

        if (target.closest('textarea, [contenteditable=""], [contenteditable="true"], .CodeMirror')) return true;

        // selects can be navigated by typing, safest is to disable shortcuts while focused
        if (target.closest('select')) return true;

        return false;
    }

    function isPopupOpen() {
        return Boolean(document.querySelector('.popup-overlay'));
    }

    function isFileManagerRoute() {
        // filemanager route is /d/<id>
        return window.location.pathname.startsWith('/d/');
    }

    function modifiersMatch(e, def) {
        if (def.ctrlKey !== undefined && def.ctrlKey !== e.ctrlKey) return false;
        if (def.altKey !== undefined && def.altKey !== e.altKey) return false;
        if (def.metaKey !== undefined && def.metaKey !== e.metaKey) return false;
        if (def.shiftKey !== undefined && def.shiftKey !== e.shiftKey) return false;
        return true;
    }

    function keyMatch(e, def) {
        if (def.key !== undefined && def.key !== e.key) return false;
        if (def.code !== undefined && def.code !== e.code) return false;
        if (def.keyCode !== undefined && def.keyCode !== e.keyCode) return false; // legacy fallback
        return true;
    }

    async function dispatch(e) {
        // keep pressedKeys updated (needed by filemanager shift-select logic)
        if (window.appdata && appdata.pressedKeys) {
            if (e.type === 'keydown') appdata.pressedKeys[e.keyCode] = true;
            if (e.type === 'keyup') appdata.pressedKeys[e.keyCode] = false;
        }

        for (const def of registry) {
            if (def.event && def.event !== e.type) continue;
            if (!keyMatch(e, def)) continue;
            if (!modifiersMatch(e, def)) continue;
            if (def.noRepeat && e.repeat) continue;

            if (def.when && !def.when(e)) continue;

            if (def.preventDefault) e.preventDefault();
            if (def.stopPropagation) e.stopPropagation();

            await def.handler(e);
        }
    }

    function register(def) {
        // def: { id?, event?, key?, code?, keyCode?, ctrlKey?, altKey?, metaKey?, shiftKey?, when?, handler, preventDefault?, stopPropagation?, noRepeat? }
        registry.push(def);
    }

    function init() {
        if (initialized) return;
        initialized = true;

        window.addEventListener('keydown', dispatch, true);
        window.addEventListener('keyup', dispatch, true);
    }

    // Expose minimal API + helpers
    window.shortcuts = {
        init,
        register,
        helpers: { isEditableTarget, isPopupOpen, isFileManagerRoute }
    };

    // --- Built-in shortcuts (filemanager) ---

    // Delete selected items (or current folder if none selected)
    register({
        id: 'filemanager.delete',
        event: 'keyup',
        key: 'Delete',
        keyCode: 46, // legacy fallback
        when: (e) => {
            if (!isFileManagerRoute()) return false;
            if (isPopupOpen()) return false;
            if (isEditableTarget(e.target)) return false;
            return Boolean(appdata.fileManager?.mainContent?.data?.isOwner);
        },
        preventDefault: true,
        stopPropagation: true,
        handler: async () => {
            const selected = appdata.fileManager?.contentsSelected || {};
            if (Object.keys(selected).length === 0) {
                deleteContents(appdata.fileManager.mainContent.data.id);
            } else {
                deleteContents(Object.keys(selected).join(','));
            }
        }
    });

    // Backspace: go to parent folder
    register({
        id: 'filemanager.parent',
        event: 'keyup',
        key: 'Backspace',
        keyCode: 8, // legacy fallback
        when: (e) => {
            if (!isFileManagerRoute()) return false;
            if (isPopupOpen()) return false;
            if (isEditableTarget(e.target)) return false;

            const parent = appdata.fileManager?.mainContent?.data?.parentFolder;
            return Boolean(appdata.fileManager?.mainContent?.data?.isOwner && parent);
        },
        preventDefault: true,
        stopPropagation: true,
        handler: async () => {
            await loadPage('filemanager');
            await setContentToMainContent(
                appdata.fileManager.mainContent.data.parentFolder,
                '',
                1,
                1000,
                appdata.fileManager.sortField,
                appdata.fileManager.sortDirection
            );
            initFilemanager();
        }
    });
})();
