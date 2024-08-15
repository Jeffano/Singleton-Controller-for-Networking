// Define the length of the response packet's header
let HEADER_SIZE = 12;

// Define variables for the header's components
let protocolVersion;

module.exports = {
    headerStream: "", // Binary stream representing the ITP header
    dataLength: 0, // Size of the ITP data payload
    dataStream: "", // Binary stream of the ITP data payload

    // Initialize the packet with given parameters
    init: function (
      version, // Protocol version
      responseCode, // Type of response
      sequenceID, // Packet sequence identifier
      timestamp, // Time of packet creation
      imageData, // Binary data of the image
    ) {
      // Assigning initial packet field values
      protocolVersion = version;
  
      // Constructing the binary stream for the header
      this.headerStream = new Buffer.alloc(HEADER_SIZE);
  
      // Populating the header with protocol fields
      storeBitPacket(this.headerStream, protocolVersion, 0, 4); // Protocol version
      storeBitPacket(this.headerStream, responseCode, 4, 8); // Response type
      storeBitPacket(this.headerStream, sequenceID, 12, 16); // Sequence number
      storeBitPacket(this.headerStream, timestamp, 32, 32); // Timestamp
      storeBitPacket(this.headerStream, imageData.length, 64, 32); // Image data length
  
      // Preparing the data payload binary stream
      this.dataStream = new Buffer.alloc(imageData.length);
  
      // Copying image data into the payload stream
      for (let dataIndex = 0; dataIndex < imageData.length; dataIndex++) {
        this.dataStream[dataIndex] = imageData[dataIndex];
      }
    },
  
    // Compile and return the complete packet as a byte stream
    compilePacket: function () {
      let fullPacket = new Buffer.alloc(this.dataStream.length + HEADER_SIZE);
      // Constructing the complete packet from header and data payload
      for (let headerIndex = 0; headerIndex < HEADER_SIZE; headerIndex++)
        fullPacket[headerIndex] = this.headerStream[headerIndex];
      for (let payloadIndex = 0; payloadIndex < this.dataStream.length; payloadIndex++)
        fullPacket[payloadIndex + HEADER_SIZE] = this.dataStream[payloadIndex];
  
      return fullPacket;
    },
};

//// Some usefull methods ////
// Feel free to use them, but DO NOT change or add any code in these methods.

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
