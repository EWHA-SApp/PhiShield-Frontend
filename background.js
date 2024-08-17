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

                console.log("추출 시작");

                // 이메일 본문을 추출
                let body = '';
                if (messageData.payload.parts) {
                    // 여러 파트로 이루어진 경우
                    const part = messageData.payload.parts.find(part => part.mimeType === 'text/plain');
                    if (part && part.body && part.body.data) {
                        body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                    }
                } else if (messageData.payload.body && messageData.payload.body.data) {
                    // 단일 파트로 이루어진 경우
                    body = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                }
                
            
                // 이메일 본문에서 URL만 추출
                const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
                const urls = body.match(urlRegex) || [];

                console.log("Extracted URLs:", urls);

                chrome.notifications.create('', {
                    title: from,
                    message: subject,
                    iconUrl: 'images/icon/icon-128.png',
                    type: 'basic'
                });

                console.log("Email From: ", from);
                console.log("Email Subject: ", subject);
                console.log("Email Body: ", body); // 이메일 내용을 콘솔에 출력
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
