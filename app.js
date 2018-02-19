const express = require(`express`);
const http = require(`http`);
const path = require(`path`);
const mongo = require(`mongodb`).MongoClient;
const ioserver = require(`socket.io`);
const sanitize = require(`mongo-sanitize`);
const bcrypt = require('bcrypt');
const config = require('config');

const app = express();
const server = http.Server(app);
const io = ioserver(server);
const serverport = process.env.PORT || 8080;
process.env.NODE_ENV = 'production';
const dburl = process.env.MONGODB_URI || config.get('admin.dbconfig.host');
let sessions = {};
let games = [];

app.use('/', express.static(path.join(__dirname, '/client')));
server.listen(serverport);
console.log(`Server listening on port: ${serverport}`);
mongo.connect(dburl, (err, database)=>{
	if (err) throw err;

	console.log(`Mongodb is listening.`);

	let db = database.db('brawlhallacrewdb');
	io.sockets.on('connection', socket =>{
		init(socket);
		socket.on('login', (data)=>login(socket, db, data));
		socket.on('register', (data)=>register(socket, db, data));
		socket.on('disconnect', ()=>disconnect(socket));
		socket.on('getgames', ()=>getgames(socket));
		socket.on('creategame', ()=>creategame(socket));
		socket.on('joingame', (data)=>joingame(socket, data));
		socket.on('updategame', (data)=>updategame(socket, data));
		socket.on('resetgame', ()=>resetgame(socket));
		socket.on('leavegame', ()=>leavegame(socket));
	});
});

//void
const init = socket =>{
	//
}

//returns string
const getusername = socket => {
	return Object.keys(sessions).find(key => sessions[key] === socket);
}

//returns boolean
const checkifadmin = socket => {
	let username = getusername(socket);
	for (let i=0; i<games.length; i++){
		let game = games[i];
		if (game.admin == username){
			return true;
		}
	}
	return false;
}

//void
const joingame = (socket, data) => {
	let username = getusername(socket);
	for (let i=0; i<games.length; i++){
		let game = games[i];
		if(game.admin == data){
			game.inbound.push(username);
			socket.emit('joingame', {
				username: username,
				game: game,
			});
			for (let j=0; j<game.inbound.length; j++){
				sessions[game.inbound[j]].emit('gameupdate', game);
			}
			for (let j=0; j<game.team1.length; j++){
				sessions[game.team1[j]].emit('gameupdate', game);
			}
			for (let j=0; j<game.team2.length; j++){
				sessions[game.team2[j]].emit('gameupdate', game);
			}
		}
	}
}

const findgame = socket => {
	for (let i=0; i<games.length; i++){
		let game = games[i];
		for (let j=0; j<game.team1.length; j++){
			if(game.team1[j] == getusername(socket))
				return game;
		}
		for (let j=0; j<game.team2.length; j++){
			if(game.team2[j] == getusername(socket))
				return game;
		}
		for (let j=0; j<game.inbound.length; j++){
			if(game.inbound[j] == getusername(socket))
				return game;
		}
	}
}

const leavegame = socket => {
	let game = findgame(socket);
	let username = getusername(socket);
	if (game.admin ==username){
		for (let i=0; i<game.inbound.length; i++){
			sessions[game.inbound[i]].emit('loginsuccess', {username: game.inbound[i]});
			sessions[game.inbound[i]].emit('notification', `Game admin ${game.admin} left the game.`);
		}
		for (let i=0; i<game.team1.length; i++){
			sessions[game.team1[i]].emit('loginsuccess', {username: game.team1[i]});
			sessions[game.team1[i]].emit('notification', `Game admin ${game.admin} left the game.`);
		}
		for (let i=0; i<game.team2.length; i++){
			sessions[game.team2[i]].emit('loginsuccess', {username: game.team1[i]});
			sessions[game.team2[i]].emit('notification', `Game admin ${game.admin} left the game.`);
		}
		for (let i=0; i<games.length; i++){
			if (games[i]==game){
				games.splice(i, 1);
			}
		}
	} else {
		for (let i=0; i<game.inbound.length; i++){
			if (game.inbound[i]==username){
				game.inbound.splice(i, 1);
			}
		}
		for (let i=0; i<game.team1.length; i++){
			if (game.team1[i]==username){
				game.team1.splice(i, 1);
			}
		}
		for (let i=0; i<game.team2.length; i++){
			if (game.team2[i]==username){
				game.team2.splice(i, 1);
			}
		}
		for (let j=0; j<game.inbound.length; j++){
			sessions[game.inbound[j]].emit('gameupdate', game);
		}
		for (let j=0; j<game.team1.length; j++){
			sessions[game.team1[j]].emit('gameupdate', game);
		}
		for (let j=0; j<game.team2.length; j++){
			sessions[game.team2[j]].emit('gameupdate', game);
		}
		socket.emit('loginsuccess', {username: username});
	}
	io.sockets.emit('gamesupdate', games);
}

