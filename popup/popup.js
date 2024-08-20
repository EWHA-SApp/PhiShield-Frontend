import { extractEmailBody } from './extractEmailBody.js';
import { extractAttachments } from './extractAttachments.js';
import { getUnreadMessages, getMessageDetails } from './gmailApi.js';
import { sendEmailDataToBackend } from './backendUtils.js';
import { saveMailData } from './mailList.js';

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
            const data = await getUnreadMessages(token);
            if (data.messages && data.messages.length > 0) {
                const messageResults = [];

                for (let message of data.messages) {
                    const messageId = message.id;
                    console.log('Message ID:', messageId);

                    const messageData = await getMessageDetails(token, messageId);

                    const headers = messageData.payload.headers;
                    const subjectHeader = headers.find(header => header.name === 'Subject');
                    const fromHeader = headers.find(header => header.name === 'From');

                    const subject = subjectHeader ? subjectHeader.value : 'No Subject';
                    let from = fromHeader ? fromHeader.value : 'Unknown Sender';

                    const emailRegex = /<([^>]+)>/;
                    const emailMatch = from.match(emailRegex);
                    if (emailMatch) {
                        from = emailMatch[1];
                    } else {
                        const simpleEmailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
                        const simpleEmailMatch = from.match(simpleEmailRegex);
                        if (simpleEmailMatch) {
                            from = simpleEmailMatch[1];
                        }
                    }

                    const { textContent, htmlContent } = extractEmailBody(messageData);

                    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
                    const urls = textContent.match(urlRegex) || [];
                    console.log("Extracted URLs:", urls);

                    const words = textContent.split(/\s+/).filter(Boolean);
                    console.log("Extracted Words:", words);

                    const attachments = await extractAttachments(messageData, token, messageData.id);

                    if (attachments.length > 0) {
                        const attachmentNames = attachments.map(att => att.filename);
                        console.log("Extracted Attachments:", attachmentNames);
                    } else {
                        console.log("No attachments found.");
                    }

                    try {
                        const result = await sendEmailDataToBackend(subject, from, textContent, htmlContent, attachments);

                        if (result !== undefined && result !== null) {
                            saveMailData(subject, from, result.is_phishing);
                        } else {
                            console.error('Result is undefined or null, skipping save operation.');
                        }

                        // 피싱 결과를 chrome.storage에 저장
                        chrome.storage.local.set({ phishingResult: result.is_phishing }, function() {
                            console.log('Phishing result saved in chrome.storage.');
                        });

                    } catch (error) {
                        console.error('Error handling API response:', error);
                    }
                }

                // Step 4: Get the phishing result from chrome.storage
                chrome.storage.local.get(['phishingResult'], function(data) {
                    let phishingStatus = data.phishingResult ? "Warning: This email is phishing!" : "This email is safe.";

                    const resultBox = document.createElement('div');
                    resultBox.id = 'resultBox';
                    resultBox.style.padding = '10px';
                    resultBox.style.marginTop = '10px';
                    resultBox.style.border = '1px solid #ccc';
                    resultBox.style.backgroundColor = data.phishingResult ? '#ffcccc' : '#ccffcc';
                    resultBox.textContent = phishingStatus;

                    document.body.appendChild(resultBox);

                    // Hide "Check Now" button
                    document.getElementById('check').style.display = 'none';
                });

            } else {
                document.getElementById('status').textContent = 'No unread messages found.';
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('status').textContent = 'Error processing messages.';
        }
    });
});
