async function refreshUploadServers() {
    while (appdata.servers.state === 'progress') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!appdata.servers.timestamp || (Date.now() - appdata.servers.timestamp > 10000)) {
        appdata.servers.state = 'progress';
        try {
            const response = await fetch('https://'+appdata.apiServer+'.gofile.io/servers');
            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(data.status);
            }

            appdata.servers.serversList = data.data.servers;
            appdata.servers.timestamp = Date.now();
        } catch (error) {
            throw new Error('refreshUploadServers ' + error.message);
        } finally {
            appdata.servers.state = 'idle';
        }
    }

    return appdata.servers.serversList
}
async function newRequestToUploadQueue(files) {
    const accountActive = await getAccountActive();
    var requestUploadObjectId = uuidv4();
    const folderData = appdata.fileManager.mainContent.data || {};
    const isEmptyMainContent = Object.keys(appdata.fileManager.mainContent).length === 0;
    
    const requestUploadObject = {
        id: requestUploadObjectId,
        state: "pending",
        account: accountActive,
        showSuccessDetails: isEmptyMainContent, // Set to true if mainContent is empty
        folderDest: isEmptyMainContent ? null : folderData.id,
        folderDestName: isEmptyMainContent ? null : folderData.name,
        folderCode: isEmptyMainContent ? null : folderData.code,
        fileList: {},
        activeFiles: 0,
        startTime: null,
        lastCalcTime: null,
        totalBytes: 0,
        bytesUploaded: 0,
        bytesRemaining: 0,
        speed: 0,
        percentComplete: 0,
    };

    for (let i = 0; i < files.length; i++) {
        const fileObjectId = uuidv4();
        const fileObject = {
            id: fileObjectId,
            state: "pending",
            startTime: null,
            bytesUploaded: 0,
            bytesRemaining: files[i].size,
            speed: 0,
            percentComplete: 0,
            file: files[i],
        };
        requestUploadObject.fileList[fileObjectId] = fileObject;
        requestUploadObject.totalBytes += files[i].size;
    }
    appdata.uploads[requestUploadObjectId] = requestUploadObject;
    domInitRequestUploadObject(requestUploadObject);
    processNextRequestUploadObject();
}
function processNextRequestUploadObject() {
    Object.values(appdata.uploads).forEach(upload => {
        if (upload.state == "pending" && appdata.uploads.activeUploads < 2) {
            processRequestUploadObject(upload);
            return
        }
    });
}
async function processRequestUploadObject(requestUploadObject) {
    appdata.uploads.activeUploads++
    appdata.uploads[requestUploadObject.id].state = "progress";

    const destinationElement = document.querySelector(`[data-id='${requestUploadObject.id}'] #destinationFolder`);

    if (!requestUploadObject.folderDest || !requestUploadObject.folderDestName) {
        destinationElement.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-t-4 border-blue-500"></div>';
        const account = await getAccountActive();
        const response = await createFolderFetch(account.rootFolder,undefined,true);
        requestUploadObject.folderDest = response.data.id;
        requestUploadObject.folderDestName = response.data.name;
        requestUploadObject.folderCode = response.data.code;
    }
    destinationElement.textContent = requestUploadObject.folderDestName;

    processNextFileObject(requestUploadObject)
}
async function processNextFileObject(requestUploadObject) {
    for (const fileObject of Object.values(requestUploadObject.fileList)) {
        if (fileObject.state == "pending" && requestUploadObject.activeFiles < 2) {
            requestUploadObject.activeFiles++;
            await processFileObject(requestUploadObject, fileObject);
            return processNextFileObject(requestUploadObject)
        }
    }
    var pendingInQueue = false;
    var progressInQueue = false;
    Object.values(requestUploadObject.fileList).forEach(fileObject => {
        if (fileObject.state == "pending") {
            pendingInQueue = true;
        }
        if (fileObject.state == "progress") {
            progressInQueue = true;
        }
    })
    if (pendingInQueue == false && progressInQueue == false) {
        appdata.uploads.activeUploads--
        if(requestUploadObject.state == "canceled") {
            removeRequestUploadObject(requestUploadObject);
        }
        else if (appdata.fileManager.mainContent.data && appdata.fileManager.mainContent.data.id === requestUploadObject.folderDest) {
            removeRequestUploadObject(requestUploadObject);
            refreshFilemanager();
        } else {
            domCreateUploadSuccess(requestUploadObject)
        }
        processNextRequestUploadObject();
    }
}
function domInitRequestUploadObject(requestUploadObject) {
    const indexUploadDiv = document.getElementById('index_upload');
    const newCard = document.createElement('div');
    newCard.setAttribute('data-id', requestUploadObject.id);
    newCard.className = 'p-6 bg-gray-700 bg-opacity-60 rounded-xl relative';

    // Create proxy server indicator if not using default server
    let proxyIndicator = '';
    if (appdata.fileManager.uploadProxy && appdata.fileManager.uploadProxy !== "upload") {
        proxyIndicator = `
            <div class="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                <i class="fas fa-server mr-1"></i>
                <span>Server: ${appdata.fileManager.uploadProxy}</span>
                <i class="fas fa-question-circle ml-1 cursor-help popover-trigger" data-popover="This upload server has been set in your profile settings and is different from the default server."></i>
            </div>
        `;
    }

    const generalInfoDiv = document.createElement('div');
    generalInfoDiv.className = 'mb-4 pb-4 border-b border-gray-500';
    generalInfoDiv.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4 text-white">
            <div class="flex flex-col">
                <div class="flex items-center mb-1">
                    <i class="fas fa-folder text-yellow-500 text-lg mr-2"></i>
                    <span class="font-semibold">Destination:</span>
                </div>
                <span id="destinationFolder" class="text-gray-400 text-xs">Pending...</span>
            </div>
            <div class="flex flex-col">
                <div class="flex items-center mb-1">
                    <i class="fas fa-file-alt text-blue-500 text-lg mr-2"></i>
                    <span class="font-semibold">Queue:</span>
                </div>
                <span id="fileQueueCount" class="text-gray-400 text-xs">${Object.keys(requestUploadObject.fileList).length} files</span>
            </div>
            <div class="flex flex-col">
                <div class="flex items-center mb-1">
                    <i class="fas fa-tachometer-alt text-green-500 text-lg mr-2"></i>
                    <span class="font-semibold">Avg Speed:</span>
                </div>
                <span id="uploadSpeedAvg" class="text-gray-400 text-xs">0MB/s</span>
            </div>
            <div class="flex flex-col">
                <div class="flex items-center mb-1">
                    <i class="fas fa-clock text-red-500 text-lg mr-2"></i>
                    <span class="font-semibold">Remaining Time:</span>
                </div>
                <span id="remainingTimeTotal" class="text-gray-400 text-xs">00:00:00</span>
            </div>
            <div class="flex flex-col">
                <div class="flex items-center mb-1">
                    <i class="fas fa-percentage text-blue-500 text-lg mr-2"></i>
                    <span class="font-semibold">Progress:</span>
                </div>
                <span id="globalProgress" class="text-gray-400 text-xs">0%</span>
            </div>
        </div>
        ${proxyIndicator}
    `;

    newCard.appendChild(generalInfoDiv);

    const fileListDiv = document.createElement('div');
    fileListDiv.id = 'fileList';
    fileListDiv.className = 'space-y-6';
    newCard.appendChild(fileListDiv);

    const filesInQueueDiv = document.createElement('div');
    filesInQueueDiv.id = 'filesStillInQueue';
    filesInQueueDiv.className = 'text-gray-400 text-xs mt-2';
    filesInQueueDiv.textContent = `${Object.keys(requestUploadObject.fileList).length} more files in the queue`;
    newCard.appendChild(filesInQueueDiv);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'requestUploadObjectCancel mt-2 bg-gray-500 text-white py-0.5 px-1 rounded hover:bg-gray-600 text-xs';
    cancelButton.textContent = 'Cancel';
    newCard.appendChild(cancelButton);

    indexUploadDiv.appendChild(newCard);
    indexUploadDiv.classList.remove('hidden');

    newCard.scrollIntoView({ behavior: 'smooth' });
    initPopover()
}
function removeRequestUploadObject(requestUploadObject) {
    // Remove the upload request from appdata
    if (appdata.uploads[requestUploadObject.id]) {
        delete appdata.uploads[requestUploadObject.id];
    }

    // Remove the corresponding DOM element
    const requestElement = document.querySelector(`[data-id='${requestUploadObject.id}']`);
    if (requestElement) {
        requestElement.remove();
    }

    // If there are no more uploads, hide the container
    const indexUploadDiv = document.getElementById('index_upload');
    if (!indexUploadDiv.hasChildNodes() || indexUploadDiv.children.length === 0) {
        indexUploadDiv.classList.add('hidden');
    }
}
async function processFileObject(requestUploadObject, fileObject) {
    appdata.uploads[requestUploadObject.id].fileList[fileObject.id].state = "progress";
    domInitFileObject(requestUploadObject, fileObject);
    
    const uploadCard = document.querySelector(`div[data-id='${requestUploadObject.id}']`);
    const filesQueue = uploadCard.querySelector('#filesStillInQueue');
    const remainingFiles = Object.values(appdata.uploads[requestUploadObject.id].fileList).filter(file => file.state === 'pending').length;
    filesQueue.textContent = `${remainingFiles} more files in the queue`;

    const fileElement = uploadCard.querySelector(`div[data-id='${fileObject.id}']`); // Select file element using data-id

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("token", requestUploadObject.account.token);
    formData.append("folderId", requestUploadObject.folderDest);
    formData.append("file", fileObject.file);

    xhr.upload.onprogress = (e) => {
        if(requestUploadObject.state == "canceled") {
            return xhr.abort();
        }
        //Calc the stats of the file object
        if(fileObject.bytesUploaded == 0) {
            fileObject.startTime = Date.now();
        }
        if (e.lengthComputable) {
            const elapsedTime = (Date.now() - fileObject.startTime) / 1000;
            fileObject.bytesUploaded = e.loaded;
            fileObject.bytesRemaining = fileObject.file.size - fileObject.bytesUploaded;
            fileObject.percentComplete = (fileObject.bytesUploaded / fileObject.file.size) * 100;
            fileObject.speed = fileObject.bytesUploaded / elapsedTime;
            const timeRemaining = fileObject.bytesRemaining / fileObject.speed;
            const hours = Math.floor(timeRemaining / 3600);
            const minutes = Math.floor((timeRemaining % 3600) / 60);
            const seconds = Math.floor(timeRemaining % 60);

            // Check if file is fully uploaded but still waiting for server response
            if (fileObject.percentComplete >= 99.9 && fileObject.state === "progress") {
                // Update state to processing
                appdata.uploads[requestUploadObject.id].fileList[fileObject.id].state = "processing";
                
                // Show processing indicator
                const progressBar = fileElement.querySelector('.progress-container');
                const processingIndicator = fileElement.querySelector('.processing-indicator');
                
                if (progressBar) progressBar.classList.add('hidden');
                if (processingIndicator) processingIndicator.classList.remove('hidden');
                
                // Update status text
                fileElement.querySelector('.file-progress').textContent = 'Processing...';
            }

            fileElement.querySelector('.file-progressbar').style.width = `${fileObject.percentComplete}%`;
            fileElement.querySelector('.file-speed').textContent = humanFileSize(fileObject.speed, true)+ '/s';
            fileElement.querySelector('.file-progress').textContent = `${fileObject.percentComplete.toFixed(2)}%`;
            fileElement.querySelector('.file-remaining').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        //Calc the stats of the global upload object
        if(requestUploadObject.startTime == null) {
            requestUploadObject.startTime = Date.now()
        }
        if(requestUploadObject.lastCalcTime == null || Date.now() - requestUploadObject.lastCalcTime > 300) {
            let totalBytesUploaded = 0;
            let totalBytesRemaining = 0;
            Object.values(requestUploadObject.fileList).forEach(file => {
                totalBytesUploaded += file.bytesUploaded;
                totalBytesRemaining += file.bytesRemaining;
            });
            requestUploadObject.bytesUploaded = totalBytesUploaded;
            requestUploadObject.bytesRemaining = totalBytesRemaining;
            requestUploadObject.percentComplete = (requestUploadObject.bytesUploaded / requestUploadObject.totalBytes) * 100;
    
            const elapsedTime = (Date.now() - requestUploadObject.startTime) / 1000;
            requestUploadObject.speed = totalBytesUploaded / elapsedTime;

            // Update the DOM
            const avgSpeedElement = uploadCard.querySelector('#uploadSpeedAvg');
            const remainingTimeElement = uploadCard.querySelector('#remainingTimeTotal');
            const progressElement = uploadCard.querySelector('#globalProgress');

            avgSpeedElement.textContent = humanFileSize(requestUploadObject.speed, true) + '/s';
            const globalHours = Math.floor(requestUploadObject.bytesRemaining / requestUploadObject.speed / 3600);
            const globalMinutes = Math.floor((requestUploadObject.bytesRemaining / requestUploadObject.speed % 3600) / 60);
            const globalSeconds = Math.floor(requestUploadObject.bytesRemaining / requestUploadObject.speed % 60);
            remainingTimeElement.textContent = `${globalHours.toString().padStart(2, '0')}:${globalMinutes.toString().padStart(2, '0')}:${globalSeconds.toString().padStart(2, '0')}`;
            progressElement.textContent = `${requestUploadObject.percentComplete.toFixed(2)}%`;

            requestUploadObject.lastCalcTime = Date.now();
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            appdata.uploads[requestUploadObject.id].fileList[fileObject.id].state = "done";
            fileElement.remove()
            requestUploadObject.activeFiles--;
            processNextFileObject(requestUploadObject)
        } else {
            appdata.uploads[requestUploadObject.id].fileList[fileObject.id].state = "failed";
            fileElement.remove()
            requestUploadObject.activeFiles--;
            processNextFileObject(requestUploadObject)
            
            // Add error alert
            let errorMessage = `Upload failed for file "${fileObject.file.name}"<br>`;
            errorMessage += `Server returned status ${xhr.status}<br>`;
            errorMessage += `Response: ${xhr.responseText}`;
            createAlert('error', errorMessage);
        }
    };

    xhr.onabort = () => {
        appdata.uploads[requestUploadObject.id].fileList[fileObject.id].state = "canceled";
        fileElement.remove()
        requestUploadObject.activeFiles--;
        processNextFileObject(requestUploadObject)
    };

    xhr.onerror = () => {
        appdata.uploads[requestUploadObject.id].fileList[fileObject.id].state = "failed";
        fileElement.remove();
        requestUploadObject.activeFiles--;
        processNextFileObject(requestUploadObject);
        
        createAlert('error', 
            `Network error while uploading file "${fileObject.file.name}"<br>` +
            "The connection may have been lost or the server is unreachable."
        );
    };

    if (window.location.hostname.includes("dev") && appdata.fileManager.uploadProxy == "upload") {
        xhr.open("POST", `https://${appdata.fileManager.uploadProxy}-dev.gofile.io/uploadfile`, true);
        // xhr.open("POST", `https://store3.gofile.io/uploadfile`, true);
        // xhr.open("POST", `https://store-eu-par-dev-1.gofile.io/uploadfile`, true);
    } else {
        xhr.open("POST", `https://${appdata.fileManager.uploadProxy}.gofile.io/uploadfile`, true);
    }
    xhr.send(formData);
}
function domInitFileObject(requestUploadObject, fileObject) {
    const uploadCard = document.querySelector(`div[data-id='${requestUploadObject.id}']`);
    const fileListDiv = uploadCard.querySelector('#fileList');

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.setAttribute('data-id', fileObject.id); // Add data-id attribute

    fileItem.innerHTML = `
        <div class="flex flex-wrap justify-between items-center mb-2 text-xs">
            <div class="flex flex-col">
                <p class="text-white font-semibold flex items-center mr-2">
                    <i class="fas fa-file mr-1"></i>
                    <span>${fileObject.file.name}</span>
                </p>
                <span class="text-gray-400">${humanFileSize(fileObject.file.size, true)}</span>
            </div>
            <div class="flex space-x-2">
                <p class="flex items-center">
                    <i class="fas fa-tachometer-alt text-green-500 mr-1"></i>
                    <span class="file-speed">0MB/s</span>
                </p>
                <p class="flex items-center">
                    <i class="fas fa-clock text-red-500 mr-1"></i>
                    <span class="file-remaining">00:00:00</span>
                </p>
                <span class="text-gray-400 file-progress">0%</span>
            </div>
        </div>
        
        <div class="progress-container">
            <div class="bg-gray-600 h-2 rounded-full">
                <div class="file-progressbar bg-green-500 h-2 rounded-full" style="width: 0%;"></div>
            </div>
        </div>
        
        <div class="processing-indicator hidden">
            <div class="flex items-center justify-center mt-1">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span class="ml-2 text-xs text-gray-400">Server processing file...</span>
            </div>
        </div>
    `;
    fileListDiv.appendChild(fileItem);
}
async function domCreateUploadSuccess(requestUploadObject) {
    // Find the existing div with the matching data-id
    const existingDiv = document.querySelector(`div[data-id="${requestUploadObject.id}"]`);
    if (!existingDiv) {
        console.error('Could not find existing upload div to replace');
        return;
    }

    // Calculate total size of uploaded files
    const totalSize = humanFileSize(requestUploadObject.totalBytes, true);
    const fileCount = Object.keys(requestUploadObject.fileList).length;
    const folderName = requestUploadObject.folderDestName;
    const folderCode = requestUploadObject.folderCode;
    
    // Update the existing div's content
    existingDiv.className = 'p-6 bg-gray-700 bg-opacity-60 rounded-xl relative';
    if (!requestUploadObject.showSuccessDetails) {
        // Minimal version
        existingDiv.innerHTML = `
            <!-- Close Button -->
            <button class="absolute top-2 right-2 text-gray-400 hover:text-white closeSuccessCard" title="Close">
                <i class="fas fa-times"></i>
            </button>

            <!-- Upload Complete Header -->
            <div class="flex justify-center mb-3">
                <div class="text-center">
                    <h2 class="text-white text-xl font-semibold">Upload Complete</h2>
                    <div class="h-1 w-24 bg-green-500 rounded mt-1 mx-auto"></div>
                </div>
            </div>

            <!-- Upload Statistics -->
            <div class="flex flex-wrap items-center justify-center mb-4 gap-2">
                <div class="flex flex-wrap items-center justify-center text-gray-300 text-sm gap-2">
                    <div class="flex items-center">
                        <i class="fas fa-file-alt text-blue-500 mr-2"></i>
                        <span>${fileCount} file${fileCount > 1 ? 's' : ''}</span>
                    </div>
                    <span class="hidden sm:block mx-2">•</span>
                    <div class="flex items-center">
                        <i class="fas fa-database text-purple-500 mr-2"></i>
                        <span>${totalSize}</span>
                    </div>
                    <span class="hidden sm:block mx-2">•</span>
                    <div class="flex items-center">
                        <i class="fas fa-folder text-yellow-500 mr-2"></i>
                        <span>${folderName}</span>
                    </div>
                </div>
            </div>

            <!-- Access Button -->
            <div class="flex justify-center">
                <a href="${window.location.origin}/d/${requestUploadObject.folderCode}"
                   class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-2 linkSuccessCard">
                    <i class="fas fa-folder-open"></i>
                    Access Folder
                </a>
            </div>
        `;
    } else {
        existingDiv.innerHTML = `
            <!-- Close Button -->
            <button class="absolute top-2 right-2 text-gray-400 hover:text-white closeSuccessCard" title="Close">
                <i class="fas fa-times"></i>
            </button>

            <!-- Upload Complete Header -->
            <div class="flex justify-center mb-3">
                <div class="text-center">
                    <h2 class="text-white text-xl font-semibold">Upload Complete</h2>
                    <div class="h-1 w-24 bg-green-500 rounded mt-1 mx-auto"></div>
                </div>
            </div>

            <!-- Upload Statistics -->
            <div class="flex flex-wrap items-center justify-center mb-6 gap-2">
                <div class="flex flex-wrap items-center justify-center text-gray-300 text-sm gap-2">
                    <div class="flex items-center">
                        <i class="fas fa-file-alt text-blue-500 mr-2"></i>
                        <span>${fileCount} file${fileCount > 1 ? 's' : ''}</span>
                    </div>
                    <span class="hidden sm:block mx-2">•</span>
                    <div class="flex items-center">
                        <i class="fas fa-database text-purple-500 mr-2"></i>
                        <span>${totalSize}</span>
                    </div>
                    <span class="hidden sm:block mx-2">•</span>
                    <div class="flex items-center">
                        <i class="fas fa-folder text-yellow-500 mr-2"></i>
                        <span>${folderName}</span>
                    </div>
                </div>
            </div>

            <!-- Folder Link and QR Section -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <!-- Folder Link Section -->
                <div class="bg-gray-800 p-4 rounded-lg">
                    <div class="flex items-center mb-3">
                        <i class="fas fa-folder-open text-blue-400 mr-2"></i>
                        <span class="text-white">Folder Link</span>
                    </div>
                    <div class="flex items-center text-sm">
                        <a href="${window.location.origin}/d/${requestUploadObject.folderCode}" 
                            class="text-blue-400 hover:text-blue-300 hover:underline truncate linkSuccessCard">
                            ${window.location.origin}/d/${requestUploadObject.folderCode}
                        </a>
                        <span class="showSuccessDetails_folderLink hidden">${window.location.origin}/d/${requestUploadObject.folderCode}</span>
                        <button class="ml-2 popover-trigger copy-button bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded inline-flex items-center text-xs" data-popover="Copy the folder link" data-copy-target=".showSuccessDetails_folderLink" data-copy-popover="Folder link copied!">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <!-- QR Code Section -->
                <div class="bg-gray-800 p-4 rounded-lg">
                    <div class="flex items-center mb-3">
                        <i class="fas fa-qrcode text-blue-400 mr-2"></i>
                        <span class="text-white">QR Code</span>
                    </div>
                    <div class="flex justify-center">
                        <div class="bg-white p-3 rounded">
                            <div id="qrcode-${requestUploadObject.id}"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Access Information -->
            <div class="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-xl p-4 mb-4">
                <div class="flex flex-col sm:flex-row items-start gap-3">
                    <i class="fas fa-info-circle text-blue-500 mt-1"></i>
                    <p class="text-gray-300 text-sm">
                        Your files have been stored in the newly created folder <i class="fas fa-folder text-yellow-500 mr-1"></i><span class="font-semibold">${folderName}</span>.<br>
                        This folder has been configured as publicly accessible through the generated link above.<br>
                        To set additional options (password, expiration date, description text, etc.), visit the folder in your file manager and access its settings.
                    </p>
                </div>
            </div>

            ${requestUploadObject.account.tier !== "premium" ? `
                <!-- Expiration Warning -->
                <div class="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-xl p-4">
                    <div class="flex flex-col sm:flex-row items-start gap-3">
                        <i class="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                        <p class="text-gray-300 text-sm">
                            Files that haven't been downloaded in 10 days will be automatically archived. Active files that are being downloaded regularly will remain available.
                            <a href="/premium" target="_blank" class="text-blue-400 hover:text-blue-300">Upgrade to Premium</a>
                            for unlimited storage duration and enhanced features.
                        </p>
                    </div>
                </div>
            ` : ''}
        `;
    }

    try {
        await loadQRCodeScript();

        const qrContainer = document.getElementById(`qrcode-${requestUploadObject.id}`);
        if (qrContainer) {
            qrContainer.innerHTML = '';
            const folderUrl = `${window.location.origin}/d/${requestUploadObject.folderCode}`;
            new QRCode(qrContainer, {
                text: folderUrl,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        const qrContainer = document.getElementById(`qrcode-${requestUploadObject.id}`);
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="text-red-500 text-sm">
                    <i class="fas fa-exclamation-circle"></i>
                    Failed to generate QR code
                </div>
            `;
        }
    }
    
    initPopover()
    return existingDiv;
}
