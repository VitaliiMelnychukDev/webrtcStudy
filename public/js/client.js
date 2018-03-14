navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitUserMedia || navigator.mozGetUserMedia;

let width = 640;
let height = 360;

let constraints = {
    audio: true,
    video: {
        maxWidth: width,
        minHeight: height,
        maxHeight: height
    }
};

videoSelector.onchange = startStream;

function getUserMediaSuccess(stream) {
    console.log("Success");
    videoTag.src = window.URL.createObjectURL(stream);
    videoTag.play()
        .catch(error => function () {
            console.log('videoTagPlayError:' , error);
        })
}

function getUserMediaError(error) {
    console.log("getUserMediaError: ", error);
}


function startStream() {
    constraints.video.optional = [{
        sourceId: videoSelector.value
    }];
    navigator.getUserMedia(constraints, getUserMediaSuccess, getUserMediaError);
}

//startStream();

navigator.mediaDevices.enumerateDevices()
    .then(getDevicesSuccess)
    .catch(getDevicesError);

function getDevicesSuccess(sourcesInfos) {
    buildDevicesSelector(sourcesInfos);
}

function buildDevicesSelector(sourcesInfos) {
    for(let i in sourcesInfos) {
        let sourceInfo = sourcesInfos[i];
        if (sourceInfo.kind === "videoinput") {
            let option = document.createElement('option');
            option.value = sourceInfo.deviceId;
            option.text = sourceInfo.label || 'camera: ' + i;
            videoSelector.appendChild(option);
        }

    }
}

function getDevicesError(error) {
    console.log("getDevicesError: ", error);
}

let ROOM = 'room';
io = io.connect();
io.emit('ready', ROOM);

io.on('announce', function (data) {
    displayMessage(data.message);
})

io.on('message', function (data) {
    displayMessage(data.author + " " + data.message);
})

function displayMessage(message) {
    chatBlock.innerHTML = chatBlock.innerHTML + "<br />" +  message
}

sendMessageButton.addEventListener('click', (ev) => {
    io.emit('send', {
        author: nameInput.value,
        message: messageInput.value
    })
    ev.preventDefault();
}, false)