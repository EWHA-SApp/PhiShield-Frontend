import { extractEmailBody } from './script/extractEmailBody.js';
import { extractAttachments } from './script/extractAttachments.js';
import { getUnreadMessages, getMessageDetails } from './script/gmailApi.js';
import { sendEmailDataToBackend } from './script/backendUtils.js';

console.log("===================PhiShield 시작===========================");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Gmail Notifier installed.");
});

chrome.identity.getAuthToken({ interactive: true }, async function(token) { // async 추가
    if (chrome.runtime.lastError || !token) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
        return;
    }

    console.log('Auth token received:', token);

    try {
        const data = await getUnreadMessages(token); // await 사용
        if (data.messages && data.messages.length > 0) {
            const messageId = data.messages[0].id;
            console.log('Message ID:', messageId);

            const messageData = await getMessageDetails(token, messageId); // await 사용

            const headers = messageData.payload.headers;
            const subjectHeader = headers.find(header => header.name === 'Subject');
            const fromHeader = headers.find(header => header.name === 'From');

            const subject = subjectHeader ? subjectHeader.value : 'No Subject';
            let from = fromHeader ? fromHeader.value : 'Unknown Sender';

            // 이메일 주소만 추출
            const emailRegex = /<([^>]+)>/;
            const emailMatch = from.match(emailRegex);
            if (emailMatch) {
                from = emailMatch[1];
            } else {
                // 이메일 주소가 < > 없이 나오는 경우를 대비하여, 이메일 형식만 찾음
                const simpleEmailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
                const simpleEmailMatch = from.match(simpleEmailRegex);
                if (simpleEmailMatch) {
                    from = simpleEmailMatch[1];
                }
            }

            console.log("===================추출 시작===========================");

            // Use the imported function to extract the email body
            const { textContent, htmlContent } = extractEmailBody(messageData);

            // 이메일 본문에서 URL 추출
            console.log("===================URL 추출===========================");
            const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
            const urls = textContent.match(urlRegex) || [];
            console.log("Extracted URLs:", urls);

            // 이메일 본문에서 단어 추출
            console.log("===================텍스트(단어) 추출===========================");
            const words = textContent.split(/\s+/).filter(Boolean); // 단어 단위로 분리하고 빈 문자열 제거
            console.log("Extracted Words:", words);

            // 첨부파일 추출
            console.log("===================첨부파일 추출===========================");
            const attachments = await extractAttachments(messageData, token, messageData.id); // await 사용

            // 첨부파일 이름들을 콘솔에 출력
            if (attachments.length > 0) {
                const attachmentNames = attachments.map(att => att.filename);
                console.log("Extracted Attachments:", attachmentNames);
            } else {
                console.log("No attachments found.");
            }

            // 백엔드로 데이터 전송
            try {
                console.log("===================백엔드 전송===========================");
                const result = await sendEmailDataToBackend(subject, from, textContent, htmlContent, attachments); // 여기서 result에 값이 저장됨 
        
            } catch (error) {
                console.error('Error handling API response:', error);
            }

            // 콘솔에 전체 데이터 출력
            console.log("Email From: ", from);
            console.log("Email Subject: ", subject);
            console.log("Email Body: ", textContent);
            console.log("Email HTML Content: ", htmlContent);

            // 아이콘 생성  
            chrome.notifications.create('', {
                title: from,
                message: subject,
                iconUrl: 'images/icon/icon-128.png',
                type: 'basic'
            });

        } else {
            console.log('No unread messages found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
