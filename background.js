import { extractEmailBody } from './script/extractEmailBody.js';
import { extractAttachments } from './script/extractAttachments.js';
import { getUnreadMessages, getMessageDetails } from './script/gmailApi.js';
import { sendEmailDataToBackend } from './script/backendUtils.js'; // 새로 추가된 모듈

console.log("===================PhiShield 시작===========================");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Gmail Notifier installed.");
});

chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError || !token) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
        return;
    }

    console.log('Auth token received:', token);

    getUnreadMessages(token)
    .then(data => {
        if (data.messages && data.messages.length > 0) {
            const messageId = data.messages[0].id;
            console.log('Message ID:', messageId);

            return getMessageDetails(token, messageId);
        } else {
            console.log('No unread messages found.');
            throw new Error('No unread messages found.');
        }
    })
    .then(messageData => {
        const headers = messageData.payload.headers;
        const subjectHeader = headers.find(header => header.name === 'Subject');
        const fromHeader = headers.find(header => header.name === 'From');

        const subject = subjectHeader ? subjectHeader.value : 'No Subject';
        const from = fromHeader ? fromHeader.value : 'Unknown Sender';

        console.log("===================추출 시작===========================");

        // Use the imported function to extract the email body
        const body = extractEmailBody(messageData);

        // 이메일 본문에서 URL 추출
        console.log("===================URL 추출===========================");
        const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
        const urls = body.match(urlRegex) || [];
        console.log("Extracted URLs:", urls);

        // 이메일 본문에서 단어 추출
        console.log("===================텍스트(단어) 추출===========================");
        const textContent = body.replace(/<[^>]+>/g, ''); // HTML 태그를 제거하여 일반 텍스트로 변환
        const words = textContent.split(/\s+/).filter(Boolean); // 단어 단위로 분리하고 빈 문자열 제거
        console.log("Extracted Words:", words);

        // 첨부파일 추출 및 다운로드
        console.log("===================첨부파일 추출===========================");
        extractAttachments(messageData, token, messageData.id);

        // 백엔드로 데이터 전송
        console.log("===================API로 데이터 전송===========================");
        sendEmailDataToBackend(subject, from, textContent);

        // 아이콘 생성  
        chrome.notifications.create('', {
            title: from,
            message: subject,
            iconUrl: 'images/icon/icon-128.png',
            type: 'basic'
        });
        
        // 콘솔에 전체 데이터 출력
        console.log("Email From: ", from);
        console.log("Email Subject: ", subject);
        console.log("Email Body: ", body);
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
