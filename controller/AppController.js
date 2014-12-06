var MyApp = angular
	.module('MyApp', ["ngAnimate",'ui.sortable'])
	.directive('duplicate', function () {
		return {
		    restrict: 'A',
		    require: 'ngModel',
		    link: function (scope, elm, attrs, ctrl) {
		        ctrl.$parsers.unshift(function (viewValue) {
		            if (scope[attrs.duplicate].indexOf(viewValue) !== -1) {
		                ctrl.$setValidity('duplicate', false);
		                return undefined;
		            } else {
		                ctrl.$setValidity('duplicate', true);
		                return viewValue;
		            }
		        });
		    }
		};
	})
	.controller('AppController',
		function($scope, $location, $filter){

			$scope.users = {};
			$scope.appScope = {
				activeChat: "public"
			};

			var ALLOC_CONTIGUOUS = "Contiguous",
				ALLOC_LINKED = "Link",
				ALLOC_INDEXED = "Index",
				ALLOC_FAT = "FAT";
			$scope.allocations = [
				{name:ALLOC_CONTIGUOUS, show:true},
				{name:ALLOC_LINKED, show:false},
				{name:ALLOC_INDEXED, show:false},
				{name:ALLOC_FAT, show:false}
			];
			$scope.allocation = $scope.allocations[0];

			var INSERTION_FIRST = "First",
				INSERTION_BEST = "Best",
				INSERTION_WORST = "Worst";
			$scope.insertionAlgorithms = [
				{name:INSERTION_FIRST},
				{name:INSERTION_BEST},
				{name:INSERTION_WORST},
			];
			$scope.insertionAlgorithm = $scope.insertionAlgorithms[0];


			var SEEK_FCFS = "FCFS",
				SEEK_SSFT = "SSTF",
				SEEK_SCAN = "SCAN",
				SEEK_CSCAN= "C-SCAN";
			$scope.seekSchemes = [
				{name:SEEK_FCFS},
				{name:SEEK_SSFT},
				{name:SEEK_SCAN},
				{name:SEEK_CSCAN}
			];
			$scope.seekScheme = $scope.seekSchemes[0];

			$scope.sectors = (function(){
				ret = [];
				for(a=0; a<400; a++){
					ret[a] = {
						index:a,
						isFree: true,
						nextIdx:-1 
					}
				}
				return ret;
			})();

			$scope.headSector = 0;
			$scope.freeSpace = 400;
			$scope.freeSectors = $scope.sectors;
			$scope.files = [];
			$scope.fragmentation = 0;

			$scope.$watch("sectors",function(){
				$scope.freeSectors = $filter("filter")($scope.sectors, {isFree:true});
			});

			var TASK_INSERT = "Insert", 
				TASK_SEEK 	= "Seek", 
				TASK_DELETE = "Delete", 
				TASK_DEFRAG = "Defrag";

			$scope.taskNames = [TASK_INSERT, TASK_SEEK, TASK_DELETE, TASK_DEFRAG];
			$scope.newTaskName = TASK_INSERT;
			$scope.newTaskSize = "";
			$scope.newTaskId = "";

			$scope.isNewTaskFormOpen = false;
			$scope.toggleTaskForm = function(){
				$scope.isNewTaskFormOpen = !$scope.isNewTaskFormOpen;
				focusNewTask();
			}

			$scope.tasks = [];
			$scope.enqueTask = function(){
				$scope.isNewTaskFormOpen = !$scope.isNewTaskFormOpen;
				if(!$scope.newTaskName == TASK_INSERT){
					$scope.newTaskSize = "";
				}
				if($scope.newTaskName == TASK_DEFRAG){
					$scope.newTaskSize = "";
					$scope.newTaskId = "";
				}
				$scope.tasks.push({
					name: $scope.newTaskName, 
					id: $scope.newTaskId, 
					size: $scope.newTaskSize,
					isActive: false
				});

				$scope.newTaskName = TASK_INSERT;
				$scope.newTaskSize = "";
				$scope.newTaskId = "";
				updateActiveIds();
			};

			var allocationQueue = null;
			$scope.stepTask = function(){
				if(!$scope.tasks.length) return;
				$scope.tasks[0].isActive = true;
				if($scope.tasks[0].name == TASK_INSERT){
					if(allocationQueue == null){
						allocationQueue = getInsertionQueue($scope.tasks[0].size);
						if(allocationQueue.length){
							$scope.files.push({name:$scope.tasks[0].id, size:0, index:allocationQueue[allocationQueue.length-1]});
						}
					}
					if(allocationQueue.length){
						allocation = allocationQueue.pop();
						nextIndex = -1;
						if(allocationQueue.length)
							nextIndex = allocationQueue[allocationQueue.length-1];
						$scope.sectors[allocation] = {
							index: allocation,
							isFree: false,
							nextIdx: nextIndex
						};
						console.log('sectorSetTo', $scope.sectors[allocation]);
						$scope.headSector = allocation;
						$scope.files[$scope.files.length-1].size++;
						if(!allocationQueue.length){
							$scope.tasks[0].isActive = false;
						}
					}
				}
				if ($scope.tasks[0].name == TASK_DELETE){
					file = $filter("filter")($scope.files, {name:$scope.tasks[0].id})[0];
					if($scope.headSector != file.index && !$scope.sectors[file.index].isFree){
						$scope.headSector = file.index;
					}
					else{
						var nextIndex = $scope.sectors[$scope.headSector].nextIdx;
						$scope.sectors[$scope.headSector] = {
							index: $scope.headSector,
							isFree: true,
							nextIdx: -1
						};
						if(nextIndex>=0){
							$scope.headSector = nextIndex;
						}else{
							$scope.tasks[0].isActive = false;
							$scope.files = $filter("filter")($scope.files, {name:'!'+$scope.tasks[0].id});
						}
					}
				}
				if(!$scope.tasks[0].isActive){
					$scope.tasks.shift();	
					allocationQueue = null;
				}	
			}

			$scope.doTask = function(){
				if(!$scope.tasks.length) return;
				$scope.tasks[0].isActive = true;
				while($scope.tasks[0].isActive){
					$scope.stepTask();
					if(!$scope.tasks.length) return;
				}
			};
			$scope.finishTasks = function(){
				while($scope.tasks.length > 0){
					$scope.doTask();
				}
			}

			$scope.activeIds = [];
			updateActiveIds = function() {
				activeIds = [];
				for(a=0; a<$scope.tasks.length; a++){
					activeIds.push($scope.tasks[a].id);
				}
				for(a=0; a<$scope.files.length; a++){
					activeIds.push($scope.files[a].name);
				}
				console.log('activeIds',activeIds);
				$scope.activeIds = activeIds;
			};


			getFreeGaps = function(){
				var freeGaps = [];
				for(idx = 0; idx<$scope.sectors.length; idx++){
					if($scope.sectors[idx].isFree){
						if(freeGaps.length <= 0 || !freeGaps[freeGaps.length-1].building){
							freeGaps.push({index:idx, size:0, building:true});
						}
						freeGaps[freeGaps.length-1].size++;
					}
					else if(freeGaps.length){
						freeGaps[freeGaps.length-1].building = false
					}
				}
				return freeGaps;
			}

			/**
			uses current scope layout to handle insertion queue.
			*/
			getInsertionQueue = function(requested_size){
				var gaps = getFreeGaps();
				var queue = [];
				for(index=0; index<gaps.length; index++){
					if(gaps[index].size>=requested_size && $scope.allocation.name == ALLOC_CONTIGUOUS && $scope.insertionAlgorithm.name == INSERTION_FIRST){
						for(a=gaps[index].index; a<requested_size+gaps[index].index; a++){
							queue.push(a);
						}
						console.log(gaps, queue);
						return queue.reverse();
					}
				}
				return queue;
			}
		}
	);

//jquery Callbacks
focusNewTask = function(){
	setTimeout(function(){$('#newTaskId').focus()},10);
}

