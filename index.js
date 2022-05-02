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
    const existName = await participantsColection.findOne({name:name})
    if(existName){
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
            const messageColection = database.collection('messages')
            const newmesage = {
                from: req.body.name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: getTime()
            }
            const promise = messageColection.insertOne(newmesage)
            promise.then(res.sendStatus(201))
        })
        
    }catch{
        res.sendStatus(409)
    }
})

//SALVAR MENSSAGEM
app.post("/messages", async (req, res)=>{
    const body = req.body
    const user = req.header("user")

    const messageSchema = Joi.object({
        to: Joi.string().required(),
        text: Joi.string().required(),
        type: Joi.string().valid('message','private_message').required(),
        from: Joi.required()
    })
    const validation = messageSchema.validate({...body, from:user}, {abortEarly: true})
    if(validation.error){
        res.sendStatus(422)
        return
    }
    const existUser = await database.collection('participants').findOne({name: user})
    if(!existUser){
        res.status(422).send()
        return
    }
    try{
        const newMessage = {
            from: user,
            to: body.to,
            text: body.text,
            type: body.type,
            time: getTime()
        }
        await database.collection('messages').insertOne(newMessage)
        res.sendStatus(201)
    }catch{
        res.sendStatus(409)
    }
})

//OBTER MENSSAGENS
app.get("/messages", async (req, res) => {
    const user = req.header('user')
    const participant =  await database.collection('participants').findOne({name: user})
    if(!participant){
        res.sendStatus(404)
        return
    }
    try{
        const messages = await database.collection('messages').find().toArray()
        const limit = parseInt(req.query.limit) || messages.length
        const lastMessages = messages
                            .reverse()
                            .slice(0, limit)
                            .filter(msg=>{
                                return (msg.from === user || msg.to === user || msg.to === 'Todos')
                            })
        res.send(lastMessages)
    }catch{
        res.sendStatus(409)
    }
});

//ATUALIZAR STATUS
app.post("/status", async (req, res)=>{
    const user = req.header('user')
    const participant =  await database.collection('participants').findOne({name: user})
    if(!participant){
        res.sendStatus(404)
        return
    }
    try{
        await database.collection('participants').updateOne({name:user}, { $set: { lastStatus: Date.now()}})
        res.sendStatus(200)
    }catch(e){
        res.status(404).send(e)
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
    console.log("Running...")
})