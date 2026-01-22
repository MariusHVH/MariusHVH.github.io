async function initContactPage() {
    var account = await getAccountActive();
    document.querySelector('input[type="email"]').value = account.email;
}
function showAbuseReportPopup() {
    createPopup({
        icon: 'fas fa-flag',
        title: 'Report Content',
        content: `
            <div class="space-y-6">
                <!-- Info message -->
                <div class="bg-blue-500 bg-opacity-10 border border-blue-500/30 rounded-lg p-4">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-400 mt-1 mr-3"></i>
                        <p class="text-gray-300 text-sm">
                            Help us maintain a safe environment by reporting inappropriate content. Your report will be reviewed by our team.
                        </p>
                    </div>
                </div>

                <!-- Report Form -->
                <form id="popup_abuseForm" class="space-y-4">
                        <div class="space-y-2">
                            <label for="popup_abuse_type" class="block text-sm font-medium text-gray-300">
                                Reason for Report
                            </label>
                            <select 
                                id="popup_abuse_type" 
                                name="type" 
                                required 
                                class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                                    text-white"
                            >
                                <option value="">Select a reason...</option>
                                <option value="copyright">Copyright Infringement</option>
                                <option value="child_abuse">Child Abuse</option>
                                <option value="terrorism">Terrorism</option>
                                <option value="malware_phishing">Malware / Phishing</option>
                                <option value="harassment">Harassment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label for="popup_abuse_email" class="block text-sm font-medium text-gray-300">
                                Your Email
                            </label>
                            <input 
                                type="email" 
                                id="popup_abuse_email" 
                                name="email" 
                                placeholder="your.email@example.com" 
                                required 
                                class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                                    text-white placeholder-gray-400"
                            >
                        </div>

                        <div class="space-y-2">
                            <label for="popup_abuse_description" class="block text-sm font-medium text-gray-300">
                                Description
                            </label>
                            <textarea 
                                id="popup_abuse_description" 
                                name="description" 
                                rows="4" 
                                required 
                                placeholder="Please provide details about your report..."
                                class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                                    text-white placeholder-gray-400"
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            id="popup_abuse_submit"
                            class="w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                                transition duration-300 ease-in-out text-white font-medium
                                flex items-center justify-center space-x-2"
                        >
                            <i class="fas fa-paper-plane"></i>
                            <span>Submit Report</span>
                        </button>
                    </form>

                <p class="text-gray-400 text-xs text-center">
                    Your report will be handled confidentially
                </p>
            </div>
        `
    });
}
