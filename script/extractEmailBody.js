/**
 * Extracts the email body from the given message data.
 * @param {Object} messageData - The message data object from Gmail API.
 * @returns {Object} An object containing the extracted text content and HTML content.
 */
export function extractEmailBody(messageData) {
    let textContent = '';
    let htmlContent = '';

    function getPartData(part) {
        if (part.body && part.body.data) {
            let partData = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            
            if (part.mimeType === 'text/html') {
                htmlContent += partData;
            } else if (part.mimeType === 'text/plain') {
                textContent += partData;
            }
        }
    }

    if (messageData.payload.parts) {
        for (let part of messageData.payload.parts) {
            if (part.mimeType === 'multipart/alternative') {
                for (let subPart of part.parts) {
                    if (subPart.mimeType === 'text/plain' || subPart.mimeType === 'text/html') {
                        getPartData(subPart);
                    }
                }
            } else if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                getPartData(part);
            }
        }
    } else if (messageData.payload.body && messageData.payload.body.data) {
        const singlePartData = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        if (messageData.payload.mimeType === 'text/html') {
            htmlContent = singlePartData;
        } else {
            textContent = singlePartData;
        }
    }

    return {
        textContent: decodeURIComponent(escape(textContent)),
        htmlContent: decodeURIComponent(escape(htmlContent))
    };
}
