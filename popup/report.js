const sectionsOrder = {
    "psender": "Sender",
    "ptitle": "Title",
    "pcontent": "Content",
    "pwhole": "Full Content",
    "chk_bad_urls": "Harmful URLs", 
    "chk_site_similarity": "Site Similarity Check",
    "chk_site_similarity_ngram": "Site Similarity N-gram Check",
    "chk_domain_similarity_ngram": "Domain Similarity N-gram Check",
    "chk_bad_mail": "Harmful Email Check",
    "chk_domain_similarity": "Domain Similarity Check",
    "chk_suspicious_urls": "Suspicious URLs",
    "chk_hidden_text": "Hidden Text",
    "chk_suspicious_links": "Suspicious Links",
    "chk_visual_similarity": "Visual Similarity Check",
    "spam_classification": "Spam Classification",
    "chk_phishing_patterns": "Phishing Patterns Detected"
};

const sectionsGroups = [
    {
        title: "Email Details",
        sections: ["psender", "ptitle", "pcontent", "pwhole"]
    },
    {
        title: "URL Checks",
        sections: [
            "chk_bad_urls", 
            "chk_site_similarity", 
            "chk_site_similarity_ngram"
        ]
    },
    {
        title: "Mail Checks",
        sections: [
            "chk_domain_similarity_ngram", 
            "chk_bad_mail", 
            "chk_domain_similarity"
        ]
    },
    {
        title: "Suspicious Elements",
        sections: [
            "chk_suspicious_urls", 
            "chk_hidden_text", 
            "chk_suspicious_links",
            "chk_visual_similarity"
        ]
    },
    {
        title: "Final Classification",
        sections: [
            "spam_classification", 
            "chk_phishing_patterns"
        ]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    console.log('보고서 시작');

    chrome.storage.local.get('reportData', (result) => {
        const report = result.reportData;

        if (report) {
            const reportContainer = document.createElement('div');
            reportContainer.className = 'report-container';

            // 그룹화된 섹션을 생성
            for (const group of sectionsGroups) {
                const groupContainer = document.createElement('div');
                groupContainer.className = 'group-container';

                const groupTitle = document.createElement('h2');
                groupTitle.className = 'group-title';
                groupTitle.textContent = group.title;

                // 토글 기능 추가
                groupTitle.style.cursor = 'pointer';
                const contentSections = [];
                for (const key of group.sections) {
                    if (report[key]) {
                        const section = document.createElement('div');
                        section.className = 'report-section';

                        const title = document.createElement('h3');
                        title.className = 'report-title';
                        title.textContent = sectionsOrder[key]; // 이름을 sectionsOrder에서 가져옴

                        const content = document.createElement('p');
                        content.className = 'report-content';
                        content.textContent = Array.isArray(report[key]) ? report[key].join('\n') : report[key];

                        section.appendChild(title);
                        section.appendChild(content);
                        groupContainer.appendChild(section);
                        contentSections.push(section);
                    }
                }

                groupTitle.addEventListener('click', () => {
                    contentSections.forEach(section => {
                        section.style.display = section.style.display === 'none' ? 'block' : 'none';
                    });
                });

                reportContainer.appendChild(groupTitle);
                reportContainer.appendChild(groupContainer);
            }

            // 생성된 보고서를 HTML에 추가
            document.getElementById('report-container').appendChild(reportContainer);
        } else {
            document.getElementById('report-container').textContent = 'No report data found.';
        }
    });
});
