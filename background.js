import { extractEmailBody } from './script/extractEmailBody.js';
import { extractAttachments } from './script/extractAttachments.js';
import { getUnreadMessages, getMessageDetails } from './script/gmailApi.js';
import { sendEmailDataToBackend } from './script/backendUtils.js';
import { saveMailData } from './script/mailList.js';

console.log("===================PhiShield 시작===========================");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Gmail Notifier installed.");
});

chrome.identity.getAuthToken({ interactive: true }, async function(token) {
    if (chrome.runtime.lastError || !token) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
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

                console.log("===================추출 시작===========================");

                const { textContent, htmlContent } = extractEmailBody(messageData);

                console.log("===================URL 추출===========================");
                const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
                const urls = textContent.match(urlRegex) || [];
                console.log("Extracted URLs:", urls);

                console.log("===================텍스트(단어) 추출===========================");
                const words = textContent.split(/\s+/).filter(Boolean);
                console.log("Extracted Words:", words);

                console.log("===================첨부파일 추출===========================");
                const attachments = await extractAttachments(messageData, token, messageData.id);

                if (attachments.length > 0) {
                    const attachmentNames = attachments.map(att => att.filename);
                    console.log("Extracted Attachments:", attachmentNames);
                } else {
                    console.log("No attachments found.");
                }

                try {
                    console.log("===================백엔드 전송===========================");
                    const result = await sendEmailDataToBackend(subject, from, textContent, htmlContent, attachments);
                    
                    // result가 존재할 때만 실행
                    if (result !== undefined && result !== null) { 
                        // 저장 기능을 mailList.js 파일로 분리하여 사용
                        saveMailData(subject, from, result.is_phishing);
                    } else {
                        console.error('Result is undefined or null, skipping save operation.');
                    }
    
                } catch (error) {
                    console.error('Error handling API response:', error);
                }
            }
            // 이후 작업: 사용자에게 팝업이나 알림을 통해 여러 메일을 선택하고 결과를 확인할 수 있게 구현
        } else {
            console.log('No unread messages found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
