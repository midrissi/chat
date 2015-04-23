'use strict';

(function () {
	var m = model.Message;
	var events = m.events;
	var eMethods = m.entityMethods;
	var methods = m.methods;

	events.init = function () {
		this.date = new Date();
		this.read_status = {};
	};

	events.validate = function () {
		if(!this.conversation){
			return {
				error: 1,
				errorMessage: 'The conversation is mondatory.'
			};
		}

		if([this.conversation.p1.getKey(), this.conversation.p2.getKey()].indexOf(sessionStorage.ID) < 0){
			return {
				error: 2,
				errorMessage: 'Invalid conversation.'
			};
		}
	};

	events.restrict = function () {
		var result = this.createEntityCollection();

		ds.Conversation.forEach(function (conv) {
			result.add(conv.messages);
		});

		return result;
	};

	events.save = function () {
		this.sender = sessionStorage.ID;
		
		if(this.conversation){
			this.conversation.last_message_date = new Date();
			this.conversation.save();
		}

		if (this.isNew()) {
			publisher.publish({
				event: 'chat:new',
				data: this.json()
			}, {
				users: [this.conversation.p1.getKey(),this.conversation.p2.getKey()]
			});
		}
	};

	eMethods.json = function() {
		return {
			text: this.text,
			date: this.date,
			__KEY: this.getKey(),
			sender: {
				__KEY: this.sender.getKey(),
				fullname: this.sender.fullname
			},
			conversation: {
				__KEY: this.conversation.getKey()
			}
		};
	};

	methods.send = function (text, pID) {
		var p = ds.Person.find('ID == :1 or username == :1', pID);
		
		if(!p){
			return false;
		}
		
		var conv = ds.Conversation.getOne(p.getKey(), true);
		
		if(conv){
			new this({
				conversation: conv,
				text: text
			}).save();
			return true;
		}

		return false;
	};
	methods.send.scope = 'public';
})();
