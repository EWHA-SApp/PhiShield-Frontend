// backendUtils.js

// 백엔드로 데이터를 전송하는 함수
export function sendEmailDataToBackend(subject, from, body) {
    fetch('http://3.38.47.187:8000/api/phishing-check', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: subject,
            sender: from,
            body: body
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log('백엔드 응답:', result);

        if (result.is_phishing) {
            console.log('이 메일은 피싱 메일로 감지되었습니다.');
        } else {
            console.log('이 메일은 안전합니다.');
        }

        // 여기서 result를 이용해 추가적인 작업을 수행할 수 있습니다.
    })
    .catch(error => {
        console.error('Error sending data to backend:', error);
    });
}
