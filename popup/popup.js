document.getElementById('check').addEventListener('click', () => {
    console.log('클릭함');
    window.location.href = 'detecting.html';
});

// "Reset Email List" 버튼 클릭 이벤트
document.getElementById('reset').addEventListener('click', () => {
    chrome.storage.local.remove('analyzedMessageIds', () => {
        console.log('Analyzed message IDs have been reset.');
        document.getElementById('status').textContent = 'Analyzed message IDs have been reset.';
    });

    // emailList를 리셋
    chrome.storage.local.get('emailList', (result) => {
        console.log('Before emailList:', result.emailList);
        
        chrome.storage.local.set({ emailList: [] }, () => {
            console.log('Email list has been reset.');
            document.getElementById('status').textContent = 'Email list has been reset.';
            
            // 리셋 후 emailList 출력
            chrome.storage.local.get('emailList', (result) => {
                console.log('Current emailList:', result.emailList);
            });
        });
    });
});
