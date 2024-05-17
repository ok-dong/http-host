// video와 canvas 요소 가져오기
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const resultElement = document.getElementById('result');

// 비디오 스트림 설정
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => { //미디어 스트림 요청 및 비디오 미디어 요청, 요청 허용시 실행할 콜백 함수 지정
    video.srcObject = stream; 
    video.setAttribute('playsinline', true); // iOS 장치 호환성?
    video.play(); //비디오 재생
    requestAnimationFrame(tick); // 새로 렌더링 될때마다 tick 실행
});

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Canvas 크기 설정
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // 비디오 프레임을 캔버스에 그리기
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // 이미지 데이터 가져오기
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // QR 코드 디코딩
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code) {
            resultElement.textContent = `QRC 데이터: ${code.data}`;
        } else {
            resultElement.textContent = 'QRC 없음';
        }
    }
    // 다음 프레임 요청
    requestAnimationFrame(tick);
}

// QR 코드 생성 기능
const generateButton = document.getElementById('generate');
const saveButton = document.getElementById('save');
const textInput = document.getElementById('text');
const qrCodeContainer = document.getElementById('qrcode');

generateButton.addEventListener('click', () => {
    const text = textInput.value;
    qrCodeContainer.innerHTML = ''; // 기존 QR 코드 제거
    QRCode.toCanvas(text, { width: 200, margin: 2 }, (error, canvas) => {
        if (error) {
            console.error(error);
            return;
        }
        qrCodeContainer.appendChild(canvas);
    });
});

// QR 코드 저장 기능
saveButton.addEventListener('click', () => {
    const text = textInput.value;
    if (!text) {
        alert('QR입략');
        return;
    }
    // 로컬 스토리지에 저장
    let savedQRCodes = JSON.parse(localStorage.getItem('savedQRCodes')) || [];
    savedQRCodes.push(text);
    localStorage.setItem('savedQRCodes', JSON.stringify(savedQRCodes));
    alert('QR 저장됨');
});

// 저장된 QR 코드를 보여주는 기능
const showSavedButton = document.getElementById('showSaved');
const savedQRCodesContainer = document.getElementById('savedQRCodesContainer');

showSavedButton.addEventListener('click', () => {
    savedQRCodesContainer.innerHTML = ''; // 기존 내용을 제거
    let savedQRCodes = JSON.parse(localStorage.getItem('savedQRCodes')) || [];
    if (savedQRCodes.length === 0) {
        savedQRCodesContainer.textContent = '저장안됨';
        return;
    }

    savedQRCodes.forEach((code, index) => {
        const div = document.createElement('div');
        div.classList.add('qrCodeItem');
        
        const qrCodeData = document.createElement('p');
        qrCodeData.classList.add('qrCodeData');
        qrCodeData.textContent = code;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('deleteButton');
        deleteButton.textContent = '삭제';
        deleteButton.addEventListener('click', () => {
            deleteQRCode(index);
        });

        const shareButton = document.createElement('button');
        shareButton.classList.add('shareButton');
        shareButton.textContent = '공유';
        shareButton.addEventListener('click', () => {
            shareQRCode(code);
        });

        QRCode.toCanvas(code, { width: 200, margin: 2 }, (error, canvas) => {
            if (error) {
                console.error(error);
                return;
            }
            div.appendChild(canvas);
        });

        div.appendChild(qrCodeData);
        div.appendChild(deleteButton);
        div.appendChild(shareButton);
        savedQRCodesContainer.appendChild(div);
    });
});

function deleteQRCode(index) {
    let savedQRCodes = JSON.parse(localStorage.getItem('savedQRCodes')) || [];
    savedQRCodes.splice(index, 1);
    localStorage.setItem('savedQRCodes', JSON.stringify(savedQRCodes));
    showSavedButton.click();
}

function shareQRCode(text) {
    if (navigator.share) {
        navigator.share({
            title: 'QR Code',
            text: `Check out this QR Code: ${text}`,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
        alert('Web Share API is not supported in your browser.');
    }
}