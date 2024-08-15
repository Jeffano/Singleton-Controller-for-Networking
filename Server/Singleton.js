// Some code need to be added here, that are common for the module
let sequenceNumber;
let timerInterval = 10;
let timer;

module.exports = {
    init: function() {
       timer = Math.floor(1000 * Math.random()); //any random number
       setInterval(startTimer, timerInterval); 
       sequenceNumber = Math.floor(1000 * Math.random()); //also any random number
    },

    //--------------------------
    //getSequenceNumber: return the current sequence number + 1
    //--------------------------
    getSequenceNumber: function() {
        sequenceNumber++;
        return sequenceNumber;
    },

    //--------------------------
    //getTimestamp: return the current timer value
    //--------------------------
    getTimestamp: function() {
        return timer;
    },
};

function startTimer() {
    timer ++;
    if (timer == 2^32)
        timer = Math.floor(1000 * Math.random()); // timer rest to be within 32 bit
}