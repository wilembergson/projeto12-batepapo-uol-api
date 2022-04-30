import express from 'express'
import cors from 'cors'
import { MongoClient } from "mongodb"
import dayjs from 'dayjs'
import Joi from 'joi'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

//CRIANDO CONEXÃO COM O BANCO
let database = null
const mongoClient = new MongoClient(process.env.MONGO_URI)
const promise = mongoClient.connect()
promise.then(()=> database = mongoClient.db(process.env.BANCO_MONGO))
promise.catch(e => console.log("Algo deu errado."))

//OBTER LISTA DE PARTICIPANTES
app.get("/participants", (req, res) => {
    try{
        const participantsColection = database.collection('participants')
        const promise = participantsColection.find().toArray()
        promise.then(participants => res.send(participants))
    }catch{
        res.sendStatus(409)
    }
});

//SALVAR UM PARTICIPANTE
app.post("/participants", async (req, res)=>{
    const participantSchema = Joi.object({
        name: Joi.string().required()
    })
    const validation = participantSchema.validate(req.body, {abortEarly: true})
    if(validation.error){
        res.sendStatus(422)
        return
    }
    
    //CHECAR SE PARTICIPANTE JÁ EXISTE
    const name = req.body.name
    const participantsColection = database.collection('participants')
    const promise1 = await participantsColection.findOne({name:name})
    if(promise1){
        res.status(409).send()
        return
    }

    try{
        const newParcipant = {
            name: req.body.name,
            lastStatus: Date.now()
        }
        const promise = participantsColection.insertOne(newParcipant)
        promise.then(()=>{
            //SALVANDO MENSSAGEM
            const mesageColection = database.collection('mesageteste')
            const newmesage = {
                from: req.body.name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: getTime()
            }
            const promise = mesageColection.insertOne(newmesage)
            promise.then(res.sendStatus(201))
        })
        
    }catch{
        res.sendStatus(409)
    }
})

//OBTER MENSSAGENS
app.get("/messages", (req, res) => {
    try{
        const messagesColection = database.collection('mesageteste')
        const promise = messagesColection.find().toArray()
        promise.then(messages =>res.send(messages))
    }catch{
        res.sendStatus(409)
    }
});

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
    console.log("Running...")
})