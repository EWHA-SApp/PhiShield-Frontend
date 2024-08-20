document.addEventListener('DOMContentLoaded', () => {
    console.log('보고서 시작');

    // reportData와 selectedReport를 둘 다 가져옵니다.
    chrome.storage.local.get('reportData', (result) => {
        // reportData가 있으면 새로운 메일 분석 결과를 사용하고,
        // selectedReport가 있으면 과거의 레포트를 사용합니다.
        const report = result.reportData || result.selectedReport;

        if (report) {
            const reportContainer = document.createElement('div');
            reportContainer.className = 'report-container';

            // 보고서 섹션을 생성
            for (const [key, value] of Object.entries(report)) {
                const section = document.createElement('div');
                section.className = 'report-section';

                const title = document.createElement('h3');
                title.className = 'report-title';
                title.textContent = formatTitle(key);

                const content = document.createElement('p');
                content.className = 'report-content';
                content.textContent = Array.isArray(value) ? value.join('\n') : value;

                section.appendChild(title);
                section.appendChild(content);
                reportContainer.appendChild(section);
            }

            // 생성된 보고서를 HTML에 추가
            document.getElementById('report-container').appendChild(reportContainer);
        } else {
            document.getElementById('report-container').textContent = 'No report data found.';
        }
    });
});

// 키를 읽기 쉬운 제목으로 변환하는 함수
function formatTitle(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
