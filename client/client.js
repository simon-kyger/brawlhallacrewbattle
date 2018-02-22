(function(){

	const socket = io();

	//static templates
	const headert = () => {
		return `<div id='header' class='container' align='center'>
					<a href='https://www.brawlhalla.com' target='_blank'><img src='img/blogotop.png' style='padding-top: 50'></a>
					<div class='list-group' style='color: orange; width: 400; text-align: center;'>CREWS</div>
				</div>
		`;
	}

	const footert = () => {
		return `<div id='footer' style='position: fixed; width: 100%; bottom: 0; font-size:12; color:gray; box-shadow: 0px 0px 50px 10px rgba(0,0,0,.7); background-color: rgba(0,0,0,.7); border-top: 1px solid black;'>
					<div class="row">
						<div class="col">
							Powered with:
							<a href='https://nodejs.org/en/' target='_blank'><img src='img/node.png' style='margin-left:4;'></a>
							<a href='https://socket.io/' target='_blank'><img src='img/socketio.png'></a>
							<a href='https://www.heroku.com/' target='_blank'><img src='img/heroku.png'></a>
							<a href='https://www.mongodb.com/' target='_blank'><img src='img/mongo.png' style='position: relative; bottom:4;'></a>
						</div>
						<div class="col" style='text-align: center;'>
							<img src='img/discord.png'>
							<a href='https://discord.gg/N2q82hb' target='_blank'>https://discord.gg/N2q82hb</a>
						</div>
						<div class="col" style='text-align: right;'>
							Fork me on 
							<a href='https://www.github.com' target='_blank'><img src='img/github.png'></a>
							@
							<a href='https://github.com/simon-kyger/brawlhallacrewbattle' target='_blank'>https://github.com/simon-kyger/brawlhallacrewbattle</a>
						</div>
					</div>
				</div>
		`;
	}

	const loginvid = () => {
		let vidids = [
			`nNF9cPPSwUQ?`, //pugsy wilson
			`cunWS-05m9s?`, //stevenator doppy
			`tQ_Yq7gj42s?start=7`, //isidroo rbrenz
			`LUK5AtT1URY?start=3`, //lilcapped sillygobi
			`-SX2mbt4-f4?start=7`, //ldz crockie
		];
		const randvid = vidids[Math.floor(Math.random()*(vidids.length))];
		return `<iframe id="brawlvid" style="position: absolute; top: 0; left: 0; width:100%; height:100%; z-index:-1; opacity:.7;" src="https://www.youtube.com/embed/${randvid}&controls=0&showinfo=0&rel=0&autoplay=1&loop=1&mute=1" frameborder="0" allowfullscreen></iframe>
		`;					
	}

	//onload
	const rendermain = () => {
		document.body.style.margin = 0;
		document.body.style.background = `black`;
		document.body.style.color = `white`;
		document.body.style.fontSize = `40`;
		document.body.style.overflow = `hidden`;
		let div = document.createElement(`div`);
		document.body.appendChild(div);
		div.id = `main`;
		socket.emit('init');
	}
	document.addEventListener('DOMContentLoaded', rendermain);

	const loginpage = () => {
		let div = document.getElementById('main');
		div.innerHTML = '';
		div.style.width = `100%`;
		div.style.height = `100%`;
		div.innerHTML = `<div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
							${loginvid()}
							${headert()}
							<div class="container">
								<div class="row">
									<div class="col"></div>
									<div id='login' class="col" align="center" style='font-size: 20;'>
										<form style='margin: 0;margin-top: 140;background-color: rgba(0,0,0,.4);box-shadow: 0px 0px 150px 20px rgba(0,0,0,.5)'>
											<div style="text-shadow: 0px 0px 8px rgba(255,255,255,.8)">Username: </div>
											<input id='username' style='color: white; background-color: rgba(0,0,0,.4); text-shadow: 0px 0px 8px rgba(255,255,255,1);'></input>
											<div style='padding-top:10; text-shadow: 0px 0px 8px rgba(255,255,255,.8)'>Password: </div>
											<input id='password' type='password' style='color: white; background-color: rgba(0,0,0,.4); text-shadow: 0px 0px 8px rgba(255,255,255,1);'></input>
											<div style='margin-top: 10; text-shadow: 3px 3px 10px #000; background-color: rgba(0,0,0,.4);'>
												<a id='loginlink' href='#'>Login</a>
												<a id='registerlink' href='#' style='margin-left: 100;'>Register</a>
											</div>
											<div id='success'></div>
										</form>
									</div>
									<div class="col"></div>
								</div>
							</div>
							${footert()}
						</div>
		`;
		$('#header').hide().fadeIn(1000);
		$('#footer').hide();
		$('#login').hide();
		$('#brawlvid').hide();
		setTimeout(()=>{
			$('#footer').fadeIn(1500)
			$('#login').fadeIn(2000)
			$('#brawlvid').fadeIn(3000);
		}, 1000);

		document.getElementById('loginlink').addEventListener('click', e=>{
			e.preventDefault();
			const username = document.getElementById('username').value;
			const password = document.getElementById('password').value;
			socket.emit('login', {
				username: username,
				password: password
			});
		})
		document.getElementById('registerlink').addEventListener('click', e=>{
			e.preventDefault();
			const username = document.getElementById('username').value;
			const password = document.getElementById('password').value;
			socket.emit('register', {
				username: username,
				password: password
			});
		})
	}

	socket.on('loginpage', ()=>loginpage());
	socket.on('welcomeheader', data => welcomeheader(data));
	socket.on('loginfailure', data => {
		document.getElementById('success').innerHTML = data.msg;
	});
	socket.on('usercreated', data => {
		document.getElementById('success').innerHTML = data.msg;
	});
	socket.on('loginsuccess', data => gamespage(data));

	const welcomeheader = data => {
		document.getElementById('loginheadert').innerHTML = data.msg;
	}

	const loginfailure = data => {
		document.getElementById('loginheadert').innerHTML = data.msg;
	}

	const gamespage = data => {
		let div = document.getElementById('main');
		div.innerHTML = `<div id='loggedin' style='font-size: 20; float: left;'>Welcome back ${data.username}</div>
						${headert()}
						<div class='container' align='center' style='width: 750;'>
							<div id='intermediate' style='font-size: 20;'></div>
							<div style='width: 38%; text-align: left;'>
								Active
							</div>
							<ul id='createjoin' class='list-group' style='float:left; margin-bottom: 0;'>
								<li id='creategame' class='list-group-item' style='color: white; background-color: black; padding-left: 30; padding-right: 30; border: 1px solid white; cursor: pointer;'>
									Create
								</li>
								<li id='joingame' class='list-group-item' style='color: white; background-color: black; padding-left: 30; padding-right: 30; border: 1px solid white; cursor: pointer;'>
									Join
								</li>
							</ul>
							<form>
								<select id='games' size='2' style='width: 500; height: 400; float: right; font-size:20; background-color: black;'>
								</select>
							</form>
						</div>
						${footert()}
		`;
		document.getElementById('creategame').addEventListener('click', e=>{
			socket.emit('creategame');
		});
		document.getElementById('joingame').addEventListener('click', e=>{
			let selectedgame = document.getElementById('games').options[document.getElementById('games').options.selectedIndex].value;
			selectedgame = selectedgame.substring(0, selectedgame.length - 7);
			socket.emit('joingame', selectedgame);
		});
	}

	socket.on('joingame', data=>{
		playgamepage(data);
	});

	socket.on('notification', data=>{
		if(document.getElementById('intermediate')){
			document.getElementById('intermediate').innerHTML = data;
		}
	});

	socket.on('gamesupdate', data=>{
		if (document.getElementById('games')){
			document.getElementById('games').innerHTML = '';
			for (let i=0; i<data.length; i++){
				let game = data[i];
				document.getElementById('games').innerHTML += `<option class='list-group-item' style='white-space:pre-wrap; color: white; background-color: black;'>${game.admin}'s Game</option>`;
			}
		}
	});

	const renderreset = () => {
		return `<button id='reset' style='color: white; background-color: black;'>ResetGame</button>`;
	}

	const renderaddremovestock = (team) => {
		return `<div id="addremovestock" class="col">
					<button id="addstock${team}" style='color: white; background-color: black; width:40;'>+</button>
					<button id="removestock${team}" style='color: white; background-color: black; width:40;'>-</button>
				</div>
		`;
	}

	const playgamepage = data => {
		let div = document.getElementById('main');
		div.innerHTML = '';
		div.style.width = `100%`;
		div.style.height = `100%`;
		div.innerHTML = ``;
		div.innerHTML = `<div id='loggedin' style='font-size: 20; float: left;'>Welcome back ${data.username}</div>
						${headert()}
						<div id='game' class="container" align='center' style='text-align: left;'>
							<div class='row' style='float: right; font-size: 20'>
								<div class='col'>
									${data.resettable ? renderreset() : ''}
								</div>
								<div class='col'>
									<button id='leavegame' style='color: white; background-color: black; float:right;'>LeaveGame</button>
								</div>
							</div>
							<div class="row" style='font-size:20;'>
								<span>Admin: &nbsp;</span>
								<span id='admin'>${data.game.admin}</span>
							</div>
							<div class="row" style='font-size:20;'>
								<span>Captains: &nbsp;</span>
								<span id='captains'></span>
							</div>
							<div class="row" style='font-size:20;'>
								<span>Currently picking: &nbsp;</span>
								<span id='picking'></span>
							</div>
							<div class="row">
								<div class="col"></div>
								<div class="col">
									<span id="moveleft" class="fa fa-chevron-left" style="cursor:pointer;"></span>
								</div>
								<div class="col"></div>
								<div class="col">
									<span id="moveright" class="fa fa-chevron-right" style="cursor:pointer;"></span>
								</div>
								<div class="col"></div>
							</div>
							<div class="row">
								<div class="col">
									<div>Team1</div>
									<div class="row" style="font-size: 20;">
										<div class="col">Stocks</div> 
										<div id='t1stocks' class="col">${data.game.team1stocks}</div>
										${data.resettable ? renderaddremovestock('t1') : ''}
									</div>
								</div>
								<div class="col">
									<div>Inbound:</div>
									<div style="font-size: 20;">&nbsp;</div>
								</div>
								<div class="col">
									<div>Team2</div>
									<div class="row" style="font-size: 20;">
										<div class="col">Stocks</div> 
										<div id='t2stocks' class="col">${data.game.team2stocks}</div>
										${data.resettable ? renderaddremovestock('t2') : ''}
									</div>
								</div>
							</div>
							<div class='row'>
								<div class='col' style='border-bottom: 1px solid white; width: 90%'></div>
								<div class='col' style='border-bottom: 1px solid white; width: 90%'></div>
								<div class='col' style='border-bottom: 1px solid white; width: 90%'></div>
							</div>
							<div id='allplayers' class='row' style="max-height: 800px; max-width: 1600px; overflow: auto;">
								<ul id='team1' class="col" style='list-style-type:none;'>
								</ul>
								<ul id='inbound' class="col" style='list-style-type:none; overflow-x: hidden; overflow-y: auto; max-height:300;'>
								</ul>
								<ul id='team2' class="col" style='list-style-type:none;'>
								</ul>
							</div>
						</div>
						${footert()}
		`;
		if (document.getElementById('addremovestock')){
			document.getElementById('addstockt1').addEventListener('click', e=>{
				socket.emit('stockchange', {
					team1stocks: parseInt(document.getElementById('t1stocks').innerHTML)+1
				});
			});
			document.getElementById('addstockt2').addEventListener('click', e=>{
				socket.emit('stockchange', {
					team2stocks: parseInt(document.getElementById('t2stocks').innerHTML)+1
				});
			});
			document.getElementById('removestockt1').addEventListener('click', e=>{
				socket.emit('stockchange', {
					team1stocks: parseInt(document.getElementById('t1stocks').innerHTML)-1
				});
			});
			document.getElementById('removestockt2').addEventListener('click', e=>{
				socket.emit('stockchange', {
					team2stocks: parseInt(document.getElementById('t2stocks').innerHTML)-1
				});
			});
		}
		if (document.getElementById('reset')){
			document.getElementById('reset').addEventListener('click', e=>{
				socket.emit('resetgame');
			});
		}
		document.getElementById('leavegame').addEventListener('click', e=>{
			socket.emit('leavegame');
		});
	}

	socket.on('stockchange', data=>{
		if(document.getElementById('game')){
			document.getElementById('t1stocks').innerHTML = data.team1;
			document.getElementById('t2stocks').innerHTML = data.team2;
		}
	})

	socket.on('gameupdate', data=>{
		if (document.getElementById('game')){
			document.getElementById('admin').innerHTML = data.admin;
			document.getElementById('picking').innerHTML = data.picking;

			setInterval(()=> {
			    $('#picking').animate({
			        opacity: 1.0
			    }, 500).animate({
			        opacity: .2
			    });
			}, 1000);

			document.getElementById('captains').innerHTML = '';
			for(let i=0; i<data.captains.length; i++){
				document.getElementById('captains').innerHTML += `${data.captains[i]} `;
			}
			document.getElementById('team1').innerHTML = '';
			for(let i=0; i<data.team1.length; i++){
				document.getElementById('team1').innerHTML += `<li class='uclick' style='cursor: pointer;'>${data.team1[i]}</li>`;
			}
			document.getElementById('inbound').innerHTML = '';
			for(let i=0; i<data.inbound.length; i++){
				document.getElementById('inbound').innerHTML += `<li class='uclick' style='cursor: pointer;'>${data.inbound[i]}</li>`;
			}
			document.getElementById('team2').innerHTML = '';
			for(let i=0; i<data.team2.length; i++){
				document.getElementById('team2').innerHTML += `<li class='uclick' style='cursor: pointer;'>${data.team2[i]}</li>`;
			}
			let userselected = {};
			let clickers = document.getElementsByClassName('uclick');
			for (let i=0; i<clickers.length; i++){
				clickers[i].addEventListener('click', e=>{
					userselected = {
						username: e.target.textContent,
						container: e.target.parentElement.id
					};
				});
			}
			document.getElementById('moveright').addEventListener('click', e=>{
				if(!userselected.username)
					return;
				socket.emit('updategame', {
					selected: userselected.username,
					container: userselected.container,
					movement: 'right'
				});
				userselected = {};
			});
			document.getElementById('moveleft').addEventListener('click', e=>{
				if(!userselected.username)
					return;
				socket.emit('updategame', {
					selected: userselected.username,
					container: userselected.container,
					movement: 'left'
				});
				userselected = {};
			});
		}
	});

	socket.on("disconnect", function(){
		loginpage();
	});

})();