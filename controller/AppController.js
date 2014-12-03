var MyApp = angular
	.module('MyApp', ["ngAnimate"])
	.controller('AppController',
		function($scope, $location){

			$scope.users = {};
			$scope.appScope = {
				activeChat: "public"
			};
		}
	);

