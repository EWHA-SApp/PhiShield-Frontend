document.getElementById('check').addEventListener('click', () => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError || !token) {
            document.getElementById('status').textContent = 'Error getting token.';
            return;
        }

        // Step 1: Get the latest unread message
        fetch('https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=1&q=is:unread', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }).then(response => response.json()).then(data => {
            if (data.messages && data.messages.length > 0) {
                const messageId = data.messages[0].id;

                // Step 2: Get the message details
                fetch('https://www.googleapis.com/gmail/v1/users/me/messages/' + messageId, {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                }).then(response => response.json()).then(async messageData => {
                    const headers = messageData.payload.headers;
                    const subjectHeader = headers.find(header => header.name === 'Subject');
                    const fromHeader = headers.find(header => header.name === 'From');

                    const subject = subjectHeader ? subjectHeader.value : 'No Subject';
                    const from = fromHeader ? fromHeader.value : 'Unknown Sender';

                    // Step 3: Display sender and subject
                    document.getElementById('status').textContent = `New message from ${from}: "${subject}"`;

                    // Hide "Check Now" button
                    document.getElementById('check').style.display = 'none';

                    // Step 4: Get the phishing result from chrome.storage
                    chrome.storage.local.get(['phishingResult'], function(data) {
                        let phishingStatus = data.phishingResult ? "Warning: This email is phishing!" : "This email is safe.";

                        // Step 5: Display phishing result
                        const resultBox = document.createElement('div');
                        resultBox.id = 'resultBox';
                        resultBox.style.padding = '10px';
                        resultBox.style.marginTop = '10px';
                        resultBox.style.border = '1px solid #ccc';
                        resultBox.style.backgroundColor = data.phishingResult ? '#ffcccc' : '#ccffcc';
                        resultBox.textContent = phishingStatus;

                        document.body.appendChild(resultBox);
                    });

                });
            } else {
                document.getElementById('status').textContent = 'No new messages.';
            }
        });
    });
});
