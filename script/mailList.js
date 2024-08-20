// mailList.js

// 메일 데이터를 저장하는 함수
export function saveMailData(subject, from, isPhishing) {
    const emailData = { subject, from, isPhishing };

    console.log('======================mailList_emailData 출력', emailData);

    // 기존 저장된 메일 데이터를 불러옵니다.
    chrome.storage.local.get(['emailList'], function(result) {
        // emailList를 result에서 가져오고, 만약 없다면 빈 배열로 초기화합니다.
        const emailList = result.emailList || [];

        console.log('======================emailList 가져오기(전)', emailList);

        // 새로운 메일 데이터를 리스트에 추가합니다.
        emailList.push(emailData);

        // 업데이트된 리스트를 저장합니다.
        chrome.storage.local.set({ emailList }, function() {
            console.log('Email data saved to chrome.storage:', emailData);

            // emailList 출력 - 이 부분은 이제 콜백 함수 내에서 사용해야 합니다.
            console.log('======================emailList 가져오기(후)', emailList);
        });
    });
}

// 메일 데이터를 불러오는 함수
export function getMailData(callback) {
    chrome.storage.local.get(['emailList'], function(result) {
        callback(result.emailList || []);
    });
}

