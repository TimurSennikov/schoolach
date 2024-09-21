const app = require("express")();
const cors = require("cors");
const db = require("better-sqlite3")("server.db");
const bodyparser = require('body-parser');

try{
	db.exec("CREATE TABLE threads(name TEXT)");	
	db.exec("CREATE TABLE messages(thread TEXT, text TEXT)");
}
catch(e){};

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cors());

class Threads{
	exists(name){
		let res = db.prepare("SELECT * FROM threads WHERE name = ?").get(name);

		if(!res || !res.name){return false;}
		else{return true;}
	}

	all(){
		return db.prepare("SELECT * FROM threads").all();
	}

	removeall(){
		db.exec("DELETE FROM threads");
	}

	add(name){
		if(!this.exists(name)){
			db.prepare("INSERT INTO threads VALUES(?)").run(name);
			return true;
		}
		else{return false;}
	}
};

let threads = new Threads();


class Messages{
	postto(thread, msg){
		if(!threads.exists(thread)){threads.add(thread);}
		db.prepare("INSERT INTO messages VALUES(?, ?)").run(thread, msg);
	}

	get(thread){
		return db.prepare("SELECT * FROM messages WHERE thread = ?").all(thread);
	}

	removeall(){
		db.exec("DELETE FROM threads");
	}
};

let messages = new Messages();

app.get("/threads", (req, res) => {
	res.json(threads.all());
});

app.get("/thread", (req, res) => {
	let thread = req.url.split("?")[1];

	res.json(messages.get(decodeURIComponent(thread)));
});

app.post("/send", (req, res) => {
	console.log("test");
	messages.postto(decodeURIComponent(req.body.thread), decodeURIComponent(req.body.text));
	res.sendStatus(200);
});

app.get("/newthread", (req, res) => {
	let spl = req.url.split("?");

	if(spl.length < 2 || spl[1].length <= 0){console.log("Invalid request."); return;}

	threads.add(decodeURIComponent(spl[1]));

	res.sendStatus(200);
});

messages.removeall();
threads.removeall();

app.listen(6675);