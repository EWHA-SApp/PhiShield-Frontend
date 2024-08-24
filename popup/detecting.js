import { processLatestEmail, analyzeAndStoreEmail } from './emailProcessor.js';

const style = document.createElement('style');
style.textContent = `
.button-59 {
  align-items: center;
  margin-top: 10px;
  background-color: #fff;
  border: 1px solid #000;
  box-sizing: border-box;
  color: #000;
  display: inline-flex;
  fill: #000;
  font-family: Inter,sans-serif;
  font-size: 16px;
  font-weight: 600;
  height: 40px;
  justify-content: center;
  letter-spacing: -.8px;
  line-height: 24px;
  min-width: 140px;
  outline: 0;
  padding: 0 17px;
  text-align: center;
  text-decoration: none;
}

.button-38 {
          background-color: #FFFFFF;
          border: 0;
          width: 50%
          border-radius: .5rem;
          margin-top:5px;
          box-sizing: border-box;
          color: #111827;
          font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: .875rem;
          font-weight: 600;
          line-height: 1.25rem;
          padding: .75rem 1rem;
          text-align: center;
          text-decoration: none #D1D5DB solid;
          text-decoration-thickness: auto;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }
        
        .button-38:hover {
          background-color: rgb(249,250,251);
        }
        
        .button-38:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }
        
        .button-38:focus-visible {
          box-shadow: none;
        }
`;
document.head.appendChild(style);


document.addEventListener('DOMContentLoaded', () => {
    // '분석하기' 버튼 클릭 이벤트
    document.getElementById('check').addEventListener('click', async () => {
        console.log('클릭함');

        // 상태 텍스트 요소 참조
        const statusElement = document.querySelector('.status-text');
        statusElement.textContent = 'Getting your token···';

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
            statusElement.textContent = 'Analyzing Emails···';

            const messageData = await processLatestEmail(token);
            if (messageData) {
                const analysisResult = await analyzeAndStoreEmail(messageData, token);

                if (analysisResult) {

                    const viewReportButton = document.createElement('button');
                    viewReportButton.textContent = 'View Report';
                    viewReportButton.id = 'viewReport';
                    viewReportButton.className = 'button-38';
                    document.body.appendChild(viewReportButton);

                    const { subject, from, is_phishing, report } = analysisResult;

                    const maxLength = 20;
                    let truncatedSubject = subject.length > maxLength ? subject.slice(0, maxLength) + "..." : subject;

                    statusElement.textContent = `New email \n "${truncatedSubject}" \n from ${from}`;
                    statusElement.style.fontSize = "20px"; // 글자 크기 조정
                    statusElement.style.whiteSpace = "pre-line"; // 줄바꿈 적용
                    

                    let phishingStatus = is_phishing ? "Warning: This email is phishing!" : "This email is safe.";

                    const resultBox = document.createElement('div');
                    resultBox.id = 'resultBox';
                    resultBox.className = 'button-59'; // button-59 스타일 클래스 적용
                    resultBox.textContent = phishingStatus;
                    resultBox.style.backgroundColor = is_phishing ? '#ffcccc' : '#ccffcc';
                    document.body.appendChild(resultBox);


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
                statusElement.textContent = 'No new messages';
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
