var MyApp = angular
	.module('MyApp', ["ngAnimate",'ui.sortable'])
	// .directive('validateRange', ['$parse', function($parse) {

	//     function link($scope, $element, $attrs, ngModel) {
	//         var attrRange, range = [];

	//         function validate(value) {
	//             var validMin = true, validMax = true;
	//             if (typeof range[0] === 'number') {
	//                 ngModel.$setValidity('min', value >= range[0]);
	//                 validMin = value >= range[0];
	//             }
	//             if (typeof range[1] === 'number') {
	//                 ngModel.$setValidity('max', value <= range[1]);
	//                 validMax = value <= range[1];
	//             }
	//             return validMin && validMax ? value : undefined;
	//         }

	//         attrRange = $attrs.validateRange.split(/,/);

	//         range[0] = $parse(attrRange[0] || '')($scope);
	//         range[1] = $parse(attrRange[1] || '')($scope);

	//         $scope.$watchCollection('[' + $attrs.validateRange + ']', function(values) {
	//             range = values;
	//             validate(ngModel.$viewValue);
	//         });

	//         ngModel.$parsers.unshift(validate);
	//         ngModel.$formatters.unshift(validate);
	//     }

	//     return {
	//         link: link,
	//         require: 'ngModel'
	//     };

	// }])
	.value("globals", {  
		ALLOC_CONTIGUOUS	: "Contiguous"	,
		ALLOC_LINKED		: "Link"		,
		ALLOC_INDEXED		: "Index"		,
		ALLOC_FAT			: "FAT"			,
		INSERTION_FIRST		: "First"		,
		INSERTION_BEST		: "Best"		,
		INSERTION_WORST		: "Worst"		,
		SEEK_FCFS			: "FCFS"		,
		SEEK_SSTF			: "SSTF"		,
		SEEK_SCAN			: "SCAN"		,
		SEEK_CSCAN			: "C-SCAN"		,
		TASK_INSERT			: "Insert"		,
		TASK_SEEK			: "Seek"		,
		TASK_DELETE			: "Delete"		,
		TASK_DEFRAG			: "Defrag"		,
		SCAN_DOWN 			: 0				,
		SCAN_UP 			: 1
	})
	.controller('AppController',
		['$scope', '$location', '$filter', 'globals','Task', 'Sector', 'File' ,function($scope, $location, $filter, globals, Task, Sector, File){

			ALLOC_CONTIGUOUS	= globals.ALLOC_CONTIGUOUS;
			ALLOC_LINKED		= globals.ALLOC_LINKED;
			ALLOC_INDEXED		= globals.ALLOC_INDEXED;
			ALLOC_FAT			= globals.ALLOC_FAT;
			INSERTION_FIRST		= globals.INSERTION_FIRST;
			INSERTION_BEST		= globals.INSERTION_BEST;
			INSERTION_WORST		= globals.INSERTION_WORST;
			SEEK_FCFS			= globals.SEEK_FCFS;
			SEEK_SSTF			= globals.SEEK_SSTF;
			SEEK_SCAN			= globals.SEEK_SCAN;
			SEEK_CSCAN			= globals.SEEK_CSCAN;
			TASK_INSERT			= globals.TASK_INSERT;
			TASK_SEEK			= globals.TASK_SEEK	;
			TASK_DELETE			= globals.TASK_DELETE;
			TASK_DEFRAG			= globals.TASK_DEFRAG;
			SCAN_DOWN 			= globals.SCAN_DOWN;
			SCAN_UP 			= globals.SCAN_UP;

			$scope.allocations = [
				{name:ALLOC_CONTIGUOUS, show:true},
				{name:ALLOC_LINKED, show:false},
				{name:ALLOC_INDEXED, show:false},
				{name:ALLOC_FAT, show:false}
			];
			$scope.allocation = $scope.allocations[0];

			$scope.insertionAlgorithms = [ INSERTION_FIRST, INSERTION_BEST, INSERTION_WORST ];
			$scope.insertionAlgorithm = $scope.insertionAlgorithms[0];


			$scope.seekSchemes = [SEEK_FCFS, SEEK_SSTF, SEEK_CSCAN, SEEK_SCAN];
			$scope.seekScheme = $scope.seekSchemes[0];

			// $scope.scanDirection = SCAN_UP;

			function getClearSectors(){
				ret = [];
				for(a=0; a<400; a++){
					ret[a] = new Sector(a);
				}
				return ret;
			};

			$scope.sectors = getClearSectors();

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

			$scope.taskNames = [TASK_INSERT, TASK_SEEK, TASK_DELETE, TASK_DEFRAG];
			$scope.newTaskName = TASK_INSERT;
			$scope.newTaskId = "";
			$scope.newTaskFile = null;
			$scope.makeRandomTaskId();
			$scope.newTaskSize = 1;
			$scope.newTaskOffset = 0;

			$scope.isNewTaskFormOpen = false;

			$scope.$watch('newTaskId',function(){
				if($filter('filter')($scope.files, {name:$scope.newTaskId}).length){
					$scope.newInsertTaskFrom.$setValidity('unique', false);
				}else{
					$scope.newInsertTaskFrom.$setValidity('unique', true);
				}
			});

			$scope.$watch('[seekScheme,headSector]', function(){
				for(a=0; a<$scope.tasks.length; a++){
					if($scope.tasks[a].name != TASK_SEEK) continue;
					$scope.tasks[a].setSeekDistance($scope.headSector, $scope.seekScheme, $scope.sectors.length)
				}
			} ,true);

			$scope.tasks = [];
			$scope.enqueTask = function(passive){
				if(!passive)
					$scope.isNewTaskFormOpen = !$scope.isNewTaskFormOpen;

				var file;
				if($scope.newTaskName == TASK_INSERT){
					file = new File($scope.newTaskId, $scope.newTaskSize);
				}
				if($scope.newTaskName == TASK_SEEK || $scope.newTaskName == TASK_DELETE){
					file = $scope.newTaskFile;
				}
				var task = new Task($scope.newTaskName, file, $scope.newTaskOffset);
				task.setSeekDistance($scope.headSector, $scope.seekScheme, $scope.sectors.length);
				$scope.tasks.push(task);

				$scope.newTaskName = TASK_INSERT;
				// $scope.newTaskId = "";
				$scope.makeRandomTaskId();
				$scope.newTaskSize = 1;
				$scope.newTaskOffset = 0;
			};

			$scope.sortTopSeeks = function(){
				var seeksLength = 0;
				for(idx = 0; idx<$scope.tasks.length; idx++){
					if($scope.tasks[idx].name != TASK_SEEK) break;
					seeksLength++;
				}
				var seeksOrig = $scope.tasks.slice(0,seeksLength);
				var seeks = $filter('orderBy')(seeksOrig, 'time' ,false);
				if($scope.seekScheme == SEEK_CSCAN){
					seeks = $filter('orderBy')(seeks, 'seekDistance' ,true);
				}
				else{
					seeks = $filter('orderBy')(seeks, 'seekDistance' ,false);
				}
				$scope.tasks = seeks.concat($scope.tasks.slice(seeksLength));
			}

			$scope.clickSector = function(sector){
				console.log(sector);
				$scope.selectFile(sector.fileName);
			}
			$scope.clickFile = function(file){
				console.log(file);
				$scope.selectFile(file.name);
			}
			$scope.clickTask = function(task){
				console.log(task);
				if(task.file){
					$scope.selectFile(task.file.name);
				}
			}

			$scope.allocationQueue = [];
			$scope.stepTask = function(){
				if(!$scope.tasks.length) return;
				if($scope.tasks[0].name == TASK_INSERT){
					if(!$scope.tasks[0].isActive){
						$scope.tasks[0].isActive = true
						$scope.allocationQueue = getInsertionQueue($scope.tasks[0].file.size);
						if($scope.allocationQueue.length){
							allocationQueue = $scope.allocationQueue.slice().reverse();
							$scope.tasks[0].file.write($scope.allocation.name, allocationQueue);
							$scope.files.push( $scope.tasks[0].file);
							console.log(allocationQueue);
							$scope.sectors[allocationQueue[0]].fileParts = allocationQueue;
						}
					}
					if($scope.allocationQueue.length){
						$scope.headSector = $scope.allocationQueue.pop();
						if($scope.allocationQueue.length)
							$scope.sectors[$scope.headSector].nextIndex = $scope.allocationQueue[$scope.allocationQueue.length-1];
						$scope.sectors[$scope.headSector].isFree = false;
						$scope.sectors[$scope.headSector].fileName = $scope.tasks[0].file.name;
					}
					//Don't make this an else{...} This if logic relies on the first if.
					if(!$scope.allocationQueue.length){
						$scope.tasks[0].isActive = false;
					}
				}
				if ($scope.tasks[0].name == TASK_SEEK){
					
					activeTasks = $filter('filter')($scope.tasks, {isActive: true});
					if(activeTasks.length < 1){
						$scope.tasks[0].isActive = true;
						$scope.tasks[0].step = 0;
					}
					activeTask = $filter('filter')($scope.tasks, {isActive: true})[0];
					taskIndex = $scope.tasks.indexOf(activeTask); 
					task = $scope.tasks[taskIndex];
					file = task.file;

					if(file.allocationType == ALLOC_CONTIGUOUS){
						if (task.step == 0){
							$scope.headSector = task.seekIndex;
							task.step = task.step + 1;
						}else{
							task.isActive = false;
						}
					}
					else if(file.allocationType == ALLOC_FAT){
						if(task.step == 0){
							file.is_doing_FAT_lookup = true;
							task.step = task.step + 1;
						}
						else if(task.step == 1){
							file.is_doing_FAT_lookup = false;
							$scope.headSector = file.allocationTable[task.offset];
							task.step = task.step + 1;
						}else{
							task.isActive = false;
						}
					}
					else if(file.allocationType == ALLOC_LINKED){
						if(task.step == 0){
							$scope.headSector = file.index;
							task.step = task.step + 1;
						}
						else if(task.step < task.offset){
							$scope.headSector = $scope.sectors[$scope.headSector].nextIndex;
							task.step = task.step + 1;
						}else{
							task.isActive = false;
						}
					}else if(file.allocationType == ALLOC_INDEXED){
						if(task.step == 0){
							$scope.headSector = file.index;
							task.step = task.step + 1;
						}
						else if(task.step == 1){
							$scope.headSector = $scope.sectors[$scope.headSector].fileParts[task.offset];
							task.step = task.step + 1;
						}else{
							task.isActive = false;
						}
					}
				}
				if ($scope.tasks[0].name == TASK_DELETE){
					$scope.tasks[0].isActive = true
					file = $scope.tasks[0].file;
					if($scope.headSector != file.index && !$scope.sectors[file.index].isFree){
						$scope.headSector = file.index;
					}
					else{
						var nextIndex = $scope.sectors[$scope.headSector].nextIndex;
						
						$scope.sectors[$scope.headSector] = new Sector($scope.headSector);

						if(nextIndex>=0){
							$scope.headSector = nextIndex;
						}else{
							$scope.tasks[0].isActive = false;
							fileIndex = $scope.files.indexOf(file);
							$scope.files.splice(fileIndex, 1);
						}
					}
				}
				if ($scope.tasks[0].name == TASK_DEFRAG){

					var files 		=  $scope.files.slice();
					var tasks 		=  $scope.tasks.slice();
					var newTaskName =  $scope.newTaskName ;
					var newTaskFile =  $scope.newTaskFile ;
					var newTaskId 	=  $scope.newTaskId   ;
					var newTaskSize =  $scope.newTaskSize ;
					var allocation  =  $scope.allocation  ;

					$scope.tasks = [];

					for(fileIdx = 0; fileIdx<files.length; fileIdx++){
						$scope.newTaskName = TASK_DELETE;
						$scope.newTaskFile = files[fileIdx];
						$scope.enqueTask(true);
					}
					$scope.finishTasks();

					for(fileIdx = 0; fileIdx<files.length; fileIdx++){
						$scope.newTaskName = TASK_INSERT;
						$scope.newTaskId = files[fileIdx].name;
						$scope.newTaskSize = files[fileIdx].size;
						allocation = $filter('filter')($scope.allocations, {name: files[fileIdx].allocationType})[0];
						$scope.allocation = allocation;
						$scope.enqueTask(true);
						$scope.doTask();
					}
					$scope.tasks 		= tasks 		;
					$scope.newTaskName  = newTaskName 	;
					$scope.newTaskFile  = newTaskFile 	;
					$scope.newTaskId    = newTaskId 	;
					$scope.newTaskSize  = newTaskSize 	;
					$scope.allocation   = allocation  	;
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
