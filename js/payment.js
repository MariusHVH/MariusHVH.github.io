// Gumroad subscription (monthly)
const GUMROAD_PRODUCT_SHORT_ID = 'lhhrv';
const GUMROAD_OPTION_ID = 'SUXP-mIu31uEjACILeIltg%3D%3D';

function getGumroadMonthlyCheckoutUrl() {
    // Keep referrer dynamic so the same build works on dev/staging domains too.
    const referrer = encodeURIComponent(`${window.location.origin}/`);
    return `https://gumroad.com/checkout?product=${GUMROAD_PRODUCT_SHORT_ID}&option=${GUMROAD_OPTION_ID}&recurrence=monthly&quantity=1&referrer=${referrer}`;
}

// NOTE: We intentionally don't link to a generic Gumroad subscriptions page here,
// because cancellation should be done from the user's Gumroad receipt email.

async function showSubscriptionCancellation() {
    const account = await getAccountActive();

    if (account.subscriptionProvider === "patreon") {
        createPopup({
            icon: 'fab fa-patreon',
            title: 'Cancel Subscription',
            content: `
                <div class="max-w-md mx-auto text-center">
                    <!-- Patreon Icon -->
                    <div class="mb-6">
                        <i class="fab fa-patreon text-blue-500 text-5xl"></i>
                    </div>
                    
                    <!-- Message -->
                    <div class="mb-6">
                        <h3 class="text-xl text-white font-semibold mb-3">Subscription Managed by Patreon</h3>
                        <p class="text-gray-300 mb-4">
                            Your subscription is currently managed through Patreon. To cancel your subscription, you'll need to:
                        </p>
                        <ol class="text-left text-gray-300 space-y-2 mb-4">
                            <li class="flex items-start">
                                <span class="mr-2">1.</span>
                                <span>Visit your Patreon account settings</span>
                            </li>
                            <li class="flex items-start">
                                <span class="mr-2">2.</span>
                                <span>Locate your Gofile membership</span>
                            </li>
                            <li class="flex items-start">
                                <span class="mr-2">3.</span>
                                <span>Click on "Edit" or "Cancel membership"</span>
                            </li>
                        </ol>
                        <p class="text-gray-400 text-sm">
                            Your premium access will remain active until the end of your current billing period.
                        </p>
                    </div>

                    <!-- Action Button -->
                    <a href="https://www.patreon.com/gofile" 
                        target="_blank"
                        class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4">
                        <i class="fab fa-patreon mr-2"></i>
                        Go to Patreon
                    </a>

                    <!-- Additional Info -->
                    <div class="text-sm text-gray-400">
                        Need help? <a href="/contact" class="closePopup text-blue-400 hover:text-blue-300">Contact our support team</a>
                    </div>
                </div>
            `
        });
    } else if (account.subscriptionProvider === "gumroad") {
        createPopup({
            icon: 'fas fa-shopping-cart',
            title: 'Cancel Subscription',
            content: `
                <div class="max-w-md mx-auto text-center">
                    <!-- Gumroad Icon -->
                    <div class="mb-6">
                        <i class="fas fa-shopping-cart text-blue-500 text-5xl"></i>
                    </div>

                    <!-- Message -->
                    <div class="mb-6">
                        <h3 class="text-xl text-white font-semibold mb-3">Subscription Managed by Gumroad</h3>
                        <p class="text-gray-300 mb-4">
                            Your subscription is currently managed through Gumroad. To cancel your subscription, you'll need to:
                        </p>
                        <ol class="text-left text-gray-300 space-y-2 mb-4">
                            <li class="flex items-start">
                                <span class="mr-2">1.</span>
                                <span>Go to your latest charge receipt email from Gumroad and click <strong>"Subscription settings"</strong> or <strong>"Manage membership"</strong>.</span>
                            </li>
                            <li class="flex items-start">
                                <span class="mr-2">2.</span>
                                <span>On the next screen, click <strong>"Cancel membership"</strong>.</span>
                            </li>
                        </ol>
                        <p class="text-gray-400 text-sm mb-3">
                            Your premium access will remain active until the end of your current billing period.
                        </p>
                        <p class="text-gray-400 text-sm">
                            More details: <a href="https://gumroad.com/help/article/192-how-do-i-cancel-my-membership" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300">How do I cancel my membership?</a>
                        </p>
                    </div>

                    <!-- Info Link -->
                    <a href="https://gumroad.com/help/article/192-how-do-i-cancel-my-membership"
                        target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        Gumroad help article
                    </a>

                    <!-- Additional Info -->
                    <div class="text-sm text-gray-400">
                        Need help? <a href="/contact" class="closePopup text-blue-400 hover:text-blue-300">Contact our support team</a>
                    </div>
                </div>
            `
        });
    } else {
        createPopup({
            icon: 'fas fa-info-circle',
            title: 'Subscription Information',
            content: `
                <div class="max-w-md mx-auto text-center">
                    <div class="mb-6">
                        <i class="fas fa-exclamation-circle text-blue-400 text-5xl"></i>
                    </div>
                    
                    <div class="mb-6">
                        <h3 class="text-xl text-white font-semibold mb-3">Unknown Subscription Provider</h3>
                        <p class="text-gray-300 mb-4">
                            We couldn't determine your subscription provider. Please contact our support team for assistance with cancellation.
                        </p>
                    </div>

                    <a href="/contact" 
                        class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        <i class="fas fa-envelope mr-2"></i>
                        Contact Support
                    </a>
                </div>
            `
        });
    }
}
async function showSubscriptionDuration() {
    const account = await getAccountActive();
    
    let subscriptionInfo = '';
    if (account.premiumType === "subscription") {
        if (account.subscriptionProvider === "internal") {
            // Convert timestamp to date
            const endDate = new Date(account.subscriptionEndDate * 1000);
            const formattedDate = endDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        
            subscriptionInfo = `
                <div class="mb-8">
                    <div class="bg-blue-500 bg-opacity-20 border-l-4 border-blue-500 p-4 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-blue-400 mt-0.5"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-blue-400">Active Subscription</h3>
                                <div class="mt-2 text-sm text-gray-300">
                                    <p>Your current subscription is active until <span class="text-blue-400 font-medium">${formattedDate}</span>. You can extend your premium access by purchasing another year, which will be added to your current subscription period.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (account.subscriptionProvider === "patreon" || account.subscriptionProvider === "gumroad") {
            const providerLabel = account.subscriptionProvider === "patreon" ? "Patreon" : "Gumroad";
            subscriptionInfo = `
                <div class="mb-8">
                    <div class="bg-blue-500 bg-opacity-20 border-l-4 border-blue-500 p-4 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-blue-400 mt-0.5"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-blue-400">Active ${providerLabel} Subscription</h3>
                                <div class="mt-2 text-sm text-gray-300">
                                    <p>You currently have an active monthly subscription through ${providerLabel}. By choosing the annual plan, you'll receive one full year of premium access without requiring an active monthly subscription.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } else if (account.premiumType === "credit") {
        subscriptionInfo = `
            <div class="mb-8">
                <div class="bg-blue-500 bg-opacity-20 border-l-4 border-blue-500 p-4 rounded">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-blue-400 mt-0.5"></i>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-blue-400">Pay As You Go Credits Active</h3>
                            <div class="mt-2 text-sm text-gray-300">
                                <p>Your account currently has <span class="text-blue-400 font-medium">${account.credit}$</span> available using the pay as you go model. If you choose to subscribe, your remaining credits will be used first.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createPopup({
        icon: 'fas fa-crown',
        title: 'Choose Your Billing Period',
        content: `
            ${subscriptionInfo}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Monthly Plan -->
                <div class="bg-gray-700 bg-opacity-50 rounded-xl p-6 border border-gray-600 hover:border-blue-500 transition-colors">
                    <div class="text-center mb-4">
                        <h3 class="font-bold text-xl text-white">Monthly Billing</h3>
                        <div class="text-3xl font-bold text-white mt-2">$9<span class="text-lg text-gray-400">/month</span></div>
                        <div class="text-sm text-gray-400">Recurring monthly payment</div>
                    </div>
                    <ul class="text-gray-300 space-y-3 mb-6">
                        <li class="flex items-center"><i class="fas fa-check text-blue-400 w-6"></i>Monthly billing</li>
                        <li class="flex items-center"><i class="fas fa-check text-blue-400 w-6"></i>Cancel anytime</li>
                        <li class="flex items-center"><i class="fab fa-patreon text-blue-400 w-6"></i>Pay via Patreon</li>
                        <!-- Gumroad payment temporarily disabled -->
                        <!-- <li class="flex items-center"><i class="fas fa-shopping-cart text-blue-400 w-6"></i>Pay via Gumroad</li> -->
                    </ul>
                    <div class="flex flex-col gap-3">
                        <button onclick="showSubscriptionPatreon()" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center">
                            Subscribe via Patreon
                        </button>
                        <!-- Gumroad payment temporarily disabled -->
                        <!--
                        <button onclick="showSubscriptionGumroad()" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center">
                            Subscribe via Gumroad
                        </button>
                        -->
                    </div>
                </div>

                <!-- Annual Plan -->
                <div class="bg-gray-700 bg-opacity-50 rounded-xl p-6 border border-gray-600 hover:border-green-500 transition-colors relative overflow-hidden">
                    <div class="absolute -right-12 top-6 bg-green-500 text-white px-12 py-1 rotate-45">
                        Save 17%
                    </div>
                    <div class="text-center mb-4">
                        <h3 class="font-bold text-xl text-white">Annual Billing</h3>
                        <div class="text-3xl font-bold text-white mt-2">$90<span class="text-lg text-gray-400">/year</span></div>
                        <div class="text-sm text-gray-400">One-time payment (equals $7.50/month)</div>
                    </div>
                    <ul class="text-gray-300 space-y-3 mb-6">
                        <li class="flex items-center"><i class="fas fa-check text-green-400 w-6"></i>Single payment for full year</li>
                        <li class="flex items-center"><i class="fas fa-check text-green-400 w-6"></i>2 months free included</li>
                        <li class="flex items-center"><i class="fas fa-credit-card text-green-400 w-6"></i>Credit Card</li>
                        <li class="flex items-center"><i class="fab fa-paypal text-green-400 w-6"></i>PayPal</li>
                        <li class="flex items-center"><i class="fab fa-bitcoin text-green-400 w-6"></i>Cryptocurrencies</li>
                    </ul>
                    <button id="showSubscriptionDuration_year" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        Choose Annual Plan
                    </button>
                </div>
            </div>

            <p class="text-gray-400 text-center mt-6 text-sm">
                Both billing periods include the same premium features.
            </p>
        `
    });
}
async function showGuestWarningPopup() {
    createPopup({
        icon: 'fas fa-user-circle',
        title: 'Quick Login Needed',
        content: `
            <div class="max-w-md mx-auto text-center">
                <!-- Info Icon -->
                <div class="mb-6">
                    <i class="fas fa-info-circle text-blue-500 text-5xl"></i>
                </div>
                
                <!-- Message -->
                <div class="mb-6">
                    <h3 class="text-xl text-white font-semibold mb-3">First Step to Premium</h3>
                    <p class="text-gray-300 mb-2">
                        To start the upgrade process to Premium, please log in with your email account.
                    </p>
                    <p class="text-gray-400 text-sm">
                        After logging in, you'll be able to choose your premium plan.
                    </p>
                </div>

                <!-- Action Button -->
                <button 
                    onclick="openAddAccountWindow()"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center mb-4">
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    <span>Login to Continue</span>
                </button>

                <!-- Additional Info -->
                <div class="text-sm text-gray-400">
                    Login is required to start the upgrade process.
                </div>
            </div>
        `
    });
}
async function showSubscriptionPatreon() {
    const account = await getAccountActive();
    // Check if guest account
    if (account.tier === "guest") {
        showGuestWarningPopup();
        return;
    }
    createPopup({
        icon: 'fab fa-patreon',
        title: 'Subscribe via Patreon',
        content: `
            <div class="text-center">
                <div class="mb-6">
                    <i class="fab fa-patreon text-blue-400 text-5xl mb-4"></i>
                    <h3 class="text-xl text-white font-semibold mb-3">You will be redirected to Patreon</h3>
                    <p class="text-gray-300">Complete your subscription process on Patreon's website</p>
                </div>

                <div class="bg-blue-500 bg-opacity-10 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-400 mt-1 mr-3"></i>
                        <div class="text-left">
                            <p class="text-blue-400 font-semibold mb-1">Important Notice</p>
                            <p class="text-gray-300">Please ensure that you use the same email address on Patreon as your Gofile account:</p>
                            <p class="text-white font-semibold mt-1">${account.email}</p>
                        </div>
                    </div>
                </div>

                <a href="javascript:void(0)" 
                    onclick="closePopup(); window.open('https://www.patreon.com/gofile/membership', '_blank')"
                    class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        <i class="fab fa-patreon mr-2"></i>
                        Continue to Patreon
                </a>

                <p class="text-gray-400 text-sm mt-6">
                    Your premium access will be automatically activated once the subscription is completed.
                </p>
            </div>
        `
    });
}

async function showSubscriptionGumroad() {
    const account = await getAccountActive();
    // Check if guest account
    if (account.tier === "guest") {
        showGuestWarningPopup();
        return;
    }

    createPopup({
        icon: 'fas fa-shopping-cart',
        title: 'Subscribe via Gumroad',
        content: `
            <div class="text-center">
                <div class="mb-6">
                    <i class="fas fa-shopping-cart text-blue-400 text-5xl mb-4"></i>
                    <h3 class="text-xl text-white font-semibold mb-3">You will be redirected to Gumroad</h3>
                    <p class="text-gray-300">Complete your subscription process on Gumroad's website</p>
                </div>

                <div class="bg-blue-500 bg-opacity-10 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-400 mt-1 mr-3"></i>
                        <div class="text-left">
                            <p class="text-blue-400 font-semibold mb-1">Important Notice</p>
                            <p class="text-gray-300">Please ensure that you use the same email address on Gumroad as your Gofile account:</p>
                            <p class="text-white font-semibold mt-1">${account.email}</p>
                        </div>
                    </div>
                </div>

                <a href="${getGumroadMonthlyCheckoutUrl()}" 
                    target="_blank" rel="noopener noreferrer"
                    onclick="closePopup();"
                    class="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        Continue to Gumroad
                </a>

                <p class="text-gray-400 text-sm mt-6">
                    Your premium access will be automatically activated once the subscription is completed.
                </p>
            </div>
        `
    });
}
async function showSubscriptionForm() {
    const account = await getAccountActive();
    // Check if guest account
    if (account.tier === "guest") {
        showGuestWarningPopup();
        return;
    }

    // Get countries list
    const countriesList = await getCountriesList();

    createPopup({
        icon: 'fas fa-crown',
        title: 'Annual Premium Subscription',
        content: `
            <div class="max-w-2xl mx-auto">
                <!-- Introduction -->
                <div class="text-center mb-8">
                    <div class="text-3xl font-bold text-white mb-2">$90<span class="text-lg text-gray-400">/year</span></div>
                    <p class="text-gray-300">Get 12 months of Premium access for the price of 10</p>
                    <div class="text-sm text-gray-400 mt-2">Price shown without VAT - Final price will be calculated based on your country</div>
                </div>

                <!-- Separator -->
                <hr class="border-gray-600 mb-8">

                <!-- Billing Form -->
                <form id="showSubscriptionForm_form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Account to Upgrade -->
                        <div class="md:col-span-2">
                            <label class="block text-gray-300 text-sm font-medium mb-2">Account to Upgrade</label>
                            <input type="email" 
                                id="showSubscriptionForm_formEmail"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-not-allowed opacity-75"
                                value="${account.email}"
                                disabled>
                            <div class="text-sm text-gray-400 mt-1">This is the account that will receive the premium upgrade</div>
                        </div>

                        <!-- First Name -->
                        <div>
                            <label class="block text-gray-300 text-sm font-medium mb-2">First Name</label>
                            <input type="text" 
                                id="showSubscriptionForm_formFirstname"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required>
                        </div>

                        <!-- Last Name -->
                        <div>
                            <label class="block text-gray-300 text-sm font-medium mb-2">Last Name</label>
                            <input type="text" 
                                id="showSubscriptionForm_formLastname"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required>
                        </div>

                        <!-- Country -->
                        <div class="md:col-span-2">
                            <label class="block text-gray-300 text-sm font-medium mb-2">Country</label>
                            <select 
                                id="showSubscriptionForm_formCountry"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required>
                                <option value="">Select your country</option>
                                ${countriesList}
                            </select>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button 
                        type="submit"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center">
                        <span>Continue to Payment</span>
                        <i class="fas fa-arrow-right ml-2"></i>
                    </button>

                    <!-- Terms and Privacy -->
                    <div class="text-sm text-center text-gray-400">
                        By proceeding, you agree to our <a href="/terms" class="text-blue-400 hover:text-blue-300">Terms of Service</a> and acknowledge our <a href="/privacy" class="text-blue-400 hover:text-blue-300">Privacy Policy</a>
                    </div>

                    <!-- Support -->
                    <div class="text-sm text-center text-gray-400">
                        Need help? <a href="/contact" class="text-blue-400 hover:text-blue-300">Contact our support team</a>
                    </div>
                </form>
            </div>
        `
    });
}
async function showPayAsYouGoCredits() {
    const account = await getAccountActive();
    
    let subscriptionInfo = '';
    if (account.premiumType === "subscription") {
        subscriptionInfo = `
            <div class="mb-8">
                <div class="bg-blue-500 bg-opacity-20 border-l-4 border-blue-500 p-4 rounded">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-blue-400"></i>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-blue-400">Subscription Information</h3>
                            <div class="mt-2 text-sm text-gray-300">
                                <p>Your account currently has an active premium subscription. Adding credits will convert your account from the subscription model to the pay-as-you-go model. If you have any questions, please contact our support team.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createPopup({
        icon: 'fas fa-coins',
        title: 'Purchase Premium Credits',
        content: `
            <div class="max-w-2xl mx-auto">
                ${subscriptionInfo}
                <!-- Introduction -->
                <div class="text-center mb-8">
                    <p class="text-gray-300">Purchase credits to use for storage and bandwidth.</p>
                    
                    <!-- Rates and Premium Info -->
                    <div class="mt-4 bg-gray-700 bg-opacity-50 rounded-lg p-4 inline-block">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div class="flex items-center justify-center space-x-2">
                                <i class="fas fa-database text-blue-400"></i>
                                <span class="text-gray-300">Storage: $3/TB/month</span>
                            </div>
                            <div class="flex items-center justify-center space-x-2">
                                <i class="fas fa-exchange-alt text-blue-400"></i>
                                <span class="text-gray-300">Bandwidth: $2/TB</span>
                            </div>
                        </div>
                        <div class="border-t border-gray-600 mt-3 pt-3 text-center">
                            <div class="text-xs text-gray-400">
                                Minimum monthly usage: $10
                            </div>
                            <div class="text-xs text-gray-400 mt-1 flex items-center justify-center space-x-1">
                                <i class="fas fa-crown text-yellow-400 text-xs"></i>
                                <span>Premium features active while credit balance > $0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Credit Packages -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div class="showPayAsYouGoCredits_packages cursor-pointer bg-gray-700 bg-opacity-50 rounded-xl p-6 border-2 border-gray-600 hover:border-blue-500 transition-colors" data-amount="50">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">$50</div>
                        </div>
                    </div>

                    <div class="showPayAsYouGoCredits_packages cursor-pointer bg-gray-700 bg-opacity-50 rounded-xl p-6 border-2 border-gray-600 hover:border-blue-500 transition-colors" data-amount="100">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">$100</div>
                        </div>
                    </div>

                    <div class="showPayAsYouGoCredits_packages cursor-pointer bg-gray-700 bg-opacity-50 rounded-xl p-6 border-2 border-gray-600 hover:border-blue-500 transition-colors" data-amount="200">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">$200</div>
                        </div>
                    </div>

                    <div class="showPayAsYouGoCredits_packages cursor-pointer bg-gray-700 bg-opacity-50 rounded-xl p-6 border-2 border-gray-600 hover:border-blue-500 transition-colors" data-amount="400">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">$400</div>
                        </div>
                    </div>
                </div>

                <!-- Payment Methods -->
                <div class="bg-gray-700 bg-opacity-50 rounded-lg p-6 mb-8">
                    <h3 class="text-white font-semibold mb-4">Available Payment Methods</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fas fa-credit-card text-blue-400"></i>
                            <span>Credit Card</span>
                        </div>
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fab fa-paypal text-blue-400"></i>
                            <span>PayPal</span>
                        </div>
                        <div class="flex items-center space-x-3 text-gray-300">
                            <i class="fab fa-bitcoin text-blue-400"></i>
                            <span>Cryptocurrency</span>
                        </div>
                    </div>
                </div>
            </div>
        `
    });
}
async function showPayAsYouGoForm() {
    const account = await getAccountActive();
    // Check if guest account
    if (account.tier === "guest") {
        showGuestWarningPopup();
        return;
    }

    // Get countries list
    const countriesList = await getCountriesList();

    createPopup({
        icon: 'fas fa-coins',
        title: 'Purchase Premium Credits',
        content: `
            <div class="max-w-2xl mx-auto">
                <!-- Introduction -->
                <div class="text-center mb-8">
                    <div class="text-3xl font-bold text-white mb-2">$${appdata.billing.amount}<span class="text-lg text-gray-400"> credits</span></div>
                    <p class="text-gray-300">Premium credits for storage and bandwidth usage</p>
                    <div class="text-sm text-gray-400 mt-2">Price shown without VAT - Final price will be calculated based on your country</div>
                </div>

                <!-- Separator -->
                <hr class="border-gray-600 mb-8">

                <!-- Billing Form -->
                <form id="showPayAsYouGoForm_form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Account to Credit -->
                        <div class="md:col-span-2">
                            <label class="block text-gray-300 text-sm font-medium mb-2">Account to Credit</label>
                            <input type="email" 
                                id="showPayAsYouGoForm_formEmail"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-not-allowed opacity-75"
                                value="${account.email}"
                                disabled>
                            <div class="text-sm text-gray-400 mt-1">Credits will be added to this account</div>
                        </div>

                        <!-- First Name -->
                        <div>
                            <label class="block text-gray-300 text-sm font-medium mb-2">First Name</label>
                            <input type="text" 
                                id="showPayAsYouGoForm_formFirstname"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required>
                        </div>

                        <!-- Last Name -->
                        <div>
                            <label class="block text-gray-300 text-sm font-medium mb-2">Last Name</label>
                            <input type="text" 
                                id="showPayAsYouGoForm_formLastname"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required>
                        </div>

                        <!-- Country -->
                        <div class="md:col-span-2">
                            <label class="block text-gray-300 text-sm font-medium mb-2">Country</label>
                            <select 
                                id="showPayAsYouGoForm_formCountry"
                                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                required>
                                <option value="">Select your country</option>
                                ${countriesList}
                            </select>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button 
                        type="submit"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center">
                        <span>Continue to Payment</span>
                        <i class="fas fa-arrow-right ml-2"></i>
                    </button>

                    <!-- Terms and Privacy -->
                    <div class="text-sm text-center text-gray-400">
                        By proceeding, you agree to our <a href="/terms" class="text-blue-400 hover:text-blue-300">Terms of Service</a> and acknowledge our <a href="/privacy" class="text-blue-400 hover:text-blue-300">Privacy Policy</a>
                    </div>

                    <!-- Support -->
                    <div class="text-sm text-center text-gray-400">
                        Need help? <a href="/contact" class="text-blue-400 hover:text-blue-300">Contact our support team</a>
                    </div>
                </form>
            </div>
        `
    });
}
async function showPremiumPayment() {
    const account = await getAccountActive();
    let title, description;

    // Set values based on plan
    if (appdata.billing.plan === "subscriptionAnnual") {
        title = "Annual Premium Subscription";
        description = "12 months of Premium access";
    } else if (appdata.billing.plan === "payAsYouGo") {
        title = "Premium Credits Purchase";
        description = "Premium credits for storage and bandwidth";
    } else {
        createAlert('error', 'Invalid billing plan selected');
        return;
    }

    // Show loading alert
    createAlert('loading', 'Creating your invoice...');
    
    // Call the API to create pending invoice
    try {
        const response = await fetch(`https://${appdata.apiServer}.gofile.io/createinvoicePending`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: appdata.billing.email,
                clientType: "Individual",
                premiumType: appdata.billing.premiumType,
                firstname: appdata.billing.firstName,
                lastname: appdata.billing.lastName,
                country: appdata.billing.country,
                premiumPriceSelected: appdata.billing.amount,
                currency: "USD"
            })
        });

        const invoiceData = await response.json();
        
        if (invoiceData.status !== "ok") {
            createAlert('error', 'Failed to create invoice. Please try again.');
            throw new Error("Failed to create invoice");
        }

        const { priceFinal, priceVatRate, priceVat, priceFinalVAT } = invoiceData.data;

        if (priceFinal == null || priceVatRate == null || priceVat == null || priceFinalVAT == null) {
            createAlert('error', 'Invalid price data received from server');
            throw new Error("Invalid price data");
        }

        appdata.billing.id = invoiceData.data.id
        appdata.billing.priceFinalVAT = invoiceData.data.priceFinalVAT
        // Used by PayPal SDK url + payment currency.
        appdata.billing.currency = invoiceData.data.currency || "USD"

        const vatRatePercentage = priceVatRate * 100;

        createPopup({
            icon: 'fas fa-credit-card',
            title: 'Complete Your Purchase',
            content: `
                <div class="max-w-2xl mx-auto">
                    <!-- Order Summary -->
                    <div class="bg-gray-700 bg-opacity-50 rounded-lg p-6 mb-8">
                        <h3 class="text-lg font-semibold text-white mb-4">Order Summary</h3>
                        
                        <div class="space-y-3">
                            <div class="flex justify-between text-gray-300">
                                <span class="mr-4">${description}</span>
                                <span class="flex-shrink-0">$${priceFinal.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span class="mr-4">VAT ${vatRatePercentage}% (${appdata.billing.country})</span>
                                <span class="flex-shrink-0">$${priceVat.toFixed(2)}</span>
                            </div>
                            <div class="border-t border-gray-600 pt-3">
                                <div class="flex justify-between text-white font-bold">
                                    <span class="mr-4">Total</span>
                                    <span class="flex-shrink-0">$${priceFinalVAT.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Billing Information -->
                    <div class="bg-gray-700 bg-opacity-50 rounded-lg p-6 mb-8">
                        <h3 class="text-lg font-semibold text-white mb-4">Billing Information</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-400">Name:</span>
                                <span class="text-white ml-2">${appdata.billing.firstName} ${appdata.billing.lastName}</span>
                            </div>
                            <div>
                                <span class="text-gray-400">Email:</span>
                                <span class="text-white ml-2">${appdata.billing.email}</span>
                            </div>
                            <div>
                                <span class="text-gray-400">Country:</span>
                                <span class="text-white ml-2">${appdata.billing.country}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Methods -->
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-white mb-4">Select Payment Method</h3>
                        
                        <!-- Credit Card -->
                        <button onclick="handleCreditCardPayment()" 
                                class="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex items-center justify-between group transition-colors">
                            <div class="flex items-center">
                                <i class="fas fa-credit-card text-blue-400 text-xl mr-3"></i>
                                <span>Credit Card</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400 group-hover:text-white transition-colors"></i>
                        </button>

                        <!-- PayPal -->
                        <button onclick="handlePayPalPayment()" 
                                class="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex items-center justify-between group transition-colors">
                            <div class="flex items-center">
                                <i class="fab fa-paypal text-blue-400 text-xl mr-3"></i>
                                <span>PayPal</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400 group-hover:text-white transition-colors"></i>
                        </button>

                        <!-- Crypto -->
                        <button onclick="handleCryptoPayment()" 
                                class="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex items-center justify-between group transition-colors">
                            <div class="flex items-center">
                                <i class="fab fa-bitcoin text-blue-400 text-xl mr-3"></i>
                                <span>Cryptocurrency</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400 group-hover:text-white transition-colors"></i>
                        </button>
                    </div>

                    <!-- Security Notice -->
                    <div class="mt-8 flex items-center justify-center text-sm text-gray-400">
                        <i class="fas fa-lock mr-2"></i>
                        <span>All payments are secured and encrypted</span>
                    </div>
                </div>
            `
        });

    } catch (error) {
        console.error('Error creating invoice:', error);
        createAlert('error', 'An unexpected error occurred. Please try again later.');
    }
}
async function handlePayPalPayment() {
    // Function to load PayPal SDK
    const loadPayPalScript = () => {
        return new Promise((resolve, reject) => {
            // Check if PayPal SDK is already loaded
            if (window.paypal) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            // Load PayPal SDK with card funding enabled so we can use PayPal both for PayPal wallet and credit card.
            const currency = appdata?.billing?.currency || "USD";
            script.src = `https://www.paypal.com/sdk/js?client-id=AUMhhKZsCLPzu-hHyF3nJWi3lCCmicQuLCxXPNrviw239k1_i1v9F1r1OOQKkrzu1y_JNUNEYx_0y3dv&currency=${currency}&components=buttons&enable-funding=card`;
            // script.src = `https://www.paypal.com/sdk/js?client-id=AaapUQAnoG5IIAhlco1eJrMvN_wOeoj9XSPYGJQaHPPrBxPKU7ldF2QTGECfvxuWOpIyYKL295-vcWWK&currency=${appdata.billing.currency}&components=buttons&enable-funding=card`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
            document.body.appendChild(script);
        });
    };

    try {
        // Show loading state
        createAlert('loading', 'Preparing PayPal payment...');

        // Load PayPal SDK
        await loadPayPalScript();

        // Create popup with PayPal button container
        createPopup({
            icon: 'fab fa-paypal',
            title: 'PayPal Payment',
            content: `
                <div class="max-w-md mx-auto">
                    <div class="bg-gray-100 rounded-lg p-6 mb-4">
                        <div class="text-center text-gray-800 mb-4">
                            Please complete your payment with PayPal
                        </div>
                        <div id="paypal-button-container" class="min-h-[150px]"></div>
                    </div>
                    
                    <div class="flex items-center justify-center text-sm text-gray-400">
                        <i class="fas fa-lock mr-2"></i>
                        <span>Secure payment processed by PayPal</span>
                    </div>
                </div>
            `
        });

        // Render PayPal buttons
        paypal.Buttons({
            fundingSource: paypal.FUNDING.PAYPAL,
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay'
            },
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: appdata.billing.priceFinalVAT
                        },
                        custom_id: appdata.billing.id
                    }],
                    application_context: {
                        shipping_preference: 'NO_SHIPPING'
                    }
                });
            },
            onApprove: (data, actions) => {
                // Show processing message
                // createAlert('loading', 'Processing your payment...');
                
                return actions.order.capture().then(function(orderData) {
                    console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
                    // Unify success flow with external checkout: navigate to /premium?billing=success
                    closePopup();
                    if (typeof loadUrl === 'function') {
                        loadUrl('/premium?billing=success');
                    } else {
                        window.location.href = '/premium?billing=success';
                    }
                });
            },
            onError: (err) => {
                console.error('PayPal Error:', err);
                createAlert('error', 'Payment failed. Please try again.');
            }
        }).render('#paypal-button-container');

    } catch (error) {
        console.error('PayPal setup error:', error);
        createAlert('error', 'Failed to initialize PayPal. Please try again later.');
    }
}
async function handlePayPalCardPayment() {
    // Function to load PayPal SDK
    const loadPayPalScript = () => {
        return new Promise((resolve, reject) => {
            // Check if PayPal SDK is already loaded
            if (window.paypal) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            // Must be loaded with card funding enabled.
            const currency = appdata?.billing?.currency || "USD";
            script.src = `https://www.paypal.com/sdk/js?client-id=AUMhhKZsCLPzu-hHyF3nJWi3lCCmicQuLCxXPNrviw239k1_i1v9F1r1OOQKkrzu1y_JNUNEYx_0y3dv&currency=${currency}&components=buttons&enable-funding=card`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
            document.body.appendChild(script);
        });
    };

    try {
        // Show loading state
        createAlert('loading', 'Preparing credit card payment...');

        // Load PayPal SDK
        await loadPayPalScript();

        // Create popup with credit card button container
        createPopup({
            icon: 'fas fa-credit-card',
            title: 'Credit Card Payment',
            content: `
                <div class="max-w-md mx-auto">
                    <div class="bg-gray-100 rounded-lg p-6 mb-4">
                        <div class="text-center text-gray-800 mb-4">
                            Please complete your payment with your credit card
                        </div>
                        <div id="card-button-container" class="min-h-[150px]"></div>
                    </div>
                    
                    <div class="flex items-center justify-center text-sm text-gray-400">
                        <i class="fas fa-lock mr-2"></i>
                        <span>Secure payment processed by PayPal</span>
                    </div>
                </div>
            `,
        });

        // Render Credit Card buttons
        paypal.Buttons({
            fundingSource: paypal.FUNDING.CARD,
            style: {
                layout: 'vertical',
                color: 'black',
                shape: 'rect',
                label: 'pay'
            },
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: appdata.billing.priceFinalVAT
                        },
                        custom_id: appdata.billing.id
                    }],
                    application_context: {
                        shipping_preference: 'NO_SHIPPING'
                    }
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then(function(orderData) {
                    console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
                    // Unify success flow with external checkout: navigate to /premium?billing=success
                    closePopup();
                    if (typeof loadUrl === 'function') {
                        loadUrl('/premium?billing=success');
                    } else {
                        window.location.href = '/premium?billing=success';
                    }
                });
            },
            onError: (err) => {
                console.error('Credit Card Error:', err);
                createAlert('error', 'Payment failed. Please try again.');
            }
        }).render('#card-button-container');

    } catch (error) {
        console.error('Credit Card setup error:', error);
        createAlert('error', 'Failed to initialize credit card payment. Please try again later.');
    }
}

