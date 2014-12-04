var MyApp = angular
	.module('MyApp', ["ngAnimate"])
	.controller('AppController',
		function($scope, $location, $filter){

			$scope.users = {};
			$scope.appScope = {
				activeChat: "public"
			};
			$scope.allocations = [
				{name:"Contiguous", show:true},
				{name:"Link", show:false},
				{name:"Index", show:false},
				{name:"FAT", show:false}
			];
			$scope.allocation = $scope.allocations[0];

			$scope.insertionAlgorithms = [
				{name:"FCFS"},
				{name:"SSTF"},
				{name:"SCAN"},
				{name:"C-SCAN"}
			];
			$scope.insertionAlgorithm = $scope.insertionAlgorithms[0];

			$scope.seekSchemes = [
				{name:"First"},
				{name:"Best"},
				{name:"Worst"},
			];
			$scope.seekScheme = $scope.seekSchemes[0];

			$scope.sectors = (function(){
				ret = [];
				for(a=0; a<400; a++){
					ret[a] = {
						index:a,
						status:"f",
						head: ""
					};
					if(a > 25 && a< 67 ){
						ret[a]['status'] = "t"
					}
					if(a == 284 ){
						ret[a]['head'] = "h"
					}
				}
				return ret;
			})();

			$scope.headSector = 0;
			$scope.freeSectors = $scope.sectors.length;
			$scope.filledSectors = 0;
			$scope.fragmentation = 0;

			$scope.$watch("sectors",function(){
				$scope.headSector = $filter("filter")($scope.sectors, {head:"h"})[0].index;
				$scope.freeSectors = $filter("filter")($scope.sectors, {status:"f"}).length;
				$scope.filledSectors = $scope.sectors.length - $scope.freeSectors;
			});

			$scope.newTaskId = "";
			$scope.newTaskTypes = [
				{name:"Insert"},
				{name:"Seak"},
				{name:"Delete"},
				{name:"Defrag"}
			];
			$scope.newTaskType = $scope.newTaskTypes[0];
			$scope.isNewTaskFormOpen = false;

			$scope.tasks = [];
			$scope.enqueTask = function(){
				$scope.tasks = [{id:$scope.newTaskId, type:$scope.newTaskType.name}].concat($scope.tasks);
				console.log($scope.tasks);
				$scope.isNewTaskFormOpen = !$scope.isNewTaskFormOpen;
				$scope.newTaskId = "";
				$scope.newTaskType = $scope.newTaskTypes[0];
			};

			$scope.dequeTask = function(){
				
			};
		}
	);

