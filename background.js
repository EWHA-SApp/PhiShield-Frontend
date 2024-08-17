console.log("시작");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Gmail Notifier installed.");
});

chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError || !token) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
        return;
    }

    console.log('Auth token received:', token);

    fetch('https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=1&q=is:unread', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.messages && data.messages.length > 0) {
            const messageId = data.messages[0].id;
            console.log('Message ID:', messageId);

            fetch('https://www.googleapis.com/gmail/v1/users/me/messages/' + messageId, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(messageData => {
                const headers = messageData.payload.headers;
                const subjectHeader = headers.find(header => header.name === 'Subject');
                const fromHeader = headers.find(header => header.name === 'From');

                const subject = subjectHeader ? subjectHeader.value : 'No Subject';
                const from = fromHeader ? fromHeader.value : 'Unknown Sender';

                console.log("===================추출 시작===========================");

                let body = '';
                if (messageData.payload.parts) {
                    // 여러 파트로 이루어진 경우
                    for (let part of messageData.payload.parts) {
                         // MIME 타입 확인
                        console.log("Part MIME Type:", part.mimeType);
                        if (part.mimeType === 'multipart/alternative') {
                            // multipart/alternative 안의 파트 처리
                            for (let subPart of part.parts) {
                                if (subPart.mimeType === 'text/plain' || subPart.mimeType === 'text/html') {
                                    console.log("Processing Sub-Part:", subPart.mimeType);
                                    if (subPart.body && subPart.body.data) {
                                        let partData = atob(subPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                                        if (subPart.mimeType === 'text/html') {
                                            // HTML을 텍스트로 변환 (정규 표현식 사용)
                                            partData = partData.replace(/<[^>]+>/g, ''); // HTML 태그 제거
                                        }
                                        body += partData;
                                    }
                                }
                            }
                        } else if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                            // 단일 MIME 타입 파트 처리
                            console.log("Processing Part:", part.mimeType);
                            if (part.body && part.body.data) {
                                let partData = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                                if (part.mimeType === 'text/html') {
                                    // HTML을 텍스트로 변환 (정규 표현식 사용)
                                    partData = partData.replace(/<[^>]+>/g, ''); // HTML 태그 제거
                                }
                                body += partData;
                            }
                        }
                    }
                } else if (messageData.payload.body && messageData.payload.body.data) {
                    // 단일 파트로 이루어진 경우
                    body = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                }

                // Base64 디코딩 후 UTF-8로 변환
                body = decodeURIComponent(escape(body));

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

                // 첨부파일 추출
                console.log("===================첨부파일 추출===========================");
                const attachments = messageData.payload.parts ? 
                                     messageData.payload.parts.filter(part => part.filename && part.body && part.body.attachmentId) 
                                     : [];

                 if (attachments.length > 0) {
                     attachments.forEach(attachment => {
                         const attachmentId = attachment.body.attachmentId;
                         const filename = attachment.filename;

                         fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`, {
                             headers: {
                                 'Authorization': 'Bearer ' + token
                             }
                         })
                         .then(response => {
                             if (!response.ok) {
                                 throw new Error('Network response was not ok');
                             }
                             return response.json();
                         })
                         .then(attachmentData => {
                             const attachmentContent = attachmentData.data;
                             const base64Content = attachmentContent.replace(/-/g, '+').replace(/_/g, '/');

                             // 다운로드 링크 생성
                             const downloadUrl = `data:application/octet-stream;base64,${base64Content}`;

                             // 크롬 다운로드 API로 다운로드
                             chrome.downloads.download({
                                 url: downloadUrl,
                                 filename: filename,
                                 conflictAction: 'uniquify' // 동일한 이름의 파일이 있을 경우 이름 변경
                             }, function(downloadId) {
                                if (chrome.runtime.lastError) {
                                    console.error('Error downloading file:', chrome.runtime.lastError);
                                } else {
                                    console.log('Downloaded file with ID:', downloadId);
                                    console.log(`Attachment [${filename}] has been downloaded.`);
                                }
                             });
                         })
                         .catch(error => {
                             console.error('Error fetching attachment:', error);
                         });
                     });
                 } else {
                     console.log('No attachments found.');
                 }
                 
                
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
                console.error('Error fetching message details:', error);
            });
        } else {
            console.log('No unread messages found.');
        }
    })
    .catch(error => {
        console.error('Error fetching messages:', error);
    });
});
