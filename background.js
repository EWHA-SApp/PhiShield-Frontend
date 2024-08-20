chrome.runtime.onInstalled.addListener(() => {
    setupGmailWatch();
});

function setupGmailWatch() {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError || !token) {
            console.error('Error obtaining OAuth token:', chrome.runtime.lastError.message || 'Unknown error');
            return;
        }

        fetch('https://www.googleapis.com/gmail/v1/users/me/watch', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                labelIds: ['INBOX'],
                topicName: 'projects/phishield2024/topics/PhiShield'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error setting up watch:', data.error);
            } else {
                console.log('Watch set up successfully:', data);
                chrome.storage.local.set({ lastHistoryId: data.historyId });
            }
        })
        .catch(error => {
            console.error('Error making watch request:', error);
        });
    });
}

function handleNewMail(historyId) {
    chrome.identity.getAuthToken({ interactive: true }, async function(token) {
        try {
            const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('시작');
            const data = await response.json();
            if (data.history && data.history.length > 0) {
                // 최신 메일 감지 후 detect.html로 이동
                console.log('메일 왔다');
                chrome.tabs.create({ url: chrome.runtime.getURL('detect.html') });
            }
        } catch (error) {
            console.error('Error fetching new emails:', error);
        }
    });
}
