const express = require("express")
const cors = require("cors")
require("dotenv").config()
const app = express()
const port = process.env.PORT || 4000
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const jwt = require("jsonwebtoken")
const { response } = require("express")

// middleweres
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//
function varifyJWT(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" })
  }
  const token = authHeader.split(" ")[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      res.status(403).send({ message: "Forbidden" })
    }
    console.log("decoded", decoded)
    req.decoded = decoded
  })
  console.log("inside varifyJWT", authHeader)
  next()
}

// =============== connecting to database =================//
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.woosd.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
})

async function run() {
  try {
    const servicesCollection = client.db("geniusCar").collection("service")
    const orderCollection = client.db("geniusCar").collection("orders")

    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d"
      })
      res.send({ accessToken })
    })

    // getting all services data
    app.get("/service", async (req, res) => {
      await client.connect()
      const query = {}
      const cursor = servicesCollection.find(query)
      const services = await cursor.toArray()
      res.send(services)
    })

    // getting a service
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const service = await servicesCollection.findOne(query)
      res.send(service)
    })

    // post a service
    app.post("/service", async (req, res) => {
      const newService = req.body
      const result = await servicesCollection.insertOne(newService)
      res.send(result)
    })

    // delete a service //
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const result = await servicesCollection.deleteOne(query)
      res.send(result)
    })

    // post orders api//
    app.post("/orders", async (req, res) => {
      const newOrder = req.body
      const result = await orderCollection.insertOne(newOrder)
      res.send(result)
    })

    // get all order api //
    app.get("/orders", async (req, res) => {
      const email = req.query.email
      const query = {}
      const cursor = orderCollection.find(query)
      const orders = await cursor.toArray()
      res.send(orders)
    })
  } finally {
  }
}

run().catch(console.dir)

app.get("/", (req, res) => {
  res.send("running server")
})

app.listen(port, () => {
  console.log("listening")
})
