let coffeeScript = require('coffee-script');
let express = require('express.io');
let path = require('path');
let app = express();
app.http().io();
const PORT = 3000;
app.use(express.static(path.join(__dirname, '/')))
console.log('Server started');

app.io.route('ready', (req) => {
    req.io.join(req.data);
    app.io.room(req.data).broadcast('announce', {
        message: 'Client name: ' + req.data
    })
});

app.io.route('send', (req) => {
    app.io.room(req.data.room).broadcast('message', {
        message: req.data.message,
        author: req.data.author
    })
});

app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.listen(PORT);