async function handleStripeCreditCardPayment() {
    try {
        if (!appdata?.billing?.id) {
            createAlert('error', 'Missing invoice id. Please restart the checkout flow.');
            return;
        }

        // Show loading state
        createAlert('loading', 'Redirecting to secure credit card checkout...');

        const response = await fetch(`https://${appdata.apiServer}.gofile.io/createPaymentStripe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                invoiceId: appdata.billing.id
            })
        });

        const data = await response.json();

        if (data.status !== 'ok' || !data.paymentUrl) {
            console.error('createPaymentStripe failed', data);
            createAlert('error', 'Failed to initialize credit card payment. Please try again later.');
            return;
        }

        // Stripe-hosted checkout. It will redirect back to /premium?billing=success on success.
        window.location.href = data.paymentUrl;
    } catch (error) {
        console.error('Stripe credit card setup error:', error);
        createAlert('error', 'Failed to initialize credit card payment. Please try again later.');
    }
}

// Credit card entrypoint from the Premium payment modal.
// - Existing customers (already have a completed invoice): Stripe
// - New customers: PayPal (card funding)
async function handleCreditCardPayment() {
    try {
        if (!appdata?.billing?.id) {
            createAlert('error', 'Missing invoice id. Please restart the checkout flow.');
            return;
        }

        const account = await getAccountActive();
        const token = account?.token;
        const accountId = account?.id;

        let hasCompletedInvoice = false;

        // Default is PayPal card for safety (only use Stripe if we can prove user is returning).
        if (token && accountId) {
            try {
                const resp = await fetch(`https://${appdata.apiServer}.gofile.io/accounts/${accountId}/invoices?status=completed&limit=1&offset=0`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const json = await resp.json();
                if (resp.ok && json?.status === 'ok' && Array.isArray(json?.data?.invoices) && json.data.invoices.length > 0) {
                    hasCompletedInvoice = true;
                }
            } catch (e) {
                console.warn('Could not check invoice history, defaulting to PayPal card.', e);
            }
        }

        if (hasCompletedInvoice) {
            return handleStripeCreditCardPayment();
        }

        return handlePayPalCardPayment();
    } catch (error) {
        console.error('handleCreditCardPayment error:', error);
        // Conservative fallback
        return handlePayPalCardPayment();
    }
}
async function handleCryptoPayment() {
    try {
        // Show loading state
        createAlert('loading', 'Preparing cryptocurrency payment...');

        // Call the BTCPay API endpoint
        const response = await fetch(`https://${appdata.apiServer}.gofile.io/createPaymentBtcpay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                invoiceId: appdata.billing.id
            })
        });

        const data = await response.json();

        // Check for valid response
        if (data.status !== "ok" || !data.data.checkoutLink) {
            createAlert('error', 'Failed to create cryptocurrency payment. Please try again.');
            return;
        }

        // Create popup with crypto payment information
        createPopup({
            icon: 'fab fa-bitcoin',
            title: 'Cryptocurrency Payment',
            content: `
                <div class="max-w-md mx-auto">
                    <div class="bg-gray-700 bg-opacity-50 rounded-lg p-6 mb-4">
                        <div class="text-center text-gray-300 mb-6">
                            Click the button below to complete your payment with cryptocurrency
                        </div>
                        
                        <button onclick="window.open('${data.data.checkoutLink}', '_blank'); showCryptoFollowUpPopup();" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                            <i class="fas fa-external-link-alt mr-2"></i>
                            Open Payment Page
                        </button>
                    </div>
                    
                    <div class="flex items-center justify-center text-sm text-gray-400">
                        <i class="fas fa-lock mr-2"></i>
                        <span>Secure payment processed by BTCPay</span>
                    </div>
                </div>
            `
        });

    } catch (error) {
        console.error('Crypto payment setup error:', error);
        createAlert('error', 'Failed to initialize cryptocurrency payment. Please try again later.');
    }
}
function showCryptoFollowUpPopup() {
    createPopup({
        icon: 'fas fa-info-circle',
        title: 'Complete Your Payment',
        content: `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-700 bg-opacity-50 rounded-lg p-6">
                    <div class="text-gray-300 space-y-4">
                        <p>
                            Please complete your payment on the page that just opened in a new tab.
                        </p>
                        <p>
                            Once your cryptocurrency payment is confirmed, you will receive a confirmation email.
                        </p>
                        <p>
                            You can safely close this page while waiting for confirmation.
                        </p>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-center">
                    <button onclick="closePopup()" 
                            class="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Got it
                    </button>
                </div>
            </div>
        `
    });
}
// Unified billing success flow:
// Any checkout provider can redirect the user to:
//   /premium?billing=success
// The app shows the success popup once and then removes the query param.
function handleBillingSuccessFromUrl() {
    try {
        // Only trigger on /premium to avoid showing this anywhere else.
        if (window.location.pathname !== '/premium') return;

        const url = new URL(window.location.href);
        if (url.searchParams.get('billing') !== 'success') return;

        // Remove the trigger param immediately to avoid re-triggering on refresh/back.
        url.searchParams.delete('billing');
        window.history.replaceState({}, '', url);

        showPaymentSuccessPopup();
    } catch (e) {
        console.error('handleBillingSuccessFromUrl error', e);
    }
}

// Expose globally so the router can call it on navigation.
window.handleBillingSuccessFromUrl = handleBillingSuccessFromUrl;

function showPaymentSuccessPopup() {
    const goHome = () => {
        // SPA navigation to keep it seamless.
        if (typeof loadUrl === 'function') {
            loadUrl('/');
        } else {
            window.location.href = '/';
        }
    };

    createPopup({
        icon: 'fas fa-check-circle text-green-400',
        title: 'Payment Successful',
        onClose: goHome,
        content: `
            <div class="max-w-md mx-auto text-center">
                <div class="mb-6">
                    <i class="fas fa-check-circle text-green-400 text-5xl"></i>
                </div>

                <div class="bg-gray-700 bg-opacity-50 rounded-lg p-6 mb-6">
                    <div class="space-y-4 text-gray-300">
                        <h3 class="text-xl font-semibold text-white mb-2">Thank you!</h3>
                        <p>Your payment was completed successfully.</p>
                        <p>
                            Your account should be upgraded to Premium within a few minutes.
                            Please check your emails for confirmation.
                        </p>
                        <p>
                            If you don’t see Premium after a few minutes, please contact our support team.
                        </p>
                    </div>
                </div>

                <a href="/" class="closePopup block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Go back to Gofile
                </a>

                <a href="/contact" class="closePopup block w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Contact support
                </a>
            </div>
        `
    });
}