const resetgame = socket => {
	let game = findgame(socket);
	let username = getusername(socket);
	if (game.admin !== username)
		return;
	const ngame = {
		admin: username,
		captains: [],
		team1: [],
		inbound: [],
		team2: [],
		phase: false,
		picking: username,
	};
	for (let i=0; i<game.team1.length; i++){
		ngame.inbound.push(game.team1[i]);
	}
	for (let i=0; i<game.team2.length; i++){
		ngame.inbound.push(game.team2[i]);
	}
	for (let i=0; i<game.inbound.length; i++){
		ngame.inbound.push(game.inbound[i]);
	}

	for (let i=0; i<games.length; i++){
		if (games[i].admin == username){
			games[i] = ngame;
			break;
		}
	}
	for (let i=0; i<ngame.inbound.length; i++){
		sessions[ngame.inbound[i]].emit('gameupdate', ngame);
	}
}

//void
const updategame = (socket, data) =>{
	let game = findgame(socket);
	let username = getusername(socket);
	//if captains pick
	if (game.phase){
		if((game.picking !== username) || (data.selected == username) || (data.selected == game.captains[0]) || (data.selected == game.captains[1]))
			return;
		if(data.movement == 'left'){
			if ((data.container =='team1') || (game.picking == game.captains[1]))
				return;
			if ((data.container =='team2') && (game.picking == game.captains[0]))
				return;
			if(data.selected == game.team2[game.team2.indexOf(data.selected)]){
				game.team2.splice(game.team2.indexOf(data.selected), 1);
				game.inbound.push(data.selected);
			} else {
				game.inbound.splice(game.inbound.indexOf(data.selected), 1);
				game.team1.push(data.selected);
			}
		}
		if(data.movement == 'right'){
			if((data.container == 'team2') || (game.picking == game.captains[0]))
				return;
			if ((data.container =='team1') && (game.picking == game.captains[1]))
				return;
			if(data.selected == game.team1[game.team1.indexOf(data.selected)]){
				game.team1.splice(game.team1.indexOf(data.selected), 1);
				game.inbound.push(data.selected);
			} else {
				game.inbound.splice(game.inbound.indexOf(data.selected), 1);
				game.team2.push(data.selected);
			}
		}

		if (game.captains.indexOf(username)){
			game.picking = game.captains[0];
		} else {
			game.picking = game.captains[1];
		}
	} else if ((game.admin == username) && !game.phase){
		//admin control only
		if(data.movement == 'left'){
			if ((data.container == 'team1') || game.team1.length)
				return;
			if(data.selected == game.team2[game.team2.indexOf(data.selected)]){
				game.team2.splice(game.team2.indexOf(data.selected), 1);
				game.inbound.push(data.selected);
			} else {
				game.inbound.splice(game.inbound.indexOf(data.selected), 1);
				game.team1.push(data.selected);
			}
		}
		if(data.movement == 'right'){
			if ((data.container == 'team2') || game.team2.length)
				return;
			if(data.selected == game.team1[game.team1.indexOf(data.selected)]){
				game.team1.splice(game.team1.indexOf(data.selected), 1);
				game.inbound.push(data.selected);
			} else {
				game.inbound.splice(game.inbound.indexOf(data.selected), 1);
				game.team2.push(data.selected);
			}
		}
	} else {
		//for anyone trying to move anything that isn't an admin or a captain
		return;
	}
	if (game.team1.length && game.team2.length && !game.phase){
		game.captains[0] = game.team1[0];
		game.captains[1] = game.team2[0];
		game.phase = true;
		game.picking = game.captains[0];
	}
	for (let i=0; i<game.team1.length; i++){
		sessions[game.team1[i]].emit('gameupdate', game);
	}
	for (let i=0; i<game.team2.length; i++){
		sessions[game.team2[i]].emit('gameupdate', game);
	}
	for (let i=0; i<game.inbound.length; i++){
		sessions[game.inbound[i]].emit('gameupdate', game);
	}
}

//void
const creategame = socket => {
	if (checkifadmin(socket))
		return;
	const username = getusername(socket);
	const game = {
		admin: username,
		captains: [],
		team1: [],
		inbound: [username],
		team2: [],
		phase: false,
		picking: username,
	};
	games.push(game);
	socket.emit('joingame', {
		username: username,
		game: game,
		resettable: true
	});
	io.sockets.emit('gamesupdate', games);
	setTimeout(()=>{
		socket.emit('gameupdate', game)
	}, 0);
}

