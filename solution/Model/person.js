'use strict';

(function() {
	var m = model.Person;
	var formatter = require("formatting");
	var eMethods = m.entityMethods;
	var methods = m.methods;
	var events = m.events;

	m.password = {
		onGet: function() {
			return '**********';
		},
		onSet: function(value) {
			this.key = directory.computeHA1(this.getKey(), value);
		}
	};


	m.fullname = {
		onGet: function() {
			var str = "";

			if (this.firstname) {
				str += formatter.formatString(this.firstname, 'c');
			}

			if (this.lastname) {
				str += ' ' + this.lastname.toUpperCase();
			}

			if (!str) {
				return this.username;
			}

			return str;
		}
	};

	events.save = function() {
		if (this.isNew()) {
			publisher.publish({
				event: 'person:new',
				data: this.json()
			}, {
				broadcast: true
			});
		}
	};

	events.remove = function() {
		ds.Conversation.query('p1.ID == :1 or p2.ID == :1', this.getKey()).remove();
	};

	eMethods.isPasswordValid = function(password) {
		return directory.computeHA1(this.getKey(), password) === this.key;
	};

	eMethods.json = function() {
		return {
			__KEY: this.getKey(),
			fullname: this.fullname,
			username: this.username,
			preview: {},
			avatar: this.avatar
		};
	};

	methods.getAll = function() {
		var res = [];
		this.forEach(function(p) {
			if (p.getKey() === sessionStorage.ID) {
				return;
			}

			var conv = ds.Conversation.getOne(p.getKey());

			res.push({
				__KEY: p.getKey(),
				fullname: p.fullname,
				username: p.username,
				preview: conv ? conv.getPreview() : {},
				avatar: p.avatar
			});
		});
		return res;
	};

	methods.getCurrent = function() {
		var p = ds.Person(sessionStorage.ID);

		return {
			__KEY: p.getKey(),
			fullname: p.fullname,
			username: p.username,
			avatar: p.avatar,
			session: currentSession().ID
		};
	};

	methods.getAll.scope = 'public';
	methods.getCurrent.scope = 'public';
})();