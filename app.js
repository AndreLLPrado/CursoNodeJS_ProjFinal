//Loading modules
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const path = require('path')
const mongoose = require('mongoose')
const admin = require('./rotes/admin')
const app = express()
const session = require('express-session')
const flash = require('connect-flash')
const req = require('express/lib/request')
require('./models/postagem')
const Postagem = mongoose.model("postagens")
require('./models/Categoria')
const Categoria = mongoose.model("categorias")
const usuarios = require('./rotes/usuario')
const passport = require("passport")
require("./config/auth")(passport)

//Config
    //Port
    const port = 8081

    //Session
    app.use(session({
        secret: "aa8sd890asdy90ayhf02h-fa",
        resave: true,
        saveUninitialized: true
    }))

    app.use(passport.initialize())
    app.use(passport.session())

    app.use(flash())

    //Session Middleware
    app.use((req,res,next)=>{
        res.locals.success_msg = req.flash("success_msg")
        res.locals.error_msg = req.flash("error_msg")
        res.locals.error = req.flash("error")
        res.locals.user = req.user || null;
        next()
    })

    //Body parser
    app.use(bodyParser.urlencoded({extended:true}))
    app.use(bodyParser.json())

    //Handlebars
    app.engine('handlebars', handlebars.engine({
        defaultLayout:'main',
        runtimeOptions:{
            allowProtoMethodsByDefault: true,
            allowProtoPropertiesByDefault: true
        }
    }))
    app.set('view engine','handlebars')

    //Mongoose
    mongoose.Promise = global.Promise
    mongoose.connect('mongodb://localhost/blogapp').then(()=>{
        console.log('Mongo connection successful!')
    }).catch((err)=>{
        console.log("Connection Error: " + err)
    })

    //Public
    app.use(express.static(path.join(__dirname,'public')))

//Rotes
    app.get('/',(req,res)=>{
        Postagem.find().populate("categoria").sort({data: "desc"}).then((postagens)=>{
            res.render("index", {postagens: postagens})
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro na Página Inicíal")
            res.redirect('/404')
        })   
    })

    app.get('/postagem/:slug',(req,res)=>{
        Postagem.findOne({slug: req.params.slug}).then((postagem)=>{
            if(postagem){
                res.render("postagem/index",{postagem: postagem})
            }
            else{
                req.flash("error_msg","Está postagem não existem")
                res.redirect("/")
            }
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro interno na postagem")
            res.redirect("/")
        })
    })

    app.get('/categorias',(req,res)=>{
        Categoria.find().then((categorias)=>{
            res.render("categorias/index",{categorias: categorias})
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro interno ao listar as categorias")
        })
    })

    app.get('/categorias/:slug',(req,res)=>{
        Categoria.findOne({slug: req.params.slug}).then((categoria)=>{
            if(categoria){
                Postagem.find({categoria: categoria._id}).then((postagens)=>{
                    if(postagens){
                        res.render("categorias/postagens",{postagens: postagens, categoria:categoria})
                    }else{
                        req.flash("error_msg","Está postagem não existe")
                        res.redirect('/')
                    }
                }).catch((err)=>{
                    req.flash("error_msg","Houve um erro interno ao procurar postagens da categoria")
                    res.redirect('/')
                })
            }else{
                req.flash("error_msg","Está categoria não existe")
                res.redirect('/')
            }
        }).catch((err)=>{
            req.flash("error_msg","Houve um erro interno ao carregar a página desta categoria")
            res.redirect('/')
        })
    })

    app.get('/404',(req,res)=>{
        res.send("Error 404!")
    })

    app.use('/admin', admin)
    app.use('/usuarios', usuarios)

//Ohters
app.listen(port, ()=>{
    console.log("Server linsten on  http://localhost:"+port)
})