//void
const disconnect = socket => {
	//game cleanup
	let username = getusername(socket);
	let ad = false;
	for (let i=0; i<games.length; i++){
		let game = games[i];
		if (game.admin == username){
			games.splice(i, 1);
			for (let k=0; k<game.team1.length; k++){
				sessions[game.team1[k]].emit('loginsuccess', {username: game.team1[k]});
				sessions[game.team1[k]].emit('notification', `Game admin ${game.admin} left the game.`);
			}
			for (let k=0; k<game.team2.length; k++){
				sessions[game.team2[k]].emit('loginsuccess', {username: game.team2[k]});
				sessions[game.team2[k]].emit('notification', `Game admin ${game.admin} left the game.`);
			}
			for (let k=0; k<game.inbound.length; k++){
				sessions[game.inbound[k]].emit('loginsuccess', {username: game.inbound[k]});
				sessions[game.inbound[k]].emit('notification', `Game admin ${game.admin} left the game.`);
			}
			io.sockets.emit('gamesupdate', games);
			break;
		}
		for(let j=0; j<game.team1.length; j++){
			if (game.team1[j] == username){
				game.team1.splice(j, 1);
				for (let k=0; k<game.team1.length; k++){
					sessions[game.team1[k]].emit('gameupdate', game);
				}
				for (let k=0; k<game.team2.length; k++){
					sessions[game.team2[k]].emit('gameupdate', game);
				}
				for (let k=0; k<game.inbound.length; k++){
					sessions[game.inbound[k]].emit('gameupdate', game);
				}
				break;
			}
		}
		for(let j=0; j<game.team2.length; j++){
			if (game.team2[j] == username){
				game.team2.splice(j, 1);
				for (let k=0; k<game.team1.length; k++){
					sessions[game.team1[k]].emit('gameupdate', game);
				}
				for (let k=0; k<game.team2.length; k++){
					sessions[game.team2[k]].emit('gameupdate', game);
				}
				for (let k=0; k<game.inbound.length; k++){
					sessions[game.inbound[k]].emit('gameupdate', game);
				}
				break;
			}
		}
		for(let j=0; j<game.inbound.length; j++){
			if (game.inbound[j] == username){
				game.inbound.splice(j, 1);
				for (let k=0; k<game.team1.length; k++){
					sessions[game.team1[k]].emit('gameupdate', game);
				}
				for (let k=0; k<game.team2.length; k++){
					sessions[game.team2[k]].emit('gameupdate', game);
				}
				for (let k=0; k<game.inbound.length; k++){
					sessions[game.inbound[k]].emit('gameupdate', game);
				}
				break;
			}
		}
	}

	//session cleanup
	for(let user in sessions){
		if (socket == sessions[user]){
			delete sessions[user];
			break;
		}
	}
}

//void
const login = (socket, db, data) => {
	if(!data.username){
		socket.emit('usercreated', {
			msg: `Enter a valid username.`
		});
		return;
	}
	if (!data.password){
		socket.emit('usercreated', {
			msg: `Enter a valid password.`
		});
		return;
	}

	let users = db.collection('users');

	let query = sanitize(data);

	users.findOne({username: query.username}).then(res=>{
		if(!res){
			socket.emit('usercreated', {
				msg: `Unknown user.`
			});
			return;
		}
		for(let user in sessions){
			if(user == res.username){
				socket.emit('usercreated',{
					msg: `User is already signed in.`
				});
				return;
			}
		}

		const a = query.username + query.password;
		const h = res.password;

		bcrypt.compare(a, h, (err, res2)=>{
			if (res2){
				sessions[res.username] = socket;
				socket.emit('loginsuccess', {
					username: res.username,
					wins: res.wins,
					losses: res.losses
				});
				socket.emit('gamesupdate', games);
			} else {
				socket.emit('usercreated', {
					msg: `Bad password.`
				});
			}
		})
	})
}

//void
const register = (socket, db, data) => {
	if(!data.username){
		socket.emit('usercreated', {
			msg: `Enter a new username to register.`
		});
		return;
	}
	if (!data.password){
		socket.emit('usercreated', {
			msg: `Enter a password.`
		});
		return;
	}
	if ((data.username.indexOf("<") > -1) || (data.username.indexOf(">") > -1) || (data.username.indexOf('&') > -1)){
		socket.emit('usercreated', {
			msg: `Characters <, >, and & are not permitted in usernames. Choose a new name.`
		});
		return;
	}

	let users = db.collection('users');
	
	let query = sanitize(data);

	users.findOne({username: query.username}).then(res=>{
		if (res){
			socket.emit('usercreated', {
				msg: `User: ${query.username} already exists.`
			});
			return;
		}

		const h = query.username + query.password;

		bcrypt.hash(h, 13, (err, hash)=>{
			users.insert({username: query.username, password: hash, wins: 0, losses: 0}, (err, user)=>{
				if (err){
					socket.emit('usercreated', {
						msg: `DB is having issues. Please contact admin.`
					});
					return;
				}
				socket.emit('usercreated', {
					msg: `User ${query.username} has been created.`
				});
			});
		});
	})
}