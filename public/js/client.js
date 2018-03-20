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
    myVideoTag.src = window.URL.createObjectURL(stream);
    myVideoTag.play()
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

let CHAT_ROOM = 'chat_room';
let SIGNAL_ROOM = 'signal_room';

let configuration = {
    'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }]
};
let rtcPeerConn;

let dataChannelOptions = {
    ordered: false,
    maxRetransmitTime: 1000
};
let dataChannel;

io = io.connect();
io.emit('ready', {
    "chat_room": CHAT_ROOM,
    "signal_room": SIGNAL_ROOM
});

io.emit('signal', {
    type: 'user_here',
    message: "Call from user",
    room: SIGNAL_ROOM
});

io.on('announce', function (data) {
    displayMessage(data.message);
})

io.on('message', function (data) {
    displayMessage(data.author + " " + data.message);
})

io.on('signaling_message', function (data) {
    displaySignalingMessage("Signal: " + data.type);

    if (!rtcPeerConn) {
        startSignaling();
    }

    if (data.type !== 'user_here') {
        let message = JSON.parse(data.message);
        if (message.sdp) {
            displaySignalingMessage("Set Remote Description");
            rtcPeerConn.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
                if (rtcPeerConn.remoteDescription.type === 'offer') {
                    rtcPeerConn.createAnswer(sendLocalDesc, logError)
                }
            }, logError)
        } else {
            displaySignalingMessage("signaling_message completed ice candidate");
            rtcPeerConn.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }
});

function startSignaling() {
    displaySignalingMessage("start signaling");
    rtcPeerConn = new RTCPeerConnection(configuration, null);

    /**
     * need to do message sending
     */
    dataChannel = rtcPeerConn.createDataChannel('textMessage', dataChannelOptions);
    /*dataChannel.onopen = dataChannelStateChanged;
    dataChannel.ondatachannel = receiveDataChannel;*/



    rtcPeerConn.onicecandidate = function (event) {
        if (event.candidate) {
            io.emit('signal', {
                "type": "ice candidate",
                "message": JSON.stringify({
                    'candidate': event.candidate
                }),
                "room": SIGNAL_ROOM
            });
            displaySignalingMessage("completed ice candidate")
        }
    }

    rtcPeerConn.onnegotiationneeded = function () {
        displaySignalingMessage("Negotiation called");
        rtcPeerConn.createOffer(sendLocalDesc, logError);
    }

    rtcPeerConn.onaddstream= function (event) {
        displaySignalingMessage('Add guest stream');
        guestVideoTag.src = URL.createObjectURL(event.stream);
    }

    navigator.getUserMedia({
        'audio': true,
        'video': {
            mandatory: {
                maxWidth: 320,
                maxHeight: 180
            }
        }
    }, (stream) => {
        displaySignalingMessage("Add own stream");
        myVideoTag.src = URL.createObjectURL(stream);
        rtcPeerConn.addStream(stream);
    }, logError);

}

/**
 * dataChannel functions
 */
function dataChannelStateChanged() {
    if (dataChannel.readyState === 'open') {
       displaySignalingMessage("Data channel open.");
       dataChannel.onmessage = receiveDataChannelMessage;
    } else {
        displaySignalingMessage("Data channel not open.");
    }
}

function receiveDataChannel(event) {
    displaySignalingMessage("Receive a data channel");
    dataChannel = event.channel;
    dataChannel.onmessage = receiveDataChannelMessage;
}

function receiveDataChannelMessage() {
    displaySignalingMessage("Data Channel Message: ");
    displayMessage("Data Channel message: " + event.data);
}

/**
 * end dataChannel functions
 */

function sendLocalDesc(desc) {
    rtcPeerConn.setLocalDescription(desc, () =>{
        displaySignalingMessage("Sending Local Description");
        io.emit('signal', {
            "type": "SDP",
            "message": JSON.stringify({
                'sdp': rtcPeerConn.localDescription
            }),
            "room": SIGNAL_ROOM
        });
    })
}

function logError(error) {
    displaySignalingMessage(error.name + " " + error.message);
}

function displayMessage(message) {
    chatBlock.innerHTML = chatBlock.innerHTML + "<br />" +  message
}

function displaySignalingMessage(message) {
    signalingBlock.innerHTML = signalingBlock.innerHTML + "<br />" +  message
}

sendMessageButton.addEventListener('click', (ev) => {
    io.emit('send', {
        author: nameInput.value,
        message: messageInput.value
    })
    dataChannel.send(nameInput.value + " message: " + messageInput.value);
    ev.preventDefault();
}, false);

