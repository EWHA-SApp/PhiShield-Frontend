document.addEventListener('DOMContentLoaded', () => {
    // 메일 데이터를 불러오는 함수 호출
    chrome.storage.local.get(['emailList'], function(result) {
        const emailList = result.emailList || [];
        const reportsList = document.getElementById('reports-list');

        if (emailList.length > 0) {
            // emailList 배열에 있는 각 메일 데이터를 순회하며 표시
            emailList.forEach((emailData, index) => {
                const reportTitle = emailData.subject || 'No Title';
                const reportDate = emailData.from || 'Unknown Sender';
                const reportContent = emailData.isPhishing ? 'Phishing Detected' : 'Safe Email';

                const reportContainer = document.createElement('div');
                reportContainer.className = 'report-container';

                const reportSection = `
                    <div class="report-title">${reportTitle}</div>
                    <div class="report-date">${reportDate}</div>
                    <div class="report-content">${reportContent}</div>
                `;

                reportContainer.innerHTML = reportSection;
                reportsList.appendChild(reportContainer);

                // 클릭 이벤트 추가
                reportContainer.addEventListener('click', () => {
                    // 선택한 메일 데이터를 chrome.storage.local에 저장
                    chrome.storage.local.set({ reportData: emailData.report }, () => {
                        console.log(`Selected report ${index + 1} data saved.`);
                        // report.html 페이지로 이동
                        window.open('report.html', '_blank', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
                    });
                });
            });
        } else {
            reportsList.textContent = 'No reports found.';
        }
    });
});
