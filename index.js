import express from 'express'
import cors from 'cors'
import { MongoClient } from "mongodb"
import dotenv from 'dotenv'
dotenv.config()
import dayjs from 'dayjs'

const app = express()
app.use(express.json())
app.use(cors())

//CRIANDO CONEXÃO COM O BANCO
const mongoClient = new MongoClient(process.env.MONGO_URI)

//OBTER LISTA DE PARTICIPANTES
app.get("/participants", async (req, res) => {
    try{
        await mongoClient.connect()
        const db = mongoClient.db(process.env.BANCO_MONGO)
        const participantsColection = db.collection('participants')

        await participantsColection.find().toArray().then(participants =>{
            res.send(participants)
        })
        mongoClient.close()
    }catch{
        res.sendStatus(409)
    }
});

//OBTER MENSSAGENS
app.get("/messages", async (req, res) => {
    try{
        await mongoClient.connect()
        const db = mongoClient.db(process.env.BANCO_MONGO)
        const messagesColection = db.collection('mesageteste')

        await messagesColection.find().toArray().then(messages =>{
            res.send(messages)
        })
        mongoClient.close()
    }catch{
        res.sendStatus(409)
    }
});

//SALVAR UM PARTICIPANTE
app.post("/participants", async (req, res)=>{
    try{
        await mongoClient.connect()
        const db = mongoClient.db(process.env.BANCO_MONGO)
        const participantsColection = db.collection('participants')
        
        const newParcipant = {
            name: req.body.name,
            lastStatus: Date.now()
        }
        await participantsColection.insertOne(newParcipant)

        //SALVANDO MENSSAGEM
        const mesageColection = db.collection('mesageteste')
        const newmesage = {
            from: req.body.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: getTime()
        }
        await mesageColection.insertOne(newmesage)

        res.sendStatus(201)
        mongoClient.close()
    }catch{
        res.sendStatus(409)
    }
})

//OBTER A HORA NO MOMENTO
function getTime(){
    let hh = dayjs().hour()
    let mm = dayjs().minute()
    let ss = dayjs().second()

    if(dayjs().hour() < 10){
        hh =`0${dayjs().hour()}`
    }
    if(dayjs().minute() < 10){
        mm =`0${dayjs().minute()}`
    }
    if(dayjs().second() < 10){
        ss =`0${dayjs().second()}`
    }
    return `${hh}:${mm}:${ss}`
}

app.listen(5000, ()=>{
    console.log(getTime())
})