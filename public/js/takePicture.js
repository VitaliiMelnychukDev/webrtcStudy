(function (videoTagSelector) {
    let takePicture = document.querySelector("#take-picture");
    let pictureCanvas = document.querySelector("#picture-canvas");
    let pictureOutputBlock = document.querySelector("#made-picture");

    /*takePicture.addEventListener('click', (event) => {
        event.preventDefault();
        takeProfilePicture();
    }, false);*/

    function takeProfilePicture() {
        let context = pictureCanvas.getContext('2d');
        context.drawImage(videoTagSelector, 0, 0, width, height);
        let canvasData = pictureCanvas.toDataURL('image/png');
        pictureOutputBlock.setAttribute('src', canvasData);
    }

})(videoTag);