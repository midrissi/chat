directory.setLoginListener("loginListener", "administrator");
require('publisher').startNotifs();

currentSession().promoteWith("administrator");
ds.Person.remove();
ds.Person.fromArray(require('users'));
