// extractAttachments.js

export function extractAttachments(messageData, token, messageId) {
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
}
