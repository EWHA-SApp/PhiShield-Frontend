/**
 * Extracts the email body from the given message data.
 * @param {Object} messageData - The message data object from Gmail API.
 * @returns {string} The extracted email body.
 */
function extractEmailBody(messageData) {
    let body = '';

    function getPartData(part) {
        if (part.body && part.body.data) {
            // Decode base64 encoded data
            let partData = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            
            // If it's HTML, we might want to convert it to plain text
            if (part.mimeType === 'text/html') {
                partData = partData.replace(/<[^>]+>/g, ''); // Remove HTML tags
            }
            return partData;
        }
        return '';
    }

    if (messageData.payload.parts) {
        // If the email is multipart, we need to handle different parts
        for (let part of messageData.payload.parts) {
            if (part.mimeType === 'multipart/alternative') {
                // Process multipart/alternative parts
                for (let subPart of part.parts) {
                    if (subPart.mimeType === 'text/plain' || subPart.mimeType === 'text/html') {
                        body += getPartData(subPart);
                    }
                }
            } else if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                // Process text/plain or text/html parts directly
                body += getPartData(part);
            }
        }
    } else if (messageData.payload.body && messageData.payload.body.data) {
        // Single part email
        body = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    // Decode base64 encoded body
    return decodeURIComponent(escape(body));
}

// Export the function
export { extractEmailBody };
