let videoElement = document.querySelector("video");
let canvasElement = document.querySelector("canvas");
let canvasCtx = canvasElement.getContext("2d");
let rightHandCoordinatesDiv = document.getElementById("rightHandCoordinates");
let leftHandCoordinatesDiv = document.getElementById("leftHandCoordinates");
let isCameraStarted = false;
let hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
let rightHandLandmarks = [];
let leftHandLandmarks = [];
let controls = document.getElementById("controls");
let resizeHandle = document.getElementById("resize-handle");
let isResizing = false;

const jointNames = [
    "0:手首"
    , "1:親指の付け根"
    , "2:親指の第1関節"
    , "3:親指の第2関節"
    , "4:親指の先端"
    , "5:人差し指の付け根"
    , "6:人差し指の第1関節"
    , "7:人差し指の第2関節"
    , "8:人差し指の先端"
    , "9:中指の付け根"
    , "10:中指の第1関節"
    , "11:中指の第2関節"
    , "12:中指の先端"
    , "13:薬指の付け根"
    , "14:薬指の第1関節"
    , "15:薬指の第2関節"
    , "16:薬指の先端"
    , "17:小指の付け根"
    , "18:小指の第1関節"
    , "19:小指の第2関節"
    , "20:小指の先端"
];

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

async function startCamera()
{
    try
    {
        // 新しいストリームを取得
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () =>
        {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            videoElement.play();
            processFrame();
        };
    } catch (error)
    {
        console.error("カメラのアクセスが許可されていません:", error);
    }
}

function onResults(results)
{
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    rightHandLandmarks = [];
    leftHandLandmarks = [];

    if (results.multiHandLandmarks && results.multiHandedness)
    {
        for (let i = 0; i < results.multiHandLandmarks.length; i++)
        {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i].label === "Right" ? "Left" : "Right";

            if (handedness === "Right" && (selectedHand === 'right' || selectedHand === 'both'))
            {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });
                rightHandLandmarks = landmarks;
                rightHandLandmarks.forEach((landmark, index) =>
                {
                    canvasCtx.font = "16px Arial";
                    canvasCtx.fillStyle = "blue";
                    canvasCtx.fillText(index, landmark.x * canvasElement.width, landmark.y * canvasElement.height);
                });
            } else if (handedness === "Left" && (selectedHand === 'left' || selectedHand === 'both'))
            {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });
                leftHandLandmarks = landmarks;
                leftHandLandmarks.forEach((landmark, index) =>
                {
                    canvasCtx.font = "16px Arial";
                    canvasCtx.fillStyle = "blue";
                    canvasCtx.fillText(index, landmark.x * canvasElement.width, landmark.y * canvasElement.height);
                });
            }
        }
    }
}

async function processFrame()
{
    if (!isCameraStarted)
    {
        return;
    }

    await hands.send({ image: videoElement });
    requestAnimationFrame(processFrame);
}

setInterval(() =>
{
    let rightHandHTML = "";
    let leftHandHTML = "";

    rightHandLandmarks.forEach((landmark, i) =>
    {
        rightHandHTML += `${jointNames[i]}: (x: ${landmark.x.toFixed(3)}, y: ${landmark.y.toFixed(3)})<br>`;
    });

    leftHandLandmarks.forEach((landmark, i) =>
    {
        leftHandHTML += `${jointNames[i]}: (x: ${landmark.x.toFixed(3)}, y: ${landmark.y.toFixed(3)})<br>`;
    });

    rightHandCoordinatesDiv.innerHTML = rightHandHTML || "右手が検出されていません";
    leftHandCoordinatesDiv.innerHTML = leftHandHTML || "左手が検出されていません";
}, 500);


// ボタン押下でカメラ開始と表示
document.getElementById('applyButton').addEventListener('click', () =>
{
    selectedHand = document.getElementById('handSelection').value;
    if (isCameraStarted)
    {
        stopCamera();
    } else
    {
        startCamera();
    }
    isCameraStarted = !isCameraStarted;
});

function stopCamera()
{
    // カメラを停止
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    videoElement.srcObject = null;
}

resizeHandle.addEventListener("mousedown", (e) =>
{
    isResizing = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
});

function resize(e)
{
    if (isResizing)
    {
        const newWidth = e.clientX;
        controls.style.width = `${newWidth}px`;
    }
}

function stopResize()
{
    isResizing = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
}
