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
						nextIdx:-1,
						file: null
					}
				}
				return ret;
			})();

			$scope.headSector = 0;
			$scope.freeSpace = 400;
			$scope.files = [];
			$scope.selectedFile = "";
			$scope.fragmentation = 0;

			$scope.selectFile = function(file){
				if(file && file != $scope.selectedFile){
					$scope.selectedFile = file;
				}else{
					$scope.selectedFile = "";
				}
			}

			$scope.freeSectors = $scope.sectors;
			$scope.$watch("sectors",function(){
				$scope.freeSectors = $filter("filter")($scope.sectors, {isFree:true});
			});

			$scope.activeIds = [];
			$scope.$watch("[tasks,files]",function(){
				activeIds = [];
				for(a=0; a<$scope.tasks.length; a++){
					activeIds.push($scope.tasks[a].id);
				}
				for(a=0; a<$scope.files.length; a++){
					activeIds.push($scope.files[a].name);
				}
				$scope.activeIds = activeIds;
			}, true);

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
			};

			$scope.allocationQueue = [];
			$scope.stepTask = function(){
				if(!$scope.tasks.length) return;
				if($scope.tasks[0].name == TASK_INSERT){
					if(!$scope.tasks[0].isActive){
						$scope.tasks[0].isActive = true
						$scope.allocationQueue = getInsertionQueue($scope.tasks[0].size);
						if($scope.allocationQueue.length){
							$scope.files.push({name:$scope.tasks[0].id, size:0, index:$scope.allocationQueue[$scope.allocationQueue.length-1]});
							console.log("allocated", $scope.allocationQueue);
						}
					}
					if($scope.allocationQueue.length){
						allocation = $scope.allocationQueue.pop();
						nextIndex = -1;
						if($scope.allocationQueue.length)
							nextIndex = $scope.allocationQueue[$scope.allocationQueue.length-1];
						$scope.sectors[allocation] = {
							index: allocation,
							isFree: false,
							nextIdx: nextIndex,
							file: $scope.tasks[0].id
						};
						$scope.headSector = allocation;
						$scope.files[$scope.files.length-1].size++;
					}
					//Don't make this an else{...} This if logic relies on the first if.
					if(!$scope.allocationQueue.length){
						$scope.tasks[0].isActive = false;
					}
				}
				if ($scope.tasks[0].name == TASK_DELETE){
					$scope.tasks[0].isActive = true
					file = $filter("filter")($scope.files, {name:$scope.tasks[0].id})[0];
					if($scope.headSector != file.index && !$scope.sectors[file.index].isFree){
						$scope.headSector = file.index;
					}
					else{
						var nextIndex = $scope.sectors[$scope.headSector].nextIdx;
						$scope.sectors[$scope.headSector] = {
							index: $scope.headSector,
							isFree: true,
							nextIdx: -1,
							file:null
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
					// $scope.allocationQueue = [];
				}	
			}

			$scope.doTask = function(){
				var taskLength = $scope.tasks.length;
				if(!taskLength)return;
				while(taskLength == $scope.tasks.length){
					$scope.stepTask();
				}
			};
			$scope.finishTasks = function(){
				while($scope.tasks.length > 0){
					$scope.doTask();
				}
			}

			$scope.makeRandomTaskId = function(){
			    var text = "";
			    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			    for( var i=0; i < 5; i++ )
			        text += possible.charAt(Math.floor(Math.random() * possible.length));
				$scope.newTaskId = text;
			}

			/**
			* Unscoped Helper Function.
			* Uses current scope's setting to return an insertion queue.
			*/
			getInsertionQueue = function(requested_size){
				if($scope.allocation.name == ALLOC_LINKED){
					if($scope.freeSpace >= requested_size){
						var queue = [];
						for(idx=0; idx<$scope.sectors.length && queue.length<requested_size; idx++){
							if($scope.sectors[idx].isFree){
								queue.push();
							}
						}
						return queue;
					}else{
						alert("Not enough space to complete allocation.");
						return [];
					}
				}
				if($scope.allocation.name == ALLOC_CONTIGUOUS){
					//get gaps.
					var gaps = function(){
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
					}();
					console.log(gaps);
					var gapIndex = -1;
					//Itterate over gaps to get the gap best suited for the current setup.
					for(index=0; index<gaps.length; index++){
						gap = gaps[index];
						gapDiffer = gap.size - requested_size
						if(gapDiffer >= 0){
							if(gapIndex < 0){
								gapIndex = index;
							}
							if($scope.insertionAlgorithm.name == INSERTION_FIRST){
								break;
							}
							if($scope.insertionAlgorithm.name == INSERTION_BEST){
								prevGapDiffer = gaps[gapIndex].size - requested_size
								if(prevGapDiffer > gapDiffer){
									gapIndex = index
								}
							}
							if($scope.insertionAlgorithm.name == INSERTION_WORST){
								prevGapDiffer = gaps[gapIndex].size - requested_size
								if(prevGapDiffer < gapDiffer){
									gapIndex = index
								}
							}
						}
					}
					if(gapIndex < 0){
						alert("Not enough space to complete allocation.");
						return [];
					}
					//convert gap to sector queue
					return function(gap, size){
						var queue = [];
						for(a=gap.index; a<gap.index+size; a++){
							queue.push(a);
						}
						return queue.reverse();
					}(gaps[gapIndex], requested_size);
				}
			}
		}
	);

//jquery Callbacks
focusNewTask = function(){
	setTimeout(function(){$('#newTaskId').focus()},10);
}

