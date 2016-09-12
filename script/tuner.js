
			navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
			var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			var mySampleRate = audioCtx.sampleRate;
			var javascriptNode = audioCtx.createScriptProcessor(1024, 1, 1);
			var gainNode = audioCtx.createGain();
			gainNode.gain.value = 5; 
			var biquadFilter = audioCtx.createBiquadFilter();
			biquadFilter.type = "lowpass";
			biquadFilter.frequency.value = 1500;
			var analyser = audioCtx.createAnalyser();
			analyser.fftSize = 2048;
			analyser.minDecibels = -90;
			analyser.maxDecibels = -10;
			analyser.smoothingTimeConstant = 0.85;
			var bufferLength = analyser.frequencyBinCount;
			var dataArray = new Uint8Array(bufferLength);
			var frequencyVals = [];
			var freqGuess = 0;
			var freqAvg = 0;
			var noteElement = document.getElementById("noteName");
			var noteNames = [ [" C8 Eighth octave ", 4186.01],
			[" B7 ", 3951.07],
			[" A#7 ", 3729.31],
			[" A7 ",    3520],
			[" G#7 ", 3322.44],
			[" G7 ", 3135.96],
			[" F#7 ", 2959.96],
			[" F7 ", 2793.83],
			[" E7 ", 2637.02],
			[" D#7 ", 2489.02],
			[" D7 ", 2349.32],
			[" C#7 ", 2217.46],
			[" C7  ",    2093],
			[" B6 ", 1975.53],
			[" A#6", 1864.66],
			[" A6 ",    1760],
			[" G#6", 1661.22],
			[" G6 ", 1567.98],
			[" F#6 ", 1479.98],
			[" F6 ", 1396.91],
			[" E6 ", 1318.51],
			[" D#6 ", 1244.51],
			[" D6 ", 1174.66],
			[" C#6", 1108.73],
			[" C6 ",  1046.5],
			[" B5 ", 987.767],
			[" A#5", 932.328],
			[" A5 ",     880],
			[" G#5", 830.609],
			[" G5 ", 783.991],
			[" F#5", 739.989],
			[" F5 ", 698.456],
			[" E5 ", 659.255],
			[" D#5", 622.254],
			[" D5 ",  587.33],
			[" C#5", 554.365],
			[" C5", 523.251],
			[" B4 ", 493.883],
			[" A#4", 466.164],
			[" A4",     440],
			[" G#4", 415.305],
			[" G4 ", 391.995],
			[" F#4", 369.994],
			[" F4 ", 349.228],
			[" E4 ", 329.628],
			[" D#4", 311.127],
			[" D4 ", 293.665],
			[" C#4", 277.183],
			[" C4", 261.626],
			[" B3 ", 246.942],
			[" A#3", 233.082],
			[" A3 ",     220],
			[" G#3", 207.652],
			[" G3 ", 195.998],
			[" F#3", 184.997],
			[" F3 ", 174.614],
			[" E3 ", 164.814],
			[" D#3", 155.563],
			[" D3", 146.832],
			[" C#3", 138.591],
			[" C3", 130.813],
			[" B2", 123.471],
			[" A#2", 116.541],
			[" A2 ",     110],
			[" G#2", 103.826],
			[" G2 ", 97.9989],
			[" F#2", 92.4986],
			[" F2", 87.3071],
			[" E2", 82.4069],
			[" D#2", 77.7817],
			[" D2", 73.4162],
			[" C#2", 69.2957],
			[" C2", 65.4064],
			[" B1", 61.7354],
			[" A#1", 58.2705],
			[" A1 ",      55],
			[" G#1", 51.9131],
			[" G1", 48.9994],
			[" F#1", 46.2493],
			[" F1", 43.6535],
			[" E1", 41.2034],
			[" D#1", 38.8909],
			[" D1 ", 36.7081],
			[" C#1", 34.6478],
			[" C1", 32.7032],
			[" B0", 30.8677],
			[" A#0", 29.1352],
			[" A0",    27.5]]

			//canvas
			var canvas = document.getElementById("myCanvas");
			var ctx = canvas.getContext('2d');
			ctx.fillStyle = "white";
			ctx.fillRect(0,0,1024,500);

			var canvastwo = document.getElementById("myCanvasTwo");
			var ctxtwo = canvastwo.getContext('2d');
			ctxtwo.fillStyle = "white";
			ctxtwo.fillRect(0,0,512,500);
			ctxtwo.beginPath();
			ctxtwo.moveTo(0,0);

			function callback(stream){
				window.sourceNode = audioCtx.createMediaStreamSource(stream);
				sourceNode.connect(gainNode);
				gainNode.connect(biquadFilter);
				biquadFilter.connect(analyser);
				analyser.connect(javascriptNode);
				javascriptNode.connect(audioCtx.destination);
				//analyser.getByteFrequencyData(dataArray);
				console.log("Executed First Here");
				// setup the event handler that is triggered every time enough samples have been collected
	            // trigger the audio analysis and draw the results
	            var counter = 0;

	            javascriptNode.onaudioprocess = function () {
	                // get the Time Domain data for this sample
	                analyser.getByteTimeDomainData(dataArray);
	                window.requestAnimationFrame(draw);
	                amdf(freqGuess);

	                if(counter ===40){
	                	freqGuess = ss.mode(frequencyVals);
	                	freqAvg = avgFreq(frequencyVals, freqGuess);
	                	freqHz = mySampleRate/freqAvg;
	                	for(var i=0; i< noteNames.length; i++){
	                		if( Math.abs(freqHz - noteNames[i][1])/freqHz < .025){
	                			noteElement.innerHTML = "Note:  " + noteNames[i][0] + " Freq: " + freqHz;
									//console.log(noteNames[i][0] + " " + freqHz);
								}
							}
							counter=0;
							frequencyVals=[];
							ctxtwo.clearRect(0, 0, canvastwo.width, canvastwo.height);
						}
						counter += 1;

					}


				}
				function callbackError(){
					console.log("Error: ");
				}
				if(navigator.getUserMedia){
					console.log("getUserMedia Works");
					navigator.getUserMedia({video: false, audio: true},callback, callbackError);
				}

			//draw on canvas the magnitude of the sound vs time
			function draw(){
				
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				var maxBinLocation = 0;
				var maxPeakMagnitude = 0;
				
				for(var i=0;i<bufferLength;i++){
					ctx.fillStyle = "rgb(200,0,0)"; // sets the color to fill in the rectangle with
					ctx.fillRect(i, dataArray[i], 1,  1);   // draws the rectangle at position 10, 10 with a width of 55 and a height of 50
				}

			} // end Draw() 

			function amdf(freqGuess){
				var m = 100; // length of array to analyze, N + m <= bufferLength, otherwise it will be out of bounds
				var N = bufferLength - m; // maximum phase shift 

				
				
				ctxtwo.fillStyle = "rgb(200,0,200)"; // sets the color to fill in the rectangle with
				ctxtwo.fillRect(50, 0, 1,100);
				ctxtwo.fillRect(150, 0, 1,100);
				ctxtwo.fillRect(250, 0, 1,100);
				ctxtwo.fillRect(350, 0, 1,100);
				ctxtwo.fillRect(450, 0, 1,100);
				ctxtwo.fillRect(550, 0, 1,100);
				
				var AMDFvalues = []; // Array to store AMDF valuesdataArray
				var AMDFprime = [];
				var AMDFsum = 0;
				var AMDFmin = []; // Array to store minimum AMDF values
				var AMDFsum; //Sum of current AMDF array values

				for (var i=0; i<N; i++ ){
						var sum = 0; // Hold the sum of all amdf values for a given time shift
						for (var j=0; j<m; j++){
							sum += Math.pow(dataArray[j] - dataArray[j+i],2);
						}
						AMDFvalues.push(sum/m);
						AMDFsum += sum;
						if(i===0){
							AMDFprime.push(1); 
						}else{
							AMDFprime.push((100*sum) / (AMDFsum/i)); 
						}
						
						//draw AMDFValues
						ctxtwo.fillStyle = "rgb(200,0,0)"; // sets the color to fill in the rectangle with
						ctxtwo.fillRect(i, AMDFvalues[i], 1,1);
						ctxtwo.fillStyle = "rgb(0,10,200)"; // sets the color to fill in the rectangle with
						ctxtwo.fillRect(i, AMDFprime[i], 1,1);
						
					}

					AMDFmin = findMin(AMDFvalues);

					frequencyVals.push(firstMinPos(AMDFmin, AMDFvalues, freqGuess));
				ctxtwo.fillStyle = "rgb(10,200,0)"; // sets the color to fill in the rectangle with
				ctxtwo.fillRect(freqGuess, AMDFvalues[freqGuess], 5,20);


				}// end amdf()
				function avgFreq(array, meanGuess){
					var sum=0;
					var average = 0;
					var counter =0;
					for(var i=0; i<array.length; i++){
						if(Math.abs(array[i] - meanGuess) < 5){
							sum += array[i];
							counter += 1;
						}
					}
					average = sum/counter;
					return Math.floor(average);

				}//end avgFreq()
				function minThreshold(array){
					for(var i=0; i<array.length; i++){
						if(array[i] < 10){
							var arrayMinX = [];

							for(var i=0; i<array.length; i++){
								var dtf = 1; // forward distance from center
								var center = i - dtf; //center location to calculate slope
								var dtb = 1; // backward distance from center
								if( center - dtb > 0 && center + dtf < array.length){
										//console.log("Min");
									var fSlope = array[center + dtf] - array[center]; // 'forward' slope value
									var bSlope = array[center] - array[center - dtb]; //'backward' slope value

									//if foward slope is positive and backslope is negative, then we have a minimum
									if(fSlope > 0 && bSlope < 0 ){
										arrayMinX.push(center);
										//console.log("Min");
									}

								}
							}
						}
					}
					return arrayMinX;
				}
				
				function findMin(array){
					//determine minimums in the array based on slope change
					//console.log("Min");
					var arrayMinX = [];

					for(var i=0; i<array.length; i++){
						var dtf = 1; // forward distance from center
						var center = i - dtf; //center location to calculate slope
						var dtb = 1; // backward distance from center
						if( center - dtb > 0 && center + dtf < array.length){
								//console.log("Min");
							var fSlope = array[center + dtf] - array[center]; // 'forward' slope value
							var bSlope = array[center] - array[center - dtb]; //'backward' slope value

							//if foward slope is positive and backslope is negative, then we have a minimum
							if(fSlope > 0 && bSlope < 0 ){
								arrayMinX.push(center);
								//console.log("Min");
							}

						}
					}
					return arrayMinX;
				}

				function firstMinPos(arrayX, arrayY, freqGuess){
					var errorFactor=20;
					var newFreq = true;
					var firstMinPos = freqGuess;

					for(var i=0; i<arrayX.length; i++){
						if(Math.abs(arrayX[i] - freqGuess) < 5){
							newFreq = false;
							firstMinPos = arrayX[i];
							//console.log("OldFreq");

						}
					}
					if(newFreq){


						for(var i=0; i<arrayX.length; i++){
							if(i===0){
								var minimumVal = arrayY[arrayX[0]];
							}else if(arrayY[arrayX[i]] < minimumVal){
								minimumVal = arrayY[arrayX[i]];
							}
						}
						//console.log(minimumVal);
						for(var i=0; i<arrayX.length; i++){
							if(arrayY[arrayX[i]] <= errorFactor*minimumVal ){
								firstMinPos = arrayX[i];
								break;
							}

						}
					}
					//console.log(firstMinPos);
					if(firstMinPos)
						return firstMinPos;
					else
						return 0;
				}//end firstMinPos()
