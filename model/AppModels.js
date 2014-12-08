MyApp.factory('File',function(){
		function File(name, size, index, allocationType, allocationTable){
			this.name = name;
			this.size = size;
			this.index = index;
			this.allocationType = allocationType;
			this.allocationTable = allocationTable; //used by FAT seek.
			this.is_doing_FAT_lookup = false;
		};
		return (File);
	})
	.factory('Sector',function(){
		function Sector(index){
			this.index = index;
			this.isFree = true;
			this.fileName = null; 	//used for high-lighting file selection.
			this.fileParts = []; 	//used for indexed allocation SEEK. (ony set in a file's first sector.)
			this.nextIdx = -1; 		//used for linked SEEK.
		};
		return (Sector);
	})
	.factory('Task',function(){
		function Task (name, id, size, offset){
			this.name = name;
			this.id = id;
			this.size = size;
			this.offset = offset;
			this.isActive = false;
			this.seekDistance = null;
			this.step = 0;
		};
		return (Task);
	});

