MyApp.factory('Sector',function(){
		function Sector(index){
			this.index = index;
			this.isFree = true;
			this.fileName = null; 	//used for high-lighting file selection.
			this.fileParts = []; 	//used for indexed allocation SEEK. (ony set in a file's first sector.)
			this.nextIdx = -1; 		//used for linked SEEK.
		};
		return (Sector);
	})
	.factory('Task',['globals', function(globals){

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

		function Task(name, file, offset){
			this.name = name;
			this.time = new Date();
			this.step = 0;			//number of step for doStep();
			this.isActive = false;	//active state for doStep();
			if(name == TASK_INSERT || name == TASK_DELETE || name == TASK_SEEK){
				this.file = file;		//task's file. Used by TASK_INSERT, TASK_SEEK, TASK_DELETE
				this.size = file.size;	//file size for TASK_INSERT.
			}
			if(name == TASK_SEEK){
				this.seekDistance = null; //distance for TASK_SEEK
				this.seekIndex = null;
				this.offset = offset;	//file offset for TASK_SEEK
			}
		}


		Task.prototype = {
			setSeekDistance: function(headSector, seekScheme, max_sectors){
				if(this.name != TASK_SEEK) return;

				var seekIndex = this.file.index; //ALLOC_INDEXED && ALLOC_LINKED both start at file's first sector. 
				if(this.file.allocationType == ALLOC_CONTIGUOUS){
					seekIndex = this.file.index + this.offset; //ALLOC_CONTIGUOUS simply calculates the offset.
				}
				else if(this.file.allocationType == ALLOC_FAT){
					seekIndex = this.file.allocationTable[this.offset]; //ALLOC_FAT uses the file's allocation table to get the offset.
				}
				this.seekIndex = seekIndex;
				if(seekScheme == SEEK_SSTF || seekScheme == SEEK_FCFS){
					this.seekDistance = Math.abs(headSector - seekIndex);
				}
				else{
					var headPosition = headSector;
					var scanDirection = SCAN_UP;
					var seekDistance = 0;
					while(headPosition != seekIndex){
						seekDistance++;
						if(seekScheme == SEEK_CSCAN){
							headPosition = (headPosition + 1) % max_sectors;
						}
						else if(seekScheme == SEEK_SCAN){
							if( headPosition == max_sectors - 1){
								scanDirection = SCAN_DOWN;
							}
							else if( headPosition == 0){
								scanDirection = SCAN_UP;
							}
							if(scanDirection == SCAN_UP){
								headPosition = headPosition+1;
							}
							else if(scanDirection == SCAN_DOWN){
								headPosition = headPosition-1;
							}
						}
					}
					this.seekDistance = seekDistance;
				}
			}
		}
		return (Task);
	}])
	.factory('File',function(){
		function File(name, size){
			this.name = name;
			this.size = size;
			this.is_doing_FAT_lookup = false;
		};

		File.prototype = {
			write: function (allocationType, allocationTable){
				this.index = allocationTable[0];		//position of first head sector
				this.allocationType = allocationType;
				this.allocationTable = allocationTable; //used by FAT seek.
			}
		}
		return (File);
	});

