let coffeeScript = require('coffee-script');
let express = require('express.io');
let path = require('path');
let app = express();
app.http().io();
const PORT = 3000;
app.use(express.static(path.join(__dirname, '/')))
console.log('Server started');

app.io.route('ready', (req) => {
    req.io.join(req.data.chat_room);
    req.io.join(req.data.signal_room);
    app.io.room(req.data.chat_room).broadcast('announce', {
        message: 'Client name: ' + req.data.chat_room
    })
});

app.io.route('send', (req) => {
    app.io.room(req.data.chat_room).broadcast('message', {
        message: req.data.message,
        author: req.data.author
    })
});

app.io.route('signal', (req) => {
    req.io.room(req.data.signal_room).broadcast('signaling_message', {
        type: req.data.type,
        message: req.data.message
    })
});

app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.listen(PORT);