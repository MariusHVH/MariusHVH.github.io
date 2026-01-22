async function initProfilePage() {
    try {
        var accountActive = await getAccountActive() //Get the active account
        await refreshAppdataAccountsAndSync(accountActive.email); //Force refresh the active account info from backend
        accountActive = await getAccountActive() //Get new info in accountActive variable
        
        // Handle profile picture
        if (accountActive.clientIcon) {
            // Create new image element
            const profileImg = document.createElement('img');
            profileImg.src = accountActive.clientIcon;
            profileImg.className = 'w-full h-full rounded-full object-cover';
            
            // Get the profile picture container
            const profileContainer = document.querySelector('.myprofile_profile-picture');
            
            // Remove the default icon
            const defaultIcon = document.getElementById('myprofile_user_icon');
            if (defaultIcon) {
                defaultIcon.remove();
            }
            
            // Add the profile image
            profileContainer.appendChild(profileImg);
        } else {
            // Ensure default icon is visible if no profile picture
            document.getElementById('myprofile_user_icon').style.display = 'block';
        }

        // Hide loading spinner
        document.getElementById('myprofile_loading').classList.add('hidden');
        
        // Show account details
        document.getElementById('myprofile_account_details').classList.remove('hidden');
        
        // Set email and creation date
        document.getElementById("myprofile_email").textContent = accountActive.email;
        const createDate = new Date(accountActive.createTime * 1000);
        document.getElementById("myprofile_created_on").textContent = createDate.toLocaleDateString();

        // Show correct account tier
        document.querySelectorAll('.myprofile_account-tier').forEach(el => el.classList.add('hidden'));
        document.getElementById(`myprofile_account_tier_${accountActive.tier}`).classList.remove('hidden');

        // Handle upgrade button visibility
        if(accountActive.tier === "guest" || accountActive.tier === "standard") {
            document.getElementById('myprofile_upgrade_button').classList.remove('hidden');
        }

        // Show appropriate warning
        if(accountActive.tier === "guest") {
            document.getElementById("myprofile_guest_warning").classList.remove('hidden');
        } else if(accountActive.tier === "standard") {
            document.getElementById("myprofile_standard_warning").classList.remove('hidden');
        }
        
        // Premium Details
        if(accountActive.tier === "premium") {
            document.getElementById("myprofile_premium_details").classList.remove('hidden');
            document.getElementById("myprofile_premium_type").textContent = accountActive.premiumType;
            
            if(accountActive.premiumType === "credit") {
                document.querySelector('#myprofile_credit_balance').closest('.flex').parentElement.classList.remove('hidden');
                document.getElementById("myprofile_credit_balance").textContent = accountActive.currencySign + accountActive.credit;
            }
            else if(accountActive.premiumType === "subscription") {
                // Show and fill provider information
                document.querySelector('#myprofile_premium_provider').closest('.flex').parentElement.classList.remove('hidden');
                document.getElementById("myprofile_premium_provider").textContent = accountActive.subscriptionProvider;

                if(accountActive.subscriptionProvider === "internal") {
                    // Show and fill validity date
                    document.querySelector('#myprofile_premium_validity').closest('.flex').parentElement.classList.remove('hidden');
                    const endDate = new Date(accountActive.subscriptionEndDate*1000);
                    document.getElementById("myprofile_premium_validity").textContent = endDate.toLocaleDateString();
                }
            }

            // Action Buttons Logic
            const renewButton = document.getElementById('myprofile_renew_button');
            const switchPaygButton = document.getElementById('myprofile_switch_payg_button');
            const cancelSubscriptionButton = document.getElementById('myprofile_cancel_subscription_button');
            const addCreditsButton = document.getElementById('myprofile_add_credits_button');

            // First, hide all buttons by default
            [renewButton, switchPaygButton, cancelSubscriptionButton, addCreditsButton].forEach(button => {
                button.classList.add('hidden');
            });

            // Show buttons based on conditions
            if (accountActive.premiumType === "credit") {
                // Show only add credits button for credit-based premium
                addCreditsButton.classList.remove('hidden');
            } 
            else if (accountActive.premiumType === "subscription") {
                if (accountActive.subscriptionProvider === "patreon" || accountActive.subscriptionProvider === "gumroad") {
                    // Show cancel subscription and switch to PAYG for monthly subscription providers
                    cancelSubscriptionButton.classList.remove('hidden');
                    switchPaygButton.classList.remove('hidden');
                } 
                else if (accountActive.subscriptionProvider === "internal") {
                    // Show extend premium and switch to PAYG for internal subscribers
                    renewButton.classList.remove('hidden');
                    switchPaygButton.classList.remove('hidden');
                }
            }
        }

        // Usage Details
        document.getElementById("myprofile_usage_details").classList.remove('hidden');
        const storageUsed = accountActive.statsCurrent.storage;
        const trafficUsed = accountActive.tier === "premium" 
            ? getAccountTrafficLastXDays(accountActive.email, 29)
            : getIpTrafficLastXDays(accountActive.email, 29)
        
        document.getElementById('myprofile_storage_usage').textContent = humanFileSize(storageUsed, true);
        document.getElementById('myprofile_traffic_usage').textContent = humanFileSize(trafficUsed, true);
        document.getElementById('myprofile_file_count').textContent = accountActive.statsCurrent.fileCount;
        document.getElementById('myprofile_folder_count').textContent = accountActive.statsCurrent.folderCount;
        
        // Show chart buttons
        if(accountActive.tier === "premium") {
            document.getElementById("myprofile_storage_history_button").classList.remove('hidden');
        }
        document.getElementById("myprofile_traffic_history_button").classList.remove('hidden');

        // Show traffic info for non-premium accounts
        if(accountActive.tier !== "premium") {
            document.getElementById("myprofile_traffic_info").classList.remove('hidden');
        }

        if (accountActive.tier === "premium") {
            if (accountActive.premiumType === "credit") {
                document.getElementById('myprofile_storage_limit').textContent = "∞";
                document.getElementById('myprofile_traffic_limit').textContent = "∞";
            } else if (accountActive.premiumType === "subscription") {
                // Storage limits and progress
                const storageLimit = humanFileSize(accountActive.subscriptionLimitStorage, true);
                document.getElementById('myprofile_storage_limit').textContent = storageLimit;
                const storageProgressPercent = Math.min((storageUsed / accountActive.subscriptionLimitStorage) * 100, 100);
                document.getElementById('myprofile_storage_progress_bar').style.width = `${storageProgressPercent}%`;

                // Traffic limits and progress
                const trafficLimit = humanFileSize(accountActive.subscriptionLimitDirectTraffic, true);
                document.getElementById('myprofile_traffic_limit').textContent = trafficLimit;
                const trafficProgressPercent = Math.min((trafficUsed / accountActive.subscriptionLimitDirectTraffic) * 100, 100);
                document.getElementById('myprofile_traffic_progress_bar').style.width = `${trafficProgressPercent}%`;
            }
        } else {
            // Storage limits
            document.getElementById('myprofile_storage_limit').textContent = "Temporary storage";
            // Traffic limits and progress
            const trafficLimit = humanFileSize(100000000000, true);
            document.getElementById('myprofile_traffic_limit').textContent = trafficLimit;
            const trafficProgressPercent = Math.min((trafficUsed / 100000000000) * 100, 100);
            document.getElementById('myprofile_traffic_progress_bar').style.width = `${trafficProgressPercent}%`;
        }

        // Account preferences
        document.getElementById("myprofile_account_preferences").classList.remove('hidden');
        document.getElementById("myprofile_account_preferences_thumbnails").classList.remove('hidden');
        document.getElementById("myprofile_account_preferences_email").classList.remove('hidden');
        document.getElementById("myprofile_account_preferences_region").classList.remove('hidden');

        // Disable thumbnails preference (client-side only, stored in localStorage per account)
        const disableThumbsEl = document.getElementById('myprofile_disable_thumbnails');
        if (disableThumbsEl) {
            const key = `fileManagerDisableThumbnails|${accountActive.email}`;
            disableThumbsEl.checked = localStorage.getItem(key) === 'true';
        }

        //Set the upload proxy to the saved one, or default
        const uploadProxySelect = document.getElementById('upload_proxy_select');
        if (uploadProxySelect && appdata.fileManager.uploadProxy) {
            const option = Array.from(uploadProxySelect.options).find(
                opt => opt.getAttribute('data-proxy-value') === appdata.fileManager.uploadProxy
            );
            
            if (option) {
                uploadProxySelect.selectedIndex = Array.from(uploadProxySelect.options).indexOf(option);
            } else {
                appdata.fileManager.uploadProxy = "upload"; // Reset to default if no matching option
            }
        }

        // Developer Information
        if(accountActive.tier !== "guest") {
            document.getElementById("myprofile_developer_info").classList.remove('hidden');
            document.getElementById("myprofile_account_id").textContent = accountActive.id;
            document.getElementById("myprofile_account_token").textContent = accountActive.token;
        }
    } catch (error) {
        console.error("Error in initProfilePage:", error);
        throw new Error("initProfilePage " + error.message);
    }
}
async function profileOpenCharts(eventTarget) {
    const account = await getAccountActive();
    const chartConfigs = {
        myprofile_credit_balance_history_button: {
            title: `Credit chart history (${account.currencySign})`,
            dataPath: 'creditConsumption',
            valueKey: 'credit',
            formatValue: (value) => account.currencySign + value.toFixed(2),
            formatTick: (value) => account.currencySign + value
        },
        myprofile_storage_history_button: {
            title: 'Storage chart history (bytes)',
            dataPath: 'statsHistory',
            valueKey: 'storage',
            formatValue: (value) => humanFileSize(value, true),
            formatTick: (value) => humanFileSize(value, true),
            includeCurrent: true
        },
        myprofile_traffic_history_button: {
            title: 'Traffic chart history (bytes)',
            dataPath: account.tier === "premium" ? 'statsHistory' : 'ipTraffic',
            valueKey: account.tier === "premium" ? 
                (data) => (data.trafficDirectGenerated || 0) + (data.trafficReqDownloaded || 0) + (data.trafficWebDownloaded || 0) : 
                (data) => data,
            formatValue: (value) => humanFileSize(value, true),
            formatTick: (value) => humanFileSize(value, true),
            includeCurrent: account.tier === "premium"
        }
    };

    const config = chartConfigs[eventTarget.id];
    const accountData = appdata.accounts[account.email];
    
    // Extract historical data
    const dataPoints = [];
    const historyData = accountData[config.dataPath];
    
    if (historyData) {
        for (const year in historyData) {
            for (const month in historyData[year]) {
                for (const day in historyData[year][month]) {
                    const dayData = historyData[year][month][day];
                    const value = typeof config.valueKey === 'function' ? 
                        config.valueKey(dayData) : dayData[config.valueKey];
                    dataPoints.push({
                        date: new Date(`${year}-${month}-${day}`),
                        value: value || 0
                    });
                }
            }
        }
    }

    // Add current day data if needed
    if (config.includeCurrent && accountData.statsCurrent) {
        const currentValue = typeof config.valueKey === 'function' ? 
            config.valueKey(accountData.statsCurrent) : 
            accountData.statsCurrent[config.valueKey];
        if (currentValue !== undefined) {
            dataPoints.push({ date: new Date(), value: currentValue });
        }
    }

    // Generate last 30 days with missing days filled as 0
    const dataMap = new Map(dataPoints.map(item => [item.date.toDateString(), item.value]));
    const chartLabels = [];
    const chartData = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        chartLabels.push(date);
        chartData.push(dataMap.get(date.toDateString()) || 0);
    }

    createPopup({
        icon: 'fas fa-chart-line',
        title: config.title,
        content: `
        <div class="flex flex-col gap-6 w-[85vw] mx-auto">
            <div class="flex justify-center gap-4">
                <button id="chartViewBtn" class="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                    <i class="fas fa-chart-line mr-2"></i>Chart View
                </button>
                <button id="tableViewBtn" class="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors">
                    <i class="fas fa-table mr-2"></i>Table View
                </button>
            </div>
            <div id="chartContainer" class="bg-gray-700/60 rounded-xl p-6 shadow-lg">
                <div class="h-[400px] w-full">
                    <canvas id="myprofile_charts_canvas"></canvas>
                </div>
            </div>
            <div id="tableContainer" class="hidden">
                <div class="bg-gray-700/60 rounded-xl p-6 shadow-lg">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-700">
                                    <th class="px-4 py-3 text-left text-gray-400">Date</th>
                                    <th class="px-4 py-3 text-right text-gray-400">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${chartData.map((value, index) => `
                                    <tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                        <td class="px-4 py-3 text-gray-300">${chartLabels[index].toLocaleDateString()}</td>
                                        <td class="px-4 py-3 text-right font-mono text-gray-200">${config.formatValue(value)}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`
    });

    // Tab switching logic
    const toggleTab = (activeBtn, inactiveBtn, showContainer, hideContainer) => {
        activeBtn.className = activeBtn.className.replace('bg-gray-700', 'bg-blue-500').replace('hover:bg-gray-600', 'hover:bg-blue-600');
        inactiveBtn.className = inactiveBtn.className.replace('bg-blue-500', 'bg-gray-700').replace('hover:bg-blue-600', 'hover:bg-gray-600');
        document.getElementById(showContainer).classList.remove('hidden');
        document.getElementById(hideContainer).classList.add('hidden');
    };

    const chartBtn = document.getElementById('chartViewBtn');
    const tableBtn = document.getElementById('tableViewBtn');
    chartBtn.onclick = () => toggleTab(chartBtn, tableBtn, 'chartContainer', 'tableContainer');
    tableBtn.onclick = () => toggleTab(tableBtn, chartBtn, 'tableContainer', 'chartContainer');

    // Initialize Chart.js
    const initChart = () => {
        const ctx = document.getElementById('myprofile_charts_canvas').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: config.title,
                    data: chartData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: config.formatTick
                        }
                    }
                }
            }
        });
    };

    if (typeof Chart === 'undefined') {
        const loadScript = (src) => {
            const script = document.createElement('script');
            script.src = src;
            document.head.appendChild(script);
            return script;
        };
        
        loadScript('https://cdn.jsdelivr.net/npm/chart.js').onload = () => {
            loadScript('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns').onload = initChart;
        };
    } else {
        initChart();
    }
}
