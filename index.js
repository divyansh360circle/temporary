const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
var ExpressBrute = require('express-brute');
const { default: mongoose } = require("mongoose");
const QrLogin = require("./models/QrLogin");
var store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
var bruteforce = new ExpressBrute(store);
const { Expo } = require('expo-server-sdk')
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

});


const initializeDB = () => {
  mongoose.set("strictQuery", true);
  mongoose
    .connect("mongodb+srv://Divyansh_Singh:2i0tP3BWOHIqFuPi@cluster0.od1jb9h.mongodb.net/?retryWrites=true&w=majority")
    .then(console.log("Database connected"))
    .catch((error) => console.log(error));
};
app.post("/upload", async (req,res)=>{
  // const { filesData: files, folderName } = ctx.request.body;
  const files = req.body.files.file; // file is the attribute/input name in your frontend app "Form-Data"
  // console.log("files : ", files);

  const myFiles = Array.isArray(files)
    ? files
    : typeof files === "object"
    ? [files]
    : null; // to handle single file and multiple files
  // console.log("myFiles : ", myFiles);

  if (myFiles) {
    try {
      const filePromises = myFiles.map(async (file) => {
        const s3 = new AWS.S3(AWS_CONFIG);

        //   var { path, name, type } = file;
        var { filepath, newFilename, originalFilename, mimetype } = file;
        // console.log(filepath, newFilename, originalFilename, mimetype)

        const body = fs.createReadStream(filepath);

        const params = {
          Bucket: `${process.env.AWS_S3_BUCKET_NAME}/vikram`,
          Key: originalFilename,
          Body: body,
          ContentType: mimetype,
        };

        // const data = await s3.upload(params);
        // console.log("data : ", data);

        return new Promise(function (resolve, reject) {
          s3.upload(params, function (error, data) {
            if (error) {
              reject(error);
              return;
            }

            if (data) {
              console.log(data);
              resolve(data);
              return;
            }
          });
        });
      });

      var results = await Promise.all(filePromises);
      res.send(200).json({results});

      // ctx.status = 200;
      // ctx.body = "file uploaded!";
    } catch (error) {
      console.error(error);
      // ctx.status = 500;
      // ctx.body = error;
    }
  }
});

app.post('/webhook', async(req,res)=>{
  console.log(req.body)
  res.send("done")
})
app.get('/webhook', async(req,res)=>{
  console.log(req.body)
  res.send("done")
})
app.get("/getData/:id?",bruteforce.prevent, async(req,res)=>{
  const user = await QrLogin.findOne({username : req.params.id})
  console.log(user, req.params.id, "this is user")
  if(!user){
    return res.status(404).json({message: "User not found"})
  }
  const token = jwt.sign(req.params.id, "?kvw^%zWK8R^f-6p{ZMU`p[$XCgzr<![/?ymzVf+Nf<b=C8^/Y");
   res.cookie("token", token, {
    path: "/",
    maxAge: 1000 * 60 * 60,
    httpOnly: false,
    sameSite: "lax",
  });
  // res.cookie(`Cookie token name`,`encrypted cookie string Value`);
  res.status(200).json({message:token})
})
app.use('/',(req,res)=>{
  res.status(200).send("server started")
})
server.listen(5000, () => {
  initializeDB()
  console.log("SERVER IS RUNNING");
});

// console.log("starting server")


//   const messages = [
//     {
//       to: 'ExponentPushToken[VcTPY6BDSlzLEXBP7rvcL]',
//       sound: 'default',
//       body: "message nsv",
//       title: "Hello!"
//     }
//   ];
//   // expoTokens.forEach(expoToken => {
//   //   messages.push({
//   //     to: expoToken,
//   //     sound: 'default',
//   //     body: message,
//   //     title: "Hello!"
//   //   });
//   // });

//   const expoTokens = async()=>{ 
//     const expo = new Expo();
//     const chunks = expo.chunkPushNotifications(messages);
//     for (const chunk of chunks) {
//       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       console.log(ticketChunk);
//     }
//   }

  // expoTokens()
// let expo = new Expo({ accessToken: "2SBxWqQVdMQ7SgGtQV0FMVwDk8-SQZo-JE1lX4Op"});

// // Create the messages that you want to send to clients
// let messages = [];

// // let somePushTokens = ["ExponentPushToken[VcTPY6BDSlzLEXBP7rvcL]"]
// let somePushTokens = ["ExponentPushToken[eo-M5TGFQw6SpVNg9yWXP9:APA91bFwoc4Ruk0KCOv7jP6uMKEXNMErCVlhF7ikh0MNLUNOYgjOmNp9OIKdZezsQ3XgZFkFg40Gqs9O1fbTwVY_a4FO43l1US-wdLsdL7ZGhj4upyEDaXFQtRodC7w2cSUqMeY8ND74]"]
// for (let pushToken of somePushTokens) {
//   // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

//   // Check that all your push tokens appear to be valid Expo push tokens
//   if (!Expo.isExpoPushToken(pushToken)) {
//     console.error(`Push token ${pushToken} is not a valid Expo push token`);
//     continue;
//   }

//   // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
//   messages.push({
//     to: pushToken,
//     sound: 'default',
//     body: 'This is a test notification',
//     data: { withSome: 'data' },
//   })
// }
// let chunks = expo.chunkPushNotifications(messages);
// let tickets = [];
// (async () => {
//   for (let chunk of chunks) {
//     try {
//       let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       console.log(ticketChunk);
//       tickets.push(...ticketChunk);
  
//     } catch (error) {
//       console.error(error);
//     }
//   }
// })();

// let receiptIds = [];
// for (let ticket of tickets) {
//   if (ticket.id) {
//     receiptIds.push(ticket.id);
//   }
// }

// let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
// (async () => {
//   // Like sending notifications, there are different strategies you could use
//   // to retrieve batches of receipts from the Expo service.
//   for (let chunk of receiptIdChunks) {
//     try {
//       let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
//       console.log(receipts);

//       // The receipts specify whether Apple or Google successfully received the
//       // notification and information about an error, if one occurred.
//       for (let receiptId in receipts) {
//         let { status, message, details } = receipts[receiptId];
//         if (status === 'ok') {
//           continue;
//         } else if (status === 'error') {
//           console.error(
//             `There was an error sending a notification: ${message}`
//           );
//           if (details && details.error) {
//             // The error codes are listed in the Expo documentation:
//             // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
//             // You must handle the errors appropriately.
//             console.error(`The error code is ${details.error}`);
//           }
//         }
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   }
// })();

// console.log("Ending server ")