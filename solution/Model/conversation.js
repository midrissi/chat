'use strict';

(function() {
	var m = model.Conversation;
	var events = m.events;
	var eMethods = m.entityMethods;

	events.validate = function() {
		if (!this.p1 || !this.p2) {
			return {
				error: 1,
				errorMessage: 'P1 and P2 are mondatory.'
			};
		}

		if (this.p1.getKey() === this.p2.getKey()) {
			return {
				error: 2,
				errorMessage: 'P1 and P2 must be different.'
			};
		}

		if (this.isNew() && this.getDataClass().get(this.p1, this.p2)) {
			return {
				error: 3,
				errorMessage: 'Conversation already exist.'
			};
		}
	};

	events.restrict = function () {
		return this.getAll();
	};

	m.get = function(p1, p2) {
		if (!p1 || !p2) {
			return null;
		}

		return this.find(
			'(p1.ID == :1 && p2.ID == :2) || (p1.ID == :2 && p2.ID == :1)',
			typeof p1 === 'object' ? p1.getKey() : p1,
			typeof p2 === 'object' ? p2.getKey() : p2
		);
	};

	eMethods.setRead = function () {
		if(this.messages.length > 0){
			var token = currentSession().promoteWith('administrator');

			var m = this.messages.orderBy('date desc').first();
			m.read_status = m.read_status || {};
			m.read_status[sessionStorage.ID] = true;
			m.save();
			currentSession().unPromote(token);
			return true;
		}

		return false;
	}

	eMethods.getPreview = function() {
		var cur = ds.Person(sessionStorage.ID);
		var is_break = false;
		var messages = this.messages.orderBy('date desc');
		var last_message = messages.first();
		var res = {
			unread: 0,
			last_message: '',
			date: null,
			user: null
		};

		if (!last_message) {
			return res;
		}

		res.last_message = last_message.text;
		res.date = last_message.date;
		res.user = last_message.sender.fullname;

		var my_last_message = messages.find('sender.ID == :1 order by date desc', cur.getKey());
		var query;

		if (my_last_message) {
			query = messages.query('date > :1 order by date desc', my_last_message.date);
		}else{
			query = messages;
		}

		query.forEach(function(m, i) {
			if (is_break) {
				return false;
			}

			if(i === 0){
				res.last_message = m.text;
			}

			res.unread++;

			if (m.read_status[cur.getKey()]) {
				is_break = true;
				return false;
			}
		});

		return res;
	};

	m.getAll = function () {
		return this.query('p1.ID == :1 or p2.ID == :1', sessionStorage.ID);
	};

	m.getOne = function (pID, create) {
		var p = ds.Person(pID);
		
		if(!p){
			return null;
		}

		var res = this.get(pID, sessionStorage.ID);

		if(!res && create === true){
			res = new this({
				p1: sessionStorage.ID,
				p2: pID
			});
			res.save();
		}
		return res;
	};
	m.getOne.scope = 'public';
	eMethods.setRead.scope = 'public';
})();