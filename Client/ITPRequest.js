// Import the 'console' module for potential future use (note: 'time' is not used in the provided code snippet)
const { time } = require('console');

// Define the size of the request packet header in bytes
let PACKET_SIZE = 12;

// Declare variables for the ITP header fields
let protocolVersion; // Protocol version
let requestType; // Request type (not used in the current context, set to 0 as default)
let sequenceNumber = 0; // Sequence number, initialized to 0
let timerInterval = 10; // Timer interval in milliseconds for the timestamp update
let timestamp; // Timestamp for the request

// Module exports for creating and managing the ITP request packet
module.exports = {
  requestHeader: "", // Bitstream of the request packet header
  payloadLength: 0, // Size of the ITP payload in bytes
  payloadData: "", // Bitstream of the ITP payload

  /**
   * Initializes the ITP request packet with the provided version and image name.
   * @param {number} version - The version of the ITP protocol.
   * @param {string} imgFullName - The full name of the image file including its extension.
   */
  init: function (version, imgFullName) {
    // Assign the provided version to the protocol version field
    protocolVersion = version;

    // Set the request type field to 0 as a default value
    requestType = 0;

    // Increment the sequence number
    sequenceNumber++;

    // Increment the timestamp (initialization)
    timestamp++;

    // Generate a random value for the timestamp within the range [1, 999] to avoid collisions
    timestamp = Math.ceil(Math.random() * 999);

    // Set up a timer to update the timestamp at regular intervals
    setInterval(timerRun, timerInterval);

    // Create a buffer to hold the request header with the predefined packet size
    this.requestHeader = new Buffer.alloc(PACKET_SIZE);

    // Define image extensions and their corresponding numerical codes
    let imageExtension = {
      BMP: 1,
      JPEG: 2,
      GIF: 3,
      PNG: 4,
      TIFF: 5,
      RAW: 15,
    };

    // Extract the image name without extension and convert it to bytes
    let imgNameBytes = stringToBytes(imgFullName.split(".")[0]);

    // Determine the image type code based on the extension
    let imgType = imageExtension[imgFullName.split(".")[1].toUpperCase()];

    // Fill the header buffer with packet field values
    // Store protocol version in the first 4 bits of the header
    storeBitPacket(this.requestHeader, protocolVersion * 1, 0, 4);
    // Store request type in bits 25-32 of the header
    storeBitPacket(this.requestHeader, requestType, 24, 8);
    // Store timestamp in bits 33-64 of the header
    storeBitPacket(this.requestHeader, timestamp, 32, 32);
    // Store image type in bits 65-68 of the header
    storeBitPacket(this.requestHeader, imgType, 64, 4);
    // Store image name length in bits 69-96 of the header
    storeBitPacket(this.requestHeader, imgNameBytes.length, 68, 28);

    // Set the payload length to the length of the image name
    this.payloadLength = imgNameBytes.length;

    // Initialize the payload data buffer with the image name bytes
    this.payloadData = new Buffer.alloc(this.payloadLength);
    for (let j = 0; j < imgNameBytes.length; j++) {
      this.payloadData[j] = imgNameBytes[j];
    }
  },

  /**
   * Constructs and returns the entire request packet as a byte array, including the header and payload.
   * @returns {Buffer} The complete request packet.
   */
  getBytePacket: function () {
    // Create a buffer to hold the entire packet with a size equal to the sum of the payload length and packet header size
    let packet = new Buffer.alloc(this.payloadLength + PACKET_SIZE);

    // Construct the packet by combining the header and payload
    // Copy the header bytes to the packet buffer
    for (let i = 0; i < PACKET_SIZE; i++) {
      packet[i] = this.requestHeader[i];
    }
    // Copy the payload bytes to the packet buffer, starting after the header
    for (let j = 0; j < this.payloadLength; j++) {
      packet[j + PACKET_SIZE] = this.payloadData[j];
    }
    return packet; // Return the constructed packet
  },

  /**
   * Returns the current sequence number incremented by 1.
   * @returns {number} The current sequence number.
   */
  getSequenceNumber: function () {
    return sequenceNumber + 1; // Return the sequence number incremented by 1
  },

  /**
   * Returns the current value of the timestamp.
   * @returns {number} The current timestamp.
   */
  getTimestamp: function () {
    return timestamp; // Return the current timestamp value
  },
};

/**
 * Increments the timestamp by 1 and resets it to a random value within a 32-bit range if it reaches the maximum limit.
 */
function timerRun() {
  timestamp++; // Increment the timestamp by 1
  // Check if the timestamp has reached the maximum limit for a 32-bit unsigned integer
  if (timestamp == 2^32) {
    // If the limit is reached, reset the timestamp to a random value within the valid range
    timestamp = Math.ceil(Math.random() * 999);
  }
}

//// Some usefull methods ////
// Feel free to use them, but DO NOT change or add any code in these methods.

// Convert a given string to byte array
function stringToBytes(str) {
  var ch,
    st,
    re = [];
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xff); // push byte to stack
      ch = ch >> 8; // shift value down by 1 byte
    } while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat(st.reverse());
  }
  // return an array of bytes
  return re;
}

// Store integer value into specific bit poistion the packet
function storeBitPacket(packet, value, offset, length) {
  // let us get the actual byte position of the offset
  let lastBitPosition = offset + length - 1;
  let number = value.toString(2);
  let j = number.length - 1;
  for (var i = 0; i < number.length; i++) {
    let bytePosition = Math.floor(lastBitPosition / 8);
    let bitPosition = 7 - (lastBitPosition % 8);
    if (number.charAt(j--) == "0") {
      packet[bytePosition] &= ~(1 << bitPosition);
    } else {
      packet[bytePosition] |= 1 << bitPosition;
    }
    lastBitPosition--;
  }
}
