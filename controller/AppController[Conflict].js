var MyApp = angular
	.module('MyApp', ["ngAnimate",'ui.sortable'])
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

			var INSERT_FCFS = "FCFS",
				INSERT_SSFT = "SSTF",
				INSERT_SCAN = "SCAN",
				INSERT_CSCAN= "C-SCAN";
			$scope.insertionAlgorithms = [
				{name:INSERT_FCFS},
				{name:INSERT_SSFT},
				{name:INSERT_SCAN},
				{name:INSERT_CSCAN}
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
						isFree: true,
						nextIdx:-1 
					}
				}
				return ret;
			})();

			$scope.headSector = 0;
			$scope.freeSpace = 400;
			$scope.freeSectors = $scope.sectors;
			$scope.freeGaps = [{index:0, size:400}];
			$scope.fragmentation = 0;

			$scope.$watch("sectors",function(){
				$scope.freeSectors = $filter("filter")($scope.sectors, {isFree:true});
				freeGaps = [{ index: 0, size:0 }]
				for(idx=0; idx<400; idx++){
					sector = $scope.sectors[idx];
					gap = freeGaps.pop();
					if(sector.isFree){
						if(gap.index == 0 && gap.size == 0){
							gap.index = sector.index;
						}
						gap.size++;
						freeGaps.push(gap);
					}else{
						if(gap.index == 0 && gap.size == 0){
							freeGaps.push(gap);
						}
						else{
							freeGaps.push(gap);
							freeGaps.push({ index: 0, size:0 });
						}
					}
				}
				gap = freeGaps.pop();
				if(gap.size != 0){
					freeGaps.push(gap);
				}
				$scope.freeGaps = freeGaps;
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
				$scope.tasks = [{
					name: $scope.newTaskName, 
					id: $scope.newTaskId, 
					size: $scope.newTaskSize
				}].concat($scope.tasks);

				$scope.newTaskName = TASK_INSERT;
				$scope.newTaskSize = "";
				$scope.newTaskId = "";
			};

			$scope.stepTask = function(){

			}

			$scope.$watch("")
			$scope.doTask = function(){
				task = $scope.tasks.pop();
				if (!task) return;
				if (task.name == TASK_INSERT){
					if($scope.allocation.name == ALLOC_CONTIGUOUS){
						insertIndex = -1;
						if($scope.insertionAlgorithm.name == INSERT_FCFS){
							for(a=0;a<$scope.freeGaps.length; a++){
								gap = $scope.freeGaps[a];
								if (gap.size >= task.size){
									insertIndex = gap.index;
									break;
								}
							}
						}
						console.log("insertIndex:"+insertIndex);
						for(a=insertIndex; a<task.size+insertIndex; a++){
							console.log(insertIndex, a, task.size);
							updatedSector = {
								index: a,
								isFree: false,
								nextIdx: a+1
							}
							if(a==task.size+insertIndex-1){
								updatedSector['nextIdx'] = -1
							}
							$scope.sectors[a] = updatedSector;
						}
					}
				}
			};

			$scope.finishTasks = function(){
				while($scope.tasks.length > 0){
					$scope.doTask();
				}
			}

			$scope.isEmptyOrNull = function() {
			  return function( task ) {
			    return task.id != '' && task.name == TASK_INSERT;
			  };
			};
		}
	);

//jquery Callbacks
focusNewTask = function(){
	setTimeout(function(){$('#newTaskId').focus()},10);
}

