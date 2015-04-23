function loginListener(username, password) {
	var dsDir = solution.getApplicationByName("solution").ds;
	var p = dsDir.Person.find('username == :1', username);

	if (p == null)
		return false;

	if (p.isPasswordValid(password)) {
		var groups = ['authenticated'];

		if (p.is_admin) {
			groups = ['administrator'];
		}

		return {
			ID: p.getKey(),
			name: username,
			fullName: p.fullname,
			belongsTo: groups,
			storage: {
				time: new Date(),
				ID: p.getKey()
			}
		};
	}

	return {
		error: 1024,
		errorMessage: "invalid login or password!"
	}
}