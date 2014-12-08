var MyApp = angular
	.module('MyApp', ["ngAnimate",'ui.sortable'])
	.controller('AppController',
		['$scope', '$location', '$filter', 'Task', 'Sector', 'File' ,function($scope, $location, $filter, Task, Sector, File){

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
			$scope.insertionAlgorithms = [ INSERTION_FIRST, INSERTION_BEST, INSERTION_WORST ];
			$scope.insertionAlgorithm = $scope.insertionAlgorithms[0];


			var SEEK_FCFS = "FCFS",
				SEEK_SSFT = "SSTF",
				SEEK_SCAN = "SCAN",
				SEEK_CSCAN= "C-SCAN";
			$scope.seekSchemes = [SEEK_FCFS, SEEK_SSFT, SEEK_SCAN, SEEK_CSCAN];
			$scope.seekScheme = $scope.seekSchemes[0];

			// var SCAN_DOWN = 0,
			// 	SCAN_UP = 1;
			// $scope.scanDirection = SCAN_UP;

			$scope.sectors = (function(){
				ret = [];
				for(a=0; a<400; a++){
					ret[a] = new Sector(a);
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
			},true);


			$scope.makeRandomTaskId = function(){
			    var text = "";
			    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			    for( var i=0; i < 5; i++ )
			        text += possible.charAt(Math.floor(Math.random() * possible.length));
				$scope.newTaskId = text;
			}

			var TASK_INSERT = "Insert", 
				TASK_SEEK 	= "Seek", 
				TASK_DELETE = "Delete", 
				TASK_DEFRAG = "Defrag";

			$scope.taskNames = [TASK_INSERT, TASK_SEEK, TASK_DELETE, TASK_DEFRAG];
			$scope.newTaskName = TASK_INSERT;
			$scope.newTaskId = "";
			$scope.makeRandomTaskId();
			$scope.newTaskSize = 1;
			$scope.newTaskOffset = 0;

			$scope.isNewTaskFormOpen = false;

			$scope.$watch('newTaskId',function(){
				if($filter('filter')($scope.files, {name:$scope.newTaskId}).length){
					$scope.newTaskFrom.$setValidity('unique', false);
				}else{
					$scope.newTaskFrom.$setValidity('unique', true);
				}
			});

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

				$scope.tasks.push(
					new Task(
						$scope.newTaskName, 
						$scope.newTaskId, 
						$scope.newTaskSize, 
						$scope.newTaskOffset
					)
				);

				$scope.newTaskName = TASK_INSERT;
				// $scope.newTaskId = "";
				$scope.makeRandomTaskId();
				$scope.newTaskSize = 1;
				$scope.newTaskOffset = 0;
			};

			$scope.allocationQueue = [];
			$scope.stepTask = function(){
				if(!$scope.tasks.length) return;
				if($scope.tasks[0].name == TASK_INSERT){
					if(!$scope.tasks[0].isActive){
						$scope.tasks[0].isActive = true
						$scope.allocationQueue = getInsertionQueue($scope.tasks[0].size);
						if($scope.allocationQueue.length){
							fileName = $scope.tasks[0].id
							fileSize = $scope.allocationQueue[$scope.allocationQueue.length-1];
							allocationQueue = $scope.allocationQueue.slice().reverse();
							$scope.files.push( new File(fileName, 0, fileSize, $scope.allocation.name, allocationQueue) );
							$scope.sectors[$scope.allocationQueue.length-1].fileParts = allocationQueue;
						}
					}
					if($scope.allocationQueue.length){
						$scope.headSector = $scope.allocationQueue.pop();
						if($scope.allocationQueue.length)
							$scope.sectors[$scope.headSector].nextIdx = $scope.allocationQueue[$scope.allocationQueue.length-1];
						$scope.sectors[$scope.headSector].isFree = false;
						$scope.sectors[$scope.headSector].fileName = $scope.tasks[0].id;

						$scope.files[$scope.files.length-1].size++;
					}
					//Don't make this an else{...} This if logic relies on the first if.
					if(!$scope.allocationQueue.length){
						$scope.tasks[0].isActive = false;
					}
				}
				if ($scope.tasks[0].name == TASK_SEEK){
					console.log($scope.seekScheme, $scope.tasks[0]);
					if(!$scope.tasks[0].isActive){
						if($scope.seekScheme == SEEK_FCFS){
							$scope.tasks[0].isActive = true;
						}
						else{
							var getSeekDistance = function(task){
								file = $filter('filter')($scope.files, { name : task.id } )[0];
								if($scope.seekScheme == SEEK_SSFT){
									var seekIndex = file.index; //ALLOC_INDEXED && ALLOC_LINKED && 
									if(file.allocationType == ALLOC_CONTIGUOUS){
										seekIndex = file.index + task.offset;
									}
									else if(file.allocationType == ALLOC_FAT){
										seekIndex = file.allocationTable[task.offset];
									}
									return Math.abs($scope.headSector - seekIndex);
								}
								else if($scope.seekScheme == SEEK_SCAN){
									headPosition = $scope.headPosition;
									scanDirection = SCAN_UP;
									seekDistance = 0;
									while(headPosition != file.index){
										if( headPosition == $scope.sectors.length - 1){
											scanDirection = SCAN_DOWN;
										}
										else if( headPosition == 0){
											scanDirection = SCAN_UP;
										}
										if(scanDirection == SCAN_UP){
											headPosition++;
										}
										if(scanDirection == SCAN_DOWN){
											headPosition--;
										}
										seekDistance++;
									}
									return seekDistance;
								}else if($scope.seekScheme == SEEK_CSCAN){
									headPosition = $scope.headPosition;
									scanDirection = SCAN_UP;
									seekDistance = 0;
									while(headPosition != file.index){
										headPosition = (headPosition + 1) % $scope.sectors.length;
										seekDistance++;
									}
									return seekDistance;
								}
							}
							for(idx = 0; idx<$scope.tasks.length; idx++){
								task = $scope.tasks[idx];
								if(task.name != TASK_SEEK) break;
								$scope.tasks[idx].seekDistance = getSeekDistance(task);
								$scope.tasks[idx].isActive = true;
							}
							activatedSeeks = $filter('filter')($scope.tasks, {isActive:true});
							sortedSeeks = $filter('orderBy')(activatedSeeks, 'distanceFromHead',false);
							$scope.tasks = sortedSeeks.concat($scope.tasks.slice(sortedSeeks));
						}
					}

					task = $scope.tasks[0];
					file = $filter('filter')($scope.files, { name: task.id })[0];

					if(file.allocationType == ALLOC_CONTIGUOUS){
						$scope.headSector = file.index + task.offset
						task.isActive = false;
					}
					else if(file.allocationType == ALLOC_FAT){
						if(task.step  == 0){
							file.is_doing_FAT_lookup = true;
							$scope.tasks[0].step++;
						}else{
							file.is_doing_FAT_lookup = false;
							$scope.headSector = file.allocationTable[task.offset];
							$scope.tasks[0].isActive = false;
						}
					}
					else if(file.allocationType == ALLOC_LINKED){
						if($task.step == 0){
							$head.headSector = file.index;
						}
						if($task.step == task.offset){
							$scope.tasks[0].isActive = false;
						}else{
							$scope.headSector = $scope.sectors[$scope.headSector].nextIndex;
							$scope.tasks[0].step++;
						}
					}else if(file.allocationType == ALLOC_INDEXED){
						if(task.step == 0){
							$scope.headSector = file.index;
						}else{
							$scope.headSector = $scope.sectors[$scope.headSector].fileParts[task.offset];
							$scope.tasks[0].isActive = false;
						}

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
						
						$scope.sectors[$scope.headSector] = new Sector($scope.headSector);

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

			/**
			* Unscoped Helper Function.
			* Uses current scope's setting to return an insertion queue.
			*/
			getInsertionQueue = function(requested_size){
				if($scope.allocation.name == ALLOC_CONTIGUOUS){
					var getContigousGaps = function(){
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
					};
					var getAppropriateGap = function(gaps, gapSize, algorithmName){
						var gapIndex = -1;
						//Itterate over gaps to get the gap best suited for the current setup.
						for(index=0; index<gaps.length; index++){
							gap = gaps[index];
							gapDiffer = gap.size - gapSize
							if(gapDiffer >= 0){
								if(gapIndex < 0){
									gapIndex = index;
								}
								if(algorithmName == INSERTION_FIRST){
									break;
								}
								if(algorithmName == INSERTION_BEST){
									prevGapDiffer = gaps[gapIndex].size - gapSize
									if(prevGapDiffer > gapDiffer){
										gapIndex = index
									}
								}
								if(algorithmName == INSERTION_WORST){
									prevGapDiffer = gaps[gapIndex].size - gapSize
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
						return gaps[gapIndex];
					};
					var convertGapToQueue = function(gap, gapSize){
						var queue = [];
						for(a=gap.index; a<gap.index+gapSize; a++){
							queue.push(a);
						}
						return queue.reverse();
					};
					//convert gap to sector queue
					var availableGaps = getContigousGaps();
					var suitableGap = getAppropriateGap(availableGaps, requested_size, $scope.insertionAlgorithm);
					return convertGapToQueue(suitableGap, requested_size);
				}
				//Non-contigous allocations.
				getNonContigousQueue = function(){
					if($scope.freeSpace >= requested_size){
						var queue = [];
						for(idx=0; idx<$scope.sectors.length && queue.length<requested_size; idx++){
							if($scope.sectors[idx].isFree){
								queue.push(idx);
							}
						}
						return queue.reverse();
					}else{
						alert("Not enough space to complete allocation.");
						return [];
					}
				};
				return getNonContigousQueue();
			}
		}]
	);
