export function extractAttachments(messageData, token, messageId) {
    const attachments = messageData.payload.parts ? 
                         messageData.payload.parts.filter(part => part.filename && part.body && part.body.attachmentId) 
                         : [];

    return Promise.all(
        attachments.map(attachment => {
            const attachmentId = attachment.body.attachmentId;
            const filename = attachment.filename;

            return fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`, {
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
                
                // Base64 URL-safe 데이터를 일반 Base64로 변환
                const base64Content = attachmentContent.replace(/-/g, '+').replace(/_/g, '/');

                // Base64 데이터를 Blob으로 변환
                const byteCharacters = atob(base64Content);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/octet-stream' });

                return { blob, filename };
            })
            .catch(error => {
                console.error('Error fetching attachment:', error);
                return null;
            });
        })
    ).then(results => results.filter(result => result !== null));
}
