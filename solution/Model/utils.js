'use strict';

(function() {
	var m = model.Utils;
	var methods = m.methods;

	methods.signup = function(user){
		if(!user || typeof user !== 'object'){
			return false;
		}

		delete user.is_admin;
		delete user.key;

		var token = currentSession().promoteWith('administrator');
		var p = new ds.Person(user);

		p.save();

		currentSession().unPromote(token); 
		return true;
	};

	methods.signup.scope = 'public';
})();