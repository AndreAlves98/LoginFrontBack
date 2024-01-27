//importações
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

//config JSON response
app.use(express.json())


//models
const User = require('./models/User')



//open Route - public Route
app.get('/', (req, res) => {
    res.status(200).json({msg: "Bem vindo a nossa API"})
})


//private ROute
app.get('/user/:id', checkToken, async (req, res) => {
    const id = req.params.id

    //checar se o usuário existe
    const user = await User.findById(id, '-password')

    if(!user) {
        return res.status(404).json({msg: "usuário não encontrado"})
    }

    res.status(200).json({ user })
})



//validação de TOKEN
function  checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if(!token) {
        return res.status(401).json({msg: "Acesso Negado!"})
    }


    try {
        const secret = process.env.SECRET
        jwt.verify(token, secret)

        next()

    }   catch(error) {

        res.status(400).json({ msg: "Token Inválido!" })
    }
}


// registro de usuário
app.post('/auth/register', async(req, res) => {

    const {name, email, password, confirmpassword} = req.body

    //validações
    if(!name) {
        return res.status(422).json({msg: "O Nome é obrigatório"}) // validar no postman
    }

    if(!email) {
        return res.status(422).json({msg: "O Email é obrigatório"}) 
    }

    if(!password) {
        return res.status(422).json({msg: "A Senha é obrigatória"})
    }

    if(password !== confirmpassword) {
        return res.status(422).json({msg: "As Senhas não conferem"})
    }



    // checagem de usuário
    const userExists = await User.findOne({ email: email })

    if(userExists) {
        return res.status(422).json({msg: "Por favor, utilize outro e-mail"})
    }



   
    // criação de senha
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)


    // criação de usuário
    const user = new User ({ 
        name,
        email,
        password: passwordHash,
    })

    try {

        await user.save()

        res.status(201).json({ msg: 'Usuário criado com sucesso!'})

    } catch(error) {
        console.log(error)

        res
        .status(500)
        .json({
            msg: 'Ocorreu um erro no servidor!'
        }) //verificar as boas práticas
    }
})


// autenticação de login
app.post("/auth/login", async (req, res) => {
    const {email, password} = req.body

    if(!email) {
        return res.status(422).json({msg: "O Email é obrigatório"}) 
    }

    if(!password) {
        return res.status(422).json({msg: "A Senha é obrigatória"})
    }

    // checagem de usuário
    const user = await User.findOne({ email: email  })

    if(!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado'})
    }

    //checar senha de usuário (se existe no banco) via TOKEN
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(404).json({ msg: 'Senha Inválida!'})
    }

    try {
        
        const secret = process.env.SECRET  //TOKEN

        const token = jwt.sign({
            id: user._id,
            },
            secret,
        )

        res.status(200).json({msg: 'Autenticação realizada com sucesso', token})

    } catch(error) {
        console.log(error)

        res
        .status(500)
        .json({
            msg: 'Ocorreu um erro no servidor!'
        }) //verificar as boas práticas
    }

})


//credenciais
const  dbUser = process.env.DB_USER
const  dbPassword = process.env.DB_PASS

mongoose
.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.53v8y54.mongodb.net/?retryWrites=true&w=majority`)
.then(() => {

    app.listen(3000)
    console.log("conectou ao banco!")

}).catch((err) => console.log(err))

