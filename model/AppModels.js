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
		SEEK_SSFT			= globals.SEEK_SSFT;
		SEEK_SCAN			= globals.SEEK_SCAN;
		SEEK_CSCAN			= globals.SEEK_CSCAN;
		TASK_INSERT			= globals.TASK_INSERT;
		TASK_SEEK			= globals.TASK_SEEK	;
		TASK_DELETE			= globals.TASK_DELETE;
		TASK_DEFRAG			= globals.TASK_DEFRAG;
		SCAN_DOWN 			= globals.SCAN_DOWN;
		SCAN_UP 			= globals.SCAN_UP;

		function Task (name, id, size, offset){
			this.name = name; //TASK_SEEK, TASK_DELETE, TASK_INSERT, TASK_DEFREAG
			this.id = id;		//the file name
			this.size = size;	//file size for TASK_INSERT.
			this.offset = offset;	//file offset for TASK_SEEK
			this.seekDistance = null; //distance for TASK_SEEK
			this.step = 0;			//number of step for doStep();
			this.isActive = false;	//active state for doStep();
		};
		Task.prototype = {
			setSeekDistance: function(taskFile, headSector, seekScheme, max_sectors){
				file = taskFile;
				if(seekScheme == SEEK_SSFT){
					var seekIndex = file.index; //ALLOC_INDEXED && ALLOC_LINKED both start at file's first sector. 
					if(file.allocationType == ALLOC_CONTIGUOUS){
						seekIndex = file.index + task.offset; //ALLOC_CONTIGUOUS simply calculates the offset.
					}
					else if(file.allocationType == ALLOC_FAT){
						seekIndex = file.allocationTable[task.offset]; //ALLOC_FAT uses the file's allocation table to get the offset.
					}
					this.seekDistance = Math.abs(headSector - seekIndex);
				}
				else{
					headPosition = headSector;
					scanDirection = SCAN_UP;
					seekDistance = 0;
					while(headPosition != file.index){
						console.log(headPosition);
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
								headPosition++;
							}
							if(scanDirection == SCAN_DOWN){
								headPosition--;
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
		function File(name, size, index, allocationType, allocationTable){
			this.name = name;
			this.size = size;
			this.index = index;		//position of first head sector
			this.allocationType = allocationType;
			this.allocationTable = allocationTable; //used by FAT seek.
			this.is_doing_FAT_lookup = false;
		};
		return (File);
	});

