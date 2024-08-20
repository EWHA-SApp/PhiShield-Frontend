import { processLatestEmail, analyzeAndStoreEmail } from './emailProcessor.js';

document.addEventListener('DOMContentLoaded', () => {
    // '분석하기' 버튼 클릭 이벤트
    document.getElementById('check').addEventListener('click', async () => {
        console.log('클릭함');

        // 상태 텍스트 요소 참조
        const statusElement = document.querySelector('.status-text');
        statusElement.textContent = '토큰을 얻고 있습니다...';

        try {
            const token = await new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ interactive: true }, function(token) {
                    if (chrome.runtime.lastError || !token) {
                        reject('Error getting auth token: ' + chrome.runtime.lastError.message);
                    } else {
                        resolve(token);
                    }
                });
            });

            console.log('Auth token received:', token);
            statusElement.textContent = '이메일을 분석 중입니다...';

            const messageData = await processLatestEmail(token);
            if (messageData) {
                const analysisResult = await analyzeAndStoreEmail(messageData, token);

                if (analysisResult) {
                    const { subject, from, is_phishing, report } = analysisResult;

                    statusElement.textContent = `New message from ${from}: "${subject}"`;

                    let phishingStatus = is_phishing ? "Warning: This email is phishing!" : "This email is safe.";

                    const resultBox = document.createElement('div');
                    resultBox.id = 'resultBox';
                    resultBox.style.padding = '10px';
                    resultBox.style.marginTop = '10px';
                    resultBox.style.border = '1px solid #ccc';
                    resultBox.style.backgroundColor = is_phishing ? '#ffcccc' : '#ccffcc';
                    resultBox.textContent = phishingStatus;
                    document.body.appendChild(resultBox);

                    const viewReportButton = document.createElement('button');
                    viewReportButton.textContent = 'View Report';
                    viewReportButton.id = 'viewReport';
                    viewReportButton.className = 'button';
                    document.body.appendChild(viewReportButton);

                    viewReportButton.addEventListener('click', () => {
                        chrome.storage.local.set({ reportData: report }, () => {
                            console.log('Report data saved to chrome.storage.local');

                            window.open('report.html', '_blank', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
                        });
                    });

                    document.getElementById('check').style.display = 'none';
                } else {
                    statusElement.textContent = 'Error analyzing email.';
                }
            } else {
                statusElement.textContent = 'No unread messages found.';
            }

        } catch (error) {
            console.error('Error:', error);
            statusElement.textContent = 'Error processing messages.';
        }
    });

    // '지난 분석 기록 보기' 버튼 클릭 이벤트
    document.getElementById('historyButton').addEventListener('click', function() {
        window.open('pastReport.html', 'PastReport', 'width=800,height=600');
    });
});
