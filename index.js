import express from 'express'
import cors from 'cors'
import { MongoClient } from "mongodb"
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

//CONECTANDO COM O BANCO
let database = null
const mongoClient = new MongoClient(process.env.MONGO_URI)
const promise = mongoClient.connect()
promise.then(()=> database = mongoClient.db("bancoteste"))

//OBTER LISTA DE PARTICIPANTES
app.get("/participants", (req, res) => {
	database.collection("participants").find().toArray().then(participants => {
		res.send(participants);
	});
});

//SALVAR UM PARTICIPANTE
app.post("/participants", (req, res)=>{
    const newParcipant = {
        name: req.body.name,
        idade: Date.now()
    }

    const promise = database.collection("participants").insertOne(newParcipant)
    promise.then(()=> res.sendStatus(201))
    promise.catch(e => res.sendStatus(409))

})

app.listen(5000, ()=>{
    console.log("Running...")
})