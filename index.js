const express = require('express')

const bodyParser = require('body-parser');

const cors = require('cors');

const fileUpload = require('express-fileupload');

const ObjectId = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;


const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const saltRounds = 10;

require('dotenv').config();
const app = express();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ieei5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(express.static('boarders'));
app.use(fileUpload());








app.get('/', (req, res) => {

   res.send("server working");


})

client.connect(err => {

   const userCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL1);
   const serviceCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL2);
   const orderCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL3);

   console.log("connected")



   app.get('/isUser', (req, res) => {
      boarderCollection.find({ email: req.query.email })
         .toArray((err, documents) => {
            res.send(documents.length > 0);
         })
   })
   app.post('/verifyUser', (req, res) => {
      const { email, otp } = req.body
      console.log(email, otp)

      userCollection.find({ email: email })
         .toArray((err, documents) => {
            const info = { ...documents[0] };
            if (documents.length) {
               bcrypt.compare(otp, info.otp, function (err, response) {
                  if (response) {

                     userCollection.updateOne({ email: email },
                        {
                           $set: {
                              ...info,
                              verified: true
                           }
                        })
                        .then((result) => {
                           res.send(result.modifiedCount > 0)
                        });
                  }
                  else {
                     res.json({ message: "Your email address has already been verified.Please go to login!" });
                  }
               });
            } else { }

         })
   })
   app.post('/signup', async (req, res) => {
      const { name, contact, email, address, password, admin, user } = req.body;
      console.log(req.body)

      userCollection.find({ email: email, verified: true })
         .toArray((err, result) => {
            console.log(result)
            if (result.length > 0) {
               console.log("user not found")
               res.send(false);
            }
            else {
               bcrypt.genSalt(saltRounds, (err, salt) => {
                  bcrypt.hash(password, salt, (err, hashPassword) => {
                     console.log("hashPassword--->", hashPassword)
                     let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                           user: process.env.email,
                           pass: process.env.pass
                        }
                     });

                     try {
                        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

                        let mailOptions = {
                           from: "ruetakash@gmail.com",
                           to: email,
                           subject: 'Verify your Email',
                           html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete registration.</p><p>This code <b>expires in 5 minutes</b>.</p>`,
                        };

                        const hashOTP = bcrypt.hash(otp, saltRounds);
                        console.log(hashOTP);


                        transporter.sendMail(mailOptions, (err, resp) => {
                           if (err) {
                              console.log("transporter error-->", err);
                              mailResponse = false
                              res.send(false)

                           }
                           else {
                              const guestImg = req.body.base64;
                              const imgSize = req.body.fileSize;
                              const type = req.body.type;


                              const image = {
                                 contentType: type,
                                 size: imgSize,
                                 img: Buffer.from(guestImg, 'base64')
                              };
                              console.log(resp);
                              const newUser = {
                                 name: name,
                                 contact: contact,
                                 email: email,
                                 address: address,
                                 password: hashPassword,
                                 // createdAt: new Date().getTime(),
                                 // expiresAt: new Date().getTime() + 300000,
                                 verified: false,
                                 otp: hashOTP,
                                 admin: admin,
                                 user: user,
                                 ...image

                              }
                              userCollection.find({ email: email, verified: false })
                                 .toArray((err, result) => {
                                    console.log(result.length);
                                    if (result.length > 0) {
                                       userCollection.deleteMany({ email: email })
                                          .then(result => {
                                             console.log("delete", result.deletedCount)
                                             userCollection.insertOne(newUser)
                                                .then(result => {
                                                   console.log("asche", result)
                                                   res.send(result.acknowledged);
                                                })
                                             // if (result.deletedCount > 0) {
                                             //    userCollection.insertOne(newUser)
                                             //       .then(result => {
                                             //          console.log("asche",result)
                                             //          res.send(result.insertedCount > 0);
                                             //       })
                                             // }else{

                                             // }
                                          })
                                    }
                                    else {
                                       userCollection.insertOne(newUser)
                                          .then(result => {
                                             console.log("ascheeee", result)
                                             res.send(result.acknowledged);
                                          })
                                    }
                                 })
                           }
                        });

                     }
                     catch (err) {
                        console.log(err.message);

                     }
                     // user.insertOne({ ...borderInfo, password: hash })
                     //    .then(result => {
                     //       res.send(result.insertedCount > 0)
                     //    })
                  });
               });
            }
         })



   })


   app.get('/isAdmin', (req, res) => {
      adminCollection.find({ email: req.query.email })
         .toArray((err, documents) => {
            res.send(documents.length > 0);
         })
   })


   app.post('/addService', (req, res) => {
      // const serviceImg = req.body.base64;
      // const imgSize = req.body.fileSize;
      // const type = req.body.type;
      // const title = req.body.title;
      // const category = req.body.category;
      // const cause = req.body.cause;
      // const symptoms = req.body.symptoms;
      // const price = req.body.price;
      const { base64, fileSize, type, title, category, cause, symptoms, price } = req.body

      const image = {
         contentType: type,
         size: fileSize,
         img: Buffer.from(base64, 'base64')
      };
      const serviceInfo = { title: title, category: category, cause: cause, symptoms: symptoms, price: price, ...image }
      console.log(serviceInfo);
      serviceCollection.insertOne(serviceInfo)
         .then(result => {
            res.send(result.acknowledged)
         })
   })



   app.get('/allServices', (req, res) => {

      serviceCollection.find({})

         .toArray((err, documents) => {
            res.send(documents);
         })
   })



   app.delete('/deleteService/:id', (req, res) => {
      serviceCollection.deleteOne({ _id: ObjectId(req.params.id) })
         .then(result => {
            res.send(result.deletedCount > 0);
         })
   })
   app.patch('/updateServiceInfo/:id', (req, res) => {
      console.log(req.body)
      const { title, category, cause, symptoms, price } = req.body
      serviceCollection.updateOne({ _id: ObjectId(req.params.id) },
         {
            $set: {
               title: title,
               cause: cause,
               symptoms: symptoms,
               price: price,
               // category: category,
            }
         })
         .then((result) => {
            res.send(result.modifiedCount > 0)
         });
   })


   //room section end



   app.post('/login', (req, res) => {
      const myPassword = req.body.password;
      console.log(req.body)

      userCollection.find({ email: req.body.email })
         .toArray((err, documents) => {
            const info = { ...documents[0] };
            // console.log(info)
            if (documents.length) {
               bcrypt.compare(myPassword, info.password, function (err, response) {
                  if (response) {
                     res.json({ info: info, message: "Login successful", login: true });
                  }
                  else {
                     res.json({ message: "Email or password is incorrect", login: false });
                  }
               });
            } else {
               res.send({ message: "You are not an user. Please register now.", login: false });
            }
         })


   })

   app.post('/placeOrder', (req, res) => {

      console.log(req.body)

      orderCollection.insertOne(req.body)
         .then(result => {
            res.send(result.acknowledged)
         })

   })

   app.get('/orders', (req, res) => {
      console.log("hi")
      orderCollection.find({})
         .toArray((err, documents) => {
            res.send(documents);
         })
   })


   app.patch('/updateStatus', (req, res) => {
      console.log(req.body)
      const { status, _id } = req.body
      orderCollection.updateOne({ _id: ObjectId(_id) },
         {
            $set: {
               status: status
            }
         })
         .then((result) => {
            res.send(result.modifiedCount > 0)
         });
   })


});

app.listen(process.env.PORT || 8085);


