export async function sendEmailDataToBackend(subject, from, textContent, htmlContent, attachments) {
    const formData = new FormData();
    formData.append('title', subject);
    formData.append('sender', from);
    formData.append('body', textContent);
    formData.append('whole_data', htmlContent);

    // 첨부파일 추가
    attachments.forEach((attachment) => {
        formData.append('file', attachment.blob, attachment.filename);
    });

    try {
        const response = await fetch('http://3.38.106.162:8000/api/phishing-check', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log('백엔드 응답:', result);

        if (result.is_phishing) {
            console.log('이 메일은 피싱 메일로 감지되었습니다.');
        } else {
            console.log('이 메일은 안전합니다.');
        }

        console.log('Phishing result:', result);

        return result; // 결과를 반환합니다.

    } catch (error) {
        console.error('Error sending data to backend:', error);
        return null; // 에러 발생 시 null 반환
    }
}
