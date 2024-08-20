import { processLatestEmail, analyzeAndStoreEmail } from './emailProcessor.js';

document.getElementById('check').addEventListener('click', () => {
    console.log('클릭함');
    chrome.identity.getAuthToken({ interactive: true }, async function(token) {
        if (chrome.runtime.lastError || !token) {
            console.error('Error getting auth token:', chrome.runtime.lastError);
            document.getElementById('status').textContent = 'Error getting token: ' + chrome.runtime.lastError.message;
            return;
        }
        console.log('Auth token received:', token);

        try {
            const messageData = await processLatestEmail(token);
            if (messageData) {
                const analysisResult = await analyzeAndStoreEmail(messageData, token);

                if (analysisResult) {
                    const { subject, from, is_phishing } = analysisResult;

                    // Step 3: Display sender and subject in the popup UI
                    document.getElementById('status').textContent = `New message from ${from}: "${subject}"`;

                    // Step 4: Display phishing result
                    let phishingStatus = is_phishing ? "Warning: This email is phishing!" : "This email is safe.";

                    const resultBox = document.createElement('div');
                    resultBox.id = 'resultBox';
                    resultBox.style.padding = '10px';
                    resultBox.style.marginTop = '10px';
                    resultBox.style.border = '1px solid #ccc';
                    resultBox.style.backgroundColor = is_phishing ? '#ffcccc' : '#ccffcc';
                    resultBox.textContent = phishingStatus;

                    document.body.appendChild(resultBox);

                    // Hide "Check Now" button
                    document.getElementById('check').style.display = 'none';
                } else {
                    document.getElementById('status').textContent = 'Error analyzing email.';
                }
            } else {
                document.getElementById('status').textContent = 'No unread messages found.';
            }

        } catch (error) {
            console.error('Error:', error);
            document.getElementById('status').textContent = 'Error processing messages.';
        }
    });
});
