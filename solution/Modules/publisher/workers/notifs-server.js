currentSession().promoteWith('authenticated');

var users = {},
    publisher = require('publisher'),
    config = require('config').publisher.password;

setInterval(function(){
    publisher.generateNew();
}, config.period);

function send(userIdOrRoom, data, isRoom) {
    if (isRoom === true) {
        userIdOrRoom.participants.forEach(function(p) {
            send(p.getKey(), data);
        });

        if (userIdOrRoom.owner) {
            send(userIdOrRoom.owner.getKey(), data);
        }

        return;
    } else if (users.hasOwnProperty(userIdOrRoom)) {
        var u = users[userIdOrRoom];
        for (var sesID in u.sessions) {
            u.sessions[sesID].send(JSON.stringify(data));
        }
    }
}

function remove(webSocket) {
    if (webSocket.user 
        && users.hasOwnProperty(webSocket.user.getKey())
        && users[webSocket.user.getKey()]
        && users[webSocket.user.getKey()].sessions.hasOwnProperty(webSocket._index)
        && users[webSocket.user.getKey()].sessions[webSocket._index]) {

        delete users[webSocket.user.getKey()].sessions[webSocket._index];
    }
}

function verifyWebSocket(webSocket) {
    if (!webSocket.user) {
        webSocket.close();
        return false;
    }

    if (!webSocket.session) {
        webSocket.close();
        return false;
    }

    return true;
}

onconnect = function(event) {
    var webSocket = event.ports[0];

    webSocket.binaryType = 'string';

    webSocket.onmessage = function(message) {
        var data = message.data;

        if(typeof data === 'string'){
            try {
                data = JSON.parse(message.data);
            } catch (e) {
                webSocket.send({
                    event: 'error',
                    data: 'Mamformed message'
                });
                return false;
            }
        }

        switch (data.event) {
            case 'init':
                var s = getSession(data.data);

                if (!s || !s.storage.ID) {
                    webSocket.close();
                    return false;
                }

                var u = users[s.storage.ID];
                var p = ds.Person(s.storage.ID);

                if (!p) {
                    webSocket.close();
                    return false;
                }

                if (!u) {
                    u = users[p.getKey()] = {
                        user: p,
                        sessions: {}
                    }
                }

                var i = 0;
                
                for(var i = 0, s_; s_ = u.sessions[i]; i++){}

                u.sessions[i] = webSocket;
                webSocket.user = p;
                webSocket.session = s;
                webSocket._index = i;
                break;
            case 'server':
                if(publisher.isPwdOk(data.password) && data.data && data.to && typeof data.to === 'object'){
                    var to = data.to;

                    if(to.broadcast){
                        for(var userID in users){
                            send(userID, data.data);
                        }

                        return;
                    }

                    if(Array.isArray(to.users)){
                        to.users.forEach(function(u){
                            send(u, data.data);
                        });
                        return;
                    }

                    if(Array.isArray(to.rooms)){
                        to.rooms.forEach(function(r){
                            send(r, data.data, true);
                        });
                        return;
                    }
                }

                break;
        }
    };

    webSocket.onclose = function() {
        remove(webSocket);
    };
};