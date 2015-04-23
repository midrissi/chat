var generator = require('./generator'),
	config = require('config').publisher.password,
	socketID = "notifsManager",
	folder = module.filename.substring(0, module.filename.lastIndexOf('/')),
	swPath = folder + "/workers/notifs-server.js";

exports.publish = function(data, to){
	var s = storage.PUBLISHER;
	var worker = new SharedWorker(swPath, socketID);

	if(s && s.last && s.password && (new Date() - s.last < config.period)){
		// Everything is OK!
	}else{
		exports.generateNew();
	}

	s = storage.PUBLISHER;

	worker.port.postMessage({
		event: 'server',
		password: s.password,
		to: to,
		data: data
	});
};

exports.generateNew = function () {
	storage.PUBLISHER = {
		password: generator.generate(config.length),
		last: new Date()
	};
};

exports.isPwdOk = function (pwd) {
	var s = storage.PUBLISHER;
	
	if(s && s.last && s.password && (new Date() - s.last < config.period)){
		return s.password === pwd;
	}

	generateNew();

	return false;
};

exports.startNotifs = function () {
	httpServer.addWebSocketHandler("/notifs", swPath, socketID, true);
};

exports.stopNotifs = function () {
	httpServer.removeWebSocketHandler(socketID);
};