const ResponsePacket = require("./ITPResponse");
const SingletonController = require("./Singleton");
const FileSystem = require("fs");

// Maps to store client details
let Nicknames = {};
let IPAddresses = {};
let ConnectionTimestamps = {};

module.exports = {
  handleClientJoining: function (socket) {
    // Assigns a unique nickname and logs connection
    nicknameClient(socket, Nicknames);
    console.log(
      "\n" + Nicknames[socket.id] +
      " is connected at timestamp: " +
      ConnectionTimestamps[socket.id]
    );

    // Event listeners for socket interactions
    socket.on("data", function (receivedPacket) {
      handleRequests(receivedPacket, socket); // Process and respond to client requests
    });
    socket.on("close", function () {
      logDisconnection(socket);
    });
  },
};

// Handles the client's requests after receiving data
function handleRequests(packet, socket) {
  console.log("\nITP packet received:");
  printPacketBit(packet); // Unchanged utility function

  // Parsing packet data to extract request details
  let protocolVersion = parseBitPacket(packet, 0, 4);
  let reqTypeCode = parseBitPacket(packet, 24, 8);
  let reqTypeNames = {
    0: "Query",
    1: "Found",
    2: "Not found",
    3: "Busy",
  };
  let fileTypeMap = {
    1: "BMP",
    2: "JPEG",
    3: "GIF",
    4: "PNG",
    5: "TIFF",
    15: "RAW",
  };
  let packetTimestamp = parseBitPacket(packet, 32, 32);
  let fileTypeCode = parseBitPacket(packet, 64, 4);
  let fileType = fileTypeMap[fileTypeCode];
  let nameLength = parseBitPacket(packet, 68, 28);
  let fileName = bytesToString(packet.slice(12, 13 + nameLength));
  
  // Logging request details
  console.log(
    "\n" + Nicknames[socket.id] +
    " requests:" +
    "\n    --ITP version: " + protocolVersion +
    "\n    --Timestamp: " + packetTimestamp +
    "\n    --Request type: " + reqTypeNames[reqTypeCode] +
    "\n    --Image file extension(s): " + fileType +
    "\n    --Image file name: " + fileName + "\n"
  );

  // Handling protocol version 9 with image retrieval
  if (protocolVersion == 9) {
    let fullPath = "images/" + fileName + "." + fileType;
    let fileData = FileSystem.readFileSync(fullPath);   

    ResponsePacket.init(
      protocolVersion,
      1, // Found
      SingletonController.getSequenceNumber(), // Unique sequence number
      SingletonController.getTimestamp(), // Current timestamp
      fileData, // The image data
    );

    // Sending the response packet to client and closing connection
    socket.write(ResponsePacket.compilePacket());
    socket.end();
  } else {
    console.log("The protocol version is not supported");
    socket.end();
  }
}

// Logs when a client disconnects
function logDisconnection(socket) {
  console.log(Nicknames[socket.id] + " closed the connection");
}

// Assigns a unique nickname based on the socket connection
function nicknameClient(socket, nicknamesMap) {
  socket.id = socket.remoteAddress + ":" + socket.remotePort;
  ConnectionTimestamps[socket.id] = SingletonController.getTimestamp();
  var clientNickname = "Client-" + ConnectionTimestamps[socket.id];
  nicknamesMap[socket.id] = clientNickname;
  IPAddresses[socket.id] = socket.remoteAddress;
}

//// Some usefull methods ////
// Feel free to use them, but DO NOT change or add any code in these methods.

// Returns the integer value of the extracted bits fragment for a given packet
function parseBitPacket(packet, offset, length) {
    let number = "";
    for (var i = 0; i < length; i++) {
        // let us get the actual byte position of the offset
        let bytePosition = Math.floor((offset + i) / 8);
        let bitPosition = 7 - ((offset + i) % 8);
        let bit = (packet[bytePosition] >> bitPosition) % 2;
        number = (number << 1) | bit;
    }
    return number;
}

// Prints the entire packet in bits format
function printPacketBit(packet) {
    var bitString = "";

    for (var i = 0; i < packet.length; i++) {
        // To add leading zeros
        var b = "00000000" + packet[i].toString(2);
        // To print 4 bytes per line
        if (i > 0 && i % 4 == 0) bitString += "\n";
        bitString += " " + b.substr(b.length - 8);
    }
    console.log(bitString);
}

// Converts byte array to string
function bytesToString(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result += String.fromCharCode(array[i]);
    }
    return result;
}
