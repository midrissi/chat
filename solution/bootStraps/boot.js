directory.setLoginListener("loginListener", "administrator");
require('publisher').startNotifs();

currentSession().promoteWith("administrator");
//ds.Conversation.remove();
if(ds.Person.length === 0){
	ds.Person.fromArray(require('users'));
}

