const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 8080;

app.use("/", express.static(path.join(__dirname, '/client')));
app.get('/', (req, res)=>{
	const file = path.join(__dirname, './client/index.html');
	console.log(file);
	res.sendFile(file);
});

server.listen(port);
console.log(`Server listening on port: ${port}`);

io.sockets.on('connection', socket =>{
	init(socket);
});

function init(socket){
	const msg = `we're connected`;
	socket.emit('helloworld', msg);
}