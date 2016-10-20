var noteElement = document.getElementById("noteName");

//canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext('2d');
ctx.fillStyle = "white";
ctx.fillRect(0,0,1024,300);

/*var canvastwo = document.getElementById("myCanvasTwo");
var ctxtwo = canvastwo.getContext('2d');
ctxtwo.fillStyle = "white";
ctxtwo.fillRect(0,0,512,500);*/

//Prompt User for permission to use microphone
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
if(navigator.getUserMedia){
	navigator.getUserMedia({video: false, audio: true},PitchDetect, CallbackError);
}else{
	alert("Error: Could not access UserMedia.");
}
function CallbackError(e){
	console.log("Error: " + e);
}
function PitchDetect(stream){
	//Set up Audio Context
	var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	var gainNode = audioCtx.createGain();
	var biquadFilter = audioCtx.createBiquadFilter();
	var analyser = audioCtx.createAnalyser();
	var javascriptNode = audioCtx.createScriptProcessor(1024, 1, 1);
	
	//Node Settings
	gainNode.gain.value = 5;

	biquadFilter.type = "lowpass";
	biquadFilter.frequency.value = 1500;

	analyser.minDecibels = -90;
	analyser.maxDecibels = -10;
	analyser.smoothingTimeConstant = 0.85;

	//Link nodes
	window.sourceNode = audioCtx.createMediaStreamSource(stream);
	sourceNode.connect(gainNode);
	gainNode.connect(biquadFilter);
	biquadFilter.connect(analyser);
	analyser.connect(javascriptNode);
	javascriptNode.connect(audioCtx.destination);

	var mySampleRate = audioCtx.sampleRate;
	var bufferLength = analyser.frequencyBinCount;
	var dataArray = new Uint8Array(bufferLength);

	//Variables
	var frequencyVals = [];  //Variable that stores the harmonic frequency values every time an array of audio data is analyzed.
	var freqGuess     = 100; //Initial guess of the harmonic frequency, this value also is recalculated as the most common value in 'frequencyVals'
	var freqAvg       = 0; 	 //Variable that holds a closer estimate to the actual frequency.
	var AMDFArray     = [];	 //(AutoSquaredMeanDifferenceFunction). Holds the ASMDF values where each index represent time
	var AMDFmin       = [];  //Array to store minimum AMDF values
	var firstHarmonic;       //The fundamental frequency will be the lowest of the harmonics
	var note;				 //The letter representation of the frequency

	// setup the event handler that is triggered every time enough samples have been collected
    // trigger the audio analysis and draw the results
    var counter = 0;
    javascriptNode.onaudioprocess = function () {
        // get the Time Domain data for this sample
        analyser.getByteTimeDomainData(dataArray);
        
        AMDFArray = amdf(dataArray, bufferLength, freqGuess);
        AMDFmin = findMin(AMDFArray);
        firstHarmonic = firstMinPos(AMDFmin, AMDFArray, freqGuess);
        frequencyVals.push(firstHarmonic);
        window.requestAnimationFrame(function(){ draw(dataArray, ctx, "red", false)});
       // window.requestAnimationFrame(function(){ draw(AMDFArray, ctxtwo, "red", true)}); // AMDF Visual

        if(counter ===30){
	        	freqGuess = ss.mode(frequencyVals);
	        	freqAvg = avgFreq(frequencyVals, freqGuess);
	        	freqHz = Math.floor(mySampleRate/freqAvg);
				note = getNote(freqHz,mySampleRate);
				noteElement.innerHTML = "Note:  " + note + " Freq: " + freqHz;
				//window.requestAnimationFrame(function(){ draw(AMDFArray, ctxtwo, "blue", true)});
				counter=0;
				frequencyVals=[];
		}
		counter += 1;
	}

}//end PitchDetect()

//Get the name of the note that corresponds to the calculated frequency.
function getNote(frequencyHz, sampleRate){
		
		var noteList = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"];
		var noteNumber = Math.round(12*Math.log2(frequencyHz/440)+49);
		var octaveLevel = ( ((noteNumber-3)/12)%1 === 0 ) ? (noteNumber-3)/12 : Math.ceil((noteNumber-3)/12);
		var noteIndex = Math.round( (((noteNumber-1)/12)%1)*12) ;
		var note = noteList[noteIndex] + octaveLevel;
	return note;
}//end getNote()

//draw on canvas the magnitude of the sound vs time
function draw(array, context, color, withBars){
	var N = array.length;
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	for(var i=0;i<N;i++){
		context.fillStyle = color; // sets the color to fill in the rectangle with
		context.fillRect(i, array[i], 1,  1);   // draws the rectangle at position 10, 10 with a width of 55 and a height of 50
	}
	if(withBars){
		var spacing = 100;
		var startLine = 0;
		var endLine = 1000;
		while(startLine < endLine){
			context.fillRect(startLine, 0, 1, 100);
			startLine += spacing;
		}
	}

} // end Draw() 

//Calculate the autocorrelation function using the audio data.
function amdf(dataArray, bufferLength, freqGuess){
	var m = 100; // length of array to analyze, N + m <= bufferLength, otherwise it will be out of bounds
	var N = bufferLength - m; // maximum phase shift, determines lowest frequency detectable (Fmin = SampleFrequency/N) 

	var AMDFvalues = []; // Array to store AMDF valuesdataArray

	for (var i=0; i<N; i++ ){
			var sum = 0; // Hold the sum of all amdf values for a given time shift
			for (var j=0; j<m; j++){
				sum += Math.pow(dataArray[j] - dataArray[j+i],2);
			}
			AMDFvalues.push(sum/m);	
		}

	return AMDFvalues;

}// end amdf()

//Find the average frequency from the 'real values' using the most common of those values.
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

//Determine minimums in the array based on slope change				
function findMin(array){

	var arrayMinX = [];

	for(var i=0; i<array.length; i++){
		var dtf = 1; // forward distance from center
		var center = i - dtf; //center location to calculate slope
		var dtb = 1; // backward distance from center
		if( center - dtb > 0 && center + dtf < array.length){
			var fSlope = array[center + dtf] - array[center]; // 'forward' slope value
			var bSlope = array[center] - array[center - dtb]; //'backward' slope value

			//if foward slope is positive and backslope is negative, then we have a minimum
			if(fSlope > 0 && bSlope < 0 ){
				arrayMinX.push(center);
			}

		}
	}
	return arrayMinX;
}

//Find most likely position of the fundamental frequency. This is accomplished by comparing the minimum AMDF values to see which one is the lowest amplitude
//and lowest frequency.
function firstMinPos(arrayX, arrayY, freqGuess){
	var errorFactor=20;
	var newFreq = true;
	var firstMinPos = freqGuess;

	for(var i=0; i<arrayX.length; i++){
		if(Math.abs(arrayX[i] - freqGuess) < 5){
			newFreq = false;
			firstMinPos = arrayX[i];
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

		for(var i=0; i<arrayX.length; i++){
			if(arrayY[arrayX[i]] <= errorFactor*minimumVal ){
				firstMinPos = arrayX[i];
				break;
			}
		}
	}

	if(firstMinPos)
		return firstMinPos;
	else
		return 0;
}