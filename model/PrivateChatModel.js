MyApp.service('PrivateChatModel',
	function(UserModel){
		
		this.activeHash = null;
		this.activeChatUsername = null;
		this.viewedChatCounts = {};

		this.getCurrentUserIndex = function(){
			var user1 = UserModel.username;
			var user2 = this.activeChatUsername;
			return ([user1, user2]).sort().indexOf(UserModel.username);
		};

		this.getMessageSenderUsername = function(userIndex){
			var user1 = UserModel.username;
			var user2 = this.activeChatUsername;
			return ([user1, user2]).sort()[userIndex];
		};

		this.startConversation = function(activeChatUsername){
			this.activeChatUsername = activeChatUsername;
			var user1 = UserModel.username;
			var user2 = this.activeChatUsername;
			this.activeHash = this.getConversationKey([user1, user2]);
			this.viewedChatCounts[this.activeHash] = 0;
		};

		this.hideConversation = function(){
			this.activeHash = null;
			this.activeChatUsername = null;
		};
		
	}
);

