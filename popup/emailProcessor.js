import { extractEmailBody } from './extractEmailBody.js';
import { extractAttachments } from './extractAttachments.js';
import { getMessageDetails } from './gmailApi.js';
import { sendEmailDataToBackend } from './backendUtils.js';
import { saveMailData } from './mailList.js';

// 분석된 메일 ID를 저장할 Set
let analyzedMessageIds = new Set();

// chrome.storage.local에서 분석된 메일 ID 불러오기
chrome.storage.local.get(['analyzedMessageIds'], (result) => {
    if (result.analyzedMessageIds) {
        analyzedMessageIds = new Set(result.analyzedMessageIds);
    }
});

export async function processLatestEmail(token) {
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=1&q=is:unread', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    const data = await response.json();
    if (data.messages && data.messages.length > 0) {
        const messageId = data.messages[0].id;

        // 중복된 메일인지 확인
        if (analyzedMessageIds.has(messageId)) {
            console.log('Message already analyzed. Skipping...');
            return null;
        }

        // Step 2: Get the message details
        const messageResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/' + messageId, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const messageData = await messageResponse.json();
        analyzedMessageIds.add(messageId);  // 메일 ID를 Set에 저장
        saveAnalyzedMessageIds();  // chrome.storage.local에 저장
        return messageData;
    } else {
        console.log('No unread messages found.');
        return null;
    }
}

export async function analyzeAndStoreEmail(messageData, token) {
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
            saveMailData(subject, from, result.is_phishing, result.report);
            return { subject, from, is_phishing: result.is_phishing, report: result.report};
        } else {
            console.error('Result is undefined or null, skipping save operation.');
            return null;
        }

    } catch (error) {
        console.error('Error handling API response:', error);
        return null;
    }
}

// 분석된 메일 ID를 chrome.storage.local에 저장하는 함수
function saveAnalyzedMessageIds() {
    chrome.storage.local.set({ analyzedMessageIds: Array.from(analyzedMessageIds) }, () => {
        console.log('Analyzed message IDs saved to chrome.storage.local.');
    });
}
